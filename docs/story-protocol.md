# Story Protocol Integration

This document outlines the standardized property naming and integration details for the Story Protocol SDK in our application.

## Property Naming Convention

We've standardized the property names across our codebase to ensure consistency and type safety:

| Standard Property Name | SDK Parameter Name |
| ---------------------- | ------------------ |
| `commercialUse`        | `commercial`       |
| `derivativeWorks`      | `derivatives`      |
| `attributionRequired`  | `attribution`      |
| `royaltyPercent`       | `royalty`          |

## Client Implementation

We've consolidated the Story Protocol client implementations:

- **Primary Client**: `src/lib/story/clients/consolidated-client.ts`
- **Compatibility Wrapper**: `src/lib/story/storyClient.ts` (for backward compatibility)

## Using the Client

```typescript
import { getStoryClient } from "../lib/story/clients/consolidated-client";

// Get the singleton instance
const storyClient = getStoryClient();

// Register IP with proper license terms
await storyClient.registerIP({
  name: "Asset Name",
  description: "Asset Description",
  licenseTerms: {
    commercialUse: true, // Allow commercial use
    derivativeWorks: true, // Allow derivative works
    attributionRequired: true, // Require attribution
    royaltyPercent: 5, // 5% royalty
  },
});
```

## Interface Updates

The following interfaces have been updated:

- `LicenseSettings` in `src/types/patterns.ts`
- `LicenseTerms` in `src/types/blockchain.ts`

## Adapter Pattern

The client implementation uses an adapter pattern to translate between our standardized property names and the SDK's expected parameter names:

```typescript
// Example adapter implementation
function adaptLicenseTerms(terms: LicenseTerms): SDKLicenseTerms {
  return {
    commercial: terms.commercialUse,
    derivatives: terms.derivativeWorks,
    attribution: terms.attributionRequired,
    royalty: terms.royaltyPercent,
  };
}
```

## Deprecation Notice

The legacy client implementations and property naming conventions are maintained for backward compatibility but will be deprecated in a future release. All new code should use the standardized property names and consolidated client.

## Legacy Compatibility Layer

### ipAsset Property

For backward compatibility, the `storyClient` compatibility wrapper includes an `ipAsset` property with the following methods:

```typescript
// Compatibility layer - use consolidated client methods directly in new code
storyClient.ipAsset.get(ipId: string) // Get IP asset by ID
storyClient.ipAsset.getByOwner(owner: string) // Get IP assets by owner
storyClient.ipAsset.transfer({ ipId: string, to: string }) // Transfer IP asset
```

These methods are adapters that call the appropriate methods on the consolidated client. New code should use the consolidated client methods directly:

```typescript
// Preferred approach for new code
const client = getStoryClient();
client.getIPAsset(ipId); // Instead of storyClient.ipAsset.get(ipId)
```
