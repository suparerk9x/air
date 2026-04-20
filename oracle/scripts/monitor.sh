#!/bin/bash

# Monitor Air on Oracle Cloud Server
# Usage: bash oracle/scripts/monitor.sh

SERVER_IP="161.33.204.39"
SERVER_USER="ubuntu"
SSH_KEY="oracle/.ssh/oracle-arm.key"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Air Server Status ===${NC}"
echo "Time: $(date)"
echo ""

if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo "Run from project root: bash oracle/scripts/monitor.sh"
    exit 1
fi

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" << 'EOF'

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== Air App ===${NC}"
pm2 list | grep -E "id|air"
echo ""

echo -e "${GREEN}=== Resources ===${NC}"
echo "Disk:"
df -h / | awk 'NR==2 {printf "  Used: %s / %s (%s)\n", $3, $2, $5}'
echo "Memory:"
free -h | awk '/Mem/ {printf "  Used: %s / %s\n", $3, $2}'
echo "Uptime:"
uptime -p
echo ""

echo -e "${GREEN}=== Database ===${NC}"
docker exec docker-db_postgres-1 psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('air')) as db_size;" -t 2>/dev/null | xargs echo "  Air DB size:"
echo ""

echo -e "${GREEN}=== Health Check ===${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3200/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  App: ${GREEN}✓ Online (HTTP $HTTP_CODE)${NC}"
else
    echo "  App: ✗ Error (HTTP $HTTP_CODE)"
fi
echo ""

echo -e "${GREEN}=== Recent Logs (last 10 lines) ===${NC}"
pm2 logs air --lines 10 --nostream 2>/dev/null

EOF
