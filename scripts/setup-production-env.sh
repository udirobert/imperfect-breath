#!/bin/bash

# Production Environment Setup Script
# Sets up environment variables on Hetzner server

echo "🔐 Setting up Production Environment Variables"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Server configuration
SERVER_HOST="157.180.36.156"
SERVER_USER="root"

print_info "Setting up environment variables on $SERVER_HOST"

# Create environment file on server
ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
# Create production environment file
cat > /opt/vision-service/.env << 'ENVFILE'
# Production Environment Variables for Vision Service
# Generated automatically - do not edit manually

# GitHub Webhook Secret (generate a secure random string)
GITHUB_WEBHOOK_SECRET=ImperfectBreath2024!SecureWebhook#Production

# AI API Keys (replace with your production keys)
OPENAI_API_KEY=your_production_openai_api_key_here
ANTHROPIC_API_KEY=your_production_anthropic_api_key_here
GEMINI_API_KEY=your_production_gemini_api_key_here

# Application Environment
APP_ENV=production
DEBUG_MODE=false
ENVFILE

# Set proper permissions
chmod 600 /opt/vision-service/.env
chown root:root /opt/vision-service/.env

echo "✅ Environment file created at /opt/vision-service/.env"
echo "⚠️  Please edit the file and add your actual API keys:"
echo "   nano /opt/vision-service/.env"
EOF

# Update docker-compose to use environment file
ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
cd /opt/vision-service

# Backup current docker-compose
cp docker-compose.yml docker-compose.yml.backup

# Update docker-compose to include environment file
if ! grep -q "env_file:" docker-compose.yml; then
    # Add env_file to vision-service
    sed -i '/vision-service:/,/^[[:space:]]*[^[:space:]]/ {
        /environment:/i\    env_file:\
        /environment:/i\      - .env
    }' docker-compose.yml
    
    echo "✅ Updated docker-compose.yml to use .env file"
else
    echo "ℹ️  docker-compose.yml already configured for .env file"
fi
EOF

print_status "Environment setup completed!"

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Edit the environment file with your actual API keys:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'nano /opt/vision-service/.env'"
echo ""
echo "2. Restart the vision service:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'cd /opt/vision-service && sudo docker-compose restart'"
echo ""
echo "3. Test the webhook endpoint:"
echo "   curl http://$SERVER_HOST:8001/webhook/github"
echo ""
echo "🔐 Security Note:"
echo "The .env file is created with 600 permissions (owner read/write only)"