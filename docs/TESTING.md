# Testing Strategy

Comprehensive testing approach for Imperfect Breath.

## Overview

The testing strategy includes:
- Unit tests for individual components
- Integration tests for cross-service operations
- E2E tests for complete user flows
- Performance tests for load scenarios
- Security tests for vulnerability assessment

## Test Structure

```
src/
├── __tests__/              # Unit tests
├── integration/__tests__/  # Integration tests
└── e2e/tests/             # E2E tests
```

## Unit Testing

### Framework
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing utilities
- **Mock Service Worker**: API mocking

### Coverage
- Authentication services
- Blockchain clients
- API endpoints
- Utility functions
- UI components

### Examples

```typescript
// Example unit test for authentication
import { describe, it, expect } from 'vitest';
import { useFlowAuth } from '../src/auth/composables/useFlowAuth';

describe('Flow Authentication', () => {
  it('should initialize with correct capabilities', () => {
    const { capabilities } = useFlowAuth();
    expect(capabilities).toBeDefined();
    expect(capabilities.scheduledTransactions).toBeTypeOf('boolean');
  });
});
```

## Integration Testing

### Scope
- Cross-service data synchronization
- Authentication flow coordination
- Blockchain transaction processing
- Social network integration

### Examples

```typescript
// Example integration test for cross-network coordination
import { describe, it, expect } from 'vitest';
import { CrossNetworkIntegration } from '../src/lib/flow/cross-network/cross-network-integration';

describe('Cross-Network Integration', () => {
  it('should create social post when NFT is minted', async () => {
    const integration = new CrossNetworkIntegration();
    const result = await integration.postMintToLens({
      nft: mockNFT,
      transactionId: 'tx-123',
      uniqueId: 'unique-123',
      creatorAddress: '0x123'
    });
    
    expect(result).not.toBeNull();
    expect(result?.id).toBeDefined();
  });
});
```

## E2E Testing

### Framework
- **Playwright**: Cross-browser testing framework
- **Docker**: Test environment isolation

### Test Scenarios

#### Authentication Flow
- Email registration and login
- Wallet connection and authentication
- Lens Protocol integration
- Flow blockchain authentication

#### Breathing Session Flow
- Pattern selection and session start
- Session completion and data saving
- AI analysis and feedback

#### NFT Marketplace Flow
- Browsing available patterns
- Minting new breathing pattern NFTs
- Purchasing existing NFTs

#### Social Features Flow
- Posting to social feed
- Following other users
- Liking and commenting on posts

#### Cross-Network Integration Flow
- Minting NFTs with social sharing
- Creating breathing challenges
- Cross-network reward distribution

### Examples

```typescript
// Example E2E test for authentication
import { test, expect } from '@playwright/test';

test('should allow user to register with email', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('SecurePassword123!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Welcome to Imperfect Breath')).toBeVisible();
});
```

## Performance Testing

### Tools
- **Lighthouse**: Web performance auditing
- **WebPageTest**: Real-world performance testing
- **Artillery**: Load testing

### Metrics
- Page load time
- Time to interactive
- Bundle size
- API response time
- Blockchain transaction time

### Examples

```javascript
// Example load test configuration
export const config = {
  target: 'http://localhost:4556',
  phases: [
    {
      duration: 60,
      arrivalRate: 5,
      name: 'Warm up',
    },
    {
      duration: 120,
      arrivalRate: 5,
      rampTo: 50,
      name: 'Ramp up load',
    },
    {
      duration: 600,
      arrivalRate: 50,
      name: 'Sustained max load',
    },
  ],
};
```

## Security Testing

### Tools
- **OWASP ZAP**: Automated security scanning
- **Snyk**: Dependency vulnerability scanning
- **Custom Security Audit Script**: Codebase security checks

### Checks
- Exposed secrets
- Insecure code patterns
- Missing security headers
- Vulnerable dependencies

### Examples

```javascript
// Example security audit check
const SECRET_PATTERNS = [
  { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{20,}/ },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

for (const { name, pattern } of SECRET_PATTERNS) {
  if (pattern.test(fileContent)) {
    console.log(`🚨 ${name} found in ${filePath}`);
  }
}
```

## Test Execution

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Security Audit
```bash
npm run security:audit
```

### Continuous Integration
All tests run automatically on GitHub Actions:
- Unit tests on every push
- E2E tests on pull requests
- Security audit weekly
- Performance tests on deployment

## Code Coverage

Target coverage thresholds:
- Unit tests: 80%
- Integration tests: 70%
- E2E tests: 60%

Coverage reports generated automatically:
- HTML reports for local development
- CI integration for pull requests
- Coverage badges for documentation