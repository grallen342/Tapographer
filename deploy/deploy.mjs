#!/usr/bin/env node
/* =====================================================================
   Tapographer one-command deploy.

     node deploy/deploy.mjs

   Does every setup step for you:
     1. Creates (or reuses) a Supabase project and waits for it to start
     2. Loads the database (supabase/schema.sql)
     3. Creates (or reuses) a GitHub repo and turns on GitHub Pages
     4. Stores your Supabase URL + key as repo variables
     5. Uploads the project and waits for the site to publish
     6. Points Supabase's login emails at your new site address
     7. Checks the live site loads

   Needs Node 18+ and two tokens (the script asks for them, or set them as
   environment variables GITHUB_TOKEN and SUPABASE_ACCESS_TOKEN):
     - GitHub: a classic personal access token with the "repo" and "workflow" scopes
     - Supabase: an access token from supabase.com/dashboard/account/tokens
   Tokens are never written to disk. Safe to run again: it picks up where it left
   off and re-uploads your latest files (use it to publish updates, too).

   Options:
     --repo NAME            GitHub repo name (default: tapographer)
     --project-ref REF      use an existing Supabase project instead of creating one
     --region REGION        Supabase region for a new project (default: us-east-1)
     --org ORG_ID           Supabase organization (default: your first one)
     --private              make the repo private (needs a paid GitHub plan for Pages)
     --skip-schema          don't re-run supabase/schema.sql
     --yes                  don't ask for confirmation
   ===================================================================== */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import readline from "node:readline";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = join(ROOT, "deploy", ".deploy-state.json");
const GH = process.env.GITHUB_API || "https://api.github.com";
const SB = process.env.SUPABASE_API || "https://api.supabase.com";
const FAST = !!process.env.DEPLOY_FAST;           // tests only: shorter waits
const WAIT = ms => new Promise(r => setTimeout(r, FAST ? Math.min(ms, 50) : ms));

/* ---------- arguments ---------- */
const args = process.argv.slice(2);
const flag = n => args.includes("--" + n);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
if (flag("help") || flag("h")){ console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].replace(/^[\s\S]*?\/\* =+\n/, "")); process.exit(0); }

/* ---------- output ---------- */
const tty = process.stdout.isTTY;
const c = (code, s) => tty ? `\x1b[${code}m${s}\x1b[0m` : s;
let stepNo = 0;
const step = t => console.log("\n" + c("1;36", `[${++stepNo}] ${t}`));
const ok = t => console.log("  " + c(32, "✓") + " " + t);
const info = t => console.log("  " + c(90, t));
const warn = t => console.log("  " + c(33, "!") + " " + t);
class Stop extends Error {}
const stop = (msg, fix) => { throw new Stop(msg + (fix ? "\n\n  How to fix: " + fix : "")); };

/* ---------- state (never contains tokens) ---------- */
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {};
const save = () => { mkdirSync(dirname(STATE_FILE), {recursive: true}); writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); };

/* ---------- prompts ---------- */
const rl = readline.createInterface({input: process.stdin, output: process.stdout});
const ask = q => new Promise(r => rl.question(q, a => r(a.trim())));
async function askSecret(q){
  if (!process.stdin.isTTY) return ask(q);
  process.stdout.write(q);
  return new Promise(res => {
    let s = ""; const stdin = process.stdin;
    stdin.setRawMode(true); stdin.resume();
    const on = ch => {
      ch = ch.toString();
      if (ch === "\r" || ch === "\n"){ stdin.setRawMode(false); stdin.removeListener("data", on); process.stdout.write("\n"); res(s.trim()); }
      else if (ch === "\u0003"){ process.exit(1); }
      else if (ch === "\u007f"){ s = s.slice(0, -1); }
      else { s += ch; process.stdout.write("•"); }
    };
    stdin.on("data", on);
  });
}

/* ---------- HTTP ---------- */
async function api(base, token, method, path, body, {okStatus = [], raw = false} = {}){
  const headers = {"Authorization": `Bearer ${token}`, "Accept": "application/json", "User-Agent": "tapographer-deploy"};
  if (base === GH){ headers["Accept"] = "application/vnd.github+json"; headers["X-GitHub-Api-Version"] = "2022-11-28"; }
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res, lastErr;
  for (let attempt = 0; attempt < 4; attempt++){
    try {
      res = await fetch(base + path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
      if (res.status >= 500 || res.status === 429){ lastErr = new Error(`${res.status} from ${base}${path}`); await WAIT(2000 * (attempt + 1)); continue; }
      break;
    } catch(e){ lastErr = e; await WAIT(2000 * (attempt + 1)); }
  }
  if (!res) throw new Stop(`Couldn't reach ${base}: ${lastErr && lastErr.message}`);
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch(e){ data = text; }
  if (res.ok || okStatus.includes(res.status)) return raw ? {status: res.status, data} : data;
  const err = new Error(`${method} ${path} → ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  err.status = res.status; err.data = data;
  throw err;
}
const gh = (m, p, b, o) => api(GH, TOKENS.github, m, p, b, o);
const sbApi = (m, p, b, o) => api(SB, TOKENS.supabase, m, p, b, o);
const TOKENS = {};

/* ---------- files to publish ---------- */
const SKIP = [/^\.git(\/|$)/, /^deploy\/\.deploy-state\.json$/, /^deploy\/DATABASE-PASSWORD\.txt$/, /^test\/shots\//, /__pycache__/, /(^|\/)\.DS_Store$/, /(^|\/)node_modules\//];
function projectFiles(dir = ROOT){
  const out = [];
  for (const name of readdirSync(dir)){
    const full = join(dir, name), rel = relative(ROOT, full).split(sep).join("/");
    if (SKIP.some(r => r.test(rel))) continue;
    if (statSync(full).isDirectory()) out.push(...projectFiles(full)); else out.push(rel);
  }
  return out.sort();
}

/* =================== main =================== */
async function main(){
  console.log(c("1", "\nTapographer deploy") + c(90, "  (GitHub Pages + Supabase)"));
  if (Number(process.versions.node.split(".")[0]) < 18) stop("This needs Node 18 or newer.", "Install the current LTS from nodejs.org, then run this again.");
  for (const f of ["site/index.html", "site/js/app.js", "supabase/schema.sql", ".github/workflows/deploy.yml"])
    if (!existsSync(join(ROOT, f))) stop(`Missing ${f}.`, "Run this from inside the unzipped tapographer folder, and make sure the hidden .github folder came along.");

  /* ---- tokens ---- */
  step("Sign in to GitHub and Supabase");
  TOKENS.github = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || await askSecret("  GitHub token (repo + workflow scopes): ");
  TOKENS.supabase = process.env.SUPABASE_ACCESS_TOKEN || await askSecret("  Supabase access token: ");
  let me;
  try { me = await gh("GET", "/user"); }
  catch(e){ stop("GitHub didn't accept that token.", "Create a classic token at github.com/settings/tokens/new with the 'repo' and 'workflow' boxes ticked."); }
  ok(`GitHub: signed in as ${me.login}`);
  let orgs;
  try { orgs = await sbApi("GET", "/v1/organizations"); }
  catch(e){ stop("Supabase didn't accept that token.", "Create one at supabase.com/dashboard/account/tokens and paste it in."); }
  if (!orgs || !orgs.length) stop("Your Supabase account has no organization yet.", "Open supabase.com/dashboard once and create an organization (free), then run this again.");
  ok(`Supabase: ${orgs.length} organization${orgs.length > 1 ? "s" : ""} found`);

  const repoName = opt("repo", state.repo || "tapographer");
  const owner = me.login;
  if (!flag("yes") && !state.confirmed){
    console.log(`\n  This will set up:\n    • GitHub repo  ${c(1, owner + "/" + repoName)} (${flag("private") ? "private" : "public"}) with GitHub Pages\n    • Supabase project ${c(1, opt("project-ref", state.projectRef || "tapographer (new, free)"))}`);
    const a = (await ask("\n  Go ahead? [Y/n] ")).toLowerCase();
    if (a && a !== "y" && a !== "yes") stop("Stopped. Nothing was changed.");
  }
  state.confirmed = true; state.repo = repoName; state.owner = owner; save();

  /* ---- Supabase project ---- */
  step("Supabase project");
  let ref = opt("project-ref", state.projectRef);
  if (!ref){
    const projects = await sbApi("GET", "/v1/projects");
    const existing = (projects || []).find(p => p.name === "tapographer");
    if (existing){ ref = existing.id || existing.ref; ok(`Reusing your existing "tapographer" project (${ref})`); }
    else {
      const org = opt("org", orgs[0].id || orgs[0].slug);
      const dbPass = randomBytes(18).toString("base64url");
      info(`Creating project "tapographer" in ${opt("region", "us-east-1")}…`);
      let created;
      try { created = await sbApi("POST", "/v1/projects", {name: "tapographer", organization_id: org, db_pass: dbPass, region: opt("region", "us-east-1")}); }
      catch(e){
        if (e.status === 402 || /limit|maximum|free/i.test(String(e.message)))
          stop("Supabase won't create another free project on this account.", "Free accounts get 2 active projects. Pause or delete one at supabase.com/dashboard, or create the project yourself and run: node deploy/deploy.mjs --project-ref YOUR_PROJECT_REF");
        stop(`Supabase couldn't create the project (${e.message}).`, "Create a project yourself at supabase.com/dashboard (name it tapographer), then run: node deploy/deploy.mjs --project-ref YOUR_PROJECT_REF  (the ref is the code in its URL).");
      }
      ref = created.id || created.ref;
      const passFile = join(ROOT, "deploy", "DATABASE-PASSWORD.txt");
      writeFileSync(passFile, `Supabase project ${ref}\nDatabase password: ${dbPass}\n\nYou rarely need this. Keep it somewhere safe and don't commit it.\n`);
      state.passwordFile = "deploy/DATABASE-PASSWORD.txt";
      ok(`Created project ${ref}. Database password saved to deploy/DATABASE-PASSWORD.txt (not uploaded).`);
    }
  } else ok(`Using project ${ref}`);
  state.projectRef = ref; save();

  info("Waiting for the database to be ready (a new project takes 1–3 minutes)…");
  for (let i = 0; ; i++){
    const p = await sbApi("GET", `/v1/projects/${ref}`).catch(e => { if (e.status === 404) stop(`Supabase project ${ref} doesn't exist on this account.`, "Check the ref, or delete deploy/.deploy-state.json to start fresh."); throw e; });
    if (p.status === "ACTIVE_HEALTHY") break;
    if (/INACTIVE|PAUSED/.test(p.status || "")) stop("That Supabase project is paused.", `Open supabase.com/dashboard/project/${ref} and click Restore project, then run this again.`);
    if (i > 60) stop("The Supabase project is taking unusually long to start.", "Wait a few minutes and run this again; it picks up where it left off.");
    if (i % 3 === 0) info(`  status: ${p.status || "starting"}…`);
    await WAIT(10000);
  }
  ok("Database is up");

  /* ---- schema ---- */
  if (!flag("skip-schema")){
    step("Load the database (tables, security rules, scoring, host tools)");
    const sql = readFileSync(join(ROOT, "supabase", "schema.sql"), "utf8");
    try { await sbApi("POST", `/v1/projects/${ref}/database/query`, {query: sql}); }
    catch(e){ stop(`The schema didn't load: ${e.message}`, `Open supabase.com/dashboard/project/${ref}/sql/new, paste supabase/schema.sql, click Run and read the error, then run this again with --skip-schema.`); }
    ok("Schema loaded (safe to repeat; players and scores are untouched)");
  }

  /* ---- keys ---- */
  const keys = await sbApi("GET", `/v1/projects/${ref}/api-keys`);
  const anon = (keys || []).find(k => k.name === "anon") || (keys || []).find(k => k.type === "publishable");
  if (!anon || !anon.api_key) stop("Couldn't read the project's public (anon) key.", `Copy it from supabase.com/dashboard/project/${ref}/settings/api and set it as the repo variable SUPABASE_ANON_KEY.`);
  const supabaseUrl = `https://${ref}.supabase.co`;
  ok(`Public key found (${anon.name || anon.type})`);

  /* ---- GitHub repo ---- */
  step("GitHub repo");
  let repo = await gh("GET", `/repos/${owner}/${repoName}`).catch(e => { if (e.status === 404) return null; throw e; });
  if (!repo){
    repo = await gh("POST", "/user/repos", {name: repoName, private: flag("private"), auto_init: true, description: "Tapographer: a MapTap-style geography game"});
    ok(`Created ${repo.full_name}`);
    await WAIT(2000);
  } else ok(`Using existing ${repo.full_name}`);
  if (repo.private && !flag("private")) warn("This repo is private. GitHub Pages on private repos needs a paid GitHub plan.");

  step("Turn on GitHub Pages");
  const pages = await gh("GET", `/repos/${owner}/${repoName}/pages`).catch(e => e.status === 404 ? null : Promise.reject(e));
  if (!pages){
    try { await gh("POST", `/repos/${owner}/${repoName}/pages`, {build_type: "workflow"}); }
    catch(e){ stop(`GitHub wouldn't turn on Pages (${e.message}).`, `Open github.com/${owner}/${repoName}/settings/pages, set Source to "GitHub Actions", then run this again.`); }
    ok("Pages turned on (source: GitHub Actions)");
  } else if (pages.build_type !== "workflow"){
    await gh("PUT", `/repos/${owner}/${repoName}/pages`, {build_type: "workflow"});
    ok("Pages switched to GitHub Actions");
  } else ok("Pages already on");

  step("Save the Supabase address and key in the repo");
  for (const [name, value] of [["SUPABASE_URL", supabaseUrl], ["SUPABASE_ANON_KEY", anon.api_key]]){
    try { await gh("POST", `/repos/${owner}/${repoName}/actions/variables`, {name, value}); }
    catch(e){ if (e.status === 409) await gh("PATCH", `/repos/${owner}/${repoName}/actions/variables/${name}`, {name, value}); else throw e; }
    ok(`${name} set`);
  }

  /* ---- upload ---- */
  step("Upload the game");
  const files = projectFiles();
  const branch = "main";
  let headSha = null, baseTree = undefined;
  const refData = await gh("GET", `/repos/${owner}/${repoName}/git/ref/heads/${branch}`).catch(e => e.status === 404 || e.status === 409 ? null : Promise.reject(e));
  if (refData){ headSha = refData.object.sha; baseTree = (await gh("GET", `/repos/${owner}/${repoName}/git/commits/${headSha}`)).tree.sha; }
  else if (repo.default_branch && repo.default_branch !== branch){
    const d = await gh("GET", `/repos/${owner}/${repoName}/git/ref/heads/${repo.default_branch}`).catch(() => null);
    if (d){ headSha = d.object.sha; baseTree = (await gh("GET", `/repos/${owner}/${repoName}/git/commits/${headSha}`)).tree.sha; }
  }
  const tree = [];
  let n = 0;
  for (const f of files){
    const content = readFileSync(join(ROOT, f)).toString("base64");
    const blob = await gh("POST", `/repos/${owner}/${repoName}/git/blobs`, {content, encoding: "base64"});
    tree.push({path: f, mode: "100644", type: "blob", sha: blob.sha});
    if (++n % 10 === 0) info(`  ${n}/${files.length} files…`);
  }
  const newTree = await gh("POST", `/repos/${owner}/${repoName}/git/trees`, baseTree ? {base_tree: baseTree, tree} : {tree});
  const unchanged = baseTree && newTree.sha === baseTree;
  const commit = unchanged ? {sha: headSha} : null;
  if (unchanged) ok("Files already up to date; nothing new to publish");
  else await publishCommit();
  async function publishCommit(){
  const commit = await gh("POST", `/repos/${owner}/${repoName}/git/commits`, {message: `Deploy Tapographer (${new Date().toISOString().slice(0, 16).replace("T", " ")})`, tree: newTree.sha, parents: headSha ? [headSha] : []});
  try {
    if (refData) await gh("PATCH", `/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {sha: commit.sha, force: false});
    else await gh("POST", `/repos/${owner}/${repoName}/git/refs`, {ref: `refs/heads/${branch}`, sha: commit.sha});
  } catch(e){
    if (/workflow/i.test(String(e.message))) stop("GitHub refused to add the deploy workflow file.", "Your token needs the 'workflow' scope. Make a new classic token with both 'repo' and 'workflow' ticked.");
    throw e;
  }
  if (repo.default_branch !== branch) await gh("PATCH", `/repos/${owner}/${repoName}`, {default_branch: branch}).catch(() => {});
  ok(`Uploaded ${files.length} files (commit ${commit.sha.slice(0, 7)})`);
  state.lastCommit = commit.sha; save();

  /* ---- publish ---- */
  step("Publish the site");
  let run = null;
  for (let i = 0; i < 12 && !run; i++){
    await WAIT(5000);
    const runs = await gh("GET", `/repos/${owner}/${repoName}/actions/runs?branch=${branch}&per_page=5`);
    run = (runs.workflow_runs || []).find(r => r.head_sha === commit.sha);
    if (i === 6 && !run){ info("Starting the deploy manually…"); await gh("POST", `/repos/${owner}/${repoName}/actions/workflows/deploy.yml/dispatches`, {ref: branch}).catch(() => {}); }
  }
  if (!run){
    const runs = await gh("GET", `/repos/${owner}/${repoName}/actions/runs?branch=${branch}&per_page=1`);
    run = (runs.workflow_runs || [])[0];
  }
  if (!run) stop("The deploy didn't start.", `Open github.com/${owner}/${repoName}/actions, enable Actions if asked, then click "Deploy to GitHub Pages" → Run workflow.`);
  info(`Deploy running: ${run.html_url}`);
  for (let i = 0; ; i++){
    const r = await gh("GET", `/repos/${owner}/${repoName}/actions/runs/${run.id}`);
    if (r.status === "completed"){
      if (r.conclusion !== "success") stop(`The deploy finished with "${r.conclusion}".`, `Open ${r.html_url} to see which step failed. Most often: Settings → Pages → Source must be "GitHub Actions". Then run this again.`);
      break;
    }
    if (i > 60) stop("The deploy is taking unusually long.", `Check ${r.html_url}, then run this again.`);
    await WAIT(8000);
  }
  }
  const pageInfo = await gh("GET", `/repos/${owner}/${repoName}/pages`);
  const siteUrl = (pageInfo.html_url || `https://${owner.toLowerCase()}.github.io/${repoName}/`).replace(/\/?$/, "/");
  ok(`Published: ${siteUrl}`);
  state.siteUrl = siteUrl; save();

  /* ---- auth URLs ---- */
  step("Point login emails at your site");
  try {
    await sbApi("PATCH", `/v1/projects/${ref}/config/auth`, {site_url: siteUrl, uri_allow_list: `${siteUrl}**,${siteUrl}`});
    ok("Confirmation and password-reset emails now link back to your site");
  } catch(e){
    warn(`Couldn't set this automatically (${e.message}).`);
    warn(`Set it by hand: supabase.com/dashboard/project/${ref}/auth/url-configuration → Site URL ${siteUrl}, Redirect URL ${siteUrl}**`);
  }

  /* ---- check ---- */
  step("Check the live site");
  let live = false;
  for (let i = 0; i < 12 && !live; i++){
    try {
      const page = await fetch(siteUrl, {headers: {"User-Agent": "tapographer-deploy"}});
      const cfg = await fetch(siteUrl + "config.js", {headers: {"User-Agent": "tapographer-deploy"}});
      const cfgText = cfg.ok ? await cfg.text() : "";
      live = page.ok && cfgText.includes(ref);
      if (page.ok && !cfgText.includes(ref)) info("  site is up, waiting for the new config…");
    } catch(e){}
    if (!live) await WAIT(10000);
  }
  if (live) ok("Site is live and connected to your database");
  else warn("The site didn't answer yet. GitHub can take a few minutes the very first time; just open the link shortly.");

  console.log("\n" + c("1;32", "Done.") + "\n");
  console.log(`  Game:           ${c(1, siteUrl)}`);
  console.log(`  Control panel:  ${siteUrl}admin.html`);
  console.log(`  Repo:           https://github.com/${owner}/${repoName}`);
  console.log(`  Database:       https://supabase.com/dashboard/project/${ref}`);
  const players = await sbApi("POST", `/v1/projects/${ref}/database/query`, {query: "select count(*)::int as n from public.profiles"}).catch(() => null);
  const count = Array.isArray(players) && players[0] ? players[0].n : null;
  if (count === 0) console.log("\n  " + c(33, "Next:") + " open the game and Create account FIRST. The first account becomes the host.\n  Confirm the email Supabase sends you, log in, then share the link with friends.");
  else if (count != null) console.log(`\n  ${count} player${count === 1 ? "" : "s"} already signed up. To publish changes later, just run this again.`);
  console.log("");
}

main().then(() => { rl.close(); process.exit(0); }).catch(e => {
  rl.close();
  if (e instanceof Stop) console.error("\n" + c("1;31", "Stopped: ") + e.message + "\n\n  Progress is saved; run the same command again after fixing it.\n");
  else console.error("\n" + c("1;31", "Unexpected error: ") + (e && e.message) + "\n\n  Progress is saved; run the same command again. If it keeps failing, share this message with Claude.\n");
  process.exit(1);
});
