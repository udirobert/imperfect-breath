# Production Error Fixes

This document outlines the solutions implemented to fix critical production errors in the Imperfect Breath application, addressing both wallet provider compatibility issues and core React initialization problems.

## Root Causes Identified

1. **Package Manager Conflicts**

   - Project had both `bun.lockb` and `package-lock.json` files
   - Multiple package managers created dependency resolution conflicts
   - This contributed to React initialization errors

2. **Wallet Provider Conflicts**

   - "Backpack couldn't override `window.ethereum`"
   - "Uncaught TypeError: Cannot redefine property: ethereum"

3. **React Initialization Errors**
   - "Cannot read properties of undefined (reading 'ReactCurrentOwner')"
   - Path resolution and bundling issues in Vite configuration

## Solutions Implemented

### 1. Package Manager Standardization

- Created `scripts/clean-package-managers.sh` to standardize on npm
- Removes `bun.lockb` and ensures clean dependency installation
- Installs exact versions of critical dependencies
- Resolves inconsistencies that contribute to build failures

### 2. Non-Intrusive Wallet Compatibility Layer

- Created a multi-layered approach that **never** attempts to redefine `window.ethereum`
- `public/ethereum-protector.js`: Runs first, protects ethereum property
- `public/wallet-adapter.js`: Basic wallet compatibility that doesn't modify ethereum
- `public/production-patch.js`: Enhanced tracking with fallback mechanisms
- Provides safe APIs through `window.walletApi` and `window.safeWallet`

### 3. Vite Configuration Fixes

- Simplified Vite configuration to properly handle React dependencies
- Fixed path aliases for correct module resolution
- Removed problematic Babel configuration causing build issues
- Enhanced build scripts for more reliable production builds

## Files Modified/Created

### New Files

- `public/ethereum-protector.js`: Early protection for window.ethereum
- `public/production-patch.js`: Non-intrusive wallet compatibility
- `scripts/rebuild-production.sh`: Optimized production build script
- `scripts/clean-package-managers.sh`: Package manager standardization
- `scripts/verify-wallet-compatibility.js`: Browser testing utility

### Modified Files

- `index.html`: Added protection scripts and enhanced error recovery
- `src/wallet-shim.ts`: Updated to use multiple provider access paths
- `src/lib/wagmi/index.ts`: Fixed TypeScript errors and enhanced safety
- `vite.config.ts`: Simplified for better compatibility

## How To Use

### Standardize Package Management

1. Clean up package management:
   ```bash
   chmod +x scripts/clean-package-managers.sh
   ./scripts/clean-package-managers.sh
   ```

### Build for Production

1. Build with the optimized script:
   ```bash
   chmod +x scripts/rebuild-production.sh
   ./scripts/rebuild-production.sh
   ```

### Testing Wallet Compatibility

To verify wallet compatibility in a browser, open the browser console on your production site and paste the contents of `scripts/verify-wallet-compatibility.js`.

## Technical Details

### Package Manager Standardization

The project now uses npm exclusively:

1. Removes `bun.lockb` to prevent conflicts with `package-lock.json`
2. Ensures clean dependency installation
3. Installs exact versions of critical dependencies

### Wallet Provider Tracking

Instead of trying to modify `window.ethereum`, we:

1. Make the property non-configurable early with `ethereum-protector.js`
2. Track the provider when it changes using a non-intrusive monitoring approach
3. Store references to providers in `window.__walletState`
4. Provide safe APIs through `window.walletApi` and `window.safeWallet`

### React Bundling Optimizations

The Vite configuration now includes:

1. Proper JSX runtime settings to prevent "ReactCurrentOwner" errors
2. Simplified configuration without complex Babel settings
3. Path aliases that match TypeScript configuration

## Troubleshooting

If you encounter issues:

1. Run `./scripts/clean-package-managers.sh` to ensure package management is standardized
2. Check browser console for errors
3. Run the verification script to test wallet compatibility
4. Make sure all dependencies are installed correctly
5. Verify that the protection scripts are loaded in the correct order in `index.html`

## Additional Notes

- The wallet solution avoids any approach that tries to redefine `window.ethereum`
- Multiple provider access methods are tried in sequence for maximum compatibility
- Standardizing on a single package manager (npm) helps prevent dependency conflicts
- Error logging helps diagnose issues in production
