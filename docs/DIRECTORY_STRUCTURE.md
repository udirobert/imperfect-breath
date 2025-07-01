# 📁 Imperfect Breath - Directory Structure

## Overview

This document outlines the organized directory structure for the Imperfect Breath project, following best practices for security, maintainability, and development workflow.

---

## 🏗️ Root Directory Structure

```
imperfect-breath/
├── .config/                    # Configuration files
├── .github/                    # GitHub workflows and templates
├── cadence/                    # Flow blockchain smart contracts
├── docs/                       # Documentation organized by topic
├── public/                     # Static assets
├── scripts/                    # Development and deployment scripts
├── src/                        # Application source code
├── supabase/                   # Database migrations and config
├── .env.example               # Environment template (safe to commit)
├── .env.development           # Development config template
├── .gitignore                 # Git ignore rules
├── flow.json.example          # Flow configuration template
├── package.json               # Node.js dependencies and scripts
├── README.md                  # Project overview and quick start
├── TECHNICAL_ROADMAP.md       # Technical implementation plan
└── tsconfig.json              # TypeScript configuration
```

---

## 📂 Detailed Directory Breakdown

### `/docs/` - Documentation Hub
```
docs/
├── deployment/
│   ├── DEPLOYMENT_GUIDE.md           # Comprehensive deployment instructions
│   └── TESTNET_DEPLOYMENT.md         # Quick testnet deployment guide
├── development/
│   ├── DEVELOPMENT_GUIDE.md          # Complete development workflow
│   └── SECURITY_CHECKLIST.md        # Security best practices
├── HACKATHON_README.md               # Hackathon submission details
├── platform-integration-plan.md     # Multi-chain integration plan
└── system-architecture.md           # Technical architecture overview
```

### `/src/` - Application Source Code
```
src/
├── components/
│   ├── ui/                          # Reusable UI components (Shadcn/ui)
│   ├── examples/                    # Integration examples
│   │   └── FlowIntegrationExample.tsx
│   ├── breathing/                   # Breathing session components
│   ├── marketplace/                 # NFT marketplace components
│   └── dashboard/                   # User dashboard components
├── lib/
│   ├── flow/                        # Flow blockchain integration
│   │   ├── config.ts               # FCL configuration service
│   │   ├── nft-client.ts           # Contract interaction client
│   │   └── types.ts                # Flow-specific TypeScript types
│   ├── ai/                         # AI service integrations
│   ├── camera/                     # Camera and pose detection
│   ├── database/                   # Supabase client and operations
│   └── utils/                      # Utility functions
├── hooks/                          # Custom React hooks
├── pages/                          # Application pages/routes
├── stores/                         # State management
└── types/                          # Global TypeScript types
```

### `/cadence/` - Flow Smart Contracts
```
cadence/
├── contracts/
│   └── ImperfectBreath.cdc         # Main NFT and marketplace contract
├── transactions/                    # Contract interaction transactions
│   ├── setup_account.cdc           # Setup user NFT collection
│   ├── mint_pattern.cdc            # Mint breathing pattern NFT
│   ├── list_pattern.cdc            # List NFT for sale
│   ├── purchase_pattern.cdc        # Purchase NFT from marketplace
│   ├── cancel_listing.cdc          # Cancel marketplace listing
│   └── log_session.cdc             # Log breathing session data
└── scripts/                        # Read-only blockchain queries
    ├── get_collection_ids.cdc      # Get user's NFT collection
    ├── get_pattern_details.cdc     # Get specific NFT details
    ├── get_all_listings.cdc        # Get marketplace listings
    └── get_listing_details.cdc     # Get specific listing details
```

### `/scripts/` - Development Tools
```
scripts/
├── setup/
│   └── setup-environment.sh        # Automated environment setup
├── deployment/
│   └── deploy-testnet.sh           # Testnet deployment automation
├── test-flow-integration.js        # Flow integration testing
└── download-models.cjs             # AI model downloading
```

### `/supabase/` - Database Configuration
```
supabase/
├── migrations/
│   └── 001_initial_schema.sql      # Database schema migration
├── functions/                       # Edge functions
└── config.toml                     # Supabase configuration
```

---

## 🔒 Security-Sensitive Files

### ❌ NEVER COMMIT (Gitignored)
```
# Environment files with secrets
.env
.env.local
.env.production

# Flow configuration with private keys
flow.json

# Private key files
*.pkey
.flow-keys*
deployment-keys*
.deployment-keys
emulator-account.pkey

# Temporary files
deployment-info.txt
validate-env.sh
```

### ✅ SAFE TO COMMIT (Templates)
```
# Configuration templates
.env.example
.env.development
flow.json.example

# Documentation
docs/
README.md
DIRECTORY_STRUCTURE.md
```

---

## 🚀 Development Workflow

### New Developer Setup
1. Clone repository
2. Copy configuration templates:
   ```bash
   cp .env.example .env
   cp flow.json.example flow.json
   ```
3. Configure environment variables
4. Install dependencies: `npm install`
5. Test integration: `npm run test:flow`

### Adding New Features

#### Frontend Components
- Create in `/src/components/[category]/`
- Export from index files
- Add to examples if needed

#### Blockchain Functions
- Add Cadence code to `/cadence/contracts/`
- Create transactions in `/cadence/transactions/`
- Add query scripts to `/cadence/scripts/`
- Update TypeScript client in `/src/lib/flow/`

#### Documentation
- Update relevant docs in `/docs/`
- Add to README if it affects setup
- Update this structure guide if needed

---

## 📦 Build and Deployment

### Development Build
```bash
npm run dev                 # Start development server
npm run test:flow          # Test blockchain integration
npm run lint               # Code quality check
```

### Production Build
```bash
npm run build              # Production build
npm run preview            # Preview production build
```

### Deployment
```bash
npm run deploy:testnet     # Deploy to Flow testnet
npm run flow:setup         # Setup environment
npm run flow:validate      # Validate configuration
```

---

## 🧹 File Organization Best Practices

### Naming Conventions
- **Files**: kebab-case (`flow-integration-example.tsx`)
- **Components**: PascalCase (`FlowIntegrationExample`)
- **Variables**: camelCase (`flowNFTClient`)
- **Constants**: UPPER_SNAKE_CASE (`VITE_FLOW_NETWORK`)

### Import Organization
```typescript
// 1. React and external libraries
import React from 'react';
import { Button } from '@/components/ui/button';

// 2. Internal utilities and services
import { flowConfig } from '@/lib/flow/config';

// 3. Types
import type { PatternData } from '@/lib/flow/types';

// 4. Relative imports
import './component.css';
```

### Component Structure
```typescript
// 1. Imports
// 2. Types and interfaces
// 3. Component definition
// 4. Export default
```

---

## 🔧 Configuration Files

### Environment Variables Hierarchy
1. `.env.local` (local overrides, gitignored)
2. `.env` (main config, gitignored)
3. `.env.development` (development template)
4. `.env.example` (documentation template)

### Flow Configuration
- `flow.json.example` - Template with placeholders
- `flow.json` - Actual config with private keys (gitignored)

---

## 📊 Monitoring and Maintenance

### Regular Cleanup Tasks
- Remove unused dependencies
- Update documentation
- Review and rotate API keys
- Clean up temporary files
- Update security configurations

### Directory Health Checks
```bash
# Check for sensitive files in git
git ls-files | grep -E '\.(env|pkey)$'

# Find large files
find . -size +10M -type f

# Check for outdated dependencies
npm audit

# Validate directory structure
tree -I 'node_modules|.git|dist'
```

---

## 🎯 Quick Reference

### Most Important Files
- `README.md` - Project overview
- `.env.example` - Environment configuration
- `src/lib/flow/` - Blockchain integration
- `cadence/contracts/` - Smart contracts
- `docs/development/` - Development guides

### Getting Help
- Development issues → `docs/development/DEVELOPMENT_GUIDE.md`
- Deployment problems → `docs/deployment/DEPLOYMENT_GUIDE.md`
- Security concerns → `docs/development/SECURITY_CHECKLIST.md`
- Architecture questions → `docs/system-architecture.md`

---

## 🎉 Benefits of This Structure

### For Developers
- ✅ Clear separation of concerns
- ✅ Easy to find relevant files
- ✅ Secure by default
- ✅ Consistent naming conventions

### For Security
- ✅ Sensitive files properly isolated
- ✅ Clear templates for configuration
- ✅ No secrets in version control
- ✅ Organized security documentation

### For Maintenance
- ✅ Predictable file locations
- ✅ Easy to update documentation
- ✅ Simple to add new features
- ✅ Clear deployment processes

---

**🌬️ This structure supports the breathing flow of development - organized, secure, and maintainable.**
