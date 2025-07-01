# 🛠️ Imperfect Breath - Development Guide

## Overview

This guide provides comprehensive instructions for developing, testing, and deploying the Imperfect Breath platform. Follow this guide to maintain code quality, security, and operational excellence.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager
- **Flow CLI** - Blockchain interactions
- **Git** - Version control
- **VS Code** (recommended) - Code editor

### Initial Setup
```bash
# Clone the repository
git clone [your-repo-url]
cd imperfect-breath

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment (see Environment Setup below)
# Edit .env with your configuration

# Test Flow integration
npm run test:flow

# Start development server
npm run dev
```

---

## 🔧 Environment Setup

### Environment Variables
The application uses environment variables for configuration. Never commit `.env` files to version control.

#### Required Variables
```bash
# Flow Blockchain Configuration
VITE_FLOW_NETWORK=testnet
VITE_FLOW_ACCESS_API=https://rest-testnet.onflow.org
VITE_IMPERFECT_BREATH_ADDRESS=0xb8404e09b36b6623
VITE_FLOW_DISCOVERY_WALLET=https://fcl-discovery.onflow.org/testnet/authn

# Application
NODE_ENV=development
VITE_DEBUG=true
```

#### Optional Variables
```bash
# Supabase Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Services
VITE_GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here

# Feature Flags
VITE_ENABLE_CAMERA=true
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_SOCIAL_FEATURES=false
```

### Automated Setup
```bash
# Use the setup script for guided configuration
npm run flow:setup

# Validate configuration
npm run flow:validate
```

---

## 🏗️ Project Structure

```
imperfect-breath/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── examples/        # Integration examples
│   │   └── ...
│   ├── lib/                 # Core libraries
│   │   ├── flow/            # Flow blockchain integration
│   │   ├── ai/              # AI services
│   │   └── ...
│   ├── pages/               # Application pages
│   └── hooks/               # Custom React hooks
├── cadence/                 # Flow smart contracts
│   ├── contracts/           # Contract source code
│   ├── transactions/        # Contract transactions
│   └── scripts/             # Read-only scripts
├── scripts/                 # Development scripts
│   ├── setup/               # Environment setup
│   └── deployment/          # Deployment automation
├── docs/                    # Documentation
└── public/                  # Static assets
```

---

## 🔗 Flow Blockchain Integration

### Current Deployment
- **Network:** Flow Testnet
- **Contract Address:** `0xb8404e09b36b6623`
- **Status:** ✅ Live and Verified
- **Explorer:** [View Contract](https://testnet.flowscan.org/account/0xb8404e09b36b6623)

### Contract Features
- ✅ **NFT Minting:** Create breathing pattern NFTs
- ✅ **Collection Management:** Store and organize NFTs
- ✅ **Marketplace:** List and purchase NFTs
- ✅ **Session Logging:** Record breathing session data
- ✅ **Query Operations:** Read contract state

### Development Flow

#### 1. Testing Contract Integration
```bash
# Validate Flow integration
npm run test:flow

# Expected output:
# ✅ Environment Configuration
# ✅ FCL Configuration  
# ✅ Contract Deployment
# ✅ Contract Functions
# ✅ Script Execution
```

#### 2. Connecting to Flow Wallet
```typescript
import { flowConfig } from '@/lib/flow/config';

// Authenticate user
await flowConfig.authenticate();

// Check authentication status
const isAuth = await flowConfig.isAuthenticated();

// Get user address
const address = await flowConfig.getUserAddress();
```

#### 3. Minting NFTs
```typescript
import { flowNFTClient } from '@/lib/flow/nft-client';

// Setup user account (first time only)
await flowNFTClient.setupAccount();

// Mint breathing pattern NFT
const patternData = {
  name: "4-7-8 Breathing",
  description: "Relaxing breathing pattern",
  phases: { inhale: 4, hold: 7, exhale: 8 },
  audioUrl: "https://example.com/audio.mp3" // optional
};

const txId = await flowNFTClient.mintBreathingPattern(patternData);
```

#### 4. Querying Data
```typescript
// Get user's NFT collection
const nftIds = await flowNFTClient.getUserCollection(address);

// Get NFT details
const nftDetails = await flowNFTClient.getNFTDetails(address, nftId);

// Get marketplace listings
const listings = await flowNFTClient.getMarketplaceListings();
```

---

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Test Flow blockchain integration
npm run test:flow

# Test specific contract functions
flow scripts execute cadence/scripts/get_collection_ids.cdc --args-json '[{"type": "Address", "value": "0xb8404e09b36b6623"}]' --network testnet
```

### Manual Testing
```bash
# Start development server
npm run dev

# Open browser to http://localhost:8080
# Navigate to the Flow Integration Example page
# Test wallet connection and NFT operations
```

---

## 🔐 Security Best Practices

### Environment Security
- ✅ Never commit `.env` files
- ✅ Use different API keys per environment
- ✅ Store secrets in secure key management
- ✅ Validate environment on startup
- ✅ Use HTTPS in production

### Code Security
- ✅ Input validation on all user inputs
- ✅ Output sanitization for AI responses
- ✅ XSS prevention measures
- ✅ CSRF protection implemented
- ✅ Dependency vulnerability scanning

### Blockchain Security
- ✅ Private keys never in source code
- ✅ Transaction validation and limits
- ✅ Gas optimization and limits
- ✅ Event monitoring and alerting
- ✅ Multi-signature for critical operations

### Development Security
```bash
# Check for security vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Scan for secrets in code
git secrets --scan

# Run linting for security issues
npm run lint
```

---

## 📦 Building and Deployment

### Development Build
```bash
# Start development server with hot reload
npm run dev

# Build for development (with source maps)
npm run build:dev
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Deployment to Flow Testnet
```bash
# Deploy smart contract to testnet
npm run deploy:testnet

# Follow the interactive prompts:
# 1. Generate keys or use existing wallet
# 2. Fund account via testnet faucet
# 3. Deploy contract
# 4. Verify deployment
```

### Contract Updates
```bash
# Update existing contract deployment
flow project deploy --network testnet --update

# Verify update
npm run test:flow
```

---

## 🛠️ Development Workflow

### Daily Development
1. **Start Development Environment**
   ```bash
   npm run dev
   ```

2. **Validate Changes**
   ```bash
   npm run lint
   npm run test:flow
   ```

3. **Test Contract Interactions**
   - Connect wallet in UI
   - Test NFT minting
   - Verify marketplace functions
   - Check session logging

### Feature Development
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Test**
   - Write code following style guidelines
   - Add comprehensive tests
   - Update documentation
   - Test in multiple environments

3. **Code Review Process**
   - Create pull request
   - Request security review
   - Address feedback
   - Verify all tests pass

4. **Deployment**
   - Merge to main branch
   - Deploy to staging
   - Run integration tests
   - Deploy to production

---

## 🎯 Common Development Tasks

### Adding New Contract Functions
1. **Update Cadence Contract**
   ```cadence
   // Add new function to ImperfectBreath.cdc
   access(all) fun newFunction(): String {
       return "Hello World"
   }
   ```

2. **Update Frontend Client**
   ```typescript
   // Add to FlowNFTClient class
   async callNewFunction(): Promise<string> {
     const script = `
       import ImperfectBreath from ${this.contractAddress}
       access(all) fun main(): String {
         return ImperfectBreath.newFunction()
       }
     `;
     return await fcl.query({ cadence: script });
   }
   ```

3. **Test Integration**
   ```bash
   npm run test:flow
   ```

### Adding New UI Components
1. **Create Component**
   ```typescript
   // src/components/YourComponent.tsx
   import React from 'react';
   import { Button } from '@/components/ui/button';
   
   export default function YourComponent() {
     return <Button>Click me</Button>;
   }
   ```

2. **Add to Example Page**
   ```typescript
   // Import and use in FlowIntegrationExample.tsx
   import YourComponent from '@/components/YourComponent';
   ```

### Environment Configuration
1. **Add New Environment Variable**
   ```bash
   # Add to .env.example
   VITE_NEW_FEATURE_KEY=your_key_here
   
   # Add to your local .env
   VITE_NEW_FEATURE_KEY=actual_key_value
   ```

2. **Update Validation**
   ```typescript
   // Add to flow/config.ts validation
   if (!import.meta.env.VITE_NEW_FEATURE_KEY) {
     errors.push("VITE_NEW_FEATURE_KEY is not configured");
   }
   ```

---

## 🐛 Troubleshooting

### Common Issues

#### Flow Integration Issues
```bash
# Problem: "Contract not found"
# Solution: Verify contract address in .env
npm run flow:validate

# Problem: "Transaction failed"
# Solution: Check account balance and network status
flow accounts get YOUR_ADDRESS --network testnet
```

#### Environment Issues
```bash
# Problem: "Environment variable not found"
# Solution: Check .env file exists and is properly formatted
cat .env | grep VITE_

# Problem: "Permission denied"
# Solution: Fix file permissions
chmod 600 .env
```

#### Build Issues
```bash
# Problem: "Module not found"
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Problem: "Type errors"
# Solution: Check TypeScript configuration
npx tsc --noEmit
```

### Debugging Tools

#### Flow Debugging
```bash
# Check Flow network status
flow status --network testnet

# View transaction details
flow transactions get TRANSACTION_ID --network testnet

# Check account information
flow accounts get ADDRESS --network testnet
```

#### Frontend Debugging
```typescript
// Enable debug mode in environment
VITE_DEBUG=true

// Use browser developer tools
console.log('Debug info:', debugData);

// Check FCL connection
console.log('FCL User:', await fcl.currentUser().snapshot());
```

---

## 📊 Performance Optimization

### Frontend Performance
- ✅ Code splitting with lazy loading
- ✅ Image optimization
- ✅ Bundle size monitoring
- ✅ Caching strategies
- ✅ Performance metrics tracking

### Blockchain Performance
- ✅ Transaction batching
- ✅ Gas optimization
- ✅ Query result caching
- ✅ Event subscription management
- ✅ Connection pooling

### Monitoring
```bash
# Analyze bundle size
npm run build
npx bundle-analyzer dist

# Monitor performance
npm run dev
# Open localhost:8080
# Use browser DevTools Performance tab
```

---

## 📚 Resources

### Documentation
- [Flow Developer Documentation](https://developers.flow.com/)
- [Cadence Language Reference](https://cadence-lang.org/)
- [FCL (Flow Client Library)](https://developers.flow.com/tools/clients/fcl-js)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools
- [Flow CLI](https://developers.flow.com/tools/flow-cli/install)
- [Flowscan Explorer](https://testnet.flowscan.org/)
- [VS Code Flow Extension](https://marketplace.visualstudio.com/items?itemName=onflow.cadence)

### Community
- [Flow Discord](https://discord.gg/flow)
- [Flow Forum](https://forum.onflow.org/)
- [GitHub Discussions](https://github.com/onflow/flow-go/discussions)

---

## 🎉 Success Checklist

### Before You Start
- [ ] Development environment set up
- [ ] Flow CLI installed and working
- [ ] Environment variables configured
- [ ] Integration tests passing
- [ ] Documentation reviewed

### Development Ready
- [ ] Can connect to Flow testnet
- [ ] Can interact with deployed contract
- [ ] UI components rendering correctly
- [ ] Error handling working
- [ ] Security measures in place

### Production Ready
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance optimized
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained on deployment

---

**🌬️ Happy developing! May your code flow as smoothly as perfect breath.**

*Last updated: December 19, 2024*
*Next review: January 19, 2025*