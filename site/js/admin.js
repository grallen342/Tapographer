/* =================== Tapographer host control panel =================== */
const CFG = window.TAPO_CONFIG || {};
const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)){
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (k === "style") e.setAttribute("style", v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return e;
}
let toastT;
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3400); }
const friendly = e => (e && (e.message || e.error_description || String(e))) || "Something went wrong.";
const fmtDate = t => t ? new Date(t).toLocaleDateString(undefined, {month:"short", day:"numeric", year:"2-digit"}) : "—";
const fmtWhen = t => t ? new Date(t).toLocaleString(undefined, {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}) : "—";
const MODE_LABEL = {random:"Random", daily:"Daily", duel:"Duel", blitz:"25s Challenge", us:"USA", eu:"Europe", as:"Asia", af:"Africa", am:"Americas"};
const siteLink = () => location.origin + location.pathname.replace(/admin\.html$/, "");
function avatarEl(p){ const s = h("span", {class:"av", text:(p && p.avatar) || "🧭"}); s.style.background = (p && p.color) || "#2A3446"; return s; }
function spark(values, label){
  const sp = h("div", {class:"spark", "aria-label": label});
  const lo = Math.min(...values), hi = Math.max(...values);
  values.forEach(v => { const b = h("i", {title: String(v)}); b.style.height = (12 + 88 * (v - lo) / Math.max(1, hi - lo)) + "%"; sp.append(b); });
  return sp;
}

let sb = null, session = null, me = null;
const UNLOCK_KEY = "tapo_host_unlocked_until", UNLOCK_MS = 30 * 60 * 1000;
const isUnlocked = () => { try { return Number(sessionStorage.getItem(UNLOCK_KEY) || 0) > Date.now(); } catch(e){ return false; } };
const setUnlocked = on => { try { on ? sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_MS)) : sessionStorage.removeItem(UNLOCK_KEY); } catch(e){} };
["click", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (isUnlocked()) setUnlocked(true); }));

const S = { tab: "overview", users: [], duels: [], overview: null, settings: null, detail: null, detailGames: null,
            q: "", filter: "all", sort: "rating", dir: -1, confirm: null };

/* ---------------- gate ---------------- */
function gate(view, msg){
  $("#panel").hidden = true; $("#hostbar").hidden = true;
  const c = $("#gatecard"); c.replaceChildren(); $("#gate").hidden = false;
  c.append(h("div", {class:"authbrand"}, h("span", {class:"pinmark"}), "Tapographer host"));
  if (view === "setup"){ c.append(h("p", {text:"config.js isn't filled in yet. Add your Supabase URL and anon key, then reload."})); return; }
  if (view === "notadmin"){
    c.append(h("h3", {text:"Hosts only"}), h("p", {text:"This control panel is only for the game's host. You're logged in as a player."}),
      h("div", {class:"btns"}, h("a", {class:"primary btnlink", href: siteLink(), text:"Back to the game"})));
    return;
  }
  const loggedIn = !!session;
  const who = h("input", {id:"hostlogin", type:"text", autocomplete:"username", autocapitalize:"none"});
  const pw = h("input", {id:"hostpw", type:"password", autocomplete:"current-password"});
  const go = h("button", {class:"primary", type:"submit", text:"Open control panel"});
  const note = msg ? h("p", {class:"note", text: msg}) : null;
  const form = h("form", {class:"authform", onsubmit: async e => {
    e.preventDefault(); go.disabled = true; go.textContent = "Checking…";
    try {
      let email = session && session.user.email;
      if (!loggedIn){
        const { data } = await sb.rpc("email_for_login", {p_login: who.value.trim()});
        email = data;
        if (!email) throw new Error("No account uses that username.");
      }
      const { data, error } = await sb.auth.signInWithPassword({email, password: pw.value});
      if (error) throw new Error(/invalid/i.test(error.message) ? "That password isn't right." : error.message);
      session = data.session;
      await loadMe();
      if (!me || !me.is_admin) return gate("notadmin");
      setUnlocked(true); openPanel();
    } catch(err){ gate("pw", friendly(err)); }
  }},
    loggedIn ? h("p", null, "Signed in as ", h("b", {text: (me && me.username) || session.user.email}), ". Enter your password to open the control panel.")
             : h("p", {text:"Log in with your host account."}),
    note,
    loggedIn ? null : h("div", {class:"field"}, h("label", {for:"hostlogin", text:"Username or email"}), who),
    h("div", {class:"field"}, h("label", {for:"hostpw", text:"Password"}), pw), go);
  c.append(h("h3", {text:"Control panel"}), form, h("a", {class:"linkbtn", href: siteLink(), text:"Back to the game"}));
  setTimeout(() => (loggedIn ? pw : who).focus(), 30);
}
async function loadMe(){
  const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  me = data;
}

/* ---------------- data ---------------- */
async function loadUsers(){ const { data, error } = await sb.rpc("admin_users"); if (error) throw error; S.users = data || []; }
async function loadOverview(){ const { data, error } = await sb.rpc("admin_overview"); if (error) throw error; S.overview = data; }
async function loadDuels(){ const { data, error } = await sb.from("duels").select("*").order("created_at", {ascending:false}).limit(500); if (error) throw error; S.duels = data || []; }
async function loadSettings(){ const { data, error } = await sb.from("settings").select("*").eq("id", 1).maybeSingle(); if (error) throw error; S.settings = data; }
async function refresh(){
  try { await Promise.all([loadUsers(), loadOverview(), loadDuels(), loadSettings()]); }
  catch(e){ toast(friendly(e)); if (/Host only/.test(friendly(e))) return gate("notadmin"); }
  render();
}
const userById = id => S.users.find(u => u.id === id);
const nameOf = id => (userById(id) || {}).username || "Deleted player";
async function act(promise, okMsg){
  const { error, data } = await promise;
  if (error){ toast(friendly(error)); return null; }
  if (okMsg) toast(okMsg);
  await refresh();
  return data ?? true;
}

/* ---------------- panel ---------------- */
function openPanel(){ $("#gate").hidden = true; $("#panel").hidden = false; $("#hostbar").hidden = false; $("#hostname").textContent = me.username; refresh(); }
function render(){
  if (!isUnlocked()) return gate("pw", "The control panel locked after 30 minutes of inactivity.");
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === S.tab ? "true" : "false"));
  const body = $("#panelbody"); body.replaceChildren();
  if (S.tab === "overview") renderOverview(body);
  if (S.tab === "players") S.detail ? renderPlayer(body) : renderPlayers(body);
  if (S.tab === "duels") renderDuels(body);
  if (S.tab === "settings") renderSettings(body);
}

function renderOverview(body){
  const o = S.overview || {};
  const g = h("div", {class:"statgrid wide"});
  [["Players", o.players], ["New this week", o.new_7d], ["Active this week", o.active_7d], ["Suspended", o.banned],
   ["Games played", o.games], ["Games in 24h", o.games_today], ["Duels", o.duels], ["Duels open", o.duels_open], ["Average rating", o.avg_rating]]
    .forEach(([l, v]) => g.append(h("div", {class:"stat"}, h("b", {text: v == null ? "—" : String(v)}), h("span", {text: l}))));
  body.append(g);
  const top = S.users.filter(u => !u.banned).slice(0, 5);
  body.append(h("h4", {class:"sect", text:"Top rated"}),
    top.length ? h("div", {class:"tblwrap"}, h("table", {class:"admintbl"}, h("tbody", null, top.map((u, i) =>
      h("tr", {tabindex:"0", onclick: () => openPlayer(u.id)}, h("td", {class:"num", text: "#" + (i + 1)}),
        h("td", null, h("span", {class:"cell-who"}, avatarEl(u), h("span", {text: u.username}))),
        h("td", {class:"num", text: String(u.rating)}), h("td", {class:"num", text: `${u.rated_games} ranked`}), h("td", {class:"num", text: `avg ${u.avg}`})))))) : h("p", {class:"empty", text:"No players yet."}));
  const feed = h("div", {class:"tblwrap"}, h("p", {class:"empty", text:"Loading recent games…"}));
  body.append(h("h4", {class:"sect", text:"Latest games"}), feed);
  sb.from("games").select("*").order("created_at", {ascending:false}).limit(25).then(({data}) => {
    feed.replaceChildren(gamesTable(data || [], true));
  });
  body.append(h("div", {class:"btns"}, h("button", {class:"secondary", text:"Export players (CSV)", onclick: exportCSV}),
    h("button", {class:"secondary", text:"Copy game link", onclick: () => copy(siteLink(), "Game link copied.")})));
}
function gamesTable(rows, withPlayer){
  if (!rows.length) return h("p", {class:"empty", text:"No games yet."});
  return h("table", {class:"admintbl"},
    h("thead", null, h("tr", null, ...[withPlayer ? "Player" : null, "When", "Mode", "Score", "Rounds", "Rating"].filter(Boolean).map(t => h("th", {text: t})))),
    h("tbody", null, rows.map(g => h("tr", null,
      withPlayer ? h("td", {text: nameOf(g.user_id)}) : null,
      h("td", {text: fmtWhen(g.created_at)}),
      h("td", {text: MODE_LABEL[g.mode] || g.mode}),
      h("td", {class:"num", text: `${g.score}/${g.max}`}),
      h("td", {class:"num", text: (g.raws || []).join(" · "), title: (g.places || []).join(", ")}),
      h("td", {class:"num", text: g.delta == null ? "—" : `${g.rating} (${g.delta >= 0 ? "+" : ""}${g.delta})`})))));
}

const COLS = [["username","Player"],["email","Email"],["rating","Rating"],["rated_games","Ranked"],["avg","Avg"],["best","Best"],["streak","Streak"],["last_played","Last played"],["created_at","Joined"]];
function renderPlayers(body){
  const search = h("input", {id:"q", type:"search", placeholder:"Search by username or email", value: S.q});
  search.addEventListener("input", () => { S.q = search.value; const pos = search.selectionStart; render(); const s = $("#q"); s.focus(); s.setSelectionRange(pos, pos); });
  const chip = (id, label) => h("button", {class:"chip", "aria-pressed": S.filter === id ? "true" : "false", text: label, onclick: () => { S.filter = id; render(); }});
  body.append(h("div", {class:"toolbar"}, search, h("div", {class:"chips"}, chip("all", "All"), chip("hosts", "Hosts"), chip("banned", "Suspended"), chip("unconfirmed", "Email not confirmed"))));
  const q = S.q.trim().toLowerCase();
  let rows = S.users.filter(u => (!q || u.username.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)) &&
    (S.filter === "all" || (S.filter === "hosts" && u.is_admin) || (S.filter === "banned" && u.banned) || (S.filter === "unconfirmed" && !u.email_confirmed)));
  rows = rows.slice().sort((a, b) => { const x = a[S.sort], y = b[S.sort]; return (x == null) - (y == null) || (x > y ? 1 : x < y ? -1 : 0) * S.dir; });
  const th = ([key, label]) => h("th", {class:"sortable", "aria-sort": S.sort === key ? (S.dir > 0 ? "ascending" : "descending") : "none",
    onclick: () => { if (S.sort === key) S.dir *= -1; else { S.sort = key; S.dir = key === "username" || key === "email" ? 1 : -1; } render(); }}, label, S.sort === key ? (S.dir > 0 ? " ↑" : " ↓") : "");
  const tbl = h("table", {class:"admintbl"}, h("thead", null, h("tr", null, COLS.map(th), h("th", {text:"Status"}))),
    h("tbody", null, rows.map(u => h("tr", {tabindex:"0", onclick: () => openPlayer(u.id), onkeydown: e => { if (e.key === "Enter") openPlayer(u.id); }},
      h("td", null, h("span", {class:"cell-who"}, avatarEl(u), h("span", {text: u.username}))),
      h("td", {text: u.email || "—"}),
      h("td", {class:"num", text: u.rating + (u.rated_games < 5 ? "*" : "")}),
      h("td", {class:"num", text: String(u.rated_games)}), h("td", {class:"num", text: String(u.avg)}), h("td", {class:"num", text: String(u.best)}),
      h("td", {class:"num", text: String(u.streak)}), h("td", {text: fmtDate(u.last_played)}), h("td", {text: fmtDate(u.created_at)}),
      h("td", null, statusChips(u))))));
  body.append(h("div", {class:"tblwrap"}, tbl), h("p", {class:"hint", text:`${rows.length} of ${S.users.length} players. * provisional rating (under 5 ranked games). Select a player to manage them.`}));
}
function statusChips(u){
  const c = [];
  if (u.is_admin) c.push(h("span", {class:"tag host", text:"Host"}));
  if (u.banned) c.push(h("span", {class:"tag bad", text:"Suspended"}));
  if (!u.email_confirmed) c.push(h("span", {class:"tag", text:"Unconfirmed"}));
  return c.length ? c : h("span", {class:"tag ok", text:"Active"});
}
function openPlayer(id){
  S.tab = "players"; S.detail = id; S.detailGames = null; S.confirm = null; render();
  sb.from("games").select("*").eq("user_id", id).order("created_at", {ascending:false}).limit(200).then(({data}) => { if (S.detail === id){ S.detailGames = data || []; render(); } });
}
function renderPlayer(body){
  const u = userById(S.detail);
  if (!u){ S.detail = null; return render(); }
  const self = u.id === me.id;
  body.append(h("div", {class:"btns"}, h("button", {class:"secondary small", text:"← All players", onclick: () => { S.detail = null; render(); }})));
  body.append(h("div", {class:"pf"}, (() => { const a = avatarEl(u); a.classList.add("lg"); return a; })(),
    h("div", null, h("div", {class:"nm", text: u.username}), h("div", {class:"rk", text: `${u.email || ""} · joined ${fmtDate(u.created_at)} · last login ${fmtWhen(u.last_sign_in)}`}), h("div", {class:"chips"}, statusChips(u)))));
  const g = h("div", {class:"statgrid wide"});
  [["Rating", u.rating], ["Ranked games", u.rated_games], ["Ranked-format games", u.games], ["Average", u.avg], ["Best", u.best], ["Bullseyes", u.bullseyes],
   ["Daily streak", u.streak], ["25s best", u.blitz_best, `${u.blitz_games} games`], ["Regional best", u.region_best, `${u.region_games} games`]]
    .forEach(([l, v, x]) => g.append(h("div", {class:"stat"}, h("b", {text: String(v)}, x ? h("small", {class:"statx", text: x}) : null), h("span", {text: l}))));
  body.append(g);

  // actions
  const acts = h("div", {class:"actions"});
  const rename = h("input", {id:"rename", type:"text", maxlength:"20", value: u.username});
  acts.append(h("div", {class:"act"}, h("div", null, h("b", {text:"Username"}), h("span", {text:"2–20 letters, numbers, spaces, dots, dashes or underscores."})),
    h("div", {class:"row"}, rename, h("button", {class:"secondary small", text:"Rename", onclick: () => act(sb.rpc("admin_rename", {p_user: u.id, p_name: rename.value}), "Renamed.")}))));
  acts.append(h("div", {class:"act"}, h("div", null, h("b", {text:"Password"}), h("span", {text:"Emails them a link to set a new password. You never see their password."})),
    h("button", {class:"secondary small", text:"Send reset email", disabled: !u.email, onclick: async () => {
      const { error } = await sb.auth.resetPasswordForEmail(u.email, {redirectTo: siteLink()});
      toast(error ? friendly(error) : `Reset link sent to ${u.email}.`); }})));
  if (!self){
    acts.append(h("div", {class:"act"}, h("div", null, h("b", {text: u.banned ? "Suspended" : "Suspend"}), h("span", {text: u.banned ? "They can't play, duel or change their profile. Their scores stay." : "Stops them playing and hides them from rankings, without deleting anything."})),
      h("button", {class:"secondary small", text: u.banned ? "Lift suspension" : "Suspend player", onclick: () => act(sb.rpc("admin_set_banned", {p_user: u.id, p_banned: !u.banned}), u.banned ? "Suspension lifted." : "Player suspended.")})));
  }
  acts.append(h("div", {class:"act"}, h("div", null, h("b", {text:"Host access"}), h("span", {text: u.is_admin ? "Can open this control panel." : "Give them the same control panel access you have."})),
    h("button", {class:"secondary small", text: u.is_admin ? "Remove host access" : "Make host", onclick: () => act(sb.rpc("admin_set_host", {p_user: u.id, p_flag: !u.is_admin}), u.is_admin ? "Host access removed." : "They're now a host.")})));
  acts.append(confirmAction("reset", "Reset stats", "Sets rating back to 1000 and clears scores, streak and game history. The account stays.", "Reset stats",
    () => act(sb.rpc("admin_reset_stats", {p_user: u.id}), "Stats reset.")));
  if (!self) acts.append(deleteAction(u));
  body.append(h("h4", {class:"sect", text:"Manage"}), acts);

  body.append(h("h4", {class:"sect", text:`Game history${S.detailGames ? ` (${S.detailGames.length})` : ""}`}));
  if (!S.detailGames) body.append(h("p", {class:"empty", text:"Loading…"}));
  else {
    const rh = S.detailGames.filter(x => x.delta != null).slice(0, 30).reverse().map(x => x.rating);
    if (rh.length > 1) body.append(h("div", {class:"field"}, h("label", {text:"Rating after each ranked game"}), spark(rh, "Rating history")));
    body.append(h("div", {class:"tblwrap"}, gamesTable(S.detailGames, false)));
  }
  const du = S.duels.filter(d => d.challenger === u.id || d.opponent === u.id).slice(0, 30);
  if (du.length) body.append(h("h4", {class:"sect", text:"Duels"}), h("div", {class:"tblwrap"}, duelsTable(du, u.id)));
}
function confirmAction(key, title, desc, label, run){
  const armed = S.confirm === key;
  return h("div", {class:"act" + (armed ? " armed" : "")}, h("div", null, h("b", {text: title}), h("span", {text: armed ? "Press again to confirm. This can't be undone." : desc})),
    h("div", {class:"row"}, armed ? h("button", {class:"secondary small", text:"Cancel", onclick: () => { S.confirm = null; render(); }}) : null,
      h("button", {class:"secondary small" + (armed ? " dangerbtn" : ""), text: armed ? "Yes, " + label.toLowerCase() : label, onclick: async () => {
        if (!armed){ S.confirm = key; return render(); }
        S.confirm = null; await run(); }})));
}
function deleteAction(u){
  const typed = h("input", {id:"deltype", type:"text", placeholder:`Type ${u.username} to confirm`, autocomplete:"off"});
  const btn = h("button", {class:"secondary small dangerbtn", text:"Delete account", disabled: true, onclick: async () => {
    const ok = await act(sb.rpc("admin_delete_user", {p_user: u.id}), `${u.username} was deleted.`);
    if (ok){ S.detail = null; render(); }
  }});
  typed.addEventListener("input", () => { btn.disabled = typed.value.trim() !== u.username; });
  return h("div", {class:"act"}, h("div", null, h("b", {text:"Delete account"}), h("span", {text:"Removes their login, profile, games and duels for good. They could sign up again unless sign-ups are closed or invite-only."})),
    h("div", {class:"row"}, typed, btn));
}

function duelsTable(rows, focus){
  return h("table", {class:"admintbl"},
    h("thead", null, h("tr", null, ...["Started", "Challenger", "Opponent", "Score", "Status", ""].map(t => h("th", {text: t})))),
    h("tbody", null, rows.map(d => {
      const done = d.challenger_score != null && d.opponent_score != null;
      const armed = S.confirm === "duel:" + d.id;
      return h("tr", null,
        h("td", {text: fmtWhen(d.created_at)}),
        h("td", {text: nameOf(d.challenger), class: focus === d.challenger ? "strong" : ""}),
        h("td", {text: nameOf(d.opponent), class: focus === d.opponent ? "strong" : ""}),
        h("td", {class:"num", text: `${d.challenger_score ?? "…"}–${d.opponent_score ?? "…"}`}),
        h("td", null, h("span", {class:"tag" + (done ? " ok" : ""), text: done ? "Finished" : d.challenger_score == null ? "Challenger to play" : "Opponent to play"})),
        h("td", null, h("button", {class:"linkbtn danger", text: armed ? "Confirm delete" : "Delete", onclick: async e => {
          e.stopPropagation();
          if (!armed){ S.confirm = "duel:" + d.id; return render(); }
          S.confirm = null; await act(sb.rpc("admin_delete_duel", {p_id: d.id}), "Duel deleted.");
        }})));
    })));
}
function renderDuels(body){
  const open = S.duels.filter(d => d.challenger_score == null || d.opponent_score == null).length;
  body.append(h("p", {class:"hint", text:`${S.duels.length} duels (latest 500 shown), ${open} still waiting on a player.`}));
  const days1 = h("input", {id:"days1", type:"number", min:"0", value:"30", class:"num-in"});
  const days2 = h("input", {id:"days2", type:"number", min:"0", value:"14", class:"num-in"});
  body.append(h("div", {class:"actions"},
    h("div", {class:"act"}, h("div", null, h("b", {text:"Clear old finished duels"}), h("span", {text:"Keeps players' ratings and records as they are now."})),
      h("div", {class:"row"}, "Older than", days1, "days", h("button", {class:"secondary small", text:"Clear", onclick: async () => {
        const n = await act(sb.rpc("admin_clear_duels", {p_days: Number(days1.value) || 0, p_unfinished_only: false}), null); if (n !== null) toast(`${n} duels cleared.`); }}))),
    h("div", {class:"act"}, h("div", null, h("b", {text:"Clear stale unfinished duels"}), h("span", {text:"Duels someone never played."})),
      h("div", {class:"row"}, "Older than", days2, "days", h("button", {class:"secondary small", text:"Clear", onclick: async () => {
        const n = await act(sb.rpc("admin_clear_duels", {p_days: Number(days2.value) || 0, p_unfinished_only: true}), null); if (n !== null) toast(`${n} duels cleared.`); }})))));
  body.append(S.duels.length ? h("div", {class:"tblwrap"}, duelsTable(S.duels)) : h("p", {class:"empty", text:"No duels yet."}));
}

function renderSettings(body){
  const s = S.settings; if (!s){ body.append(h("p", {class:"empty", text:"Loading…"})); return; }
  const toggle = (id, label, desc, on) => {
    const cb = h("input", {id, type:"checkbox"}); cb.checked = on;
    return [h("label", {class:"act toggle", for: id}, h("div", null, h("b", {text: label}), h("span", {text: desc})), cb), cb];
  };
  const [t1, signups] = toggle("signups", "New sign-ups", "When off, nobody new can create an account. Existing players keep playing.", s.signups_open);
  const [t2, bonus] = toggle("bonus", "Daily country bonus", "MapTap's safety net in the Daily: right country scores at least 25, right continent at least 10.", s.daily_bonus);
  const invite = h("input", {id:"invite", type:"text", placeholder:"No code: anyone with the link can sign up", value: s.invite_code || "", autocapitalize:"none"});
  const gen = h("button", {class:"secondary small", type:"button", text:"Generate", onclick: () => { invite.value = Math.random().toString(36).slice(2, 8) + "-" + Math.random().toString(36).slice(2, 6); }});
  const clr = h("button", {class:"secondary small", type:"button", text:"Clear", onclick: () => { invite.value = ""; }});
  const ann = h("textarea", {id:"announce", rows:"2", maxlength:"200", placeholder:"Optional message shown at the top of the game for everyone"}); ann.value = s.announcement || "";
  const save = h("button", {class:"primary", text:"Save settings", onclick: async () => {
    save.disabled = true;
    await act(sb.from("settings").update({signups_open: signups.checked, daily_bonus: bonus.checked, invite_code: invite.value.trim() || null,
      announcement: ann.value.trim() || null, updated_at: new Date().toISOString()}).eq("id", 1), "Settings saved.");
    save.disabled = false;
  }});
  body.append(h("div", {class:"actions"}, t1,
    h("div", {class:"act"}, h("div", null, h("b", {text:"Invite code"}), h("span", {text:"When set, new players must enter this code to sign up. Share it with the link."})), h("div", {class:"row"}, invite, gen, clr)),
    t2,
    h("div", {class:"act col"}, h("div", null, h("b", {text:"Announcement"}), h("span", {text:"Up to 200 characters, shown as a banner to every player."})), ann)),
    h("div", {class:"btns"}, save));
  body.append(h("h4", {class:"sect", text:"Your game link"}), h("div", {class:"act"}, h("div", null, h("b", {text: siteLink()}), h("span", {text:"Send this to friends. They create their own username, email and password."})),
    h("button", {class:"secondary small", text:"Copy", onclick: () => copy(siteLink(), "Link copied.")})));
}

async function copy(text, msg){ try { await navigator.clipboard.writeText(text); toast(msg); } catch(e){ toast(text); } }
function exportCSV(){
  const cols = ["username","email","email_confirmed","is_admin","banned","rating","rated_games","games","avg","best","bullseyes","streak","blitz_best","region_best","created_at","last_played","last_sign_in"];
  const esc = v => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(",")].concat(S.users.map(u => cols.map(c => esc(u[c])).join(","))).join("\n");
  const a = h("a", {href: URL.createObjectURL(new Blob([csv], {type:"text/csv"})), download: `tapographer-players-${new Date().toISOString().slice(0,10)}.csv`});
  document.body.append(a); a.click(); a.remove();
}

/* ---------------- start ---------------- */
(async function boot(){
  document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; S.detail = null; S.confirm = null; render(); });
  $("#lock").onclick = () => { setUnlocked(false); gate("pw"); };
  $("#refresh").onclick = () => refresh();
  if (!CFG.SUPABASE_URL || /YOUR-/.test(CFG.SUPABASE_URL) || !window.supabase) return gate("setup");
  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  ({ data: { session } } = await sb.auth.getSession());
  if (session){ await loadMe(); if (!me || !me.is_admin) return gate("notadmin"); }
  if (session && isUnlocked()) openPanel(); else gate("pw");
  setInterval(() => { if (!$("#panel").hidden && !isUnlocked()) render(); }, 30000);
})();
