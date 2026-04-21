#!/bin/bash

# Deploy Air Admin to Oracle Cloud Server
# Usage: bash oracle/scripts/deploy-admin.sh

SERVER_IP="161.33.204.39"
SERVER_USER="ubuntu"
SSH_KEY="oracle/.ssh/oracle-arm.key"
APP_NAME="air-admin"
APP_PATH="/home/ubuntu/apps/air"
ADMIN_PORT=3201

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Deploy Air Admin ===${NC}"

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    echo "Run from project root: bash oracle/scripts/deploy-admin.sh"
    exit 1
fi

# Push to GitHub first
echo -e "${GREEN}Pushing to GitHub...${NC}"
git push origin master

echo ""
echo -e "${GREEN}Deploying admin to server...${NC}"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" << DEPLOY
set -e
cd ${APP_PATH}

echo "=== Pulling latest code ==="
git pull

echo "=== Installing dependencies ==="
npm install

echo "=== Generating Prisma clients ==="
npx prisma generate --schema=prisma/schema.prisma

echo "=== Running migrations ==="
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "=== Setting up admin .env ==="
if [ ! -f apps/admin/.env ]; then
    # Copy DB URL from web app, use separate session secret
    DB_URL=\$(grep DATABASE_URL .env | head -1)
    cat > apps/admin/.env << ENVEOF
\${DB_URL}
SESSION_SECRET="\$(openssl rand -hex 32)"
NODE_ENV=production
PORT=${ADMIN_PORT}
ENVEOF
    echo "Created apps/admin/.env"
else
    echo "apps/admin/.env already exists"
fi

echo "=== Building admin app ==="
npm run build:admin

echo "=== Starting/Reloading PM2 ==="
if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
    pm2 reload ${APP_NAME}
else
    cd apps/admin
    pm2 start npm --name "${APP_NAME}" -- start
    cd ${APP_PATH}
fi
pm2 save

echo ""
echo "=== Opening firewall port ${ADMIN_PORT} ==="
sudo iptables -C INPUT -p tcp --dport ${ADMIN_PORT} -j ACCEPT 2>/dev/null || {
    sudo iptables -I INPUT -p tcp --dport ${ADMIN_PORT} -j ACCEPT
    sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null
    echo "Firewall rule added"
}

echo ""
echo "=== Status ==="
pm2 list | grep ${APP_NAME}

DEPLOY

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Admin app deployed to https://air-admin.lightepic.com${NC}"
else
    echo ""
    echo -e "${RED}✗ Deploy failed${NC}"
    exit 1
fi
