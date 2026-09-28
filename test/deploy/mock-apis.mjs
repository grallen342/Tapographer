// Test-only fake GitHub + Supabase APIs for deploy.mjs. Port 8801 = GitHub, 8802 = Supabase, 8803 = published site.
import http from "node:http";
import { createHash } from "node:crypto";
const log = [];
const S = { repo: null, pages: null, vars: {}, blobs: {}, trees: {}, commits: {}, refs: {}, runs: [], projects: [], queries: [], auth: null, polls: {} };
const sha = x => createHash("sha1").update(JSON.stringify(x)).digest("hex");
const body = req => new Promise(r => { let d = ""; req.on("data", c => d += c); req.on("end", () => r(d ? JSON.parse(d) : null)); });
const send = (res, code, obj) => { res.writeHead(code, {"Content-Type":"application/json"}); res.end(obj === undefined ? "" : JSON.stringify(obj)); };
const FAIL = process.env.MOCK_FAIL || "";

http.createServer(async (req, res) => {
  const b = await body(req); const u = new URL(req.url, "http://x"); const p = u.pathname; const m = req.method;
  log.push(`GH ${m} ${p}`);
  if (req.headers.authorization !== "Bearer ghtok") return send(res, 401, {message:"Bad credentials"});
  if (m === "GET" && p === "/user") return send(res, 200, {login: "greg"});
  const R = "/repos/greg/tapographer";
  if (m === "GET" && p === R) return S.repo ? send(res, 200, S.repo) : send(res, 404, {message:"Not Found"});
  if (m === "POST" && p === "/user/repos"){ S.repo = {full_name:"greg/tapographer", private: b.private, default_branch:"main"}; const t = sha("init"); S.trees[t] = {}; const c = sha("c0"); S.commits[c] = {tree:{sha:t}}; S.refs.main = c; return send(res, 201, S.repo); }
  if (p === R + "/pages"){
    if (m === "GET") return S.pages ? send(res, 200, S.pages) : send(res, 404, {});
    if (m === "POST"){ if (FAIL === "pages") return send(res, 422, {message:"Pages not available"}); S.pages = {build_type: b.build_type, html_url: "http://127.0.0.1:8803/tapographer/"}; return send(res, 201, S.pages); }
    if (m === "PUT"){ S.pages.build_type = b.build_type; return send(res, 204); }
  }
  if (m === "POST" && p === R + "/actions/variables"){ if (S.vars[b.name]) return send(res, 409, {message:"exists"}); S.vars[b.name] = b.value; return send(res, 201, {}); }
  if (m === "PATCH" && p.startsWith(R + "/actions/variables/")){ S.vars[b.name] = b.value; return send(res, 204); }
  if (m === "GET" && p === R + "/git/ref/heads/main") return S.refs.main ? send(res, 200, {object:{sha:S.refs.main}}) : send(res, 404, {});
  if (m === "GET" && p.startsWith(R + "/git/commits/")) return send(res, 200, S.commits[p.split("/").pop()]);
  if (m === "POST" && p === R + "/git/blobs"){ const s = sha(b.content); S.blobs[s] = b.content; return send(res, 201, {sha: s}); }
  if (m === "POST" && p === R + "/git/trees"){ const base = b.base_tree ? S.trees[b.base_tree] : {}; const t = Object.assign({}, base); b.tree.forEach(e => t[e.path] = e.sha); const s = sha(t); S.trees[s] = t; return send(res, 201, {sha: s}); }
  if (m === "POST" && p === R + "/git/commits"){ const s = sha([b.tree, b.parents, Math.random()]); S.commits[s] = {tree:{sha:b.tree}}; return send(res, 201, {sha: s}); }
  if (m === "PATCH" && p === R + "/git/refs/heads/main"){
    const t = S.trees[S.commits[b.sha].tree.sha];
    if (FAIL === "workflow" && Object.keys(t).some(k => k.startsWith(".github/workflows"))) return send(res, 422, {message:"refusing to allow a Personal Access Token to create or update workflow `.github/workflows/deploy.yml` without `workflow` scope"});
    S.refs.main = b.sha; S.runs.unshift({id: S.runs.length + 1, head_sha: b.sha, status: "queued", conclusion: null, html_url: "http://gh/run/" + (S.runs.length + 1), polls: 0});
    // publish the site for the check step
    S.site = {index: S.blobs[t["site/index.html"]], config: Buffer.from(S.blobs[t["site/config.js"]] || "", "base64").toString()};
    if (S.vars.SUPABASE_URL) S.site.config = `window.TAPO_CONFIG = {SUPABASE_URL: "${S.vars.SUPABASE_URL}"};`;
    return send(res, 200, {});
  }
  if (m === "PATCH" && p === R) return send(res, 200, S.repo);
  if (m === "GET" && p === R + "/actions/runs") return send(res, 200, {workflow_runs: S.runs});
  if (m === "GET" && p.startsWith(R + "/actions/runs/")){ const r = S.runs.find(x => String(x.id) === p.split("/").pop()); r.polls++; if (r.polls > 2){ r.status = "completed"; r.conclusion = FAIL === "deployfail" ? "failure" : "success"; } else r.status = "in_progress"; return send(res, 200, r); }
  if (m === "POST" && p.endsWith("/dispatches")) return send(res, 204);
  send(res, 404, {message: "mock: no route " + m + " " + p});
}).listen(8801);

http.createServer(async (req, res) => {
  const b = await body(req); const p = new URL(req.url, "http://x").pathname; const m = req.method;
  log.push(`SB ${m} ${p}`);
  if (req.headers.authorization !== "Bearer sbtok") return send(res, 401, {message:"Unauthorized"});
  if (m === "GET" && p === "/v1/organizations") return send(res, 200, [{id: "org1", name: "Greg"}]);
  if (m === "GET" && p === "/v1/projects") return send(res, 200, S.projects);
  if (m === "POST" && p === "/v1/projects"){ if (FAIL === "quota") return send(res, 402, {message:"The following organization members have reached their maximum limits for the number of active free projects"}); const pr = {id: "abcdefghijklmnop", name: b.name, status: "COMING_UP", region: b.region}; S.projects.push(pr); return send(res, 201, pr); }
  const mm = p.match(/^\/v1\/projects\/([a-z]+)(\/.*)?$/);
  if (mm){
    const pr = S.projects.find(x => x.id === mm[1]); if (!pr) return send(res, 404, {message:"not found"});
    const rest = mm[2] || "";
    if (m === "GET" && rest === ""){ S.polls[pr.id] = (S.polls[pr.id] || 0) + 1; if (S.polls[pr.id] > 2) pr.status = "ACTIVE_HEALTHY"; return send(res, 200, pr); }
    if (m === "POST" && rest === "/database/query"){ S.queries.push(b.query.slice(0, 60)); if (FAIL === "schema" && b.query.includes("create table")) return send(res, 400, {message:"syntax error at or near \"x\""}); return send(res, 201, b.query.includes("count(*)") ? [{n: 0}] : []); }
    if (m === "GET" && rest === "/api-keys") return send(res, 200, [{name:"anon", api_key:"eyJanon"}, {name:"service_role", api_key:"eyJsecret"}]);
    if (m === "PATCH" && rest === "/config/auth"){ S.auth = b; return send(res, 200, b); }
  }
  send(res, 404, {message:"mock: no route " + m + " " + p});
}).listen(8802);

http.createServer((req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  if (!S.site) { res.writeHead(404); return res.end(); }
  if (p === "/tapographer/") { res.writeHead(200); return res.end("<html>tapographer</html>"); }
  if (p === "/tapographer/config.js") { res.writeHead(200); return res.end(S.site.config); }
  res.writeHead(404); res.end();
}).listen(8803);

process.on("SIGTERM", () => { console.log(JSON.stringify({vars: S.vars, auth: S.auth, pages: S.pages, files: S.refs.main && Object.keys(S.trees[S.commits[S.refs.main].tree.sha]).length, runs: S.runs.length, queries: S.queries.length, projects: S.projects.map(p => p.id)})); process.exit(0); });
console.log("mock ready");
