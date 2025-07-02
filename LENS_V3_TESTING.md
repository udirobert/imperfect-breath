# Lens V3 SDK Testing Guide

## Overview

This guide explains how to use the Lens V3 testing suite to explore and validate the Lens Protocol V3 SDK integration.

## Accessing the Test Suite

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the test page:**
   ```
   http://localhost:8080/lens-test
   ```

## Test Components

### 1. Wallet Connection Test
- **Purpose**: Verify wallet connection functionality
- **What it tests**: Wagmi wallet connection, address display
- **Expected behavior**: Should connect wallet and display address

### 2. Session Test
- **Purpose**: Explore Lens V3 session management
- **What it tests**: `useSession` hook, session data structure
- **Expected behavior**: Should show session state and structure

### 3. Login Test
- **Purpose**: Discover correct V3 authentication patterns
- **What it tests**: Multiple login parameter combinations
- **Expected behavior**: One approach should work, others will fail with instructive errors

### 4. Logout Test
- **Purpose**: Test session termination
- **What it tests**: `useLogout` hook functionality
- **Expected behavior**: Should clear session if authenticated

### 5. SDK Exports Test
- **Purpose**: Validate available SDK functions
- **What it tests**: Hook availability and structure
- **Expected behavior**: Should confirm hooks are properly imported

## How to Use

### Step 1: Connect Wallet
1. Click "Connect Wallet"
2. Approve connection in your wallet
3. Verify wallet address displays correctly

### Step 2: Test Session
1. Click "Test Session" 
2. Review session data structure in results
3. Note any authentication state

### Step 3: Test Login
1. Ensure wallet is connected
2. Click "Test Login"
3. Review which login attempts succeed/fail
4. Note successful parameter patterns

### Step 4: Analyze Results
1. Review test results in the console area
2. Check SDK Information panel for current state
3. Document working patterns

## Expected Outcomes

### Successful Test Run
- Wallet connects successfully
- Session hook returns data (may be null/empty initially)
- At least one login attempt pattern works
- SDK exports are confirmed available

### Common Issues
- **"global is not defined"**: Browser polyfill issue (should be fixed)
- **Type errors in login**: V3 SDK parameter structure different than expected
- **Authentication failures**: App address or SDK version issues

## Debugging Tips

### Check Environment Variables
```bash
# Verify app address is set
echo $VITE_LENS_APP_ADDRESS
```

### Examine Network Requests
1. Open browser DevTools → Network tab
2. Run tests and observe API calls
3. Look for authentication endpoints

### Review Console Output
- React DevTools for component state
- Browser console for SDK errors
- Network tab for failed requests

## Documenting Findings

### Record Working Patterns
When you find a successful authentication flow:

1. **Document the exact parameters:**
   ```typescript
   // Example working pattern
   const result = await loginExecute({
     address: "0x...",
     // other required fields
   });
   ```

2. **Note the response structure:**
   ```typescript
   // Example response
   {
     success: true,
     session: { ... },
     // other fields
   }
   ```

3. **Update the production hooks** with working patterns

### Common V3 Patterns to Test

Based on Lens team guidance:

1. **App-based authentication**
2. **Account vs Profile terminology**
3. **Post vs Publication terminology**
4. **New session management**

## Next Steps

Once you identify working patterns:

1. **Update `useLensAuth.ts`** with correct login implementation
2. **Update `useModernLensAccount.ts`** with proper account fetching
3. **Update `useModernLensFeed.ts`** with correct posts API
4. **Remove placeholder implementations**

## Environment Configuration

### Required Environment Variables
```env
# Your Lens app address (provided by Lens team)
VITE_LENS_APP_ADDRESS=DF7gzk-zW-C24tTtRamHCwj8VCuSZ40erZ

# WalletConnect project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Package Versions
```json
{
  "@lens-protocol/react-web": "canary",
  "@lens-protocol/wagmi": "canary",
  "wagmi": "^2.15.6",
  "viem": "^2.21.0"
}
```

## Troubleshooting

### Test Page Won't Load
1. Check for TypeScript errors: `npm run build`
2. Verify all dependencies installed: `npm install`
3. Check browser console for errors

### Authentication Always Fails
1. Verify app address in environment
2. Check wallet is connected to correct network
3. Review Lens team guidance for updates

### SDK Hooks Not Available
1. Verify canary packages installed
2. Check import paths
3. Review package.json for version conflicts

## Success Criteria

✅ **Ready for production implementation when:**
- [ ] Wallet connection works reliably
- [ ] At least one login pattern succeeds
- [ ] Session data structure is understood
- [ ] Error handling patterns are clear
- [ ] Account/profile data can be fetched
- [ ] Basic post/feed data can be retrieved

## Contributing

When you discover working patterns:

1. **Update this documentation**
2. **Create examples in the test suite**
3. **Share findings with the development team**
4. **Contribute back to Lens community**

---

## Quick Reference

### Test Page URL
```
http://localhost:8080/lens-test
```

### Key Files
- `src/components/LensV3Test.tsx` - Test component
- `src/pages/LensV3TestPage.tsx` - Test page
- `src/lib/lens/config.ts` - Lens configuration
- `src/hooks/useLens*.ts` - Production hooks to update

### Lens Team Contacts
- Developer Dashboard: https://developer.lens.xyz
- Documentation: https://lens.xyz/docs/protocol/authentication
- Discord: Lens Protocol community