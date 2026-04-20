#!/bin/bash

# Air — Deploy to Oracle Cloud Server
# Usage: bash oracle/deploy.sh

SERVER_IP="161.33.204.39"
SERVER_USER="ubuntu"
APP_NAME="air"
APP_PATH="/home/ubuntu/apps/air"

# Find SSH key
for KEY in \
  "../Agentic-Enterprise/.ssh/oracle-arm.key" \
  "../Lumitra/oracle/.ssh/oracle-arm.key" \
  "../Super Richy/.ssh/oracle-arm.key"; do
  if [ -f "$KEY" ]; then
    SSH_KEY="$KEY"
    break
  fi
done

if [ -z "$SSH_KEY" ]; then
  echo "Error: SSH key not found"
  exit 1
fi

echo "Deploying $APP_NAME to $SERVER_IP..."
echo "Using SSH key: $SSH_KEY"

# Push to GitHub first
git push origin master

# Deploy on server
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
echo "=== Deploy complete ==="
pm2 list | grep ${APP_NAME}
DEPLOY

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Deployed successfully to https://air.lightepic.com"
else
  echo ""
  echo "✗ Deploy failed"
  exit 1
fi
