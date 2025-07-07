#!/bin/bash

# =================================================================
# Environment Check Script for Story Aeneid Integration
# =================================================================

echo "============================================================"
echo "Checking environment for Story Aeneid Testnet integration"
echo "============================================================"

# Check if Node.js is installed
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js is installed (Version: $NODE_VERSION)"
else
    echo "❌ Node.js is not installed. Please install Node.js before proceeding."
    exit 1
fi

# Check if npm is installed
echo "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm is installed (Version: $NPM_VERSION)"
else
    echo "❌ npm is not installed. Please install npm before proceeding."
    exit 1
fi

# Check for required files
echo "Checking for required files..."

# Check for package.json in project root
if [ -f "package.json" ]; then
    echo "✅ Project package.json found"
else
    echo "❌ Project package.json not found. Are you in the correct directory?"
    exit 1
fi

# Check for server files
if [ -d "server" ]; then
    echo "✅ Server directory found"
else
    echo "❌ Server directory not found. Are you in the correct directory?"
    exit 1
fi

if [ -f "server/package.json" ]; then
    echo "✅ Server package.json found"
else
    echo "❌ Server package.json not found. The server setup might be incomplete."
    exit 1
fi

if [ -f "server/server.js" ]; then
    echo "✅ Server main file found"
else
    echo "❌ server.js not found. The server setup might be incomplete."
    exit 1
fi

# Check for environment files
echo "Checking environment files..."

if [ -f ".env.aeneid.example" ]; then
    echo "✅ Aeneid environment example file found"
else
    echo "❌ .env.aeneid.example not found. The setup might be incomplete."
    exit 1
fi

# Check for actual environment files
if [ -f ".env" ]; then
    echo "✅ Server environment file (.env) found"
else
    echo "⚠️ Server environment file (.env) not found. It will be created by the setup script."
fi

if [ -f ".env.local" ]; then
    echo "✅ Client environment file (.env.local) found"
else
    echo "⚠️ Client environment file (.env.local) not found. It will be created by the setup script."
fi

# Check for environment variables in existing .env file
if [ -f ".env" ]; then
    echo "Checking server environment variables..."
    
    # Check PRIVATE_KEY
    if grep -q "PRIVATE_KEY=" .env && ! grep -q "PRIVATE_KEY=your_private_key_here" .env; then
        echo "✅ PRIVATE_KEY is configured"
    else
        echo "⚠️ PRIVATE_KEY is not properly configured in .env. You'll need to set this manually."
    fi
    
    # Check RPC_URL
    if grep -q "RPC_URL=" .env; then
        echo "✅ RPC_URL is present"
    else
        echo "⚠️ RPC_URL is missing in .env"
    fi
    
    # Check CHAIN_ID
    if grep -q "CHAIN_ID=" .env; then
        echo "✅ CHAIN_ID is present"
    else
        echo "⚠️ CHAIN_ID is missing in .env"
    fi
fi

# Check for dependencies
echo "Checking for installed dependencies..."

# Check root project dependencies
if [ -d "node_modules" ]; then
    echo "✅ Root project dependencies are installed"
else
    echo "⚠️ Root project dependencies are not installed. The setup script will install them."
fi

# Check server dependencies
if [ -d "server/node_modules" ]; then
    echo "✅ Server dependencies are installed"
    
    # Check for specific critical dependencies
    if [ -d "server/node_modules/express" ]; then
        echo "✅ Express is installed"
    else
        echo "❌ Express is not installed. The server will not function properly."
    fi
    
    if [ -d "server/node_modules/@story-protocol" ]; then
        echo "✅ Story Protocol SDK is installed"
    else
        echo "❌ Story Protocol SDK is not installed. The server will not function properly."
    fi
else
    echo "⚠️ Server dependencies are not installed. The setup script will install them."
fi

echo "============================================================"
echo "Environment check complete!"
echo "============================================================"

# Provide next steps based on the check results
echo "Next steps:"
if [ ! -f ".env" ] || [ ! -d "server/node_modules" ]; then
    echo "1. Run the setup script: ./setup-and-run.sh"
    echo "2. In a new terminal, start the frontend: npm run dev"
else
    echo "1. Start the server: ./start-server.sh"
    echo "2. In a new terminal, start the frontend: npm run dev"
fi
echo "============================================================"