/* =================== accounts, players, rankings, duels =================== */
const CFG = window.TAPO_CONFIG || {};
const AVATARS = ["🧭","🌍","🗺️","✈️","🏔️","🌋","🏝️","🐧","🦅","🐢","🦊","🐙","🚀","⛵","🎯","🌵"];
const COLORS = ["#4FE3B0","#FFC857","#FF7A45","#7AA7FF","#C58BFF","#FF6A9A","#5ED0E8","#B8E05A"];
const RATED = new Set(["random", "daily", "duel"]);   // ranked games move the skill rating
const START_RATING = 1000, PROVISIONAL = 5;
let sb = null;
const net = { uid: null, email: null, me: null, profiles: {}, duels: [], recentPlaces: [],
  settings: {signups_open: true, invite_required: false, announcement: null, daily_bonus: true} };

const myProfile = () => net.me;
const canPlay = () => !!(net.me && !net.me.banned);
const siteLink = () => location.origin + location.pathname.replace(/index\.html$/, "");
function nameOf(uid){ const p = net.profiles[uid]; return (p && p.username) || "Someone"; }
function avatarEl(p, size){ const s = h("span", {class:"av" + (size ? " " + size : ""), text:(p && p.avatar) || "🧭"}); s.style.background = (p && p.color) || "#2A3446"; return s; }
const ratingOf = p => Math.round((p && p.rating) || START_RATING);
const isProvisional = p => !p || (p.rated_games || 0) < PROVISIONAL;
const friendly = e => (e && (e.message || e.error_description || String(e))) || "Something went wrong.";

/* ---------------- data ---------------- */
async function loadMe(){
  const { data, error } = await sb.from("profiles").select("*").eq("id", net.uid).maybeSingle();
  if (error) throw error;
  net.me = data;
  if (data) net.profiles[data.id] = data;
  onNet();
  return data;
}
async function loadAll(){
  if (!net.uid) return;
  const [pr, du, ga] = await Promise.all([
    sb.from("profiles").select("id,username,avatar,color,is_admin,banned,created_at,last_played,games,avg,best,bullseyes,rating,rated_games,rating_hist,recent,daily,streak,blitz_games,blitz_best,region_games,region_best"),
    sb.from("duels").select("*").order("created_at", {ascending: false}).limit(300),
    sb.from("games").select("places,created_at").eq("user_id", net.uid).order("created_at", {ascending: false}).limit(12),
  ]);
  if (!pr.error){ const m = {}; pr.data.forEach(p => m[p.id] = p); net.profiles = m; if (m[net.uid]) net.me = Object.assign({}, net.me, m[net.uid]); }
  if (!du.error) net.duels = du.data;
  if (!ga.error) net.recentPlaces = ga.data.flatMap(g => g.places || []);
  onNet();
}
async function refreshSettings(){
  try { const { data } = await sb.rpc("public_settings"); if (data) net.settings = data; } catch(e){}
  const a = $("#announce");
  a.hidden = !net.settings.announcement; a.textContent = net.settings.announcement || "";
}

/* Save a finished game. The server recomputes the score and updates stats, streak and rating. */
async function recordGame(){
  if (!canPlay()) return {isBest: false, delta: null, error: "You're not logged in."};
  const raws = state.results.map(r => r.raw), places = state.results.map(r => r.name);
  try {
    const { data, error } = await sb.rpc("record_game", {p_mode: state.mode, p_raws: raws, p_places: places, p_day: todayKey(), p_duel: state.duel ? state.duel.id : null});
    if (error) throw error;
    net.recentPlaces = places.concat(net.recentPlaces).slice(0, 60);
    for (const k in boardCache) delete boardCache[k];   // scores changed: refetch the leaderboard next time
    await loadMe(); loadAll();
    if (data.duel_delta != null) toast(`Duel finished: ${data.duel_delta >= 0 ? "+" : ""}${data.duel_delta} rating`);
    return {isBest: data.is_best, delta: data.delta, duelDelta: data.duel_delta};
  } catch(e){ return {isBest: false, delta: null, error: friendly(e)}; }
}

/* rankings */
function players(){ return Object.entries(net.profiles).filter(([, p]) => !p.banned).map(([id, p]) => ({id, p, rec: duelRecord(id)})); }
function ranked(by = "rating"){
  const key = by === "avg" ? (x => x.p.avg || 0) : (x => ratingOf(x.p));
  const prov = by === "avg" ? (x => (x.p.games || 0) < 3) : (x => isProvisional(x.p));
  return players().sort((a, b) => (prov(a) - prov(b)) || (key(b) - key(a)) || ((b.p.games || 0) - (a.p.games || 0)));
}
function rankOf(uid){ const r = ranked().filter(x => !isProvisional(x.p)); const i = r.findIndex(x => x.id === uid); return i >= 0 ? i + 1 : null; }

/* duels */
const dMine = (d, uid = net.uid) => d.challenger === uid ? d.challenger_score : d.opponent_score;
const dTheirs = (d, uid = net.uid) => d.challenger === uid ? d.opponent_score : d.challenger_score;
const dOther = (d, uid = net.uid) => d.challenger === uid ? d.opponent : d.challenger;
function duelRecord(uid){
  let w = 0, l = 0, t = 0;
  for (const d of net.duels){
    if (d.challenger_score == null || d.opponent_score == null || (d.challenger !== uid && d.opponent !== uid)) continue;
    const a = dMine(d, uid), b = dTheirs(d, uid);
    if (a > b) w++; else if (a < b) l++; else t++;
  }
  return {w, l, t};
}
const myTurn = d => (d.challenger === net.uid && d.challenger_score == null) || (d.opponent === net.uid && d.opponent_score == null);
async function challenge(oppId){
  if (!canPlay()) return;
  const picks = [1,2,3,4,5].map(t => { const ids = CURATED.map((c, i) => c[4] === t ? i : -1).filter(i => i >= 0); return ids[Math.floor(Math.random()*ids.length)]; });
  const { data, error } = await sb.rpc("create_duel", {p_opponent: oppId, p_picks: picks});
  if (error) return toast(friendly(error));
  const d = {id: data, challenger: net.uid, opponent: oppId, picks, created_at: new Date().toISOString()};
  net.duels = [d].concat(net.duels);
  playDuel(d);
}
function playDuel(d){
  closeSheet();
  state.duel = {id: d.id, opp: dOther(d), picks: d.picks};
  state.mode = "duel"; renderModes(); newGame();
}
function renderDuelResult(){
  const box = $("#duelres"); box.replaceChildren();
  if (state.mode !== "duel" || !state.duel) return;
  const d = net.duels.find(x => x.id === state.duel.id) || {};
  const opp = state.duel.opp, mine = total(), theirs = d.challenger ? dTheirs(d) : null;
  const line = (who, sc) => h("div", {class:"line"}, avatarEl(net.profiles[who], "md"), h("span", {class:"nm", text: nameOf(who)}), h("span", {class:"sc", text: sc == null ? "—" : String(sc)}));
  let verdict;
  if (theirs == null) verdict = h("div", {class:"verdict", text: `Waiting for ${nameOf(opp)} to play.`});
  else if (mine > theirs) verdict = h("div", {class:"verdict win", text: "You won the duel."});
  else if (mine < theirs) verdict = h("div", {class:"verdict loss", text: `${nameOf(opp)} wins this one.`});
  else verdict = h("div", {class:"verdict tie", text: "Dead heat."});
  box.append(h("div", {class:"duelbox"}, verdict, line(net.uid, mine), line(opp, theirs)));
}

/* ---------------- sign in / sign up ---------------- */
let authView = "login", authMsg = null;
function showAuth(view, msg){ authView = view; authMsg = msg || null; renderAuth(); $("#auth").hidden = false; renderAuthBoard(); }
function hideAuth(){ $("#auth").hidden = true; }
function field(id, label, type, attrs = {}){
  const i = h("input", Object.assign({id, type, name: id}, attrs));
  return [h("div", {class:"field"}, h("label", {for: id, text: label}), i), i];
}
const add = (el, ...kids) => el.append(...kids.filter(k => k != null && k !== false));
function renderAuth(){
  const c = $("#authcard"); c.replaceChildren();
  const brand = h("div", {class:"authhead"}, h("div", {class:"authbrand"}, h("span", {class:"pinmark"}), "Tapographer"),
    h("p", {class:"tagline", text:"Five places. One globe. Tap where you think they are."}));
  const msg = authMsg ? h("p", {class: "note" + (authMsg.ok ? " ok" : ""), text: authMsg.text}) : null;
  const tabs = (active) => h("div", {class:"tabs", role:"tablist"},
    h("button", {role:"tab", "aria-selected": active === "login" ? "true" : "false", text:"Log in", onclick: () => showAuth("login")}),
    h("button", {role:"tab", "aria-selected": active === "signup" ? "true" : "false", text:"Create account", onclick: () => showAuth("signup")}));
  const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };

  if (authView === "setup"){
    add(c, brand, h("h3", {text:"Almost ready"}), h("p", {text:"This copy of Tapographer isn't connected to its database yet. Add your Supabase project URL and anon key to config.js (see the README), then reload."}));
    return;
  }
  if (authView === "banned"){
    add(c, brand, h("h3", {text:"Account suspended"}), h("p", {text:"The host has suspended this account. Contact them if you think this is a mistake."}),
      h("div", {class:"btns"}, h("button", {class:"secondary", text:"Log out", onclick: () => sb.auth.signOut()})));
    return;
  }
  if (authView === "login"){
    const [f1, who] = field("login", "Username or email", "text", {autocomplete:"username", autocapitalize:"none"});
    const [f2, pw] = field("password", "Password", "password", {autocomplete:"current-password"});
    const go = h("button", {class:"primary", type:"submit", text:"Log in"});
    const form = h("form", {class:"authform", onsubmit: async e => {
      e.preventDefault();
      if (!who.value.trim() || !pw.value) return showAuth("login", {text:"Enter your username (or email) and password."});
      busy(go, true, "Logging in…");
      const { data: email } = await sb.rpc("email_for_login", {p_login: who.value.trim()});
      if (!email){ busy(go, false, "Log in"); return showAuth("login", {text:"No account uses that username. Check the spelling, or log in with your email."}); }
      const { error } = await sb.auth.signInWithPassword({email, password: pw.value});
      busy(go, false, "Log in");
      if (error){
        if (/confirm/i.test(error.message)) return showAuth("confirm", {text: email});
        return showAuth("login", {text: /invalid/i.test(error.message) ? "That password isn't right." : friendly(error)});
      }
    }}, f1, f2, go);
    add(c, brand, tabs("login"), msg, form,
      h("button", {class:"linkbtn", text:"Forgot your password?", onclick: () => showAuth("forgot")}));
    setTimeout(() => who.focus(), 30);
    return;
  }
  if (authView === "signup"){
    if (!net.settings.signups_open){
      add(c, brand, tabs("signup"), h("p", {class:"note", text:"New sign-ups are closed right now. Ask the host to open them."})); return;
    }
    let avatar = AVATARS[Math.floor(Math.random()*AVATARS.length)], color = COLORS[Math.floor(Math.random()*COLORS.length)];
    const [f1, un] = field("username", "Username", "text", {maxlength:"20", autocomplete:"username", autocapitalize:"none", placeholder:"Shown on the rankings"});
    const [f2, em] = field("email", "Email", "email", {autocomplete:"email", placeholder:"For confirming your account and password resets"});
    const [f3, pw] = field("newpw", "Password", "password", {autocomplete:"new-password", placeholder:"At least 8 characters"});
    const [f4, pw2] = field("newpw2", "Confirm password", "password", {autocomplete:"new-password"});
    const [f5, inv] = field("invite", "Invite code", "text", {autocapitalize:"none", placeholder:"From the host"});
    const ap = h("div", {class:"pick", role:"group", "aria-label":"Badge"});
    AVATARS.forEach(a => ap.append(h("button", {type:"button", "aria-pressed": a === avatar ? "true" : "false", text: a, onclick: () => { avatar = a; ap.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.textContent === a)); }})));
    const cp = h("div", {class:"pick colors", role:"group", "aria-label":"Color"});
    COLORS.forEach(col => { const b = h("button", {type:"button", "aria-label":"Color " + col, "aria-pressed": col === color ? "true" : "false", onclick: () => { color = col; cp.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); }}); b.style.background = col; cp.append(b); });
    const go = h("button", {class:"primary", type:"submit", text:"Create account"});
    const form = h("form", {class:"authform", onsubmit: async e => {
      e.preventDefault();
      const username = un.value.trim().replace(/\s+/g, " "), email = em.value.trim();
      const err = t => showAuthInline(form, t);
      if (username.length < 2) return err("Pick a username with at least 2 characters.");
      if (!/^\S+@\S+\.\S+$/.test(email)) return err("Enter a valid email address.");
      if (pw.value.length < 8) return err("Use a password with at least 8 characters.");
      if (pw.value !== pw2.value) return err("The two passwords don't match.");
      busy(go, true, "Creating account…");
      const { data: reason } = await sb.rpc("check_signup", {p_username: username, p_invite: inv.value.trim() || null});
      if (reason){ busy(go, false, "Create account"); return err(reason); }
      const { data, error } = await sb.auth.signUp({email, password: pw.value,
        options: {emailRedirectTo: siteLink(), data: {username, avatar, color, invite: inv.value.trim() || null}}});
      busy(go, false, "Create account");
      if (error) return err(/registered/i.test(error.message) ? "That email already has an account. Log in instead." : friendly(error));
      if (!data.session) showAuth("confirm", {text: email});
    }}, f1, f2, f3, f4, net.settings.invite_required ? f5 : null,
      h("div", {class:"field"}, h("label", {text:"Badge"}), ap), h("div", {class:"field"}, h("label", {text:"Color"}), cp), go);
    add(c, brand, tabs("signup"), msg, form);
    setTimeout(() => un.focus(), 30);
    return;
  }
  if (authView === "confirm"){
    const email = authMsg && authMsg.text;
    const resend = h("button", {class:"secondary", text:"Send the email again", onclick: async () => {
      resend.disabled = true; const { error } = await sb.auth.resend({type:"signup", email, options:{emailRedirectTo: siteLink()}});
      resend.textContent = error ? friendly(error) : "Sent. Check your inbox."; }});
    add(c, brand, h("h3", {text:"Check your email"}),
      h("p", null, "We sent a confirmation link to ", h("b", {text: email || "your email"}), ". Open it to activate your account; it brings you back here, logged in."),
      h("div", {class:"btns"}, resend, h("button", {class:"primary", text:"Back to log in", onclick: () => showAuth("login")})));
    return;
  }
  if (authView === "forgot"){
    const [f1, who] = field("forgotwho", "Username or email", "text", {autocapitalize:"none"});
    const go = h("button", {class:"primary", type:"submit", text:"Send reset link"});
    const form = h("form", {class:"authform", onsubmit: async e => {
      e.preventDefault(); busy(go, true, "Sending…");
      const { data: email } = await sb.rpc("email_for_login", {p_login: who.value.trim()});
      if (email) await sb.auth.resetPasswordForEmail(email, {redirectTo: siteLink()});
      showAuth("login", {ok: true, text:"If that account exists, a password reset link is on its way. Open it on this device."});
    }}, f1, go);
    add(c, brand, h("h3", {text:"Reset your password"}), msg, form, h("button", {class:"linkbtn", text:"Back to log in", onclick: () => showAuth("login")}));
    return;
  }
  if (authView === "newpw"){
    const [f1, pw] = field("resetpw", "New password", "password", {autocomplete:"new-password", placeholder:"At least 8 characters"});
    const [f2, pw2] = field("resetpw2", "Confirm new password", "password", {autocomplete:"new-password"});
    const go = h("button", {class:"primary", type:"submit", text:"Save new password"});
    const form = h("form", {class:"authform", onsubmit: async e => {
      e.preventDefault();
      if (pw.value.length < 8) return showAuthInline(form, "Use at least 8 characters.");
      if (pw.value !== pw2.value) return showAuthInline(form, "The two passwords don't match.");
      busy(go, true, "Saving…");
      const { error } = await sb.auth.updateUser({password: pw.value});
      busy(go, false, "Save new password");
      if (error) return showAuthInline(form, friendly(error));
      recovering = false; history.replaceState(null, "", location.pathname);
      toast("Password updated."); hideAuth(); startSession();
    }}, f1, f2, go);
    add(c, brand, h("h3", {text:"Choose a new password"}), form);
  }
}
function showAuthInline(form, text){
  let n = form.querySelector(".note"); if (!n){ n = h("p", {class:"note"}); form.prepend(n); }
  n.textContent = text; n.scrollIntoView({block:"nearest"});
}

let polling = null, recovering = false;
async function startSession(){
  const { data: { session } } = await sb.auth.getSession();
  if (!session){ net.uid = null; net.me = null; onNet(); return showAuth(authView === "confirm" ? "confirm" : "login", authView === "confirm" ? authMsg : null); }
  if (recovering) return;
  if (net.me && session.user.id === net.uid){ hideAuth(); loadAll(); return; }   // same player coming back: keep the game
  const firstUid = net.uid;
  net.uid = session.user.id; net.email = session.user.email;
  try { await loadMe(); } catch(e){ return showAuth("login", {text: friendly(e)}); }
  if (!net.me) return showAuth("login", {text:"Your account has no player profile. Ask the host for help."});
  if (net.me.banned) return showAuth("banned");
  hideAuth();
  await loadAll();
  clearInterval(polling);
  polling = setInterval(() => { if (!document.hidden){ loadAll(); refreshSettings(); } }, 45000);
  const saved = savedProgressUid();
  if (saved && saved !== net.uid){ clearProgress(); newGame(); }         // someone else's game on this device
  else if (firstUid !== net.uid && state.mode === "daily" && !state.done && !state.results.length) newGame();
  else if (state.picks.length) saveProgress();                             // tag the game with this player
}
async function initNet(){
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY || /YOUR-/.test(CFG.SUPABASE_URL) || !window.supabase) return showAuth("setup");
  if (/type=recovery/.test(location.hash)){ recovering = true; showAuth("newpw"); }   // arrived from a password-reset email
  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  await refreshSettings();
  sb.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY"){ recovering = true; showAuth("newpw"); return; }
    if (event === "USER_UPDATED" && recovering){ recovering = false; return; }
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(startSession, 0);
  });
  await startSession();
}

/* ---------------- sheets ---------------- */
let sheetKind = null, rankTab = "rating", confirmDelete = false;
function openSheet(kind){ sheetKind = kind; confirmDelete = false; renderSheet(); const s = $("#sheet"); s.hidden = false; s.classList.remove("in"); void s.offsetWidth; s.classList.add("in"); }
function closeSheet(){ $("#sheet").hidden = true; sheetKind = null; }
function renderSheet(){
  const body = $("#sheetbody"), title = $("#sheettitle");
  body.replaceChildren();
  if (sheetKind === "edit") return renderProfileForm(body, title);
  if (sheetKind === "rank") return renderRank(body, title);
  if (sheetKind === "duels") return renderDuels(body, title);
  if (sheetKind === "me") return renderMe(body, title);
}
function recText(r){ return r.w + r.l + r.t ? `${r.w}–${r.l}${r.t ? "–" + r.t : ""}` : ""; }
function playerRow(x, i, showDuel, by){
  const me = x.id === net.uid, prov = by === "avg" ? (x.p.games || 0) < 3 : isProvisional(x.p);
  const sub = by === "avg" ? `rating ${ratingOf(x.p)} · ${x.p.games || 0} games` : `avg ${x.p.avg || 0} · ${x.p.rated_games || 0} ranked`;
  return h("li", {class: me ? "me" : ""},
    h("span", {class:"rk", text: prov ? "–" : String(i)}), avatarEl(x.p, "md"),
    h("span", {class:"who"}, h("b", null, x.p.username || "Someone", me ? " (you)" : "", prov ? h("span", {class:"prov", text:"new"}) : null), h("span", {text: sub + (recText(x.rec) ? " · " + recText(x.rec) : "")})),
    h("span", {class:"val"}, String(by === "avg" ? (x.p.avg || 0) : ratingOf(x.p)), h("small", {text: by === "avg" ? "avg" : "rating"})),
    showDuel && !me && canPlay() ? h("button", {class:"secondary small", text:"Duel", onclick: () => challenge(x.id)})
      : showDuel ? h("button", {class:"secondary small", text:"Duel", tabindex:"-1", "aria-hidden":"true", style:"visibility:hidden"}) : h("span"));
}
/* ---------------- leaderboard ----------------
   Served by the database (public.leaderboard) so everyone sees the same board, even before logging in.
   If the database hasn't been updated yet, it falls back to what this browser already knows. */
const BOARDS = {
  rating: {tab:"All-time", unit:"rating", empty:"Nobody has played a ranked game yet.",
           note:`All-time skill rating from every ranked game (Random, Daily and Duels). Beat the score your rating predicts to climb. Everyone starts at ${START_RATING}; "new" means fewer than ${PROVISIONAL} ranked games.`},
  avg:    {tab:"Average",  unit:"avg",    empty:"Nobody has played a ranked game yet.",
           note:"All-time average score across Random, Daily and Duel games, out of 1000."},
  week:   {tab:"Week",     unit:"avg",    empty:"Nobody has played a ranked game in the last 7 days.",
           note:"Average score over the last 7 days of Random, Daily and Duel games."},
  today:  {tab:"Today",    unit:"today",  empty:"Nobody has finished today's Daily yet. Be the first!",
           note:"Today's Daily: the same five places for everyone. One try each; resets at midnight."},
};
const boardCache = {};   // period -> {t, rows, local}
async function fetchBoard(period, fresh){
  const c = boardCache[period];
  if (c && !fresh && Date.now() - c.t < 30000) return c;
  let rows = null, local = false;
  if (net.uid && period !== "week" && Object.keys(net.profiles).length){ rows = localBoard(period); local = true; }
  else if (sb){
    try {
      const { data, error } = await sb.rpc("leaderboard", {p_period: period, p_day: todayKey(), p_limit: 100});
      if (!error) rows = data;            // null = the host hid the board from signed-out visitors
      else throw error;
    } catch(e){ rows = localBoard(period); local = true; }
  }
  const out = {t: Date.now(), rows, local};
  boardCache[period] = out;
  return out;
}
function localBoard(period){
  if (!net.uid) return null;
  const key = todayKey(), P = players();
  const row = (x, value, extra) => Object.assign({id: x.id, username: x.p.username, avatar: x.p.avatar, color: x.p.color, value}, extra);
  if (period === "today") return P.filter(x => x.p.daily && x.p.daily.date === key).sort((a, b) => b.p.daily.score - a.p.daily.score).map(x => row(x, x.p.daily.score, {raws: x.p.daily.raws}));
  if (period === "rating") return P.filter(x => (x.p.rated_games || 0) >= 1).sort((a, b) => (ratingOf(b.p) - ratingOf(a.p)) || ((b.p.avg || 0) - (a.p.avg || 0))).map(x => row(x, ratingOf(x.p), {games: x.p.rated_games, avg: x.p.avg}));
  if (period === "avg") return P.filter(x => (x.p.games || 0) >= 1).sort((a, b) => ((b.p.avg || 0) - (a.p.avg || 0)) || ((b.p.best || 0) - (a.p.best || 0))).map(x => row(x, x.p.avg || 0, {games: x.p.games, best: x.p.best}));
  return null;   // "week" needs the database
}
function boardSub(period, r){
  if (period === "today") return (r.raws || []).map(emoji).join("");
  if (period === "rating") return `avg ${r.avg ?? 0} · ${r.games ?? 0} ranked`;
  if (period === "week") return `${r.games} game${r.games === 1 ? "" : "s"} · best ${r.best}`;
  return `${r.games} games · best ${r.best ?? 0}`;
}
function boardRow(period, r, i, opts = {}){
  const me = r.id === net.uid, medal = ["🥇","🥈","🥉"][i];
  return h("li", {class: (me ? "me " : "") + (i < 3 ? "podium p" + (i + 1) : "")},
    h("span", {class:"rk" + (medal ? " medal" : ""), text: medal || String(i + 1)}), avatarEl(r, "md"),
    h("span", {class:"who"}, h("b", null, h("span", {class:"nm", text: r.username || "Someone"}), period === "rating" && (r.games || 0) < PROVISIONAL ? h("span", {class:"prov", text:"new"}) : null), h("span", {text: (me ? "you · " : "") + boardSub(period, r)})),
    h("span", {class:"val"}, String(r.value), h("small", {text: BOARDS[period].unit})),
    opts.duel ? (!me && canPlay() ? h("button", {class:"secondary small", text:"Duel", onclick: () => challenge(r.id)})
                                 : h("button", {class:"secondary small", text:"Duel", tabindex:"-1", "aria-hidden":"true", style:"visibility:hidden"})) : null);
}
function myBoardHint(period, rows){
  const p = myProfile(); if (!p || !rows || rows.some(r => r.id === net.uid)) return null;
  if (period === "today"){
    const played = p.daily && p.daily.date === todayKey();
    if (played) return null;
    return h("div", {class:"myspot"}, h("span", {text:"You haven't played today's Daily yet."}),
      h("button", {class:"primary small", text:"Play the Daily", onclick: () => { closeSheet(); state.mode = "daily"; state.duel = null; renderModes(); newGame(); }}));
  }
  return h("div", {class:"myspot", text:"Play a ranked game (Random, Daily or Duel) to get on the board."});
}
let rankLoad = 0;
function renderRank(body, title){
  title.textContent = "Leaderboard";
  const tab = (id) => h("button", {role:"tab", "aria-selected": rankTab === id ? "true" : "false", text: BOARDS[id].tab, onclick: () => { rankTab = id; renderSheet(); }});
  body.append(h("div", {class:"tabs", role:"tablist"}, ...Object.keys(BOARDS).map(tab)));
  const list = h("ul", {class:"board lb"}), foot = h("div");
  body.append(list, foot, h("p", {class:"lbnote", text: BOARDS[rankTab].note}));
  const period = rankTab, my = ++rankLoad;
  const paint = (res) => {
    if (my !== rankLoad || sheetKind !== "rank") return;
    list.replaceChildren(); foot.replaceChildren();
    const rows = res && res.rows;
    if (!rows) list.append(h("li", {class:"empty", style:"display:block", text: period === "week" ? "The weekly board needs the latest database update (re-run schema.sql)." : "The leaderboard isn't available right now."}));
    else if (!rows.length) list.append(h("li", {class:"empty", style:"display:block", text: BOARDS[period].empty}));
    else rows.forEach((r, i) => list.append(boardRow(period, r, i, {duel: true})));
    const hint = myBoardHint(period, rows); if (hint) foot.append(hint);
  };
  const cached = boardCache[period];
  if (cached) paint(cached); else list.append(h("li", {class:"empty", style:"display:block", text:"Loading…"}));
  fetchBoard(period, true).then(paint);
}
function openBoard(period){ if (period) rankTab = period; loadAll(); openSheet("rank"); }

/* A small public board on the sign-in screen, so visitors can see who's on top before they join. */
async function renderAuthBoard(){
  const box = $("#authboard"); if (!box) return;
  if (!sb){ box.hidden = true; return; }
  const period = "rating", res = await fetchBoard("rating");
  if (!res.rows || !res.rows.length){ box.hidden = true; return; }
  box.replaceChildren(
    h("div", {class:"abhead"}, h("span", {class:"trophy", text:"🏆"}), h("b", {text:"Leaderboard"}),
      h("span", {class:"abnote", text:"All-time"})),
    h("ul", {class:"board lb mini"}, ...res.rows.slice(0, 5).map((r, i) => boardRow(period, r, i))),
    h("p", {class:"abfoot", text:"Create an account to get on the board."}));
  box.hidden = $("#auth").hidden;
}
function renderDuels(body, title){
  title.textContent = "Duels";
  body.append(h("p", {text:"Challenge a player to the same five places. You each play once; higher score wins, and the result moves both ratings."}));
  const mine = net.duels.filter(d => d.challenger === net.uid || d.opponent === net.uid);
  const sec = (label, items, render) => { if (items.length) body.append(h("div", {class:"dsec"}, h("h4", {text: label}), items.map(render))); };
  const ago = t => { const m = Math.round((Date.now() - new Date(t))/60000); return m < 60 ? `${Math.max(1, m)}m ago` : m < 1440 ? `${Math.round(m/60)}h ago` : `${Math.round(m/1440)}d ago`; };
  const card = (d, right, sub) => h("div", {class:"duel"}, avatarEl(net.profiles[dOther(d)], "md"), h("div", {class:"who"}, h("b", {text: nameOf(dOther(d))}), h("span", {text: sub})), right);
  sec("Your turn", mine.filter(myTurn), d => card(d, h("button", {class:"primary small", text:"Play", onclick: () => playDuel(d)}),
    dTheirs(d) != null ? `They scored ${dTheirs(d)} · ${ago(d.created_at)}` : `${d.challenger === net.uid ? "You started this" : "Challenged you"} · ${ago(d.created_at)}`));
  sec("Waiting on them", mine.filter(d => dMine(d) != null && dTheirs(d) == null), d => card(d, h("span", {class:"val", style:"font-family:var(--mono)", text: String(dMine(d))}), `You scored ${dMine(d)} · ${ago(d.created_at)}`));
  sec("Finished", mine.filter(d => dMine(d) != null && dTheirs(d) != null).slice(0, 20), d => {
    const a = dMine(d), b = dTheirs(d), cls = a > b ? "win" : a < b ? "loss" : "tie";
    return card(d, h("span", {class: cls, style:"font-family:var(--mono);font-weight:500", text: `${a}–${b}`}), a > b ? "You won" : a < b ? "You lost" : "Tie");
  });
  if (!mine.length) body.append(h("p", {class:"empty", text:"No duels yet. Pick someone below."}));
  const others = ranked().filter(x => x.id !== net.uid);
  const list = h("ul", {class:"board"}); let n = 0;
  others.forEach(x => { if (!isProvisional(x.p)) n++; list.append(playerRow(x, n, true, "rating")); });
  if (!others.length) list.append(h("li", {class:"empty", style:"display:block", text:"No other players yet. Send friends the link so they can sign up."}));
  body.append(h("div", {class:"dsec"}, h("h4", {text:"Challenge a player"}), list));
}
function spark(values, max, label){
  const sp = h("div", {class:"spark", "aria-label": label});
  const lo = Math.min(...values), hi = Math.max(...values);
  values.forEach(v => { const b = h("i", {title: String(v)}); b.style.height = (max ? Math.max(3, v / max * 100) : 12 + 88 * (v - lo) / Math.max(1, hi - lo)) + "%"; sp.append(b); });
  return sp;
}
function renderMe(body, title){
  const p = myProfile(); title.textContent = "Your profile"; if (!p) return;
  const rk = rankOf(net.uid), rec = duelRecord(net.uid), left = PROVISIONAL - (p.rated_games || 0);
  body.append(h("div", {class:"pf"}, avatarEl(p, "lg"), h("div", null, h("div", {class:"nm", text: p.username}),
    h("div", {class:"rk", text: isProvisional(p) ? `Provisional: ${left} more ranked game${left === 1 ? "" : "s"} to get ranked` : `Ranked #${rk} of ${ranked().filter(x => !isProvisional(x.p)).length}`}),
    h("div", {class:"rk", text: net.email || ""}))));
  const g = h("div", {class:"statgrid"});
  [["Skill rating", ratingOf(p)], ["Average", p.avg || 0], ["Best", p.best || 0], ["Ranked games", p.rated_games || 0], ["Daily streak", p.streak || 0], ["Duels", recText(rec) || "0–0"]]
    .forEach(([l, v]) => g.append(h("div", {class:"stat"}, h("b", {text: String(v)}), h("span", {text: l}))));
  body.append(g);
  const rh = (p.rating_hist || []).slice(0, 20).reverse().map(x => x.r);
  if (rh.length > 1) body.append(h("div", {class:"field"}, h("label", {text:`Rating over your last ${rh.length} ranked results`}), spark(rh, 0, "Rating history")));
  const recent = (p.recent || []).slice(0, 20).reverse().map(r => r.s);
  if (recent.length) body.append(h("div", {class:"field"}, h("label", {text:`Last ${recent.length} scores (out of 1000)`}), spark(recent, 1000, "Recent scores")));
  body.append(h("p", {style:"font-size:13.5px", text: `25s Challenge best ${p.blitz_best || 0}/500 · Regional best ${p.region_best || 0}/500 · ${p.bullseyes || 0} bullseyes. The 25s Challenge and regional maps are practice and don't change your rating.`}));
  body.append(h("div", {class:"btns"},
    h("button", {class:"secondary", text:"Edit profile", onclick: () => openSheet("edit")}),
    h("button", {class:"secondary", text:"Log out", onclick: async () => { closeSheet(); await sb.auth.signOut(); }})));
  if (p.is_admin) body.append(h("div", {class:"btns"}, h("a", {class:"primary btnlink", href:"admin.html", text:"Open the host control panel"})));
  const del = h("button", {class:"linkbtn danger", text: confirmDelete ? "Tap again to permanently delete your account and scores" : "Delete my account", onclick: async () => {
    if (!confirmDelete){ confirmDelete = true; return renderSheet(); }
    const { error } = await sb.rpc("delete_my_account");
    if (error) return toast(friendly(error));
    await sb.auth.signOut(); closeSheet(); toast("Your account was deleted.");
  }});
  body.append(del);
}
function renderProfileForm(body, title){
  const cur = myProfile(); title.textContent = "Edit profile";
  let avatar = cur.avatar, color = cur.color;
  const preview = h("div", {class:"pf"});
  const input = h("input", {id:"handle", type:"text", maxlength:"20", autocomplete:"username"}); input.value = cur.username;
  const paint = () => preview.replaceChildren(avatarEl({avatar, color}, "lg"), h("div", null, h("div", {class:"nm", text: input.value.trim() || "Your name"}), h("div", {class:"rk", text:`Rating ${ratingOf(cur)}`})));
  input.addEventListener("input", paint);
  const ap = h("div", {class:"pick", role:"group", "aria-label":"Badge"});
  AVATARS.forEach(a => ap.append(h("button", {type:"button", "aria-pressed": a === avatar ? "true" : "false", text: a, onclick: () => { avatar = a; ap.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.textContent === a)); paint(); }})));
  const cp = h("div", {class:"pick colors", role:"group", "aria-label":"Color"});
  COLORS.forEach(c => { const b = h("button", {type:"button", "aria-label":"Color " + c, "aria-pressed": c === color ? "true" : "false", onclick: () => { color = c; cp.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); paint(); }}); b.style.background = c; cp.append(b); });
  paint();
  const save = h("button", {class:"primary", text:"Save changes", onclick: async () => {
    const username = input.value.trim().replace(/\s+/g, " ");
    if (username.length < 2) return toast("Pick a name with at least 2 characters.");
    if (!/^[A-Za-z0-9_. -]+$/.test(username)) return toast("Use letters, numbers, spaces, dots, dashes or underscores.");
    save.disabled = true;
    const { error } = await sb.from("profiles").update({username, avatar, color}).eq("id", net.uid);
    save.disabled = false;
    if (error) return toast(/duplicate|unique/i.test(error.message) ? "That username is taken." : friendly(error));
    await loadMe(); toast("Profile saved."); openSheet("me");
  }});
  body.append(preview, h("div", {class:"field"}, h("label", {for:"handle", text:"Username"}), input),
    h("div", {class:"field"}, h("label", {text:"Badge"}), ap), h("div", {class:"field"}, h("label", {text:"Color"}), cp),
    h("div", {class:"btns"}, h("button", {class:"secondary", text:"Cancel", onclick: () => openSheet("me")}), save));
}

function onNet(){
  const p = myProfile();
  const av = $("#meav"); av.textContent = (p && p.avatar) || "🧭"; av.style.background = (p && p.color) || "#2A3446";
  $("#mename").textContent = p ? p.username : "Log in";
  $("#merating").hidden = !p; $("#merating").textContent = p ? ratingOf(p) : "";
  const n = net.duels.filter(d => d.opponent === net.uid && d.opponent_score == null).length;
  $("#duelbadge").hidden = !n; $("#duelbadge").textContent = n;
  $("#nb-admin").hidden = !(p && p.is_admin);
  if (sheetKind === "rank" || sheetKind === "duels" || sheetKind === "me") renderSheet();
  if (!$("#summary").hidden && state.mode === "duel") renderDuelResult();
}

/* ---------------- controls & start-up ---------------- */
function renderModes(){
  const nav = $("#modes"); nav.replaceChildren();
  Object.entries(MODES).forEach(([key, m]) => {
    if (m.hidden && state.mode !== key) return;
    if (key === "us") nav.append(h("span", {class:"sep"}));
    nav.append(h("button", {class:"mode", role:"tab", id:"mode-" + key, "aria-selected": key === state.mode ? "true" : "false",
      onclick: () => { if (!tex32 || key === "duel") return; state.mode = key; state.duel = null; renderModes(); newGame(); }},
      m.label, m.sub ? h("span", {class:"sub", text: m.sub}) : null));
  });
}
function wire(){
  $("#action").onclick = () => { if (!canPlay()) return; if (state.revealed) next(); else if (state.guess) lockIn(); };
  $("#again").onclick = () => { if (mode().daily || state.mode === "duel"){ state.mode = "random"; state.duel = null; renderModes(); } newGame(); };
  $("#copy").onclick = async () => {
    const txt = shareText();
    try { await navigator.clipboard.writeText(txt); $("#copy").textContent = "Copied"; }
    catch(e){ const r = document.createRange(); r.selectNodeContents($("#sharetext")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $("#copy").textContent = "Selected: copy it"; }
  };
  $("#zin").onclick = () => { stopAnim(); flyTo([view.lam, view.phi], clamp(view.k*1.8, KMIN, KMAX), 260); };
  $("#zout").onclick = () => { stopAnim(); flyTo([view.lam, view.phi], clamp(view.k/1.8, KMIN, KMAX), 260); };
  $("#nb-rank").onclick = () => canPlay() && openBoard();
  $("#seeboard").onclick = () => canPlay() && openBoard(state.mode === "daily" ? "today" : "rating");
  $("#nb-duel").onclick = () => canPlay() && (loadAll(), openSheet("duels"));
  $("#nb-me").onclick = () => canPlay() ? openSheet("me") : showAuth("login");
  $("#nb-admin").onclick = () => { location.href = "admin.html"; };
  $("#sheetx").onclick = closeSheet;
  $("#sheet").addEventListener("click", e => { if (e.target === $("#sheet")) closeSheet(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !$("#sheet").hidden) return closeSheet();
    if (e.key !== "Enter" || /BUTTON|INPUT|A/.test(e.target.tagName) || !$("#sheet").hidden || !$("#auth").hidden) return;
    if (!$("#summary").hidden) $("#again").click(); else $("#action").click();
  });
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
}

(async function boot(){
  canvas = $("#globe"); ctx = canvas.getContext("2d");
  gPins = sv("g", {}); $("#pins").append(gPins);
  overlayHook = drawArc; afterDraw = placePins;
  renderModes(); wire(); onNet();
  layout();
  const netReady = initNet().catch(e => showAuth("login", {text: friendly(e)}));
  const satP = loadImage(IMAGERY).catch(() => null);   // download the satellite map while the coastlines load
  try { await loadLand(); } catch(e){}
  $("#loadmsg").textContent = "Loading satellite imagery…";
  const sat = await loadImagery(satP);
  if (!sat){
    $("#loadmsg").textContent = "Painting the planet…";
    await new Promise(r => setTimeout(r, 30));
    paintTexture();
  }
  sprites(); prepareOverlays();
  buildDensity();   // population density fades in once it's ready
  initGestures(p => { if (canPlay()) handleTap(p); });
  layout();
  if (!resumeGame()) newGame();   // pick up where you left off, if a game was in progress
  $("#loading").hidden = true;
  (function spin(){ if (!$("#auth").hidden && !anim){ view.lam += 0.06; draw(false); } requestAnimationFrame(spin); })();
  await netReady;
})();
