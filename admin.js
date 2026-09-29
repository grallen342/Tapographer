/* =================== globe engine (no libraries): painted Earth texture, orthographic raster, gestures =================== */
const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = s => document.querySelector(s);

function vec(lon, lat){ const l = lon*RAD, p = lat*RAD, c = Math.cos(p); return [c*Math.cos(l), c*Math.sin(l), Math.sin(p)]; }
function gdist(a, b){ // radians between [lon,lat] points
  const dl = (b[0]-a[0])*RAD, p1 = a[1]*RAD, p2 = b[1]*RAD;
  const h = Math.sin((p2-p1)/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*Math.asin(Math.min(1, Math.sqrt(h)));
}
function slerp(a, b, t){
  const d = gdist(a, b); if (d < 1e-9) return a.slice();
  const A = Math.sin((1-t)*d)/Math.sin(d), B = Math.sin(t*d)/Math.sin(d);
  const va = vec(a[0], a[1]), vb = vec(b[0], b[1]);
  const x = A*va[0]+B*vb[0], y = A*va[1]+B*vb[1], z = A*va[2]+B*vb[2];
  return [Math.atan2(y, x)/RAD, Math.atan2(z, Math.hypot(x, y))/RAD];
}

/* ---------------- land data ---------------- */
function loadScript(urls){
  return new Promise((resolve, reject) => {
    let i = 0;
    const next = () => {
      if (i >= urls.length) return reject(new Error("load failed"));
      const s = document.createElement("script");
      s.src = urls[i++];
      s.onload = () => resolve();
      s.onerror = () => { s.remove(); next(); };
      document.head.appendChild(s);
    };
    next();
  });
}
function topoPolys(topo){
  const tf = topo.transform;
  const arcs = topo.arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(p => {
      if (tf){ x += p[0]; y += p[1]; return [x*tf.scale[0] + tf.translate[0], y*tf.scale[1] + tf.translate[1]]; }
      return [p[0], p[1]];
    });
  });
  const ring = idxs => {
    const pts = [];
    idxs.forEach(i => {
      const a = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
      a.forEach((p, j) => { if (j || !pts.length) pts.push(p); });
    });
    return pts;
  };
  const obj = topo.objects[Object.keys(topo.objects)[0]];
  const geoms = obj.type === "GeometryCollection" ? obj.geometries : [obj];
  const polys = [];
  LAND_IDS = [];
  geoms.forEach(g => {
    if (g.type === "Polygon"){ polys.push(g.arcs.map(ring)); LAND_IDS.push(g.id || null); }
    else if (g.type === "MultiPolygon") g.arcs.forEach(p => { polys.push(p.map(ring)); LAND_IDS.push(g.id || null); });
  });
  return polys;
}
function echartsPolys(json){
  const scale = json.UTF8Scale == null ? 1024 : json.UTF8Scale;
  const dec = (str, off) => {
    const out = []; let px = off[0], py = off[1];
    for (let i = 0; i < str.length; i += 2){
      let x = str.charCodeAt(i) - 64, y = str.charCodeAt(i+1) - 64;
      x = (x >> 1) ^ (-(x & 1)); y = (y >> 1) ^ (-(y & 1));
      x += px; y += py; px = x; py = y;
      out.push([x/scale, y/scale]);
    }
    return out;
  };
  const polys = [];
  json.features.forEach(f => {
    const g = f.geometry, off = g.encodeOffsets, enc = json.UTF8Encoding;
    if (g.type === "Polygon") polys.push(g.coordinates.map((r,i) => enc ? dec(r, off[i]) : r));
    else if (g.type === "MultiPolygon") g.coordinates.forEach((p,i) => polys.push(p.map((r,j) => enc ? dec(r, off[i][j]) : r)));
  });
  return polys;
}
let LAND = null, LAND_IDS = []; // array of polygons, each an array of rings of [lon,lat]
let landSource = "";
async function loadLand(){
  // 1. Natural Earth coastlines at 1:50m (detailed), then 1:110m, both as TopoJSON
  for (const url of ["https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json", "https://unpkg.com/world-atlas@2/countries-50m.json",
                     "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"]){
    try {
      const r = await fetch(url); if (!r.ok) continue;
      const topo = await r.json();
      if (topo && topo.objects && topo.objects.countries){ topo.objects = {countries: topo.objects.countries}; LAND = topoPolys(topo); landSource = url; break; }
    } catch(e){}
  }
  // 2. older map packages, 3. a rough built-in outline so the game still works offline
  if (!LAND){
    try{
      await loadScript(["https://cdn.jsdelivr.net/npm/datamaps@0.5.9/dist/datamaps.all.min.js","https://cdnjs.cloudflare.com/ajax/libs/datamaps/0.5.9/datamaps.all.min.js"]);
      const Dm = window.Datamap || window.Datamaps, wt = Dm && Dm.prototype.worldTopo;
      if (wt && typeof wt === "object"){ LAND = topoPolys(wt); landSource = "datamaps"; }
    }catch(e){}
  }
  if (!LAND){ LAND = ROUGH_LAND.map(r => [r]); LAND_IDS = []; landSource = "rough"; }
}


/* True coastline only: an edge shared by two countries is a border, so it is dropped.
   Edges on the date line and the Antarctic cut are dropped too. */
let COAST = [];
function computeCoast(){
  const key = p => Math.round(p[0]*1000) + "," + Math.round(p[1]*1000);
  const count = new Map(), segKey = (a, b) => { const ka = key(a), kb = key(b); return ka < kb ? ka + "|" + kb : kb + "|" + ka; };
  for (const poly of LAND) for (const ring of poly)
    for (let i = 0; i < ring.length - 1; i++){ const k = segKey(ring[i], ring[i+1]); count.set(k, (count.get(k) || 0) + 1); }
  const lines = [];
  for (const poly of LAND) for (const ring of poly){
    let cur = null;
    for (let i = 0; i < ring.length - 1; i++){
      const a = ring[i], b = ring[i+1];
      const seam = (Math.abs(a[0]) > 179.9 && Math.abs(b[0]) > 179.9) || a[1] < -84.5 || b[1] < -84.5 || Math.abs(a[0] - b[0]) > 180;
      if (seam || count.get(segKey(a, b)) !== 1 || (a[0] === b[0] && a[1] === b[1])){ if (cur && cur.length > 1) lines.push(cur); cur = null; continue; }
      if (!cur) cur = [a];
      cur.push(b);
    }
    if (cur && cur.length > 1) lines.push(cur);
  }
  COAST = lines;
}

/* Which country (ISO3 id) a point falls in, when the map data carries ids. */
let LAND_BOX = null;
function countryAt(lon, lat){
  if (!LAND || !LAND_IDS.length) return null;
  if (!LAND_BOX) LAND_BOX = LAND.map(poly => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; poly[0].forEach(p => { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); }); return [a, b, c, d]; });
  const inRing = ring => { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
  for (let i = 0; i < LAND.length; i++){
    const id = LAND_IDS[i], bx = LAND_BOX[i];
    if (!id || id === "-99" || lon < bx[0] || lon > bx[2] || lat < bx[1] || lat > bx[3]) continue;
    const poly = LAND[i];
    if (inRing(poly[0]) && !poly.slice(1).some(inRing)) return id;
  }
  return null;
}

/* ---------------- the painted Earth texture ---------------- */
let TW = 4096, TH = 2048, tex32 = null, tex8 = null;
function hexA(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }

function paintTexture(){
  computeCoast();
  const small = Math.min(screen.width, screen.height) < 700;
  TW = small ? 3072 : 4096; TH = TW / 2;
  const ppd = TW / 360;
  const X = lon => (lon + 180) * ppd, Y = lat => (90 - lat) * ppd;

  const tracePoly = (g, poly, offsets = [-TW, 0, TW]) => {
    for (const ring of poly){
      let lonMin = 1e9, lonMax = -1e9;
      ring.forEach(p => { lonMin = Math.min(lonMin, p[0]); lonMax = Math.max(lonMax, p[0]); });
      const spansWorld = lonMax - lonMin > 350;
      const pts = []; let prev = null, shift = 0;
      for (const p of ring){
        let lon = p[0];
        if (!spansWorld && prev !== null){
          const d = lon + shift - prev;
          if (d > 180) shift -= 360; else if (d < -180) shift += 360;
        }
        lon += spansWorld ? 0 : shift; prev = lon;
        pts.push([lon, p[1]]);
      }
      for (const off of (spansWorld ? [0] : offsets)){
        pts.forEach((p, i) => { const x = X(p[0]) + off, y = Y(p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.closePath();
      }
    }
  };
  // Fill each polygon on its own path: holes stay holes, but two shapes that overlap (or a shape listed twice) both stay land.
  const fillLand = (g, color, seam) => {
    g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 1;
    for (const poly of LAND){ g.beginPath(); tracePoly(g, poly); g.fill("evenodd"); if (seam) g.stroke(); }
  };

  // 1. ocean
  const O = document.createElement("canvas"); O.width = TW; O.height = TH;
  const o = O.getContext("2d");
  const og = o.createLinearGradient(0, 0, 0, TH);
  og.addColorStop(0, "#23415f"); og.addColorStop(.18, "#123a66"); og.addColorStop(.5, "#0c3a72");
  og.addColorStop(.82, "#113660"); og.addColorStop(1, "#2a4560");
  o.fillStyle = og; o.fillRect(0, 0, TW, TH);
  // continental shelves: lighter water hugging the coastline (never country borders)
  o.lineJoin = "round"; o.lineCap = "round";
  o.beginPath();
  for (const line of COAST) for (const off of [-TW, 0, TW]){
    line.forEach((p, i) => { const x = X(p[0]) + off, y = Y(p[1]); i ? o.lineTo(x, y) : o.moveTo(x, y); });
  }
  for (const [w, a, c] of [[22, .10, "#2f78a8"], [13, .14, "#3a8cba"], [7, .2, "#4aa0c8"], [3, .25, "#5fb3cf"]]){
    o.strokeStyle = hexA(c, a); o.lineWidth = w * ppd / 11.4; o.stroke();
  }

  // 2. land layer (transparent outside land)
  const L = document.createElement("canvas"); L.width = TW; L.height = TH;
  const g = L.getContext("2d");
  fillLand(g, "#56703a", true);   // the stroke closes hairline seams between neighbouring countries
  g.globalCompositeOperation = "source-atop";

  // latitude bands: cooler, darker greens north; savanna tones in the tropics
  const lg = g.createLinearGradient(0, 0, 0, TH);
  lg.addColorStop(0, "rgba(120,118,98,.9)"); lg.addColorStop(.14, "rgba(96,104,80,.7)");
  lg.addColorStop(.2, "rgba(48,74,44,.75)"); lg.addColorStop(.3, "rgba(70,96,52,.45)");
  lg.addColorStop(.38, "rgba(128,120,70,.25)"); lg.addColorStop(.5, "rgba(46,86,36,.35)");
  lg.addColorStop(.6, "rgba(120,112,66,.3)"); lg.addColorStop(.7, "rgba(90,104,60,.35)");
  lg.addColorStop(.85, "rgba(110,110,90,.5)"); lg.addColorStop(1, "rgba(230,236,240,1)");
  g.fillStyle = lg; g.fillRect(0, 0, TW, TH);

  // Biomes and mountain bands are painted small, then enlarged: the upscale gives soft, natural edges.
  const LO = 8, lw = TW/LO, lh = TH/LO, lppd = ppd/LO;
  const B = document.createElement("canvas"); B.width = lw; B.height = lh;
  const bg = B.getContext("2d");
  const blob = (lon, lat, rx, ry, color, a) => {
    for (const off of [0, -lw, lw]){
      const x = (lon + 180)*lppd + off; if (x < -rx*lppd*1.2 || x > lw + rx*lppd*1.2) continue;
      bg.save(); bg.translate(x, (90 - lat)*lppd); bg.scale(rx*lppd*1.25, ry*lppd*1.25);
      const gr = bg.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, hexA(color, a)); gr.addColorStop(.45, hexA(color, a*.85)); gr.addColorStop(1, hexA(color, 0));
      bg.fillStyle = gr; bg.beginPath(); bg.arc(0, 0, 1, 0, 2*Math.PI); bg.fill(); bg.restore();
    }
  };
  BIOMES.forEach(b => blob(...b));
  // ragged edges: knock random holes out of the biome layer so patches don't read as ovals
  const rough = document.createElement("canvas"); rough.width = lw/4; rough.height = lh/4;
  const rx = rough.getContext("2d"), rid = rx.createImageData(rough.width, rough.height);
  for (let i = 0; i < rid.data.length; i += 4){ rid.data[i+3] = Math.random() < .5 ? 0 : 150 + Math.random()*105; }
  rx.putImageData(rid, 0, 0);
  bg.save(); bg.globalCompositeOperation = "destination-out"; bg.globalAlpha = .35; bg.imageSmoothingEnabled = true;
  bg.drawImage(rough, 0, 0, lw, lh); bg.restore();
  // broad mountain bands and snowfields
  bg.lineJoin = "round"; bg.lineCap = "round";
  for (const [wDeg, hgt, line] of RANGES){
    bg.beginPath(); line.forEach((p, i) => { const x = (p[0]+180)*lppd, y = (90-p[1])*lppd; i ? bg.lineTo(x, y) : bg.moveTo(x, y); });
    bg.strokeStyle = hexA("#6e5e44", .25 + .4*hgt); bg.lineWidth = wDeg*lppd*1.1; bg.stroke();
    bg.strokeStyle = hexA("#8a7a5e", .2 + .3*hgt); bg.lineWidth = wDeg*lppd*.6; bg.stroke();
    if (hgt >= .8){ bg.strokeStyle = hexA("#eef2f4", Math.min(.45, (hgt - .75)*1.6)); bg.lineWidth = Math.max(1, wDeg*lppd*.22); bg.stroke(); }
  }
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(B, 0, 0, TW, TH);

  // ridgelets: short lit and shaded spurs running off each crest, like hill shading seen from orbit
  let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
  g.lineCap = "round";
  for (const [wDeg, hgt, line] of RANGES){
    const w = wDeg*ppd;
    for (let i = 0; i < line.length - 1; i++){
      const ax = X(line[i][0]), ay = Y(line[i][1]), bx = X(line[i+1][0]), by = Y(line[i+1][1]);
      const L = Math.hypot(bx-ax, by-ay) || 1, tx = (bx-ax)/L, ty = (by-ay)/L, nx = -ty, ny = tx;
      const step = Math.max(1.4, 2*ppd/11.4);
      for (let d = 0; d < L; d += step){
        const px = ax + tx*d, py = ay + ty*d;
        for (const side of [-1, 1]){
          const len = w*(.1 + rnd()*.26), jit = (rnd() - .5)*1.1;
          const dx = (nx*side + tx*jit), dy = (ny*side + ty*jit);
          const sx = px + nx*side*w*rnd()*.08, sy = py + ny*side*w*rnd()*.08;
          const lit = (dx*-1 + dy*-1) > 0;
          g.strokeStyle = lit ? hexA("#e6dcc4", .03 + .06*hgt) : hexA("#2b2317", .07 + .12*hgt);
          g.lineWidth = Math.max(1, ppd*.09);
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + dx*len, sy + dy*len); g.stroke();
        }
      }
    }
  }

  // ice caps
  const ice = (lat0, lat1, a) => {
    const gr = g.createLinearGradient(0, Y(lat0), 0, Y(lat1));
    gr.addColorStop(0, "rgba(236,242,246,0)"); gr.addColorStop(1, `rgba(236,242,246,${a})`);
    g.fillStyle = gr; g.fillRect(0, Math.min(Y(lat0), Y(lat1)), TW, Math.abs(Y(lat1) - Y(lat0)));
  };
  // Greenland: an ice sheet edged with bare rock, whatever shape the map data gives it
  LAND.forEach(poly => {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    poly[0].forEach(p => { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); });
    if (a < -75 || c > -10 || b < 59 || d > 84.5 || d < 78 || (c - a) < 8) return;
    g.beginPath(); tracePoly(g, poly); g.fillStyle = "#eef2f5"; g.fill("evenodd");
    g.lineJoin = "round"; g.strokeStyle = "rgba(118,108,92,.55)"; g.lineWidth = 7*ppd/11.4; g.stroke();
    g.strokeStyle = "rgba(200,206,208,.5)"; g.lineWidth = 3*ppd/11.4; g.stroke();
  });
  ice(-58, -68, .98); g.fillStyle = "rgba(238,243,247,.98)"; g.fillRect(0, Y(-68), TW, TH - Y(-68));
  ice(79, 83, .85); g.fillStyle = "rgba(232,238,242,.9)"; g.fillRect(0, 0, TW, Y(83));

  // 3. natural grain on land (re-masked to the coastline), a whisper of it on the ocean, then compose
  const grainCanvas = (w, h) => {
    const n = document.createElement("canvas"); n.width = w; n.height = h;
    const nx = n.getContext("2d"), id = nx.createImageData(w, h);
    for (let i = 0; i < id.data.length; i += 4){ const v = 80 + Math.random()*96; id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = 255; }
    nx.putImageData(id, 0, 0); return n;
  };
  const g1 = grainCanvas(360, 180), g2 = grainCanvas(1440, 720);
  g.save(); g.globalCompositeOperation = "overlay"; g.imageSmoothingEnabled = true;
  g.globalAlpha = .28; g.drawImage(g1, 0, 0, TW, TH); g.globalAlpha = .14; g.drawImage(g2, 0, 0, TW, TH);
  g.globalCompositeOperation = "destination-in"; g.globalAlpha = 1;
  { const M = document.createElement("canvas"); M.width = TW; M.height = TH; const mg = M.getContext("2d"); fillLand(mg, "#000", true); g.drawImage(M, 0, 0); }
  g.restore();
  o.save(); o.globalCompositeOperation = "overlay"; o.globalAlpha = .07; o.drawImage(g1, 0, 0, TW, TH); o.restore();
  o.drawImage(L, 0, 0);

  const img = o.getImageData(0, 0, TW, TH);
  tex8 = img.data; tex32 = new Uint32Array(tex8.buffer);
}

/* ---------------- real imagery: NASA Blue Marble + night lights (public domain) ----------------
   Served by jsDelivr/unpkg from the three-globe package. If they can't load, the painted map above is used. */
const IMG_VER = "2.45.2";
const IMAGERY = [`https://cdn.jsdelivr.net/npm/three-globe@${IMG_VER}/example/img/earth-blue-marble.jpg`,
                 `https://unpkg.com/three-globe@${IMG_VER}/example/img/earth-blue-marble.jpg`];
const NIGHT   = [`https://cdn.jsdelivr.net/npm/three-globe@${IMG_VER}/example/img/earth-night.jpg`,
                 `https://unpkg.com/three-globe@${IMG_VER}/example/img/earth-night.jpg`];
let imagerySource = "painted";

function loadImage(urls, ms = 20000){
  return new Promise((resolve, reject) => {
    let i = 0;
    const next = () => {
      if (i >= urls.length) return reject(new Error("image failed"));
      const im = new Image(), url = urls[i++];
      let done = false;
      const t = setTimeout(() => { if (!done){ done = true; im.src = ""; next(); } }, ms);
      im.crossOrigin = "anonymous";
      im.decoding = "async";
      im.onload = () => { if (done) return; done = true; clearTimeout(t); resolve(im); };
      im.onerror = () => { if (done) return; done = true; clearTimeout(t); next(); };
      im.src = url;
    };
    next();
  });
}

/* Satellite base map. Returns true when it replaced the painted texture. */
async function loadImagery(pending){
  const im = await (pending || loadImage(IMAGERY)).catch(() => null);
  if (!im) return false;
  try {
    const small = Math.min(screen.width, screen.height) < 700;
    const cap = small ? 3072 : 4096;
    const w = Math.min(cap, im.naturalWidth), h = Math.round(w / 2);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d", {willReadFrequently: true});
    g.imageSmoothingQuality = "high";
    g.drawImage(im, 0, 0, w, h);
    const id = g.getImageData(0, 0, w, h), d = id.data;   // throws if the image isn't CORS-clean
    gradePixels(d);   // a touch more contrast and color, to sit on the dark UI
    TW = w; TH = h; tex8 = d; tex32 = new Uint32Array(d.buffer);
    imagerySource = "satellite";
    computeCoast();
    return true;
  } catch(e){ return false; }
}

/* Population density: NASA night lights, blended with the city and rural population tables,
   stored as one 0–255 channel the same size as the base map. */
let DEN = null, denReady = false;
async function buildDensity(){
  const w = TW, h = TH, ppd = w / 360;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", {willReadFrequently: true});
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  let lights = null;
  try { lights = await loadImage(NIGHT); } catch(e){}
  if (lights){
    try { g.drawImage(lights, 0, 0, w, h); g.getImageData(0, 0, 1, 1); }
    catch(e){ g.globalCompositeOperation = "source-over"; g.fillStyle = "#000"; g.fillRect(0, 0, w, h); lights = null; }
  }
  // soft splats for every city and rural belt (adds density where lights undercount, e.g. South Asia, Africa)
  const blob = document.createElement("canvas"); blob.width = blob.height = 64;
  { const bg = blob.getContext("2d"), gr = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    bg.fillStyle = gr; bg.fillRect(0, 0, 64, 64); }
  g.globalCompositeOperation = "lighter";
  const put = (lat, lon, rKm, a) => {
    const r = Math.max(1.2, rKm / 111 * ppd / Math.max(.2, Math.cos(lat*RAD))), ry = Math.max(1.2, rKm / 111 * ppd);
    const x = (lon + 180) * ppd, y = (90 - lat) * ppd;
    g.globalAlpha = Math.min(1, a);
    for (const off of [0, -w, w]) if (x + off + r > 0 && x + off - r < w) g.drawImage(blob, x + off - r, y - ry, r*2, ry*2);
  };
  for (const [lat, lon, pop] of CITIES) put(lat, lon, 6 + 16*Math.sqrt(pop/1000), lights ? .06 + Math.min(.22, pop/45000) : .4 + Math.min(.45, pop/20000));
  for (const [lat, lon, rKm, wgt] of RURAL) put(lat, lon, rKm, (lights ? .06 : .22) * wgt);
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  const d = g.getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h);
  for (let i = 0, j = 0; j < out.length; i += 4, j++){
    const m = Math.max(d[i], d[i+1], d[i+2]);
    const v = (m - 14) / 200;                     // drop the faint noise floor
    if (v <= 0) continue;
    if (tex8 && w === TW){   // keep it on land: skip water pixels (blue-dominant) in the base map
      const k = j*4, r = tex8[k], gg = tex8[k+1], b = tex8[k+2];
      if (b > r + 18 && b >= gg) continue;
    }
    out[j] = v >= 1 ? 255 : Math.round(Math.pow(v, .85) * 255);
  }
  if (w === TW && h === TH){ DEN = out; denReady = true; requestDraw(true); }
}

/* Density color ramp (coral → gold → warm white) and how strongly it shows at the current zoom. */
const DEN_R = new Uint8Array(256), DEN_G = new Uint8Array(256), DEN_B = new Uint8Array(256), DEN_M = new Uint16Array(256);
{
  const stops = [[0, [240,96,56]], [.4, [255,140,64]], [.75, [255,190,90]], [1, [255,222,150]]];
  for (let i = 0; i < 256; i++){
    const t = i / 255; let k = 0; while (k < stops.length - 2 && t > stops[k+1][0]) k++;
    const [t0, c0] = stops[k], [t1, c1] = stops[k+1], f = (t - t0) / (t1 - t0);
    DEN_R[i] = c0[0] + (c1[0]-c0[0])*f; DEN_G[i] = c0[1] + (c1[1]-c0[1])*f; DEN_B[i] = c0[2] + (c1[2]-c0[2])*f;
  }
}
let denK = -1;
function densityStrength(k){ return clamp(.14 + (k - 1.15) * .19, .14, .78); }   // faint at world view, strong once zoomed in
function denTable(){
  if (denK === view.k) return;
  denK = view.k;
  const A = densityStrength(view.k);
  for (let i = 0; i < 256; i++){ const t = i / 255; DEN_M[i] = Math.round(Math.min(1, Math.pow(t, .8) * 1.15) * A * 256); }
}

/* ---------------- view + rendering ---------------- */
const view = { lam: Math.random()*360 - 180, phi: Math.random()*50 - 15, k: 1 };
let canvas, ctx, W = 0, H = 0, dpr = 1, R0 = 200, gcx = 0, gcy = 0;
let rc, rctx, rimg = null, rW = 0, rH = 0;
let starCanvas = null, drawQueued = false, hiTimer = null, interacting = false;
let fxCities = [], coastRings = [];
let overlayHook = () => {};   // game draws its arc here
let afterDraw = () => {};      // game positions pins here

const S = () => R0 * view.k;
function project(lon, lat){
  const l = (lon - view.lam)*RAD, p = lat*RAD, dp = -view.phi*RAD, cp = Math.cos(p);
  const x = Math.cos(l)*cp, y = Math.sin(l)*cp, z = Math.sin(p);
  const cdp = Math.cos(dp), sdp = Math.sin(dp);
  const vis = x*cdp - z*sdp;
  const s = S();
  return [gcx + s*y, gcy - s*(z*cdp + x*sdp), vis];
}
function unproject(px, py){
  const s = S(), X = (px - gcx)/s, Y = (gcy - py)/s, r2 = X*X + Y*Y;
  if (r2 > 1) return null;
  const a = Math.sqrt(1 - r2), dp = -view.phi*RAD, c = Math.cos(dp), sn = Math.sin(dp);
  const x = a*c + Y*sn, z = -a*sn + Y*c;
  let lon = Math.atan2(X, x)/RAD + view.lam; lon = ((lon + 540) % 360) - 180;
  return [lon, Math.asin(clamp(z, -1, 1))/RAD];
}

function makeStars(){
  starCanvas = document.createElement("canvas");
  starCanvas.width = Math.ceil(W*dpr); starCanvas.height = Math.ceil(H*dpr);
  const s = starCanvas.getContext("2d");
  const bg = s.createRadialGradient(W*dpr/2, H*dpr*.45, 0, W*dpr/2, H*dpr*.45, Math.max(W, H)*dpr*.8);
  bg.addColorStop(0, "#0B1628"); bg.addColorStop(1, "#03060C");
  s.fillStyle = bg; s.fillRect(0, 0, starCanvas.width, starCanvas.height);
}

function prepareOverlays(){
  fxCities = CITIES.map(([lat, lon, pop]) => ({lon, lat, v:vec(lon, lat), rKm: 2.5 + 9*Math.sqrt(pop/1000), pop})).sort((a,b) => a.pop - b.pop);
  coastRings = COAST;
}

function requestDraw(hi = false){
  if (!drawQueued){
    drawQueued = true;
    requestAnimationFrame(() => { drawQueued = false; draw(false); });
  }
  clearTimeout(hiTimer);
  hiTimer = setTimeout(() => { if (!interacting) draw(true); }, hi ? 0 : 160);
}

/* Write one screen pixel from an equirectangular image (T8/T32, w×h) at image coords fx, fy,
   with the population-density channel D blended on top. */
let r32 = null, rd8 = null;
function samplePx(o, T8, T32, D, w, h, fx, fy, bil, wrap){
  let r, g, b, dv;
  if (!bil){
    let ix = fx|0, iy = fy|0;
    if (wrap){ ix %= w; if (ix < 0) ix += w; } else if (ix >= w) ix = w - 1; else if (ix < 0) ix = 0;
    if (iy >= h) iy = h - 1; else if (iy < 0) iy = 0;
    const t = iy*w + ix;
    dv = D ? D[t] : 0;
    const m = dv ? DEN_M[dv] : 0;
    if (!m){ r32[o] = T32[t]; return; }
    const p = T32[t]; r = p & 255; g = (p >> 8) & 255; b = (p >> 16) & 255;
  } else {
    let x0 = Math.floor(fx - .5), yy = fy - .5;
    if (yy < 0) yy = 0; else if (yy > h - 1.001) yy = h - 1.001;
    const tx = fx - .5 - x0, iy = yy|0, ty = yy - iy;
    let x1;
    if (wrap){ x0 %= w; if (x0 < 0) x0 += w; x1 = x0 + 1 === w ? 0 : x0 + 1; }
    else { if (x0 < 0) x0 = 0; if (x0 > w - 1) x0 = w - 1; x1 = x0 + 1 < w ? x0 + 1 : x0; }
    const j0 = iy*w, j1 = iy + 1 < h ? j0 + w : j0;
    const a = (j0 + x0)*4, c = (j0 + x1)*4, e = (j1 + x0)*4, f = (j1 + x1)*4;
    const w00 = (1 - tx)*(1 - ty), w10 = tx*(1 - ty), w01 = (1 - tx)*ty, w11 = tx*ty;
    r = T8[a]*w00 + T8[c]*w10 + T8[e]*w01 + T8[f]*w11;
    g = T8[a+1]*w00 + T8[c+1]*w10 + T8[e+1]*w01 + T8[f+1]*w11;
    b = T8[a+2]*w00 + T8[c+2]*w10 + T8[e+2]*w01 + T8[f+2]*w11;
    dv = D ? (D[j0 + x0]*w00 + D[j0 + x1]*w10 + D[j1 + x0]*w01 + D[j1 + x1]*w11 + .5)|0 : 0;
  }
  const m = dv ? DEN_M[dv] : 0;
  if (m){ const im = 256 - m; r = (r*im + DEN_R[dv]*m) / 256; g = (g*im + DEN_G[dv]*m) / 256; b = (b*im + DEN_B[dv]*m) / 256; }
  r32[o] = 0xFF000000 | ((b|0) << 16) | ((g|0) << 8) | (r|0);
}

function raster(hi){
  // phones get a sharper image while you drag and pinch; everyone gets up to 2× pixels when still
  const res = hi ? Math.min(dpr, 2) : Math.min(dpr, W < 700 ? 1 : .8);
  const w = Math.ceil(W*res), h = Math.ceil(H*res);
  if (!rc){ rc = document.createElement("canvas"); rctx = rc.getContext("2d"); }
  if (rc.width !== w || rc.height !== h){ rc.width = w; rc.height = h; rimg = rctx.createImageData(w, h); r32 = new Uint32Array(rimg.data.buffer); rd8 = rimg.data; }
  r32.fill(0);
  const s = S()*res, cx = gcx*res, cy = gcy*res;
  const dp = -view.phi*RAD, cdp = Math.cos(dp), sdp = Math.sin(dp);
  const lam = view.lam*RAD, TWO = 2*Math.PI;
  const y0 = Math.max(0, Math.floor(cy - s)), y1 = Math.min(h, Math.ceil(cy + s));
  const bil = view.k > 1.6 && (hi || view.k > 3);
  const den = denReady && DEN && DEN.length === TW*TH ? DEN : null;
  denTable();
  const dt = det;   // high-resolution patch for the area on screen, when loaded
  for (let y = y0; y < y1; y++){
    const Yn = (cy - y - .5)/s, Y2 = Yn*Yn; if (Y2 >= 1) continue;
    const half = Math.sqrt(1 - Y2)*s;
    const xa = Math.max(0, Math.floor(cx - half)), xb = Math.min(w, Math.ceil(cx + half));
    const Ys = Yn*sdp, Yc = Yn*cdp;
    const row = y*w;
    for (let x = xa; x < xb; x++){
      const Xn = (x + .5 - cx)/s, r2 = Xn*Xn + Y2; if (r2 >= 1) continue;
      const a = Math.sqrt(1 - r2);
      const gx = a*cdp + Ys, gz = -a*sdp + Yc;
      let u = (Math.atan2(Xn, gx) + lam)/TWO + .5; u -= Math.floor(u);
      const v = .5 - Math.asin(gz)/Math.PI;
      if (dt){
        let du = u*360 - 180 - dt.lon0; du -= 360*Math.floor(du/360);   // u = 0 is 180°W
        const dv = v*180 - dt.top;
        if (du < dt.wDeg && dv >= 0 && dv < dt.hDeg){
          if (dt.den) samplePx(row + x, dt.d8, dt.d32, dt.den, dt.w, dt.h, du*dt.ppd, dv*dt.ppd, bil, false);
          else samplePx(row + x, dt.d8, dt.d32, null, dt.w, dt.h, du*dt.ppd, dv*dt.ppd, bil, false);
          continue;
        }
      }
      samplePx(row + x, tex8, tex32, den, TW, TH, u*TW, v*TH, bil, true);
    }
  }
  rctx.putImageData(rimg, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(rc, 0, 0, w, h, 0, 0, w/res, h/res);
  if (hi) scheduleDetail();
}

/* ---------------- zoomed-in detail: NASA GIBS tiles (Blue Marble + Black Marble, ~500 m per pixel) ----------------
   Only the tiles covering the screen are fetched, once you stop moving. Tiles use the same
   lat/lon grid as the base map: level z tiles are 512 px and 288/2^z degrees wide, starting at 180°W, 90°N. */
const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/";
const tileDay = (z, y, x) => `${GIBS}BlueMarble_NextGeneration/default/500m/${z}/${y}/${x}.jpeg`;
const tileNight = (z, y, x) => `${GIBS}VIIRS_Black_Marble/default/2016-01-01/500m/${z}/${y}/${x}.png`;
let det = null, detTimer = null, detBusy = false, detOff = false, detFails = 0;
const tileCache = new Map();
function tileImg(url){
  if (!tileCache.has(url)){
    if (tileCache.size > 300) tileCache.delete(tileCache.keys().next().value);
    tileCache.set(url, loadImage([url], 15000).catch(() => null));
  }
  return tileCache.get(url);
}
function gradePixels(d){
  for (let i = 0; i < d.length; i += 4){
    let r = d[i], gg = d[i+1], b = d[i+2];
    const l = .3*r + .59*gg + .11*b;
    r = l + (r - l)*1.12; gg = l + (gg - l)*1.12; b = l + (b - l)*1.12;
    r = (r - 128)*1.06 + 124; gg = (gg - 128)*1.06 + 124; b = (b - 128)*1.06 + 126;
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r; d[i+1] = gg < 0 ? 0 : gg > 255 ? 255 : gg; d[i+2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}
function scheduleDetail(){
  if (detOff) return;
  clearTimeout(detTimer);
  detTimer = setTimeout(() => { if (!interacting && !anim && !detBusy) buildDetail(); }, 220);
}
function detailPlan(){
  const s = S(), devPx = Math.min(dpr, 2);
  const want = 1/(s*RAD)/devPx;                 // degrees per device pixel at the center of the view
  if (want > (360/TW)*.8) return null;          // the whole-globe image is already sharp enough
  let z = 2; while (z < 7 && (288/2**z)/512 > want*1.25) z++;
  // what's on screen, with longitudes unwrapped around the view center
  let lo = 1e9, hi = -1e9, la = 1e9, lb = -1e9, n = 0;
  for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++){
    const q = unproject(W*i/10, H*j/10); if (!q) continue; n++;
    const L = view.lam + (((q[0] - view.lam) % 360 + 540) % 360 - 180);
    lo = Math.min(lo, L); hi = Math.max(hi, L); la = Math.min(la, q[1]); lb = Math.max(lb, q[1]);
  }
  if (n < 20) return null;
  const pad = Math.max(hi - lo, lb - la)*.08; lo -= pad; hi += pad; la = Math.max(-90, la - pad); lb = Math.min(90, lb + pad);
  const maxTiles = W < 700 ? 30 : 42;
  for (; z >= 2; z--){
    const D = 288/2**z, rows = Math.ceil(180/D);
    const c0 = Math.floor((lo + 180)/D), c1 = Math.floor((hi + 180)/D);
    const r0 = clamp(Math.floor((90 - lb)/D), 0, rows - 1), r1 = clamp(Math.floor((90 - la)/D), 0, rows - 1);
    const count = (c1 - c0 + 1)*(r1 - r0 + 1);
    if (count <= maxTiles){
      if ((D/512) > (360/TW)*.8) return null;   // no sharper than what we have
      return {z, D, c0, c1, r0, r1, cols: Math.round(360/D)};
    }
  }
  return null;
}
async function buildDetail(){
  const plan = detailPlan();
  if (!plan){ if (det && view.k < 2) det = null; return; }
  const {z, D, c0, c1, r0, r1, cols} = plan;
  if (det && det.z === z && det.c0 <= c0 && det.c1 >= c1 && det.r0 <= r0 && det.r1 >= r1) return;   // already covered
  detBusy = true;
  try {
    const nx = c1 - c0 + 1, ny = r1 - r0 + 1, w = nx*512, h = ny*512;
    const jobs = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++){
      const cc = ((c % cols) + cols) % cols;
      jobs.push(Promise.all([tileImg(tileDay(z, r, cc)), tileImg(tileNight(z, r, cc))]).then(([d, n]) => ({x: (c - c0)*512, y: (r - r0)*512, d, n})));
    }
    const tiles = await Promise.all(jobs);
    if (!tiles.some(t => t.d)){ if (++detFails >= 3) detOff = true; return; }
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d", {willReadFrequently: true});
    g.fillStyle = "#0b1d3a"; g.fillRect(0, 0, w, h);
    tiles.forEach(t => { if (t.d) g.drawImage(t.d, t.x, t.y, 512, 512); });
    let d8;
    try { d8 = g.getImageData(0, 0, w, h).data; } catch(e){ detOff = true; return; }   // tiles not CORS-readable
    gradePixels(d8);
    let den = null;
    if (tiles.some(t => t.n)){
      g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
      tiles.forEach(t => { if (t.n) g.drawImage(t.n, t.x, t.y, 512, 512); });
      try {
        const nd = g.getImageData(0, 0, w, h).data;
        den = new Uint8Array(w*h);
        for (let i = 0, j = 0; j < den.length; i += 4, j++){
          const m = Math.max(nd[i], nd[i+1], nd[i+2]), v = (m - 22)/190;
          if (v <= 0) continue;
          const r = d8[i], gg = d8[i+1], b = d8[i+2];
          if (b > r + 18 && b >= gg) continue;      // water
          den[j] = v >= 1 ? 255 : Math.round(Math.pow(v, .85)*255);
        }
      } catch(e){ den = null; }
    }
    detFails = 0;
    det = {z, c0, c1, r0, r1, lon0: -180 + c0*D, top: r0*D, wDeg: nx*D, hDeg: ny*D, ppd: 512/D, w, h,
           d8, d32: new Uint32Array(d8.buffer), den};
    draw(true);
  } catch(e){
    if (++detFails >= 3) detOff = true;
  } finally { detBusy = false; }
}

let citySprite = null, coreSprite = null;
function sprites(){
  const mk = (stops) => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  citySprite = mk([[0, "rgba(170,160,142,.9)"], [.35, "rgba(150,142,126,.62)"], [.7, "rgba(140,132,118,.22)"], [1, "rgba(140,132,118,0)"]]);
  coreSprite = mk([[0, "rgba(228,222,208,.85)"], [.5, "rgba(210,202,186,.5)"], [1, "rgba(210,202,186,0)"]]);
}

function draw(hi){
  const s = S();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  if (starCanvas) ctx.drawImage(starCanvas, 0, 0, W, H); else { ctx.fillStyle = "#04070D"; ctx.fillRect(0, 0, W, H); }

  // atmosphere halo
  const ag = ctx.createRadialGradient(gcx, gcy, s*.97, gcx, gcy, s*1.13);
  ag.addColorStop(0, "rgba(120,185,255,.55)"); ag.addColorStop(.3, "rgba(90,160,255,.18)"); ag.addColorStop(1, "rgba(90,160,255,0)");
  ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(gcx, gcy, s*1.13, 0, 2*Math.PI); ctx.fill();

  if (tex32) raster(hi);

  ctx.save();
  ctx.beginPath(); ctx.arc(gcx, gcy, s, 0, 2*Math.PI); ctx.clip();
  const c = vec(view.lam, view.phi);

  // coastline pen once zoomed, where the painted texture softens
  const coastA = imagerySource === "satellite" ? 0 : clamp((view.k - 2.2)/5, 0, .5);
  if (coastA > 0){
    ctx.beginPath();
    for (const ring of coastRings){
      let pen = false, px = 0, py = 0;
      for (const p of ring){
        const q = project(p[0], p[1]);
        if (q[2] > 0 && q[0] > -50 && q[0] < W + 50 && q[1] > -50 && q[1] < H + 50){
          if (pen && Math.abs(q[0]-px) < 1.2 && Math.abs(q[1]-py) < 1.2) continue;   // skip sub-pixel steps
          if (pen && Math.abs(q[0]-px) < 400) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
          pen = true; px = q[0]; py = q[1];
        } else pen = false;
      }
    }
    ctx.strokeStyle = `rgba(235,244,250,${coastA})`; ctx.lineWidth = 1; ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // sunlight falloff toward the limb
  const sg = ctx.createRadialGradient(gcx - s*.28, gcy - s*.32, s*.1, gcx, gcy, s*1.02);
  sg.addColorStop(0, "rgba(255,255,255,.07)"); sg.addColorStop(.5, "rgba(0,0,0,0)"); sg.addColorStop(.85, "rgba(0,6,20,.22)"); sg.addColorStop(1, "rgba(0,6,20,.55)");
  ctx.fillStyle = sg; ctx.fillRect(gcx - s, gcy - s, s*2, s*2);
  overlayHook(ctx);
  ctx.restore();

  ctx.strokeStyle = "rgba(150,200,255,.35)"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(gcx, gcy, s, 0, 2*Math.PI); ctx.stroke();
  afterDraw();
}

/* ---------------- gestures ---------------- */
let anim = null;
function stopAnim(){ if (anim){ cancelAnimationFrame(anim); anim = null; } }
function flyTo(center, kTarget, ms = 1000, done){
  stopAnim();
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const c0 = [view.lam, view.phi], k0 = view.k;
  if (reduce || ms <= 0){ view.lam = center[0]; view.phi = center[1]; view.k = kTarget; requestDraw(true); done && done(); return; }
  const t0 = performance.now(), lk0 = Math.log(k0), lk1 = Math.log(kTarget);
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  const step = now => {
    const t = Math.min(1, (now - t0)/ms), e = ease(t);
    const c = slerp(c0, center, e);
    view.lam = c[0]; view.phi = c[1]; view.k = Math.exp(lk0 + (lk1 - lk0)*e);
    draw(false);
    if (t < 1) anim = requestAnimationFrame(step); else { anim = null; requestDraw(true); done && done(); }
  };
  anim = requestAnimationFrame(step);
}
const KMIN = .8, KMAX = 40;
function zoomAbout(f, px, py){
  const before = px != null ? unproject(px, py) : null;
  view.k = clamp(view.k * f, KMIN, KMAX);
  if (before){
    const after = unproject(px, py);
    if (after){ view.lam -= ((after[0] - before[0] + 540) % 360) - 180; view.phi = clamp(view.phi - (after[1] - before[1]), -85, 85); }
  }
  requestDraw();
}
function initGestures(onTap){
  const pts = new Map(); let down = null, moved = false, pinch0 = null, lastMove = 0;
  const pos = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener("pointerdown", e => {
    stopAnim(); try { canvas.setPointerCapture(e.pointerId); } catch(err){}
    pts.set(e.pointerId, pos(e));
    if (pts.size === 1){ down = {p: pos(e), t: performance.now()}; moved = false; }
    if (pts.size === 2){
      const [a, b] = [...pts.values()];
      pinch0 = {d: Math.hypot(a[0]-b[0], a[1]-b[1]), k: view.k, anchor: unproject((a[0]+b[0])/2, (a[1]+b[1])/2)};   // zoom toward your fingers
      moved = true;
    }
    interacting = true; canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId), cur = pos(e);
    pts.set(e.pointerId, cur);
    if (pts.size === 1){
      if (down && Math.hypot(cur[0]-down.p[0], cur[1]-down.p[1]) > 6) moved = true;
      if (!moved) return;
      const s = S(), dx = cur[0] - prev[0], dy = cur[1] - prev[1];
      view.lam -= dx / s / RAD / Math.max(.35, Math.cos(view.phi*RAD));
      view.phi = clamp(view.phi + dy / s / RAD, -85, 85);
      requestDraw();
    } else if (pts.size === 2 && pinch0){
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a[0]-b[0], a[1]-b[1]);
      view.k = clamp(pinch0.k * d / Math.max(pinch0.d, 1), KMIN, KMAX);
      if (pinch0.anchor){
        const now = unproject((a[0]+b[0])/2, (a[1]+b[1])/2);
        if (now){ view.lam -= ((now[0] - pinch0.anchor[0] + 540) % 360) - 180; view.phi = clamp(view.phi - (now[1] - pinch0.anchor[1]), -85, 85); }
      }
      requestDraw();
    }
  });
  const end = e => {
    if (!pts.has(e.pointerId)) return;
    const wasSingle = pts.size === 1;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch0 = null;
    if (!pts.size){
      interacting = false; canvas.classList.remove("dragging");
      if (wasSingle && !moved && down && performance.now() - down.t < 700 && e.type === "pointerup") onTap(pos(e));
      down = null;
      requestDraw(true);
    }
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("wheel", e => {
    e.preventDefault(); stopAnim();
    const p = pos(e);
    zoomAbout(Math.exp(-e.deltaY * (e.deltaMode ? .05 : .0016)), p[0], p[1]);
  }, {passive: false});
}
