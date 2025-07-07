# Production Error Fixes

This document outlines the solutions implemented to fix critical production errors in the Imperfect Breath application, focusing on wallet provider compatibility and React initialization issues.

## Issues Fixed

1. **Wallet Provider Conflicts**

   - "Backpack couldn't override `window.ethereum`"
   - "Uncaught TypeError: Cannot redefine property: ethereum"

2. **React Initialization Errors**
   - "Cannot read properties of undefined (reading 'ReactCurrentOwner')"

## Solution Overview

### 1. Non-Intrusive Wallet Compatibility Layer

The key insight was that we cannot modify `window.ethereum` directly in production because browser extensions like Backpack set it as a non-configurable property. Our solution:

- Created a completely non-intrusive approach that **never** attempts to redefine `window.ethereum`
- Implemented a tracking system in `public/production-patch.js` that monitors provider changes without modifying properties
- Provided a safe API through `window.walletApi` for accessing wallet functionality

### 2. React Runtime Fixes

- Updated Vite configuration to properly handle React dependencies
- Ensured proper JSX runtime is used with explicit imports
- Fixed path aliases and resolved React module issues
- Added manual chunking to optimize bundle size

### 3. Error Recovery System

- Enhanced error handling in `index.html` to catch and recover from critical errors
- Added diagnostic logging for better error tracking
- Implemented fallback rendering when errors occur

## Files Modified

- `public/production-patch.js` (NEW): Non-intrusive wallet compatibility implementation
- `index.html`: Added production patch and enhanced error recovery
- `src/wallet-shim.ts`: Updated to use the new production-safe APIs
- `src/lib/wagmi/index.ts`: Enhanced to use safer wallet access methods
- `vite.config.ts`: Updated with proper React runtime settings and manual chunking

## Scripts Added

- `scripts/rebuild-production.sh`: Optimized production build script
- `scripts/verify-wallet-compatibility.js`: Tool for testing wallet compatibility
- `scripts/setup-dependencies.sh`: Installs required dependencies

## How To Use

### Setup and Build

1. Install dependencies:

   ```bash
   chmod +x scripts/setup-dependencies.sh
   ./scripts/setup-dependencies.sh
   ```

2. Build for production:
   ```bash
   chmod +x scripts/rebuild-production.sh
   ./scripts/rebuild-production.sh
   ```

### Testing Wallet Compatibility

To verify wallet compatibility in a browser, open the browser console on your production site and paste the contents of `scripts/verify-wallet-compatibility.js`.

## Technical Details

### Wallet Provider Tracking

Instead of trying to modify `window.ethereum`, we:

1. Track the provider when it changes using a non-intrusive monitoring approach
2. Store references to providers in `window.__walletState`
3. Provide a safe API through `window.walletApi` that never modifies `window.ethereum`

### React Bundling Optimizations

The Vite configuration now includes:

1. Proper JSX runtime settings to prevent "ReactCurrentOwner" errors
2. Manual chunking to reduce bundle size:
   ```js
   manualChunks: {
     'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
     'wallet': ['@walletconnect', 'viem', 'wagmi'],
     'ui-framework': ['@radix-ui', 'lucide-react'],
     'blockchain': ['@onflow', '@lens-protocol', '@story-protocol']
   }
   ```
3. Path aliases that match TypeScript configuration

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Run the verification script to test wallet compatibility
3. Make sure all dependencies are installed correctly
4. Verify that `production-patch.js` is loaded before other scripts in `index.html`

## Additional Notes

- The solution avoids any approach that tries to redefine `window.ethereum`, ensuring compatibility with all wallet extensions
- Multiple provider access methods are tried in sequence for maximum compatibility
- Error logging helps diagnose issues in production
