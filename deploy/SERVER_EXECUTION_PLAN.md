# Server Execution Plan — 103.157.135.253:2233 (AlmaLinux 8.10)

## Survey findings (19 Jul)
- 16 cores · 31 GB RAM · **328 GB free** · SELinux **Disabled** (no boolean/context work needed) · glibc 2.28
- **DNS: clausechain.zai.bd already resolves to this server** ✅ — TLS can issue immediately
- **The old Docker deployment is live here**: docker swarm (ports 2377/7946) with containers bound to **80, 443, 3000** via docker-proxy. These block nginx + Next.js.
- Nothing else running beyond stock services (sshd on 2233, chronyd, firewalld). No panels.

## Step 0 — Removals (authorized: "no production-grade apps")
1. `docker stack ls` / `docker ps` — record what runs (evidence in the log), then:
2. `docker swarm leave --force` · stop+disable `docker.service` + `containerd.service` (leave packages installed, harmless) — frees 80/443/3000/2377/7946.
3. Nothing else identified for removal.

## Step 1 — Base (dnf)
`dnf install -y nginx python3.12 python3.12-devel git rsync tar` · EPEL + `certbot python3-certbot-nginx` · firewalld: open 80/443 (`--permanent`, reload). **Node 24**: try NodeSource el8 rpm; glibc 2.28 is the floor — if the rpm refuses, fall back to official tarball into `/usr/local/node24`; last resort: build the frontend on the Mac and rsync the standalone `.next` build. Verified live, choice recorded here afterwards.

## Step 2 — Users & layout
`deploy` (sudo, my key) + `clausechain-engine` (no login) service user. Clone repo → `/srv/clausechain`. Continue as `deploy`, not root.

## Step 3 — Data (long pole; started first in practice)
From the Mac: `rsync -az -e "ssh -p 2233" engine/{data,outputs,logs,submission,reports} …:/srv/clausechain/engine/` (~3.1 GB). Free-space check (≥8 GB ✅ 328 G), file-count + 5-hash spot verification per DEPLOY.md.

## Step 4 — Envs & apps
Engine venv (python3.12) + engine `.env` (OpenAI, OCR VM, `GRAPH_BACKEND=sqlite`, spend cap; 600). Backend venv + gunicorn; backend `.env` (fresh `DJANGO_SECRET_KEY`/`JWT_SIGNING_KEY` generated ON the server, `DB_ENGINE=postgresql` **only if** Postgres is provisioned tonight — otherwise start on sqlite exactly as D0 locked, Postgres lands with D8), `TRUST_X_FORWARDED_PROTO=1`, `ENGINE_ROOT`, `WORKSPACE_LOCK_DIR`; `migrate` + `createsuperuser` + reviewer accounts + `collectstatic`. Frontend `.env` + `npm ci && npm run build`.

## Step 5 — Services & TLS
Install the three systemd units (api :8001 / web :3000 / engine worker) + targeted ownership (code read-only; write dirs to service users per DEPLOY.md). nginx site (the `/proof/` alias is now optional — D4 serves proofs authenticated through Django; alias removed). `nginx -t` → enable → `certbot --nginx -d clausechain.zai.bd`.

## Step 6 — Acceptance (reported back in chat)
1. `pytest engine/tests -q` on the server → **112+ green**
2. `champion_validate.py` runs (FAIL list = pending approvals only)
3. https login works; `/review` renders real queues; one decision POST → `decisions.json` changes on disk with matching receipt hash
4. Admin-triggered `engine_refresh` through the worker completes
5. Backup cron: nightly tar of `engine/data/review`, `engine/submission`, DB → `/srv/backups` (Rev C)

## Rollback
Stop the three units, `systemctl start docker` — the old stack returns as it was. Nothing in Step 0 uninstalls anything.
