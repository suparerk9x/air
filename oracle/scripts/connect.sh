#!/bin/bash

# SSH Connection to Oracle Cloud Server
# Usage: bash oracle/scripts/connect.sh

SERVER_IP="161.33.204.39"
SERVER_USER="ubuntu"
SSH_KEY="oracle/.ssh/oracle-arm.key"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Oracle Cloud Server ===${NC}"
echo -e "${GREEN}Connecting to ${SERVER_USER}@${SERVER_IP}...${NC}"
echo ""

if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo "Run from project root: bash oracle/scripts/connect.sh"
    exit 1
fi

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}"
