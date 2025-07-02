#!/bin/bash

# Setup script for Lens Protocol integration
echo "🚀 Setting up Lens Protocol integration..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install required dependencies
echo "📦 Installing Lens Chain and wallet dependencies..."
npm install @lens-chain/storage-client@latest @lens-chain/sdk@latest wagmi@^2.12.0 @wagmi/core@^2.13.0 @wagmi/connectors@^5.1.0

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual values:"
    echo "   - VITE_WALLETCONNECT_PROJECT_ID (get from https://cloud.walletconnect.com)"
    echo "   - Other API keys as needed"
else
    echo "✅ .env file already exists"
fi

# Check for WalletConnect project ID
if ! grep -q "VITE_WALLETCONNECT_PROJECT_ID=" .env; then
    echo "VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here" >> .env
    echo "⚠️  Added WalletConnect project ID placeholder to .env"
fi

echo ""
echo "✅ Lens Protocol integration setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get a WalletConnect Project ID from https://cloud.walletconnect.com"
echo "2. Update VITE_WALLETCONNECT_PROJECT_ID in your .env file"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Test wallet connection on Lens testnet"
echo ""
echo "🔗 Useful links:"
echo "- Lens Protocol Docs: https://docs.lens.xyz/"
echo "- Grove Storage Guide: https://docs.grove.storage/"
echo "- WalletConnect Setup: https://cloud.walletconnect.com/"