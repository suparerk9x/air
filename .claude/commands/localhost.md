Run Air apps locally for development.

Usage: /localhost [target]
- /localhost web — run web app only (port 7660)
- /localhost admin — run admin app only (port 7661)
- /localhost all — run both web and admin (default)

## Instructions

1. Start the SSH tunnel for PostgreSQL (if not already running):
   - Check if port 5433 is already in use: `lsof -i :5433 2>/dev/null || netstat -an | grep 5433`
   - If NOT running, start it: `ssh -L 5433:172.18.0.8:5432 -i oracle/.ssh/oracle-arm.key ubuntu@161.33.204.39 -fN`
2. Determine the target from the argument (default: "all").
3. Run the dev server(s):
   - **web**: `npm run dev --workspace=apps/web` (port 7660)
   - **admin**: `npm run dev --workspace=apps/admin` (port 7661)
   - **all** (default): Run both in parallel using two background Bash commands
4. Report the URLs to the user:
   - Web: http://localhost:7660
   - Admin: http://localhost:7661

Important:
- Run from the project root directory `d:/Antigravity/Air`
- Use `run_in_background: true` for the dev server commands so they don't block
- If a port is already in use, inform the user and suggest killing the existing process
