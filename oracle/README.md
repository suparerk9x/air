# Air — Oracle Cloud Deployment

Deployment configuration for **Air** (Airbnb Co-host Property & Calendar Management) on Oracle Cloud ARM server.

## Quick Info

| Key | Value |
|-----|-------|
| URL | https://air.lightepic.com |
| Server | 161.33.204.39 (Oracle Cloud ARM) |
| PM2 Name | `air` |
| Port | 3200 |
| Database | PostgreSQL `air` on `docker-db_postgres-1` |
| Repo | https://github.com/suparerk9x/air |
| Path on server | `/home/ubuntu/apps/air` |

## SSH Connection

```bash
ssh -i <path-to>/oracle-arm.key ubuntu@161.33.204.39
```

SSH key locations (any of these work):
- `d:\Antigravity\Agentic-Enterprise\.ssh\oracle-arm.key`
- `d:\Antigravity\Lumitra\oracle\.ssh\oracle-arm.key`
- `d:\Antigravity\Super Richy\.ssh\oracle-arm.key`

## Deploy

```bash
SSH_KEY="<path-to>/oracle-arm.key"
ssh -i "$SSH_KEY" ubuntu@161.33.204.39 << 'DEPLOY'
cd /home/ubuntu/apps/air
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 reload air
pm2 save
DEPLOY
```

## Environment (.env on server)

```
DATABASE_URL="postgresql://postgres:<password>@172.18.0.8:5432/air"
NODE_ENV=production
PORT=3200
SESSION_SECRET="<secret>"
```

## Architecture

- **Framework:** Next.js 16 (App Router)
- **Auth:** JWT sessions with `jose`, HttpOnly cookies
- **ORM:** Prisma (PostgreSQL)
- **Proxy:** Nginx Proxy Manager → `172.17.0.1:3200`
- **SSL:** Wildcard `*.lightepic.com` certificate (Cloudflare)
- **Firewall:** iptables rule for port 3200 required

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
# Connect to database
ssh -i "$SSH_KEY" ubuntu@161.33.204.39
docker exec -it docker-db_postgres-1 psql -U postgres -d air

# Backup
docker exec docker-db_postgres-1 pg_dump -U postgres air > air-backup-$(date +%Y%m%d).sql
```

## PM2 Commands

```bash
pm2 list | grep air       # Status
pm2 logs air --lines 50   # Logs
pm2 reload air             # Zero-downtime reload
pm2 restart air            # Hard restart
pm2 stop air               # Stop
pm2 delete air             # Remove
```

## Seed Demo Data

```bash
curl -X POST https://air.lightepic.com/api/seed
# Credentials: demo@air.local / demo123
```

## Troubleshooting

**502 Bad Gateway:**
```bash
# Check if app is running
pm2 list | grep air

# Check if port is open from NPM container
docker exec nginx-proxy-manager python3 -c "
import urllib.request
r = urllib.request.urlopen('http://172.17.0.1:3200/', timeout=3)
print('Status:', r.status)
"

# If not reachable, add iptables rule
sudo iptables -I INPUT -p tcp --dport 3200 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null
```

**Database connection error:**
```bash
# Check PostgreSQL container is running
docker ps | grep postgres

# Test connection
docker exec docker-db_postgres-1 psql -U postgres -c "SELECT 1" air
```

## Deployed: 2026-04-20
