# 🌬️ Imperfect Breath - Flow Testnet Deployment Guide

## Overview

This guide will walk you through deploying the ImperfectBreath smart contract to Flow testnet. The contract enables users to mint breathing pattern NFTs, create a marketplace, and log session data on-chain.

## Prerequisites

Before starting, ensure you have:

- [ ] **Flow CLI** installed (v2.2.16 or higher)
- [ ] **Node.js** 18+ for frontend integration
- [ ] A **web browser** for accessing the Flow faucet
- [ ] **Basic understanding** of blockchain concepts

### Install Flow CLI

If you don't have Flow CLI installed:

**macOS:**
```bash
brew install flow-cli
```

**Linux/Windows:**
```bash
curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh | bash
```

Verify installation:
```bash
flow version
```

## Step 1: Generate Keys

First, generate a key pair for your testnet account:

```bash
flow keys generate
```

**Sample Output:**
```
🔴️ Store private key safely and don't share with anyone!
Private Key: 6c44753258125660226d364440dc8eff60055b1071d5cab50456b750b2c8fcf2
Public Key:  a771604dde67dd2b3c63d0be24daa8b52b11904c7c72a7bf25b5e59cd4b8aed325bbf0334455685160707398d9aec96a49e4038a2b28abe6a344a074a94dbe7b
```

⚠️ **IMPORTANT:** Save your private key securely. You'll need it for deployment.

## Step 2: Create Testnet Account

1. **Visit the Flow Testnet Faucet:** https://testnet-faucet.onflow.org/
2. **Paste your public key** (from Step 1)
3. **Click "Create Account"**
4. **Copy the created account address** (format: `0x1234567890abcdef`)

The faucet will:
- Create a new testnet account
- Fund it with 1000 testnet FLOW tokens
- Display your account address

## Step 3: Update Flow Configuration

Update your `flow.json` file to include the testnet account:

```json
{
  "contracts": {
    "ImperfectBreath": {
      "source": "cadence/contracts/ImperfectBreath.cdc"
    }
  },
  "networks": {
    "emulator": "127.0.0.1:3569",
    "testnet": "access.devnet.nodes.onflow.org:9000",
    "mainnet": "access.mainnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "testnet-account": {
      "address": "YOUR_TESTNET_ADDRESS_HERE",
      "key": {
        "type": "hex",
        "index": 0,
        "signatureAlgorithm": "ECDSA_P256",
        "hashAlgorithm": "SHA3_256",
        "privateKey": "YOUR_PRIVATE_KEY_HERE"
      }
    }
  },
  "deployments": {
    "testnet": {
      "testnet-account": ["ImperfectBreath"]
    }
  }
}
```

**Replace:**
- `YOUR_TESTNET_ADDRESS_HERE` with your account address from Step 2
- `YOUR_PRIVATE_KEY_HERE` with your private key from Step 1

## Step 4: Deploy Contract

Deploy the contract to testnet:

```bash
flow project deploy --network testnet
```

**Expected Output:**
```
Deploying 1 contracts for accounts: testnet-account

ImperfectBreath -> 0x1234567890abcdef (testnet-account)

✅ All contracts deployed successfully
```

## Step 5: Verify Deployment

Check your deployment on Flowscan:

1. Visit: https://testnet.flowscan.org/
2. Search for your account address
3. Navigate to the "Contracts" tab
4. Verify `ImperfectBreath` is deployed

## Step 6: Test Contract Functions

### Setup User Account

First, users need to set up their account to hold NFTs:

```bash
flow transactions send cadence/transactions/setup_account.cdc --network testnet --signer testnet-account
```

### Mint a Breathing Pattern

Test minting an NFT:

```bash
flow transactions send cadence/transactions/mint_pattern.cdc \
  --arg String:"4-7-8 Breathing" \
  --arg String:"Relaxing breathing pattern for stress relief" \
  --arg Address:0x1234567890abcdef \
  --arg '{String: UInt64}:{"inhale": 4, "hold": 7, "exhale": 8}' \
  --arg 'String?':"https://example.com/audio.mp3" \
  --network testnet \
  --signer testnet-account
```

### Query Contract Data

Get all NFTs in an account:

```bash
flow scripts execute cadence/scripts/get_collection_ids.cdc \
  --arg Address:0x1234567890abcdef \
  --network testnet
```

## Contract Features

### Core NFT Functionality
- **Mint Patterns:** Create breathing pattern NFTs with custom phases
- **Transfer:** Move NFTs between accounts
- **Session Logging:** Record breathing session data on-chain

### Marketplace Features
- **List for Sale:** Put patterns up for sale
- **Purchase:** Buy patterns from other users
- **Remove Listings:** Cancel sales

### Data Structure

Each breathing pattern NFT contains:
```cadence
{
  id: UInt64,              // Unique identifier
  name: String,            // Pattern name
  description: String,     // Pattern description
  creator: Address,        // Original creator
  phases: {String: UInt64}, // Breathing phases (inhale, hold, exhale)
  audioUrl: String?,       // Optional audio guide
  sessionHistory: [...]    // Recorded sessions
}
```

## Frontend Integration

### Environment Variables

Update your `.env` file:

```bash
# Flow Configuration
VITE_FLOW_NETWORK=testnet
VITE_FLOW_ACCESS_API=https://rest-testnet.onflow.org
VITE_FLOW_CONTRACT_ADDRESS=0x1234567890abcdef

# Replace with your deployed contract address
VITE_IMPERFECT_BREATH_ADDRESS=0x1234567890abcdef
```

### FCL Configuration

In your React app:

```typescript
import * as fcl from "@onflow/fcl"

fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xImperfectBreath": "0x1234567890abcdef" // Your contract address
})
```

## Common Issues & Solutions

### Issue: "insufficient balance"
**Solution:** Visit the faucet again to get more testnet FLOW tokens.

### Issue: "account not found"
**Solution:** Double-check your account address in `flow.json`.

### Issue: "invalid signature"
**Solution:** Verify your private key is correct and matches the account.

### Issue: "contract already exists"
**Solution:** Use `--update` flag to update existing contract:
```bash
flow project deploy --network testnet --update
```

## Security Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive data
3. **Test thoroughly** on testnet before mainnet
4. **Backup your keys** securely
5. **Use a dedicated testnet wallet**

## Next Steps

After successful deployment:

1. **Update frontend** with contract address
2. **Test all contract functions** through your UI
3. **Implement error handling** for network issues
4. **Add user onboarding** flow for account setup
5. **Monitor contract** usage and performance

## Support Resources

- **Flow Documentation:** https://developers.flow.com/
- **Flow Discord:** https://discord.gg/flow
- **Cadence Reference:** https://cadence-lang.org/
- **Flowscan Testnet:** https://testnet.flowscan.org/

## Mainnet Deployment

When ready for production:

1. Change network to `mainnet` in configuration
2. Create mainnet account with real FLOW tokens
3. Deploy using the same process
4. Update frontend environment variables

---

**🎉 Congratulations!** You've successfully deployed ImperfectBreath to Flow testnet. Your breathing pattern NFT marketplace is now live on the blockchain!