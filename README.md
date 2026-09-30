# ClauseChain - Production Deployment Guide

This guide provides instructions on how to bring up the full containerized stack for ClauseChain in a production or self-contained environment using Docker Compose.

## One-Command Startup (Linux & macOS)

The easiest way to start the entire stack is by using the provided `start.sh` script. This script automatically handles Docker installation (if missing), `.env` creation, secret generation, port checking, and starting the containers.

**Run the following command in your terminal:**

```bash
./start.sh
```

**What this script does:**
1. Checks for Docker and Docker Compose (installs Docker if missing on Linux).
2. Checks if port 80 is available.
3. Creates a `.env` file from `.env.example` and securely generates required secrets (`DJANGO_SECRET_KEY`, `JWT_SIGNING_KEY`, `POSTGRES_PASSWORD`).
4. Creates necessary volume directories for the engine.
5. Builds and starts the Docker Compose stack (`docker-compose.yml`) in the background.
6. Waits for the backend service to become healthy.

---

## Startup on Windows

For Windows, the `start.sh` script is not natively supported by the standard command prompt or PowerShell. You have two options:

### Option 1: Using WSL (Windows Subsystem for Linux) or Git Bash (Recommended)

If you have WSL or Git Bash installed with Docker Desktop configured to use them:

1. Open your WSL terminal or Git Bash.
2. Navigate to the project directory.
3. Run the script just like on Linux:
   ```bash
   ./start.sh
   ```

### Option 2: Manual Startup (PowerShell / Command Prompt)

If you prefer to run it manually without a bash emulator, follow these steps:

1. **Install Docker Desktop** for Windows and ensure it is running.
2. **Create the `.env` file:**
   - Copy `.env.example` and rename it to `.env`.
   - Open `.env` and replace `__CHANGE_ME__` for `DJANGO_SECRET_KEY`, `JWT_SIGNING_KEY`, and `POSTGRES_PASSWORD` with secure random strings.
3. **Create required directories:**
   Run the following commands to create the required empty directories (to prevent Docker from creating them as root):
   ```powershell
   mkdir -p engine/data engine/outputs engine/logs engine/submission engine/reports
   mkdir -p backend/staticfiles backend/media backend/var/locks
   ```
4. **Start the stack:**
   ```powershell
   docker compose up -d --build
   ```

---

## Post-Startup Manual Steps (All Platforms)

Once the stack is successfully up and running, you can access the application at:
- **Frontend**: `http://localhost/`
- **Backend API**: `http://localhost/api/`

You must complete the following manual steps to finalize the setup:

1. **Create an admin user:**
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

2. **Load real engine data (fresh hosts start empty):**
   Copy your data from the engine into the respective folders.
   ```bash
   # Example using rsync (if transferring from another machine)
   rsync -az engine/{data,outputs,logs,submission,reports} <this host>:/path/to/ClauseChain/engine/
   
   # After data is populated, refresh the engine via the backend
   docker compose exec backend python manage.py engine_refresh
   ```

3. **Acceptance checks:**
   Run tests to verify the engine:
   ```bash
   docker compose exec engine-worker sh -c 'cd /srv/clausechain/engine && .venv/bin/python -m pytest tests -q'
   ```
   Verify the API is secure (expect a 401 Unauthorized response):
   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' http://localhost/api/auth/user/
   ```

---

## Useful Docker Commands

- **View Logs**: `docker compose logs -f [service_name]` (e.g., `docker compose logs -f backend`)
- **Stop Stack**: `docker compose down`
- **Reset Stack (Wipes DB & Redis)**: `docker compose down -v`

> **Note on Docker Compose Multiple Files:**
> Be cautious when using docker compose commands in this directory if both the production and dev stacks are running. Always ensure you are targeting the correct project (by default, `docker-compose.yml` is used) or check `docker ps` to verify running containers to avoid accidental recreations of live databases.
