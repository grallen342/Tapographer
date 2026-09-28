#!/bin/bash
# Double-click to deploy Tapographer (Mac). Opens Terminal and runs the deploy script.
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed. Get the LTS version from https://nodejs.org, then double-click this again."
  read -p "Press Return to close."; exit 1
fi
node deploy/deploy.mjs "$@"
read -p "Press Return to close."
