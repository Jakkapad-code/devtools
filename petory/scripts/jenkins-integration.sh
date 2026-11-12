#!/bin/sh
# Disposable CI database only. Never use an existing project database.
set -eu
cd "$(dirname "$0")/.."

case "$(uname -s)" in
  Darwin) command -v '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' >/dev/null || { echo 'Google Chrome is required for the macOS browser test.' >&2; exit 1; } ;;
  Linux)
    npx playwright install --only-shell chromium
    if ! node -e 'require("playwright").chromium.launch().then(browser => browser.close()).catch(error => { console.error(error); process.exit(1); })'; then
      npx playwright install-deps chromium
    fi ;;
  *) echo 'Unsupported test host.' >&2; exit 1 ;;
esac

db_id=$(docker run -d --rm --platform linux/amd64 -p 127.0.0.1::5432 \
  -e POSTGRES_DB=petory_ci -e POSTGRES_USER=petory -e POSTGRES_PASSWORD=petory_ci \
  postgis/postgis:17-3.5)
trap 'docker stop "$db_id" >/dev/null 2>&1 || true' EXIT HUP INT TERM

ready=0
for attempt in $(seq 1 60); do
  # The initialization process briefly starts a temporary database; wait for
  # the final server before attempting migrations.
  count=$(docker logs "$db_id" 2>&1 | grep -c 'database system is ready to accept connections' || true)
  if [ "$count" -ge 2 ]; then ready=1; break; fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then echo 'Temporary PostgreSQL did not become ready.' >&2; exit 1; fi
port=$(docker port "$db_id" 5432/tcp | sed -n '1s/.*://p')
case "$port" in ''|*[!0-9]*) echo 'Invalid temporary PostgreSQL port.' >&2; exit 1 ;; esac

export DATABASE_URL="postgresql://petory:petory_ci@127.0.0.1:$port/petory_ci"
export DATABASE_SSL=false
export NODE_ENV=development
export NEXT_PUBLIC_APP_URL=http://localhost:3110
export ALLOWED_ORIGINS=http://localhost:3110
export SESSION_SECRET=ci-session-secret-that-is-longer-than-32-characters
export PETORY_INTEGRATION_DB=1
npm run db:migrate
npm run db:seed
npm run test:integration
