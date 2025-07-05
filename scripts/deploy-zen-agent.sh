#!/bin/bash

# Deploy Zen AI Agent (Eliza Framework)
# This script sets up a production-ready Zen AI agent

set -e

echo "🌬️ Deploying Zen AI Breathing Coach..."

# Configuration
AGENT_DIR="zen-agent-production"
REPO_URL="https://github.com/ai16z/eliza.git"

# Check if we want to use the existing temp directory or create fresh
read -p "Use existing eliza-agent-temp directory? (y/n): " use_existing

if [ "$use_existing" = "y" ] && [ -d "../eliza-agent-temp" ]; then
    echo "📁 Using existing eliza-agent-temp directory..."
    AGENT_DIR="../eliza-agent-temp"
else
    echo "📥 Cloning fresh Eliza repository..."
    
    # Clean up if exists
    if [ -d "$AGENT_DIR" ]; then
        rm -rf "$AGENT_DIR"
    fi
    
    # Clone Eliza
    git clone "$REPO_URL" "$AGENT_DIR"
    cd "$AGENT_DIR"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    pnpm install
    
    # Copy our Zen components
    echo "🤖 Installing Zen components..."
    cp ../src/ai-agent/zen-character.json ./characters/breathing-coach.character.json
    cp -r ../src/ai-agent/breathing-pattern-plugin ./packages/
    
    cd ..
fi

# Navigate to agent directory
cd "$AGENT_DIR"

# Build the breathing pattern plugin
echo "🔨 Building breathing pattern plugin..."
cd packages/breathing-pattern-plugin
pnpm build
cd ../..

# Set up environment
echo "⚙️ Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - FLOW_PRIVATE_KEY"
    echo "   - STORY_PRIVATE_KEY"
    echo "   - LENS_API_KEY"
    echo ""
    read -p "Press enter when you've configured .env..."
fi

# Test the agent
echo "🧪 Testing Zen agent..."
if node test-zen-simple.js; then
    echo "✅ Zen agent test passed!"
else
    echo "❌ Zen agent test failed. Please check configuration."
    exit 1
fi

# Create startup script
echo "📝 Creating startup script..."
cat > start-zen-production.sh << 'EOF'
#!/bin/bash

echo "🌬️ Starting Zen AI Breathing Coach..."

# Check environment
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please configure environment variables."
    exit 1
fi

# Start the agent
cd agent
pnpm start --character="../characters/breathing-coach.character.json"
EOF

chmod +x start-zen-production.sh

# Create Docker setup (optional)
echo "🐳 Creating Docker configuration..."
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/breathing-pattern-plugin/package.json ./packages/breathing-pattern-plugin/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY . .

# Build plugin
RUN cd packages/breathing-pattern-plugin && pnpm build

# Expose port
EXPOSE 3000

# Start command
CMD ["pnpm", "start", "--character=./characters/breathing-coach.character.json"]
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  zen-agent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
EOF

echo ""
echo "🎉 Zen AI Agent deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure .env with your API keys"
echo "2. Test: ./start-zen-production.sh"
echo "3. Deploy: docker-compose up -d (optional)"
echo ""
echo "🔗 Integration options:"
echo "- Full agent: Use this Eliza setup"
echo "- API integration: Use components in src/ai-agent/"
echo "- Custom integration: Import breathing-pattern-plugin"
echo ""
echo "📚 Documentation: See src/ai-agent/README.md"
