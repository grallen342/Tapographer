/* =================== game rules & round flow =================== */
const TYPES = {cap:"Capital", city:"City", mark:"Landmark", nat:"Natural wonder"};
const MODES = {
  random: {label:"Random",    kind:"classic"},
  daily:  {label:"Daily",     kind:"classic", daily:true},
  blitz:  {label:"Challenge", sub:"25s", kind:"blitz"},
  us:     {label:"USA",      kind:"region", regions:["us"], center:[-97,38.5], zoom:3.4},
  eu:     {label:"Europe",   kind:"region", regions:["eu"], center:[14,52],   zoom:3.1},
  as:     {label:"Asia",     kind:"region", regions:["as"], center:[88,28],   zoom:1.8},
  af:     {label:"Africa",   kind:"region", regions:["af"], center:[19,2],    zoom:1.9},
  am:     {label:"Americas", kind:"region", regions:["am"], center:[-74,8],   zoom:1.3},
  duel:   {label:"Duel",     kind:"classic", hidden:true},
};
const ROUNDS = 5;
const MULT = {classic:[1,1,2,3,3], blitz:[1,1,1,1,1], region:[1,1,1,1,1]};
const BLITZ_MS = 25000;

const store = {
  get(k,d){ try{ const v = localStorage.getItem("tapo3:"+k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem("tapo3:"+k, JSON.stringify(v)); }catch(e){} }
};
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
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200); }

const startMode = "random";   // every visit opens a fresh random game
const state = {
  mode: startMode,
  picks: [], round: 0, results: [], guess: null, revealed: false, done: false,
  blitzLeft: BLITZ_MS, blitzT0: 0, blitzTimer: null, duel: null,
};
const mode = () => MODES[state.mode];
const mults = () => MULT[mode().kind];

function todayKey(d = new Date()){ return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function dateLabel(){ return new Date().toLocaleDateString(undefined, {month:"short", day:"numeric"}); }
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let x = 2166136261; for (const ch of s){ x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }

const fromCurated = c => ({name:c[0], ctx:c[1], lat:c[2], lon:c[3], tier:c[4], story:c[5]});
const fromPlace = p => ({name:p[0], ctx:p[1], lat:p[2], lon:p[3], type:p[4], story:null});

function pickFrom(list, rand, seenKey){
  let seen = seenKey ? new Set(store.get(seenKey, [])) : new Set();
  // also skip places from this player's recent games (saved with their profile, so it works across devices)
  const recentNames = new Set((typeof net !== "undefined" && net.recentPlaces) || []);
  let fresh = list.filter(x => !seen.has(x.name + "|" + x.ctx) && !recentNames.has(x.name));
  if (!fresh.length) fresh = list.filter(x => !seen.has(x.name + "|" + x.ctx));
  if (!fresh.length){ seen = new Set(); fresh = list.slice(); }
  const pick = fresh[Math.floor(rand() * fresh.length)];
  if (seenKey){ seen.add(pick.name + "|" + pick.ctx); store.set(seenKey, [...seen]); }
  return pick;
}
function makePicks(){
  const m = mode();
  if (state.mode === "duel") return state.duel.picks.map(i => fromCurated(CURATED[i]));
  const all = CURATED.map(fromCurated);
  const tier = t => all.filter(x => x.tier === t);
  if (m.kind === "classic"){
    const rand = m.daily ? rng(hashStr("tapographer:" + todayKey())) : Math.random;
    return [1,2,3,4,5].map(t => pickFrom(tier(t), rand, m.daily ? null : "seen:random:" + t));
  }
  if (m.kind === "blitz"){
    const pool = all.filter(x => x.tier <= 3), out = [];
    while (out.length < ROUNDS){ const p = pickFrom(pool, Math.random, "seen:blitz"); if (!out.includes(p)) out.push(p); }
    return out.sort((a,b) => a.tier - b.tier);
  }
  const pool = PLACES.filter(p => m.regions.includes(p[5])).map(fromPlace), out = [];
  let guard = 0;
  while (out.length < ROUNDS && guard++ < 200){
    const p = pickFrom(pool, Math.random, "seen:" + state.mode);
    if (out.some(q => q === p || gdist([p.lon,p.lat],[q.lon,q.lat]) * 6371 < 150)) continue;
    out.push(p);
  }
  return out;
}
const current = () => state.picks[state.round];
const truthLL = () => { const p = current(); return [p.lon, p.lat]; };

/* Scoring follows MapTap's published rules: 100 within 22 km, about 81 at 1,000 km, nothing past 16,250 km.
   The curve between is the community fit of MapTap scores, 100 / (1 + (km / 3867)^1.05): kind up close, unforgiving far out.
   Regional maps are much smaller, so distances there count four times as much. */
function mapTapScore(km){
  if (km <= 22) return 100;
  if (km >= 16250) return 0;
  let s = 100 / (1 + Math.pow(km / 3867, 1.05));
  if (km > 10000) s *= (16250 - km) / 6250;     // taper to zero at 16,250 km
  return Math.max(0, Math.min(100, Math.round(s)));
}
function rawScore(km){ return mapTapScore(mode().kind === "region" ? km * 4 : km); }

/* MapTap's Daily safety net: a tap in the right country is worth at least 25, the right continent at least 10. */
const CONTINENT = {};
("NA:USA CAN MEX GTM BLZ HND SLV NIC CRI PAN CUB JAM HTI DOM PRI BHS TTO GRL|SA:COL VEN GUY SUR ECU PER BOL BRA PRY URY ARG CHL FLK GUF|" +
 "EU:ISL IRL GBR NOR SWE FIN DNK EST LVA LTU POL DEU NLD BEL LUX FRA ESP PRT CHE AUT ITA SVN HRV BIH SRB MNE ALB MKD GRC BGR ROU MDA UKR BLR CZE SVK HUN RUS CYP KOS|" +
 "AF:MAR DZA TUN LBY EGY ESH MRT MLI NER TCD SDN SSD ERI ETH DJI SOM KEN UGA RWA BDI TZA MOZ MWI ZMB ZWE BWA NAM ZAF LSO SWZ AGO COD COG GAB GNQ CMR CAF NGA BEN TGO GHA CIV LBR SLE GIN GNB SEN GMB BFA MDG|" +
 "AS:TUR GEO ARM AZE IRN IRQ SYR LBN ISR PSE JOR SAU YEM OMN ARE QAT KWT KAZ UZB TKM KGZ TJK AFG PAK IND NPL BTN BGD LKA MMR THA LAO KHM VNM MYS SGP BRN IDN TLS PHL CHN MNG PRK KOR JPN TWN|" +
 "OC:AUS NZL PNG SLB VUT NCL FJI").split("|").forEach(g => { const [c, list] = g.split(":"); list.split(" ").forEach(id => CONTINENT[id] = c); });
// The detailed map uses numeric ISO codes ("840" = USA); the fallback map uses letter codes.
("NA:840 124 484 320 84 340 222 558 188 591 192 388 332 214 630 44 780 304|SA:170 862 328 740 218 604 68 76 600 858 32 152 238 254|" +
 "EU:352 372 826 578 752 246 208 233 428 440 616 276 528 56 442 250 724 620 756 40 380 705 191 70 688 499 8 807 300 100 642 498 804 112 203 703 348 643 196 470|" +
 "AF:504 12 788 434 818 732 478 466 562 148 729 728 232 231 262 706 404 800 646 108 834 508 454 894 716 72 516 710 426 748 24 180 178 266 226 120 140 566 204 768 288 384 430 694 324 624 686 270 854 450|" +
 "AS:792 268 51 31 364 368 760 422 376 275 400 682 887 512 784 634 414 398 860 795 417 762 4 586 356 524 64 50 144 104 764 418 116 704 458 702 96 360 626 608 156 496 408 410 392 158 48|" +
 "OC:36 554 598 90 548 540 242").split("|").forEach(g => { const [c, list] = g.split(":"); list.split(" ").forEach(id => CONTINENT[id] = c); });
const countryKey = id => id == null ? null : /^\d+$/.test(String(id)) ? String(parseInt(id, 10)) : String(id);
function bonusFloor(guess, truth){
  if (!mode().daily || !net.settings.daily_bonus) return 0;
  const a = countryKey(countryAt(guess[0], guess[1])), b = countryKey(countryAt(truth[0], truth[1]));
  if (!a || !b) return 0;
  if (a === b) return 25;
  if (CONTINENT[a] && CONTINENT[a] === CONTINENT[b]) return 10;
  return 0;
}
const TIER_LABEL = {1:"World city", 2:"Capital & city", 3:"Landmark", 4:"History", 5:"Far corner"};
const verdictFor = raw => raw >= 100 ? "Bullseye!" : raw >= 95 ? "Superb" : raw >= 85 ? "So close" : raw >= 70 ? "Close" : raw >= 45 ? "Getting warm" : raw >= 20 ? "Wrong neighborhood" : "Way off";
const tierOf = raw => raw >= 90 ? 1 : raw >= 70 ? 2 : raw >= 40 ? 3 : 4;
const emoji = raw => raw >= 100 ? "🎯" : raw >= 95 ? "🔥" : raw >= 90 ? "🎉" : raw >= 80 ? "🌟" : raw >= 70 ? "👍" : raw >= 50 ? "🤨" : raw >= 25 ? "😬" : "💀";
const maxScore = () => mults().reduce((a,b) => a + b*100, 0);
const total = () => state.results.reduce((s,r) => s + (r ? r.pts : 0), 0);
function fmtDist(km){ const mi = km * 0.621371; return (mi < 10 ? mi.toFixed(1) : Math.round(mi).toLocaleString()) + " mi"; }

/* ---------------- pins & arc ---------------- */
let gPins, pinGuess = null, pinTruth = null;
const PIN_D = "M0,0 C-2,-6 -9,-10 -9,-17 A9,9 0 1 1 9,-17 C9,-10 2,-6 0,0Z";
const SVGNS = "http://www.w3.org/2000/svg";
const sv = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
function buildPins(){
  gPins.replaceChildren(); pinGuess = pinTruth = null;
  if (state.revealed){
    pinTruth = sv("g", {class:"truth"});
    pinTruth.append(sv("circle", {class:"ring", r:9}), sv("circle", {class:"dot", r:6.5}));
    const t = sv("text", {x:12, y:5}); t.textContent = current().name; pinTruth.append(t);
    gPins.append(pinTruth);
  }
  if (state.guess){
    pinGuess = sv("g", {class:"pin"});
    const b = sv("g", {class:"body"});
    b.append(sv("ellipse", {cx:0, cy:0, rx:5, ry:2}), sv("path", {d:PIN_D}), sv("circle", {class:"hole", cx:0, cy:-17, r:3.4}));
    pinGuess.append(b); gPins.append(pinGuess);
  }
  placePins();
}
function placePins(){
  const place = (g, ll) => {
    const q = project(ll[0], ll[1]);
    if (q[2] <= 0.01){ g.setAttribute("display", "none"); return null; }
    g.removeAttribute("display"); g.setAttribute("transform", `translate(${q[0]},${q[1]})`);
    return q;
  };
  if (pinGuess && state.guess) place(pinGuess, state.guess);
  if (pinTruth){
    const q = place(pinTruth, truthLL());
    if (q){
      const t = pinTruth.querySelector("text"), w = t.getComputedTextLength ? t.getComputedTextLength() : 80;
      const flip = q[0] + w + 24 > W;
      t.setAttribute("x", flip ? -12 : 12); t.setAttribute("text-anchor", flip ? "end" : "start");
    }
  }
}
function drawArc(c){
  if (!(state.revealed && state.guess)) return;
  const a = state.guess, b = truthLL();
  c.save(); c.setLineDash([6,5]); c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = 2;
  c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 3;
  c.beginPath(); let pen = false;
  for (let i = 0; i <= 64; i++){
    const p = slerp(a, b, i/64), q = project(p[0], p[1]);
    if (q[2] > 0){ pen ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); pen = true; } else pen = false;
  }
  c.stroke(); c.restore();
}

/* ---------------- layout ---------------- */
function layout(){
  const stage = $("#stage");
  W = stage.clientWidth; H = stage.clientHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
  $("#pins").setAttribute("width", W); $("#pins").setAttribute("height", H);
  const sr = stage.getBoundingClientRect();
  const topH = $("#top").getBoundingClientRect().height;
  $("#prompt").style.top = (topH + 8) + "px";
  const top = $("#prompt").getBoundingClientRect().bottom - sr.top + 10;
  const bottom = H - ($("#action").getBoundingClientRect().top - sr.top) + 10;
  $("#zoomctl").style.bottom = (bottom + 6) + "px";
  const availH = Math.max(160, H - top - bottom);
  // Fill the space: on narrow screens let the globe run a little past the edges, like a real globe view
  R0 = Math.max(90, Math.min(availH * 0.5, W < 600 ? Math.min(W * 0.6, availH * 0.46) : W * 0.46));
  gcx = W/2; gcy = top + availH/2;
  makeStars();
  requestDraw(true);
}

/* ---------------- rounds ---------------- */
function handleTap(p){
  if (!canPlay()) return;
  if (state.revealed || state.done || !$("#summary").hidden || !$("#sheet").hidden) return;
  const ll = unproject(p[0], p[1]); if (!ll) return;
  state.guess = ll;
  buildPins();
  if (mode().kind === "blitz") lockIn(); else updateDock();
}

function updatePrompt(){
  const p = current(); if (!p) return;
  const ranked = RATED.has(state.mode), classic = mode().kind === "classic";
  $("#roundlbl").textContent = `Round ${state.round+1} / ${ROUNDS}`;
  const tag = $("#rtag"); tag.textContent = state.mode === "duel" ? "Duel" : ranked ? "Ranked" : "Practice"; tag.className = "rtag" + (ranked ? " on" : "");
  $("#place").textContent = p.name;
  $("#kind").textContent = p.story ? TIER_LABEL[p.tier] : (TYPES[p.type] || "Place");
  $("#ctx").textContent = p.ctx;
  $("#total").textContent = total();
  $("#outof").textContent = "/ " + maxScore();
  const vs = $("#vs");
  if (state.mode === "duel" && state.duel){ vs.hidden = false; vs.textContent = "vs " + nameOf(state.duel.opp); } else vs.hidden = true;
  const dots = $("#dots"); dots.replaceChildren();
  for (let i = 0; i < ROUNDS; i++){
    const r = state.results[i], m = mults()[i];
    const cls = "seg" + (r ? " done t" + tierOf(r.raw) : i === state.round ? " now" : "") + (m > 1 ? " hot" : "");
    dots.append(h("span", {class: cls}, h("i"), classic ? h("em", {text: r ? String(r.pts) : "×" + m}) : null));
  }
  $("#timer").hidden = mode().kind !== "blitz";
}

function updateDock(){
  const btn = $("#action"), box = $("#result");
  btn.classList.remove("next"); btn.hidden = false;
  const blitz = mode().kind === "blitz";
  if (state.revealed){
    btn.disabled = false;
    btn.textContent = state.round >= ROUNDS - 1 ? "See final score" : "Next place";
    btn.classList.add("next");
    if (blitz) btn.hidden = true;
  } else if (state.guess){
    btn.disabled = false; btn.textContent = "Lock it in";
  } else {
    btn.disabled = true; btn.textContent = blitz ? "Tap fast: your pin locks in instantly" : "Tap the globe to drop a pin";
  }
  const r = state.results[state.round];
  if (state.revealed && r){
    box.hidden = false;
    const t = tierOf(r.raw);
    $("#remoji").textContent = emoji(r.raw);
    $("#rpts").textContent = "+" + r.pts;
    $("#rpts").style.color = `var(--t${t})`;
    $("#rmath").textContent = r.mult > 1 ? `${r.raw} × ${r.mult}` : "points";
    $("#verdict").textContent = verdictFor(r.raw);
    $("#rdist").textContent = `${fmtDist(r.km)} away` + (r.bonus ? ` · ${r.bonus} bonus` : "");
    const mt = $("#meter"); mt.style.background = `var(--t${t})`;
    mt.style.width = "0%"; requestAnimationFrame(() => requestAnimationFrame(() => { mt.style.width = r.raw + "%"; }));
    const p = current();
    $("#story").textContent = p.story || `${p.name} sits at ${Math.abs(p.lat).toFixed(2)}° ${p.lat>=0?"N":"S"}, ${Math.abs(p.lon).toFixed(2)}° ${p.lon>=0?"E":"W"}.`;
    $("#story").hidden = blitz;
  } else box.hidden = true;
}

function lockIn(){
  if (!state.guess || state.revealed) return;
  const km = gdist(state.guess, truthLL()) * 6371;
  const base = rawScore(km), floor = bonusFloor(state.guess, truthLL());
  const raw = Math.max(base, floor), mult = mults()[state.round];
  state.results[state.round] = {name: current().name, km, raw, mult, pts: raw*mult, story: current().story, ctx: current().ctx, bonus: raw > base ? (floor === 25 ? "right country" : "right continent") : null};
  state.revealed = true;
  if (mode().kind === "blitz") pauseBlitz();
  buildPins(); updatePrompt(); updateDock();
  countUp($("#total"), total() - raw*mult, total());
  const d = gdist(state.guess, truthLL());
  const mid = slerp(state.guess, truthLL(), .5);
  const kT = clamp(0.62 / Math.max(Math.sin(Math.min(d, 1.4)), 0.012), 1, 20);
  flyTo(mid, kT, mode().kind === "blitz" ? 500 : 1100);
  if (mode().kind === "blitz") setTimeout(() => { if (state.revealed && mode().kind === "blitz") next(); }, 1300);
}
function countUp(el, from, to){
  const t0 = performance.now(), dur = 550;
  const step = now => { const q = Math.min(1, (now - t0)/dur); el.textContent = Math.round(from + (to-from) * (1 - Math.pow(1-q, 3))); if (q < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function startRound(){
  state.guess = null; state.revealed = false;
  buildPins(); updatePrompt(); updateDock(); layout();
  const m = mode();
  if (m.kind === "region") flyTo(m.center, m.zoom, 800);
  else flyTo([view.lam, clamp(view.phi, -35, 45)], 1, 800);
  if (m.kind === "blitz") resumeBlitz();
}
function next(){
  if (!state.revealed) return;
  if (state.round >= ROUNDS - 1) return finish();
  state.round++;
  startRound();
}

/* 25-second clock */
function resumeBlitz(){
  state.blitzT0 = performance.now();
  cancelAnimationFrame(state.blitzTimer);
  const tick = () => {
    const left = state.blitzLeft - (performance.now() - state.blitzT0);
    $("#timerbar").style.transform = `scaleX(${Math.max(0, left / BLITZ_MS)})`;
    $("#timer").classList.toggle("low", left < 7000);
    if (left <= 0){ state.blitzLeft = 0; timeUp(); return; }
    state.blitzTimer = requestAnimationFrame(tick);
  };
  tick();
}
function pauseBlitz(){ cancelAnimationFrame(state.blitzTimer); state.blitzLeft = Math.max(0, state.blitzLeft - (performance.now() - state.blitzT0)); }
function timeUp(){
  cancelAnimationFrame(state.blitzTimer);
  for (let i = state.round; i < ROUNDS; i++)
    if (!state.results[i]) state.results[i] = {name: state.picks[i].name, km: null, raw: 0, mult: 1, pts: 0, ctx: state.picks[i].ctx, missed: true};
  finish();
}

/* ---------------- lifecycle ---------------- */
function newGame(){
  cancelAnimationFrame(state.blitzTimer);
  state.picks = makePicks(); state.round = 0; state.results = []; state.done = false;
  state.blitzLeft = BLITZ_MS; state.guess = null; state.revealed = false;
  $("#summary").hidden = true;
  if (mode().daily){
    const saved = savedDaily();
    if (saved){
      state.results = saved.raws.map((raw, i) => ({name: state.picks[i].name, ctx: state.picks[i].ctx, story: state.picks[i].story, raw, mult: MULT.classic[i], pts: raw*MULT.classic[i], km: saved.kms ? saved.kms[i] : null}));
      state.done = true; updatePrompt(); updateDock(); layout(); showSummary(false); return;
    }
  }
  startRound();
}
function savedDaily(){
  const p = myProfile();
  return p && p.daily && p.daily.date === todayKey() ? p.daily : null;
}

const GRADES = [
  [950, "Near perfect. You could have drawn this globe."],
  [850, "Excellent. A human GPS."],
  [700, "Strong round. You know your way around the planet."],
  [500, "Respectable. A few pins drifted."],
  [300, "Some rough landings. Run it back."],
  [0,   "The globe won this one."],
];

async function finish(){
  state.done = true;
  showSummary(false, null, true);            // show the result right away while it saves
  const res = await recordGame();
  if (!$("#summary").hidden) showSummary(res.isBest, res.delta, false, res.error);
}

function shareText(){
  const m = mode(), sc = total();
  if (state.mode === "duel") return `Tapographer duel vs ${nameOf(state.duel.opp)}\n` + state.results.map(r => r.raw + emoji(r.raw)).join(" ") + `\nFinal score: ${sc}\n${siteLink()}`;
  if (m.kind === "classic") return `Tapographer${m.daily ? " Daily" : ""} · ${dateLabel()}\n` + state.results.map(r => r.raw + emoji(r.raw)).join(" ") + `\nFinal score: ${sc}\n${siteLink()}`;
  if (m.kind === "blitz"){
    const used = ((BLITZ_MS - state.blitzLeft) / 1000).toFixed(1);
    return `Tapographer 25s Challenge · ${dateLabel()}\n` + state.results.map(r => r.missed ? "⏱️" : emoji(r.raw)).join(" ") + `\n${sc}/500 in ${used}s\n${siteLink()}`;
  }
  return `Tapographer ${m.label} · ${dateLabel()}\n` + state.results.map(r => emoji(r.raw)).join(" ") + `\n${sc}/500\n${siteLink()}`;
}

function showSummary(isBest, delta, saving, error){
  const m = mode(), sc = total(), max = maxScore();
  $("#sumh").textContent = (m.daily ? `Daily · ${dateLabel()}` : state.mode === "duel" ? "Duel" : m.label) + " · Final score";
  $("#sumn").textContent = sc; $("#sumof").textContent = "/ " + max;
  const frac = sc / max * 1000;
  $("#grade").textContent = (isBest ? "New personal best. " : "") + GRADES.find(g => frac >= g[0])[1] + (m.daily ? " Tap Random for a fresh set." : "");
  renderDuelResult();
  const tiles = $("#tiles"); tiles.replaceChildren();
  state.results.forEach((r, i) => tiles.append(h("span", {class: "tile t" + (r.missed ? 4 : tierOf(r.raw)), title: r.name},
    h("span", {class: "te", text: r.missed ? "⏱️" : emoji(r.raw)}), h("b", {text: String(r.raw)}), mults()[i] > 1 ? h("small", {text: "×" + mults()[i]}) : h("small", {text: "\u00a0"}))));
  const rows = $("#rows"); rows.replaceChildren();
  state.results.forEach(r => {
    rows.append(h("li", null,
      h("span", {class:"e", text: r.missed ? "⏱️" : emoji(r.raw)}),
      h("span", {class:"nm", text: r.name}),
      h("span", {class:"pt"}, r.mult > 1 ? h("small", {text: `${r.raw}×${r.mult}`}) : null, String(r.pts)),
      h("span", {class:"sub", text: (r.missed ? "Out of time" : r.km != null ? fmtDist(r.km) + " off" : "") + (r.story ? (r.km != null || r.missed ? " · " : "") + r.story : "")})));
  });
  $("#sharetext").textContent = shareText();
  const p = myProfile(), st = $("#stats"); st.replaceChildren();
  if (saving) st.append(h("div", {class:"note", style:"flex:1", text:"Saving your score…"}));
  else if (error) st.append(h("div", {class:"note", style:"flex:1", text:"Your score couldn't be saved: " + error}));
  else if (p){
    const items = [];
    const dl = delta != null ? h("em", {class: delta >= 0 ? "up" : "down", text: (delta >= 0 ? "+" : "−") + Math.abs(delta)})
             : RATED.has(state.mode) ? null : h("em", {text:"practice"});
    items.push(["Rating", ratingOf(p), dl]);
    const rk = rankOf(net.uid); if (rk) items.push(["Rank", "#" + rk]);
    items.push(["Average", p.avg || 0], ["Best", p.best || 0], ["Streak", p.streak || 0]);
    items.forEach(([l, v, x]) => { const b = h("b", {text: String(v)}); if (x) b.append(x); st.append(h("div", null, l, b)); });
  }
  $("#seeboardtxt").textContent = state.mode === "daily" ? "See today's leaderboard" : "See the leaderboard";
  $("#seeboard").hidden = !!saving;
  $("#again").textContent = m.daily || state.mode === "duel" ? "Play a random game" : "Play again";
  $("#copy").textContent = "Copy result";
  $("#summary").hidden = false;
}

