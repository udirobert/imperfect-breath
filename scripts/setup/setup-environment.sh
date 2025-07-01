#!/bin/bash

# Imperfect Breath - Secure Environment Setup Script
# This script helps securely configure your development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo "🌬️  Imperfect Breath - Environment Setup"
echo "========================================"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure random key
generate_secure_key() {
    openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32
}

# Function to validate environment variables
validate_env_var() {
    local var_name=$1
    local var_value=$2
    local required=${3:-false}

    if [ "$required" = true ] && [ -z "$var_value" ]; then
        echo -e "${RED}❌ Required variable $var_name is not set${NC}"
        return 1
    elif [ -n "$var_value" ]; then
        echo -e "${GREEN}✅ $var_name is configured${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $var_name is optional and not set${NC}"
        return 0
    fi
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
echo -e "${GREEN}✅ npm $(npm --version) found${NC}"

# Check for Flow CLI
if command_exists flow; then
    echo -e "${GREEN}✅ Flow CLI $(flow version | head -1) found${NC}"
else
    echo -e "${YELLOW}⚠️  Flow CLI not found. Install it from: https://developers.flow.com/tools/flow-cli/install${NC}"
fi

echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}🔧 .env file already exists${NC}"
    read -p "Do you want to backup and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ Backed up existing .env file${NC}"
    else
        echo -e "${BLUE}💡 Continuing with existing .env file${NC}"
        echo -e "${YELLOW}💡 You can manually update it using .env.example as reference${NC}"
        echo ""
        echo -e "${BLUE}📋 To validate your current environment:${NC}"
        echo "   source .env && ./scripts/setup/validate-environment.sh"
        exit 0
    fi
fi

echo -e "${BLUE}🚀 Setting up environment configuration...${NC}"

# Create .env file from template
if [ ! -f ".env.example" ]; then
    echo -e "${RED}❌ .env.example not found. Please ensure it exists first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Creating .env file from template...${NC}"
cp .env.example .env

echo ""
echo -e "${PURPLE}🔧 FLOW BLOCKCHAIN CONFIGURATION${NC}"
echo "=================================="

# Set up Flow configuration
echo -e "${BLUE}Current deployed contract address: 0xb8404e09b36b6623${NC}"
read -p "Use this address? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    CONTRACT_ADDRESS="0xb8404e09b36b6623"
else
    read -p "Enter your contract address: " CONTRACT_ADDRESS
    if [[ ! $CONTRACT_ADDRESS =~ ^0x[a-fA-F0-9]{16}$ ]]; then
        echo -e "${RED}❌ Invalid contract address format${NC}"
        exit 1
    fi
fi

# Update Flow configuration in .env
sed -i.bak "s/VITE_IMPERFECT_BREATH_ADDRESS=.*/VITE_IMPERFECT_BREATH_ADDRESS=$CONTRACT_ADDRESS/" .env
echo -e "${GREEN}✅ Flow contract address configured${NC}"

echo ""
echo -e "${PURPLE}🗄️  SUPABASE CONFIGURATION${NC}"
echo "============================"

read -p "Do you have a Supabase project? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Supabase URL: " SUPABASE_URL
    read -p "Enter your Supabase Anon Key: " SUPABASE_KEY

    sed -i.bak "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|" .env
    sed -i.bak "s/VITE_SUPABASE_ANON_KEY=.*/VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY/" .env
    echo -e "${GREEN}✅ Supabase configuration updated${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping Supabase setup. You can configure it later.${NC}"
    echo -e "${BLUE}💡 Visit https://supabase.com to create a project${NC}"
fi

echo ""
echo -e "${PURPLE}🤖 AI SERVICES CONFIGURATION${NC}"
echo "============================="

read -p "Do you have a Google Gemini API key? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -s -p "Enter your Google Gemini API key: " GEMINI_KEY
    echo
    sed -i.bak "s/VITE_GOOGLE_GEMINI_API_KEY=.*/VITE_GOOGLE_GEMINI_API_KEY=$GEMINI_KEY/" .env
    echo -e "${GREEN}✅ Google Gemini API key configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping AI setup. You can configure it later.${NC}"
    echo -e "${BLUE}💡 Visit https://makersuite.google.com/app/apikey to get an API key${NC}"
fi

echo ""
echo -e "${PURPLE}📱 DEVELOPMENT CONFIGURATION${NC}"
echo "============================="

# Set development environment
sed -i.bak "s/NODE_ENV=.*/NODE_ENV=development/" .env
sed -i.bak "s/VITE_DEBUG=.*/VITE_DEBUG=true/" .env

echo -e "${GREEN}✅ Development environment configured${NC}"

# Clean up backup files
rm -f .env.bak

echo ""
echo -e "${BLUE}🔒 SECURITY SETUP${NC}"
echo "================="

# Set proper file permissions
chmod 600 .env
echo -e "${GREEN}✅ Set secure permissions on .env file${NC}"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
# Local development overrides
# This file is gitignored and safe for local secrets

# Local development server
VITE_APP_URL=http://localhost:8080
EOF
    chmod 600 .env.local
    echo -e "${GREEN}✅ Created .env.local for local overrides${NC}"
fi

echo ""
echo -e "${YELLOW}🧪 VALIDATING CONFIGURATION${NC}"
echo "============================"

# Source the new environment
set -o allexport
source .env
set +o allexport

# Validate required variables
VALIDATION_ERRORS=0

validate_env_var "VITE_FLOW_NETWORK" "$VITE_FLOW_NETWORK" true || ((VALIDATION_ERRORS++))
validate_env_var "VITE_FLOW_ACCESS_API" "$VITE_FLOW_ACCESS_API" true || ((VALIDATION_ERRORS++))
validate_env_var "VITE_IMPERFECT_BREATH_ADDRESS" "$VITE_IMPERFECT_BREATH_ADDRESS" true || ((VALIDATION_ERRORS++))
validate_env_var "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL" false
validate_env_var "VITE_GOOGLE_GEMINI_API_KEY" "$VITE_GOOGLE_GEMINI_API_KEY" false

echo ""
if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Environment setup completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Setup completed with $VALIDATION_ERRORS validation warnings${NC}"
    echo -e "${YELLOW}💡 You can fix these later by editing .env manually${NC}"
fi

echo ""
echo -e "${BLUE}📋 NEXT STEPS${NC}"
echo "============="
echo "1. Install dependencies: npm install"
echo "2. Start development server: npm run dev"
echo "3. Test Flow integration: npm run test:flow"
echo "4. Deploy to staging: npm run deploy:staging"
echo ""
echo -e "${PURPLE}🔐 SECURITY REMINDERS${NC}"
echo "===================="
echo "• Never commit .env files to git"
echo "• Rotate API keys regularly"
echo "• Use different keys for different environments"
echo "• Monitor API usage and costs"
echo "• Keep your private keys secure"
echo ""
echo -e "${GREEN}✨ Happy building! May your code flow as smoothly as your breath! 🌬️${NC}"

# Create validation script reference
cat > validate-env.sh << 'EOF'
#!/bin/bash
# Quick environment validation
source .env 2>/dev/null || { echo "❌ .env file not found"; exit 1; }
echo "✅ Environment loaded successfully"
echo "📋 Key configurations:"
echo "   Flow Network: $VITE_FLOW_NETWORK"
echo "   Contract: $VITE_IMPERFECT_BREATH_ADDRESS"
echo "   Debug Mode: $VITE_DEBUG"
EOF

chmod +x validate-env.sh
echo -e "${BLUE}💡 Created validate-env.sh for quick environment checks${NC}"
