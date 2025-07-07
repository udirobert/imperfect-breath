# Lens Protocol V3 Migration Documentation

## Overview

This document outlines the migration from Lens Protocol V2 (on Polygon) to Lens Protocol V3 (on Lens Chain), along with the integration of ConnectKit/Avara wallet functionality to replace the previous Tomo SDK.

## Key Changes

### 1. Network Changes

| Network | Before                   | After                            |
| ------- | ------------------------ | -------------------------------- |
| Lens    | Polygon Mumbai (Lens V2) | Lens Chain Testnet (Lens V3)     |
| Flow    | Flow Testnet             | Flow Testnet (unchanged)         |
| Story   | Story Aeneid Testnet     | Story Aeneid Testnet (unchanged) |

### 2. Wallet Integration

- **Previous**: Tomo SDK
- **Current**: ConnectKit/Avara
- **Benefits**: Improved wallet connection reliability, better cross-chain support, and enhanced security features

### 3. Account Model Changes

- **Lens V2**: Profile-based model
- **Lens V3**: Account-based model
- **Impact**: User identification and social actions now use account IDs rather than profile IDs

### 4. API Endpoint Updates

- **Lens V2**: `https://api-v2-mumbai.lens.dev`
- **Lens V3**: `https://api-v3-testnet.lens-chain.xyz`

### 5. Contract Address Updates

- Updated Lens Hub contract address for V3
- Maintained compatibility with Flow and Story Protocol contracts

## Migration Checklist

The following components have been updated:

- [x] Network configurations in `src/config/environment.ts`
- [x] Lens API URLs in GraphQL clients
- [x] Lens Hub contract address
- [x] Flow blockchain integration in `useFlow.ts`
- [x] Story Protocol integration in `useStory.ts`
- [x] Mock implementations replaced with real API calls
- [x] Error handling with fallback mechanisms
- [x] Authentication flow updated for new wallet integration
- [x] Blockchain verifier utility added

## Verification Process

### Using the Blockchain Verifier

We've added a blockchain verification utility that can be used to test connections to all three blockchain networks. This helps ensure that the migration was successful and that all blockchain connections are functioning properly.

```typescript
import { runBlockchainVerificationTests } from "@/utils/blockchain-verifier";

// Run all verification tests
const results = await runBlockchainVerificationTests();

// Check specific networks
import {
  verifyFlowConnection,
  verifyStoryConnection,
  verifyLensConnection,
  verifyApiEndpoints,
  verifyWalletIntegration,
} from "@/utils/blockchain-verifier";

// Test just Lens connection
const lensResult = await verifyLensConnection();
console.log(lensResult);
```

### Manual Verification Steps

1. **Lens Chain Connection**:

   - Connect wallet to Lens Chain Testnet
   - Verify profile data is loading correctly
   - Test social actions (follow, comment, repost)

2. **Flow Blockchain**:

   - Verify NFT minting functionality
   - Test NFT transfers and viewing
   - Check COA information retrieval

3. **Story Protocol**:

   - Verify IP registration
   - Test licensing functionality
   - Check royalty distribution

4. **API Endpoints**:
   - Ensure all API calls are directed to updated endpoints
   - Verify data retrieval from all blockchain networks

## Potential Issues and Solutions

### Missing Profile Data

**Issue**: User profiles may not appear after migration
**Solution**: Users need to initialize their account on Lens V3 by connecting their wallet to the Lens Chain network

### Authentication Errors

**Issue**: Failed wallet connections
**Solution**: Ensure ConnectKit is properly initialized in the application and the correct network configurations are being used

### API Errors

**Issue**: Failed API calls to Lens endpoints
**Solution**: Verify that all API calls are using the updated V3 endpoints and appropriate authentication

### Cross-Chain Operations

**Issue**: Actions requiring multiple blockchain networks may fail
**Solution**: Ensure proper sequencing of blockchain operations and handle network switching appropriately

## Rollback Procedure

If critical issues are encountered, a rollback to Lens V2 can be performed by:

1. Reverting network configurations in `src/config/environment.ts`
2. Restoring previous API endpoints in GraphQL clients
3. Reinstating Tomo SDK wallet integration
4. Reverting to profile-based model in social features

## Additional Resources

- [Lens V3 Documentation](https://docs.lens.xyz/v3)
- [ConnectKit Documentation](https://docs.family.co/connectkit)
- [Flow Blockchain Documentation](https://docs.onflow.org/)
- [Story Protocol Documentation](https://docs.story.xyz/)
