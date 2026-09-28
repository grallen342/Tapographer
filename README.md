# Tapographer

A MapTap-style geography game: five places per game, tap the globe, score by distance, ×2/×3 multipliers on the late rounds, up to 1,000 points. Players make their own account (username, email, password), and get a skill rating, rankings, a Daily leaderboard and 1-on-1 duels. The host (you) gets a password-protected control panel.

**What's in this folder**

| Folder | What it is |
|---|---|
| `site/` | The website. GitHub publishes this folder. |
| `.github/workflows/deploy.yml` | Tells GitHub to publish `site/` to GitHub Pages on every push. |
| `supabase/schema.sql` | The database: tables, security rules, scoring, ratings and host tools. You paste it into Supabase once. |
| `deploy/` | The deploy agent: `deploy.mjs` plus double-click launchers for Mac and Windows. |
| `.claude/agents/tapographer-deployer.md` | The same agent for Claude Code: say "deploy Tapographer". |
| `supabase/test/`, `test/` | The tests I ran. You don't need them. |

It costs nothing to run for a group of friends. Supabase (accounts and database) and GitHub Pages (the website) are both free.

---

## Quick start: let the deploy agent do everything (about 5 minutes)

The deploy agent does every setup step below for you: it creates the Supabase project, loads the database, creates the GitHub repo, turns on Pages, stores your keys, uploads the game, waits for it to publish, points the login emails at your site, and checks the site works.

**You need:**
- **Node.js 18 or newer**: install the LTS version from nodejs.org.
- **A GitHub token**: go to github.com/settings/tokens/new (a "classic" token), tick **repo** and **workflow**, and click **Generate token**.
- **A Supabase token**: sign up at supabase.com, then create one at supabase.com/dashboard/account/tokens.

**Then run it, whichever way is easiest for you:**
- **Mac**: double-click `deploy/Deploy-Mac.command`. The first time, macOS may block it; right-click it → **Open** → **Open**.
- **Windows**: double-click `deploy\Deploy-Windows.bat`.
- **Terminal**: in this folder, run `node deploy/deploy.mjs`.
- **Claude Code**: open this folder in Claude Code and say *"deploy Tapographer"*. The `tapographer-deployer` agent runs the script, fixes common problems and gives you your link.

It asks for the two tokens (they're never saved), confirms, then works through 10 steps. When it finishes it prints your game link, `https://YOUR-GITHUB-USERNAME.github.io/tapographer/`. **Open it and create your account first. The first account becomes the host.**

**To publish changes later**, run the same thing again. It only uploads what changed and never touches players or scores. If a step fails, it stops with a plain-English "How to fix" and resumes where it left off the next time you run it.

---

## Manual setup (if you'd rather click through it yourself)

### 1. Create the database (Supabase)

1. Go to **supabase.com**, sign up (free), and click **New project**.
   - Name: `tapographer`. Set a database password (save it somewhere; you won't need it day to day). Pick the region closest to you (for example, East US).
   - Wait a minute or two while it sets up.
2. In the left sidebar, open **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` from this folder in any text editor, copy **everything**, paste it into the query box, and click **Run**. You should see "Success. No rows returned."
4. Get your two connection values: open **Project Settings** (gear icon) → **API** (it may be called **Data API** or **API Keys**). Copy:
   - the **Project URL** (looks like `https://abcdefghijkl.supabase.co`)
   - the **anon public** key (a long string starting with `eyJ...`). If your dashboard shows a **publishable** key (`sb_publishable_...`) instead, use that one. Both are safe to put on a public website, since the database's security rules do the protecting.

### 2. Put the project in your GitHub repo

Use a new repo (for example `tapographer`) or an existing one. **Public** repos get free GitHub Pages; private repos need a paid GitHub plan for Pages.

**Easiest (in the browser):**
1. On github.com click **New repository**, name it `tapographer`, choose **Public**, and click **Create repository**.
2. On the empty repo page, click **uploading an existing file**.
3. Unzip the project on your computer. Open the `tapographer` folder and drag **everything inside it** (`site`, `supabase`, `test`, `README.md`, `.github`, `.gitignore`) onto the upload page.
   - The `.github` folder is hidden on Mac and Windows by default, and without it nothing deploys. On a Mac press **Cmd + Shift + .** in Finder to show it. On Windows, go to File Explorer → View → **Hidden items**.
   - Alternatively use **GitHub Desktop**, or run `git init`, `git add .`, `git commit -m "Tapographer"`, then `git push` from the folder. Both include hidden folders automatically.
4. Click **Commit changes**. Check that the repo now shows a `.github/workflows/deploy.yml` file.

(If your repo already has other things in it, put these files at the top level of the repo; the workflow expects `site/` there.)

### 3. Turn on GitHub Pages and add your Supabase keys

1. In the repo: **Settings** → **Pages** → under **Build and deployment**, set **Source** to **GitHub Actions**.
2. **Settings** → **Secrets and variables** → **Actions** → **Variables** tab → **New repository variable**, twice:
   - Name `SUPABASE_URL`, value: your Project URL from step 1
   - Name `SUPABASE_ANON_KEY`, value: your anon (or publishable) key from step 1

   (These go into the site when it's built, so you never edit `config.js`. Both values are designed to be public; the database's security rules protect the data.)
3. Go to the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**. That first run is needed because you added the variables after the upload. After about a minute it shows a green check, and your site is live at:

   `https://YOUR-GITHUB-USERNAME.github.io/tapographer/`

   From now on, every change you push to `main` redeploys automatically.

### 4. Tell Supabase your web address (so emails link back correctly)

In Supabase: **Authentication** → **URL Configuration**:

- **Site URL**: `https://YOUR-GITHUB-USERNAME.github.io/tapographer/`
- **Redirect URLs** → **Add URL**: `https://YOUR-GITHUB-USERNAME.github.io/tapographer/**`

Leave **Authentication → Sign In / Providers → Email → Confirm email** turned **on**. That's what makes every player confirm their email address.

### 5. Become the host

**Before you share the link**, open your site (`https://YOUR-GITHUB-USERNAME.github.io/tapographer/`) and **Create account** with the username you want. The first account ever created automatically becomes the host. Confirm the email Supabase sends you, then log in. You'll see a **Host** button (padlock) at the top. It opens the control panel at `/admin.html`, which asks for your password again before it opens.

### 6. Invite friends

Send them your address. They click **Create account**, choose a username, enter their email and a password, confirm the email, and play. To keep it to people you invite, set an **invite code** in the control panel (Settings), and share the code with the link.

---

## The host control panel (`/admin.html`)

Only accounts marked as host can open it, and it asks for your password every time you open it (and again after 30 minutes idle, or when you press **Lock**). The database itself refuses host actions from anyone who isn't a host, so hiding the page isn't the only protection.

- **Overview**: players, new and active this week, games played, duels, average rating, top 5, the latest games from everyone, **Export players (CSV)**.
- **Players**: search by username or email, filter (hosts, suspended, email not confirmed), sort any column. Open a player to:
  - see every stat, their rating history, full game history (every round) and duels
  - **rename** them
  - **send a password reset email** (you never see anyone's password)
  - **suspend** or lift a suspension (they can't play or duel; scores are kept; they drop off the rankings)
  - **make host** or remove host access (there must always be at least one host)
  - **reset stats** (rating back to 1000, history cleared, account kept)
  - **delete the account** (you type their username to confirm; removes login, profile, games and duels)
- **Duels**: every duel with status; delete one, or clear finished or stale unfinished duels older than N days.
- **Settings**: turn **new sign-ups** on or off, set or clear an **invite code**, post an **announcement** banner for all players, toggle the Daily **country bonus**, and copy your game link.

---

## How the game works

- **Modes**
  - **Random**: a fresh five places every time; this is the default.
  - **Daily**: the same five places for everyone, once a day, with its own leaderboard.
  - **Duels**: you and one other player get the same five places.
  - **25s Challenge** and the **regional maps** (USA, Europe, Asia, Africa, Americas) are practice.
- **Scoring**: MapTap's published rules. 100 points within 22 km (about 14 miles), about 81 at 1,000 km, 0 past 16,250 km. Rounds 3–5 count ×2, ×3, ×3. In the Daily, landing in the right country scores at least 25, and the right continent at least 10. Scores are recomputed on the server from the five round scores, so nobody can post a made-up total.
- **Skill rating**: starts at 1000 and moves after every ranked game (Random, Daily, Duel). Each game compares your score with what your rating predicts: 1000 predicts 500, 1300 predicts about 850. Beat it to climb. Duels add a head-to-head swing, bigger for beating a higher-rated player. Players are marked "new" until 5 ranked games.

---

## Things to know

- **Confirmation emails.** Supabase's built-in email sender is meant for getting started and only allows a few emails per hour. If several friends sign up at once, some confirmation emails may be delayed. For a bigger group, connect a free email service: **Authentication → Emails → SMTP Settings** in Supabase, using, for example, Resend's free plan.
- **Idle projects pause.** Supabase may pause a free project if nobody uses it for about a week. If the game stops loading, open your Supabase dashboard and click **Restore project**.
- **Logging in with a username.** The site looks up the email that goes with a username in order to log in. So someone who knows a username can find out which email it uses. If that matters for your group, players can log in with their email instead, and you can ask me to switch to email-only login.
- **Updating the site later**: change files in the repo (on github.com or by pushing) and GitHub redeploys within a minute. The database and everyone's accounts are unaffected.
- **Deploy failed?** Open the **Actions** tab and click the failed run to see which step broke. The usual cause is Pages not being set to **GitHub Actions** (step 3.1).
- **Netlify instead** (optional): you can also drag just the `site` folder onto app.netlify.com/drop. Then fill in `site/config.js` by hand, because the GitHub variables aren't used there.
- **Re-running `schema.sql`** is safe. It updates functions and rules without touching players or scores.
- **Your own domain** (optional): repo **Settings → Pages → Custom domain**. Then update the Supabase URL settings in step 4 to match.
