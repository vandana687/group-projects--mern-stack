#!/usr/bin/env bash
set -euo pipefail

say() { echo -e "\n[dev-check] $*"; }

say "Node & npm versions"
node -v || true
npm -v || true

say "Checking required files"
if [[ -f server/.env ]]; then
  echo "server/.env present"
else
  echo "server/.env missing (copy server/.env.example to server/.env)"
fi

say "Validating env vars (if .env exists)"
if [[ -f server/.env ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' server/.env | xargs -d '\n' -0 2>/dev/null || true)
  echo "MONGODB_URI=${MONGODB_URI:-<unset>}"
  echo "PORT=${PORT:-<unset>}"
  echo "CLIENT_URL=${CLIENT_URL:-<unset>}"
fi

say "Port usage"
for p in 3000 5000 27017; do
  echo "--- Port :$p ---"
  ss -ltnp 2>/dev/null | grep ":$p" || echo "No listeners on :$p"
  lsof -i :$p 2>/dev/null || true
done

say "MongoDB reachability"
if command -v mongosh >/dev/null 2>&1; then
  mongosh --quiet --eval 'db.runCommand({ ping: 1 })' 2>/dev/null || echo "mongosh ping failed"
else
  echo "mongosh not installed; checking socket on :27017"
  (echo > /dev/tcp/127.0.0.1/27017) >/dev/null 2>&1 && echo "TCP 27017 open" || echo "TCP 27017 closed"
fi

say "Backend health check"
if command -v curl >/dev/null 2>&1; then
  curl -sS http://localhost:5000/api/health || echo "health check failed"
else
  echo "curl not installed"
fi

say "Done. Address any missing pieces above and try npm run dev:full."
