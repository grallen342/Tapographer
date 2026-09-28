#!/bin/bash
# Runs deploy.mjs against the fake APIs: a full first run, an unchanged re-run, a re-run after a file change, then failure cases.
cd "$(dirname "$0")/../.."
export GITHUB_API=http://127.0.0.1:8801 SUPABASE_API=http://127.0.0.1:8802 DEPLOY_FAST=1 GITHUB_TOKEN=ghtok SUPABASE_ACCESS_TOKEN=sbtok
start(){ MOCK_FAIL="$1" node test/deploy/mock-apis.mjs > /tmp/mock.out 2>&1 & MOCK=$!; sleep 0.7; }
finish(){ kill -TERM $MOCK; wait $MOCK 2>/dev/null; echo "  mock state: $(tail -1 /tmp/mock.out)"; }
clean(){ rm -f deploy/.deploy-state.json deploy/DATABASE-PASSWORD.txt; }

echo "===== RUN 1: fresh setup"; clean; start ""
node deploy/deploy.mjs --yes 2>&1 | sed 's/\x1b\[[0-9;]*m//g'; echo "  exit: ${PIPESTATUS[0]}"
echo "===== RUN 2: nothing changed"
node deploy/deploy.mjs --yes 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E "^\[|✓|!|Stopped|Done|exit"; echo "  exit: ${PIPESTATUS[0]}"
echo "===== RUN 3: after editing a file"
cp site/config.js /tmp/cfg.bak; echo "// edited" >> site/config.js
node deploy/deploy.mjs --yes --skip-schema 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E "Uploaded|up to date|Published|exit"; echo "  exit: ${PIPESTATUS[0]}"
cp /tmp/cfg.bak site/config.js
finish
for f in quota schema workflow deployfail pages; do
  echo "===== FAIL CASE: $f"; clean; start "$f"
  node deploy/deploy.mjs --yes 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -A3 -E "Stopped|Unexpected"; finish
done
echo "===== BAD TOKEN"; clean; start ""
GITHUB_TOKEN=wrong node deploy/deploy.mjs --yes 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -A2 Stopped; finish
clean
