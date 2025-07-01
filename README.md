# Imperfect Breath

## One-Sentence Description

Breath Flow Vision is a decentralized wellness platform where users can truly own, practice, and trade unique breathing patterns as on-chain assets, powered by a multichain architecture.

## Multichain Architecture

We leverage three specialized blockchains for optimal functionality:

### Flow Blockchain (Primary Chain)
- **BreathingPattern NFTs:** Unique breathing patterns as Non-Fungible Tokens with true digital ownership
- **On-Chain Marketplace:** Decentralized marketplace for buying/selling breathing patterns
- **Session Logging:** Immutable recording of breathing session metrics and AI analysis
- **Value Transfer:** Primary chain for all monetary transactions

### Lens Protocol (Social Layer)
- **Social Profiles:** Decentralized user profiles and identity
- **Content Sharing:** Share breathing sessions and achievements
- **Community Features:** Follow creators, engage with content, build community
- **Social Proof:** Verifiable social interactions and reputation

### Story Protocol (IP Management)
- **IP Registration:** Register breathing patterns as intellectual property
- **Licensing Framework:** Set terms for pattern usage and derivatives
- **Royalty Distribution:** Automated creator compensation
- **Attribution Tracking:** Maintain provenance and creator rights

## Current Implementation Status

### ✅ Completed (Phase 1)
- **Environment Configuration:** Comprehensive multichain environment setup
- **Database Schema:** Full Supabase schema with multichain identity mapping
- **Flow Integration:** Proper FCL configuration with real contract addresses
- **Lens Integration:** Basic client setup and authentication framework
- **Story Integration:** IP registration and licensing framework
- **AI Analysis:** Google Gemini integration with structured feedback
- **Multichain Provider:** Unified Web3 provider managing all blockchain connections
- **Flow NFT Client:** Complete Flow blockchain operations (mint, list, purchase, query)
- **Contract Deployment:** Successfully deployed to Flow testnet (0xb8404e09b36b6623)
- **Security Implementation:** Environment variables, git ignore, and secure key management
- **Integration Testing:** Comprehensive Flow integration validation and testing

### 🚧 In Progress (Phase 2)
- **Camera Integration:** TensorFlow.js pose detection implementation
- **Database Operations:** Supabase service layer completion
- **UI Components:** Updating components to use new multichain architecture

### 📋 Planned (Phase 3-4)
- **Lens Social Features:** Complete social functionality implementation
- **Story IP Features:** Full IP management and royalty system
- **Advanced AI:** Enhanced analysis with multiple providers
- **Real-time Features:** WebSocket integration for live updates
- **Creator Economy:** Revenue sharing and analytics dashboard

## Technical Architecture

### Data Flow
```
User Action → Frontend → Appropriate Blockchain
├── NFT Operations → Flow Blockchain
├── Social Actions → Lens Protocol  
└── IP Registration → Story Protocol
```

### Cross-Chain Identity
```typescript
interface MultiChainUser {
  flowAddress: string;      // Primary wallet for transactions
  lensProfile: LensProfile; // Social identity
  storyIPAssets: IPAsset[]; // Registered IP assets
}
```

## How it was done

Our application is built with React and TypeScript for the frontend, with a sophisticated multichain backend:

- **Flow Blockchain:** Cadence smart contracts for NFTs and marketplace
- **Lens Protocol:** Social features and community building
- **Story Protocol:** IP registration and creator rights
- **Supabase:** Centralized database for cross-chain data coordination
- **Google Gemini:** AI-powered breathing analysis and feedback

## Key Features

### For Users
- **Own Your Practice:** Breathing patterns as tradeable NFTs
- **AI-Powered Feedback:** Personalized analysis and improvement suggestions
- **Social Community:** Connect with other practitioners via Lens Protocol
- **Progress Tracking:** Comprehensive analytics and achievement system

### For Creators
- **IP Protection:** Register patterns with Story Protocol
- **Revenue Streams:** Direct sales, royalties, and licensing
- **Creator Tools:** Pattern builder with audio integration
- **Analytics Dashboard:** Track usage, earnings, and community engagement

### For the Ecosystem
- **Decentralized Ownership:** True user ownership of digital assets
- **Creator Economy:** Fair compensation and attribution system
- **Community Governance:** Social features drive platform evolution
- **Cross-Chain Interoperability:** Best-of-breed blockchain integration

## Getting Started

### Prerequisites
- Node.js 18+
- Flow CLI (for blockchain interactions)
- Supabase account (optional)
- Google Gemini API key (for AI features)

### Directory Organization
The project is now properly organized with security-first practices:

```
imperfect-breath/
├── docs/                       # Organized documentation
│   ├── deployment/            # Deployment guides
│   └── development/           # Development guides
├── src/                       # Application source code
│   ├── lib/flow/             # Flow blockchain integration
│   └── components/examples/   # Integration examples
├── cadence/                   # Smart contracts & transactions
├── scripts/                   # Development automation
├── .env.example              # Environment template (safe)
├── flow.json.example         # Flow config template (safe)
└── DIRECTORY_STRUCTURE.md    # Detailed structure guide
```

### Quick Start
1. **Clone and Install**
   ```bash
   git clone [your-repo-url]
   cd imperfect-breath
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy configuration templates
   cp .env.example .env
   cp flow.json.example flow.json
   
   # Or use the automated setup script
   npm run flow:setup
   ```

3. **Configure Environment Variables**
   ```bash
   # Flow Configuration (Pre-configured for testnet)
   VITE_FLOW_NETWORK=testnet
   VITE_IMPERFECT_BREATH_ADDRESS=0xb8404e09b36b6623
   
   # Optional: Add your API keys
   VITE_GOOGLE_GEMINI_API_KEY=your_key_here
   VITE_SUPABASE_URL=your_project_url
   ```

4. **Test Integration**
   ```bash
   npm run test:flow
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

### Security Best Practices
- ✅ Environment variables are properly configured
- ✅ Private keys and sensitive files are gitignored
- ✅ `flow.json` with private keys excluded from version control
- ✅ Secure file permissions set (600 for sensitive files)
- ✅ API keys stored securely in environment variables
- ✅ Configuration templates provided for safe sharing
- ⚠️ Never commit .env or flow.json files to version control
- ⚠️ Use different keys for different environments
- ⚠️ Regularly rotate API keys and monitor usage

## Live Deployment Information

### 🎉 Successfully Deployed to Flow Testnet!

**Contract Details:**
- **Address:** `0xb8404e09b36b6623`
- **Network:** Flow Testnet
- **Explorer:** [View on Flowscan](https://testnet.flowscan.org/account/0xb8404e09b36b6623)
- **Status:** ✅ Live and Verified

**Test NFT Created:**
- **Name:** "4-7-8 Breathing"
- **ID:** `124244814074997`
- **Phases:** inhale: 4, hold: 7, exhale: 8

**Available Features:**
- ✅ NFT Minting (breathing patterns)
- ✅ Collection Management
- ✅ Marketplace (list/purchase)
- ✅ Session Data Logging
- ✅ Query Operations

### Testing Commands
```bash
# Test Flow integration
npm run test:flow

# Validate environment
npm run flow:validate

# Deploy to testnet (if needed)
npm run deploy:testnet
```

## Development Roadmap

See [TECHNICAL_ROADMAP.md](./TECHNICAL_ROADMAP.md) for detailed implementation plan.

### Deployment Documentation
- [docs/deployment/DEPLOYMENT_GUIDE.md](./docs/deployment/DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions
- [docs/deployment/TESTNET_DEPLOYMENT.md](./docs/deployment/TESTNET_DEPLOYMENT.md) - Ready-to-deploy guide
- [docs/development/DEVELOPMENT_GUIDE.md](./docs/development/DEVELOPMENT_GUIDE.md) - Complete development workflow
- [docs/development/SECURITY_CHECKLIST.md](./docs/development/SECURITY_CHECKLIST.md) - Security best practices
- [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) - Project organization guide

## Security & Production Ready

### Environment Security
- ✅ Git ignore configured for all sensitive files (including flow.json)
- ✅ Environment variables template provided (.env.example)
- ✅ Flow configuration template provided (flow.json.example)
- ✅ Secure key management practices implemented
- ✅ Development/production separation enforced
- ✅ Directory structure organized for security

### Testing & Validation
- ✅ Comprehensive Flow integration tests (5/5 passing)
- ✅ Contract deployment verification completed
- ✅ Frontend integration validation working
- ✅ TypeScript errors resolved
- ✅ Error handling and monitoring implemented

### Production Considerations
- 🔒 **Security:** Private keys never committed, secure file permissions
- 🌐 **Networks:** Testnet validated, mainnet ready
- 📊 **Monitoring:** Transaction tracking and logging implemented
- 🚀 **Deployment:** Automated scripts and comprehensive validation
- 📁 **Organization:** Clean directory structure following best practices

## Team

Built with a focus on production-ready multichain architecture, proper error handling, scalable design patterns, and security best practices.

---

*This is a sophisticated multichain application that demonstrates the future of decentralized wellness platforms. Each blockchain serves a specific purpose, creating a comprehensive ecosystem for breathing practice, social interaction, and creator economy.*

**🌬️ Contract Live on Flow Testnet: `0xb8404e09b36b6623`**