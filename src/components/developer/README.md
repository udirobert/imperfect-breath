# Developer Tools

## Overview

The developer tools provide easy access to subscription overrides and debugging utilities for testing premium features locally.

## Features

### 1. Subscription Overrides
- **Basic Tier**: Free tier with core features
- **Premium Tier**: $4.99/month tier with AI features
- **Pro Tier**: $9.99/month tier with Web3 features

### 2. Console Commands

In development mode, you can use console commands for quick access:

```javascript
// Set subscription tiers
dev.setBasic()     // Set basic tier access
dev.setPremium()   // Set premium tier access  
dev.setPro()       // Set pro tier access
dev.clearOverride() // Clear any override

// Status checks
dev.getOverride()        // Show current override
dev.getRevenueCatStatus() // Show RevenueCat config status
dev.checkSubscription()  // Check current subscription status

// Help
dev.help()         // Show available commands
```

### 3. UI Panel

Click the settings icon in the bottom-right corner (development mode only) to access:
- Current override status
- Quick tier selection
- RevenueCat configuration status
- Clear override button

## How It Works

### Override System
- Overrides are stored in localStorage
- They persist across browser sessions
- Only active in development mode
- Take precedence over actual RevenueCat subscriptions

### Configuration Modes
- **Production**: Uses real RevenueCat configuration from backend
- **Development**: Uses fallback keys for testing
- **Demo**: Graceful fallback when backend is unavailable
- **Developer Override**: Manual tier override for testing

## Usage Examples

### Testing Premium Features
```javascript
// Grant premium access
dev.setPremium()

// Test AI analysis features
// Navigate to /results and try AI analysis

// Check what tier is active
dev.checkSubscription()
```

### Testing Pro Features
```javascript
// Grant pro access
dev.setPro()

// Test NFT creation, Web3 features
// Navigate to /create or /marketplace

// Clear when done testing
dev.clearOverride()
```

### Debugging RevenueCat Issues
```javascript
// Check configuration status
dev.getRevenueCatStatus()

// Check current subscription
dev.checkSubscription()

// If backend is down, app automatically falls back to demo mode
```

## Environment Variables

For persistent developer mode, add to your `.env.development`:

```bash
VITE_DEVELOPER_MODE=true
```

This will automatically grant pro access without needing to set overrides.

## Integration Points

The developer tools integrate with:
- `useSubscriptionAccess` hook
- `RevenueCatService` class
- `hasFeatureAccess` functions
- All subscription-gated components

## Security

- Only available in development mode
- No production impact
- Overrides are client-side only
- Real billing always uses production RevenueCat