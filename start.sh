#!/usr/bin/env bash
# ClauseChain — bring up the containerized deployment (docker-compose.yml).
#
# The production server runs bare-metal instead (systemd + nginx, no Docker
# — see deploy/DEPLOY.md and deploy/SERVER_EXECUTION_PLAN.md). This script
# is for the separate, self-contained Docker path: a fresh host that doesn't
# have that stack already, or a local run of the full thing.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "== docker =="
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    if ! sudo -v &> /dev/null; then
        echo "Docker install needs a sudo-capable user. Re-run as one, or install Docker yourself." >&2
        exit 1
    fi
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm -f get-docker.sh
fi

if ! docker compose version &> /dev/null; then
    echo "Docker is installed but the 'docker compose' plugin isn't available." >&2
    echo "See https://docs.docker.com/compose/install/ and re-run this script." >&2
    exit 1
fi

echo "== ports =="
# nginx is the only service docker-compose.yml publishes to the host (80:80).
check_port() {
    local port="$1"
    if ! lsof -i ":${port}" &> /dev/null; then
        echo "Port ${port} is available."
        return
    fi
    echo "Port ${port} is in use. Do you want to kill the process? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        sudo lsof -i ":${port}" -t | xargs -r sudo kill -9
    else
        exit 1
    fi
}
check_port 80

echo "== .env =="
if [ ! -f .env ]; then
    cp .env.example .env
    # Generate the two secrets Django refuses to start without (min 50 chars,
    # not a placeholder — see ensure_strong_secret in clausechain/settings.py)
    # and a real Postgres password, exactly as deploy/DEPLOY.md's own
    # `openssl rand -hex 48` step does for the bare-metal path.
    django_secret="$(openssl rand -hex 48)"
    jwt_secret="$(openssl rand -hex 48)"
    postgres_password="$(openssl rand -hex 24)"
    tmp="$(mktemp)"
    sed \
        -e "s/^DJANGO_SECRET_KEY=__CHANGE_ME__/DJANGO_SECRET_KEY=${django_secret}/" \
        -e "s/^JWT_SIGNING_KEY=__CHANGE_ME__/JWT_SIGNING_KEY=${jwt_secret}/" \
        -e "s/^POSTGRES_PASSWORD=__CHANGE_ME__/POSTGRES_PASSWORD=${postgres_password}/" \
        .env > "$tmp"
    mv "$tmp" .env
    echo "Created .env with generated secrets. Review it (OPENAI_API_KEY, Stripe/bKash/OAuth keys, APP_ORIGIN) before going further."
else
    echo ".env already exists — leaving it alone."
fi

echo "== engine data directories =="
# Bind-mounted into backend/engine-worker; create them so Docker doesn't
# auto-create them as root. Empty on a fresh host until you rsync real data
# in (deploy/DEPLOY.md section 2) — engine_refresh is allowed to no-op until then.
mkdir -p engine/data engine/outputs engine/logs engine/submission engine/reports
mkdir -p backend/staticfiles backend/media backend/var/locks

echo "== build + up =="
docker compose up -d --build

echo "== waiting for backend to become healthy =="
tries=0
until [ "$(docker compose ps --format '{{.Health}}' backend 2>/dev/null)" = "healthy" ]; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
        echo "backend never became healthy — check: docker compose logs backend" >&2
        exit 1
    fi
    sleep 2
done

cat <<'NEXT'

ClauseChain is up:
  http://localhost/            (frontend, via nginx)
  http://localhost/api/        (backend API, via nginx)

Remaining manual steps (same as deploy/DEPLOY.md for the bare-metal path):
  1. Create an admin user:
       docker compose exec backend python manage.py createsuperuser
  2. Load real engine data (fresh hosts start empty):
       rsync -az engine/{data,outputs,logs,submission,reports} <this host>:/path/to/ClauseChain/engine/
       docker compose exec backend python manage.py engine_refresh
  3. Acceptance checks:
       docker compose exec engine-worker sh -c 'cd /srv/clausechain/engine && .venv/bin/python -m pytest tests -q'
       curl -s -o /dev/null -w '%{http_code}\n' http://localhost/api/auth/user/   # expect 401

Logs:    docker compose logs -f [service]
Stop:    docker compose down
Reset:   docker compose down -v   (also wipes postgres/redis data volumes)
NEXT
