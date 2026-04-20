#!/bin/bash

# Backup Air database from Oracle Cloud Server
# Usage: bash oracle/scripts/backup.sh

SERVER_IP="161.33.204.39"
SERVER_USER="ubuntu"
SSH_KEY="oracle/.ssh/oracle-arm.key"
LOCAL_BACKUP_DIR="oracle/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="air"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== Air Database Backup ===${NC}"
echo "Date: $(date)"
echo ""

if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo "Run from project root: bash oracle/scripts/backup.sh"
    exit 1
fi

mkdir -p "$LOCAL_BACKUP_DIR"

echo -e "${GREEN}Creating database backup on server...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" << EOF
    docker exec docker-db_postgres-1 pg_dump -U postgres ${DB_NAME} > /tmp/air-${DATE}.sql
    echo "Backup created: /tmp/air-${DATE}.sql"
    ls -lh /tmp/air-${DATE}.sql
EOF

echo ""
echo -e "${GREEN}Downloading backup...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    "${SERVER_USER}@${SERVER_IP}:/tmp/air-${DATE}.sql" \
    "$LOCAL_BACKUP_DIR/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup saved: ${LOCAL_BACKUP_DIR}/air-${DATE}.sql${NC}"
    du -sh "$LOCAL_BACKUP_DIR/air-${DATE}.sql"

    # Cleanup remote temp
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "rm /tmp/air-${DATE}.sql"

    # Keep only last 7 backups locally
    ls -t "$LOCAL_BACKUP_DIR"/air-*.sql 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null
else
    echo -e "${YELLOW}Warning: Failed to download backup${NC}"
fi
