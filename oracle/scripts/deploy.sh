#!/bin/bash

# Deploy Air to Oracle Cloud Server
# Usage: bash oracle/scripts/deploy.sh

SERVER_IP="161.33.204.39"
SERVER_USER="ubuntu"
SSH_KEY="oracle/.ssh/oracle-arm.key"
APP_NAME="air"
APP_PATH="/home/ubuntu/apps/air"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Deploy Air ===${NC}"

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    echo "Run from project root: bash oracle/scripts/deploy.sh"
    exit 1
fi

# Push to GitHub first
echo -e "${GREEN}Pushing to GitHub...${NC}"
git push origin master

echo ""
echo -e "${GREEN}Deploying to server...${NC}"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" << DEPLOY
set -e
cd ${APP_PATH}

echo "=== Pulling latest code ==="
git pull

echo "=== Installing dependencies ==="
npm install

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== Running migrations ==="
npx prisma migrate deploy

echo "=== Building ==="
npm run build

echo "=== Reloading PM2 ==="
pm2 reload ${APP_NAME}
pm2 save

echo ""
echo "=== Status ==="
pm2 list | grep ${APP_NAME}
DEPLOY

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Deployed successfully to https://air.lightepic.com${NC}"
else
    echo ""
    echo -e "${RED}✗ Deploy failed${NC}"
    exit 1
fi
