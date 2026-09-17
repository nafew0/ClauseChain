# ClauseChain backend image — serves both the `backend` (gunicorn API) and
# `engine-worker` (run_engine_worker) compose services from one image, the
# same way DEPLOY.md/bootstrap.sh lay both trees under one /srv/clausechain
# checkout with separate venvs. Build context is the repo root (needs
# engine/ and deploy/ alongside backend/), e.g.:
#   docker build -f backend/Dockerfile -t clausechain-backend .
FROM python:3.12-slim AS runtime

# psycopg2-binary/Pillow ship manylinux wheels; gcc/libpq-dev cover any
# package here that needs to compile from source.
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Mirrors the production layout (App Dev Plan D0): backend, engine and
# deploy/ all live under /srv/clausechain so ENGINE_ROOT / ENGINE_ALLOWLIST
# defaults in clausechain/settings.py resolve without extra env vars.
WORKDIR /srv/clausechain

COPY backend/requirements.txt backend/requirements.txt
# gunicorn isn't in requirements.txt — bootstrap.sh installs it ad hoc onto
# the production venv the same way.
RUN pip install --no-cache-dir -U pip \
    && pip install --no-cache-dir -r backend/requirements.txt gunicorn

COPY engine/requirements.txt engine/requirements.txt
COPY engine/pyproject.toml engine/pyproject.toml
COPY engine/packages engine/packages
COPY engine/scripts engine/scripts
COPY engine/configs engine/configs
COPY engine/tests engine/tests
COPY engine/run.py engine/run.py
# Isolated engine venv, exactly as bootstrap.sh creates on the bare-metal
# host (ENGINE_PYTHON / WORKSPACE_DECISION_WRITER point at .venv/bin/python).
# No editable install: engine scripts/tests are always invoked with
# cwd=ENGINE_ROOT (see engine_worker.py, pyproject's pytest pythonpath=["."]),
# which is how they resolve `packages.*` imports — not a pip-installed package.
RUN python -m venv engine/.venv \
    && engine/.venv/bin/pip install --no-cache-dir -U pip \
    && engine/.venv/bin/pip install --no-cache-dir -r engine/requirements.txt

COPY deploy/engine_allowlist.json deploy/engine_allowlist.json
COPY backend backend

RUN install -d -m 0750 backend/var/locks backend/staticfiles backend/media

WORKDIR /srv/clausechain/backend
EXPOSE 8001

# Waits for Postgres to accept connections, then execs the real CMD (either
# gunicorn, or the engine-worker service's `manage.py run_engine_worker`
# override) — "--" becomes $0 so "$@" below is exactly that CMD.
ENTRYPOINT ["/bin/sh", "-c", "\
    echo \"Waiting for database ${DB_HOST:-localhost}:${DB_PORT:-5432}...\"; \
    tries=0; \
    until python -c \"import socket,os; s=socket.socket(); s.settimeout(2); s.connect((os.environ.get('DB_HOST','localhost'), int(os.environ.get('DB_PORT','5432'))))\" 2>/dev/null; do \
        tries=$((tries + 1)); \
        if [ \"$tries\" -ge 60 ]; then echo 'Database never became reachable - giving up.' >&2; exit 1; fi; \
        sleep 1; \
    done; \
    exec \"$@\"", "--"]

# Overridden by the engine-worker service to run:
#   python manage.py run_engine_worker
CMD ["gunicorn", "clausechain.wsgi:application", "--bind", "0.0.0.0:8001", \
     "--workers", "2", "--threads", "4", "--timeout", "300"]
