# Tapographer

MapTap-style geography game. A static site in `site/` is hosted on GitHub Pages; accounts and data are in Supabase (`supabase/schema.sql`). The host control panel is `site/admin.html`.

- To deploy or publish changes, use the `tapographer-deployer` agent (`.claude/agents/tapographer-deployer.md`), which runs `node deploy/deploy.mjs`.
- Never write GitHub or Supabase tokens to files or commit them. `deploy/.deploy-state.json` and `deploy/DATABASE-PASSWORD.txt` are local only.
- Scores, ratings and host actions are enforced in SQL functions (security definer) with row-level security; keep that model when changing features.
- Tests: `python3 test/run_ui.py` (UI, mocked Supabase), `test/deploy/run.sh` (deploy script against mocked APIs), `supabase/test/*.sql` (database scenarios on a local Postgres).
