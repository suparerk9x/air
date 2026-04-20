# Air — Oracle Cloud Deployment

Deployment configuration for **Air** (Airbnb Co-host Property & Calendar Management) on Oracle Cloud ARM server.

## Quick Info

| Key | Value |
|-----|-------|
| URL | https://air.lightepic.com |
| Server | `161.33.204.39` (Oracle Cloud ARM) |
| PM2 Name | `air` |
| Port | 3200 |
| Database | PostgreSQL `air` on `docker-db_postgres-1` |
| Repo | https://github.com/suparerk9x/air |
| Path on server | `/home/ubuntu/apps/air` |

## File Structure

```
oracle/
├── .gitignore              # Prevents keys/backups from being committed
├── .ssh/
│   └── oracle-arm.key      # SSH private key (git-ignored)
├── scripts/
│   ├── connect.sh           # SSH into the server
│   ├── deploy.sh            # Build & deploy to production
│   ├── backup.sh            # Backup database locally
│   └── monitor.sh           # Check server/app status
├── backups/                 # Local DB backups (git-ignored)
└── README.md                # This file
```

## Scripts

All scripts run from **project root** (`d:\Antigravity\Air`):

| Script | Usage | Description |
|--------|-------|-------------|
| `connect.sh` | `bash oracle/scripts/connect.sh` | SSH into the server |
| `deploy.sh` | `bash oracle/scripts/deploy.sh` | Push to GitHub, pull on server, build, reload PM2 |
| `backup.sh` | `bash oracle/scripts/backup.sh` | Dump `air` database and download to `oracle/backups/` |
| `monitor.sh` | `bash oracle/scripts/monitor.sh` | Show app status, resources, DB size, health check |

## SSH Connection

```bash
# Using the script
bash oracle/scripts/connect.sh

# Or manually
ssh -i oracle/.ssh/oracle-arm.key ubuntu@161.33.204.39
```

The SSH key is at `oracle/.ssh/oracle-arm.key` (git-ignored, never committed).

## Deploy

```bash
# One command
bash oracle/scripts/deploy.sh

# What it does:
# 1. git push origin master
# 2. SSH to server
# 3. git pull → npm install → prisma generate → prisma migrate → npm run build
# 4. pm2 reload air
```

## Environment (.env on server)

```
DATABASE_URL="postgresql://postgres:<password>@172.18.0.8:5432/air"
NODE_ENV=production
PORT=3200
SESSION_SECRET="<secret>"
```

Located at `/home/ubuntu/apps/air/.env` on the server.

## Architecture

- **Framework:** Next.js 16 (App Router)
- **Auth:** JWT sessions with `jose`, HttpOnly cookies
- **ORM:** Prisma (PostgreSQL)
- **Proxy:** Nginx Proxy Manager → `172.17.0.1:3200`
- **SSL:** Wildcard `*.lightepic.com` certificate (Cloudflare)
- **Firewall:** iptables rule for port 3200

## Nginx Proxy Manager

Managed at https://nginx.lightepic.com

| Setting | Value |
|---------|-------|
| Domain | `air.lightepic.com` |
| Scheme | http |
| Forward Host | 172.17.0.1 |
| Forward Port | 3200 |
| SSL | Custom Certificate (lightepic.com wildcard) |
| Force SSL | Yes |
| HTTP/2 | Yes |
| Block Exploits | Yes |
| Websockets | Yes |

## Database

PostgreSQL running in Docker container `docker-db_postgres-1`:

```bash
# Backup (using script)
bash oracle/scripts/backup.sh

# Connect directly
ssh -i oracle/.ssh/oracle-arm.key ubuntu@161.33.204.39
docker exec -it docker-db_postgres-1 psql -U postgres -d air
```

## PM2 Commands (on server)

```bash
pm2 list | grep air        # Status
pm2 logs air --lines 50    # Logs
pm2 reload air              # Zero-downtime reload
pm2 restart air             # Hard restart
pm2 stop air                # Stop
```

## Seed Demo Data

```bash
curl -X POST https://air.lightepic.com/api/seed
# Credentials: demo@air.local / demo123
```

## Troubleshooting

**502 Bad Gateway:**
```bash
# 1. Check if app is running
pm2 list | grep air

# 2. Check if port is reachable from Nginx container
docker exec nginx-proxy-manager python3 -c "
import urllib.request
r = urllib.request.urlopen('http://172.17.0.1:3200/', timeout=3)
print('Status:', r.status)
"

# 3. If not reachable, add iptables rule
sudo iptables -I INPUT -p tcp --dport 3200 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null
```

**Database connection error:**
```bash
docker ps | grep postgres
docker exec docker-db_postgres-1 psql -U postgres -c "SELECT 1" air
```

## Deployed: 2026-04-20
