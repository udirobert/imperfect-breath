# Homepage UX Refactor Plan

## 🎯 **Strategy: Progressive Enhancement UI**

Convert from crypto-first to wellness-first while maintaining aesthetic through **component refactoring** and **content prioritization**.

## 🔐 **Authentication Strategy: Context-Aware Wallet Integration**

### **Core Principle**: Only surface authentication when functionally required

Instead of presenting multiple wallet options upfront, we implement **just-in-time authentication** based on user actions:

#### **Authentication Contexts**

| User Action | Required Auth | When to Prompt | Fallback |
|-------------|---------------|----------------|----------|
| **Basic breathing session** | None | Never | Continue as anonymous |
| **Session history/progress** | Supabase auth | After 3+ sessions | Guest mode with local storage |
| **Social sharing/comments** | EVM wallet (Lens) | On first social action | Skip social features |
| **NFT minting/trading** | Flow wallet | On first NFT action | Explain benefits, offer later |
| **Community features** | Supabase + optional social | On community page visit | Basic features with Supabase only |
| **Instructor tools** | All three (progressive) | On instructor onboarding | Start with Supabase, add others as needed |

#### **Progressive Authentication Flow**
```
Anonymous User → Basic breathing sessions
    ↓ (engagement signal: 3+ sessions)
Supabase Auth → Progress tracking, basic social
    ↓ (social action: share, comment)
EVM Wallet (Lens) → Full social features
    ↓ (NFT interest: view marketplace)
Flow Wallet → NFT creation/trading
```

### **Implementation in Components**

#### **Smart Authentication Wrapper**
```typescript
interface AuthGateProps {
  required: 'none' | 'supabase' | 'evm' | 'flow' | 'any';
  context: 'social' | 'nft' | 'progress' | 'instructor';
  fallback: 'disable' | 'prompt' | 'redirect';
  benefits?: string[]; // Why this auth is needed
}

// Usage examples:
<AuthGate required="none">
  <BreathingSession /> {/* Always accessible */}
</AuthGate>

<AuthGate required="supabase" context="progress" fallback="prompt">
  <ProgressDashboard /> {/* Prompt for account after engagement */}
</AuthGate>

<AuthGate required="evm" context="social" fallback="disable">
  <LensSocialActions /> {/* Hide until EVM wallet connected */}
</AuthGate>

<AuthGate required="flow" context="nft" fallback="prompt">
  <NFTMinting /> {/* Show benefits, then prompt for Flow wallet */}
</AuthGate>
```

---

## 📋 **Phase 1: Information Architecture Restructure**

### 1.1 **Refactor Existing Hero Section**
**Target**: `src/pages/Index.tsx` or `src/pages/EnhancedIndex.tsx`

```typescript
// Current: Instructor-focused
// New: Wellness-focused with progressive CTAs

interface HeroProps {
  variant: 'wellness' | 'instructor' | 'community';
  primaryAction: 'start-session' | 'connect-wallet' | 'learn-more';
}
```

**Changes**:
- Modify existing hero text content (no new components)
- Add `variant` prop to existing hero component
- Reorder existing sections via CSS `order` property
- **Remove wallet connection from hero entirely**

### 1.2 **Enhance Existing CTA Components**
**Target**: `src/components/ui/button.tsx` + existing CTA sections

```typescript
// Extend existing Button component
interface ButtonProps {
  priority: 'primary' | 'secondary' | 'tertiary';
  context: 'wellness' | 'crypto' | 'social';
  authRequired?: 'none' | 'supabase' | 'evm' | 'flow';
}
```

**Implementation**:
- Add new variants to existing Button component
- Modify existing CTA sections to use priority hierarchy
- Add context-aware authentication triggers
- No new components needed

## 📋 **Phase 2: Context-Aware Authentication Integration**

### 2.1 **Create Smart Auth Gate Component**
**Target**: Extend existing auth components in `src/auth/`

```typescript
interface SmartAuthGateProps {
  required: AuthType[];
  context: AuthContext;
  children: React.ReactNode;
  fallback?: React.ComponentType;
  onAuthSuccess?: (authType: AuthType) => void;
}

// Reuse existing WalletErrorBoundary and auth logic
```

### 2.2 **Refactor ConnectWalletButton Component**
**Target**: `src/components/wallet/ConnectWalletButton.tsx` (already migrated)

```typescript
interface ConnectWalletButtonProps {
  context: 'social-action' | 'nft-action' | 'instructor-tools';
  requiredFor: string; // "share this session" | "mint NFT" | "create course"
  hideUntilNeeded?: boolean;
  showBenefits?: boolean;
}
```

**Changes**:
- Add context-specific messaging to existing component
- Create benefit explanation modals (reuse existing modal components)
- Remove generic "Connect Wallet" buttons from navigation
- No component duplication

### 2.3 **Authentication Context Manager**
**Target**: Extend existing `src/lib/wallet/wallet-context.tsx`

```typescript
interface AuthContextState {
  currentAuthLevel: 'anonymous' | 'supabase' | 'evm' | 'flow' | 'full';
  availableFeatures: string[];
  pendingAction?: {
    action: string;
    requiresAuth: AuthType;
    context: string;
  };
}
```

## 📋 **Phase 3: Component Consolidation**

### 3.1 **Merge Duplicate Homepage Components**
**Audit Target**: 
- `src/pages/Index.tsx` vs `src/pages/EnhancedIndex.tsx`
- Remove duplicate, enhance remaining

```typescript
// Single homepage with progressive enhancement
interface HomePageProps {
  enhanced?: boolean;
  userType?: 'anonymous' | 'authenticated' | 'instructor';
}
```

### 3.2 **Consolidate Session Entry Points**
**Target**: `src/components/navigation/SessionEntryPoints.tsx`

```typescript
// Refactor existing component to handle multiple contexts
interface SessionEntryProps {
  context: 'homepage' | 'navigation' | 'dashboard';
  complexity: 'simple' | 'full';
  authGate: boolean; // Only show auth options when needed
}
```

### 3.3 **Smart Feature Discovery**
**New Logic**: Progressive feature revelation based on engagement

```typescript
// Add to existing session orchestrator
interface FeatureDiscoveryState {
  sessionsCompleted: number;
  socialInterest: boolean; // User clicked social features
  nftInterest: boolean;    // User viewed marketplace
  instructorInterest: boolean; // User viewed instructor content
}
```

## 📋 **Phase 4: Mobile-First Responsive Enhancement**

### 4.1 **Enhance Existing Layout Components**
**Target**: `src/components/MainLayout.tsx`

```typescript
// Add mobile-optimized variants to existing layout
interface LayoutProps {
  mobileOptimized?: boolean;
  progressiveNavigation?: boolean;
  authRequired: AuthType; // Show relevant auth options only
}
```

**Implementation**:
- Add mobile-first CSS to existing components
- Reorder sections with CSS Grid `order` property
- Hide irrelevant auth options on mobile
- No new layout components needed

### 4.2 **Responsive Session Setup**
**Target**: `src/components/session/SessionSetup.tsx` (already migrated)

**Enhancement**:
- Add mobile-first progressive disclosure
- Remove wallet requirements from basic session setup
- Simplify desktop version to match mobile flow
- Reuse existing responsive patterns

## 📋 **Phase 5: Content & Messaging Strategy**

### 5.1 **Create Content Configuration**
**New File**: `src/config/messaging.ts`

```typescript
export const MESSAGING = {
  hero: {
    wellness: "Transform your breathing with AI-powered guidance",
    instructor: "Teach mindful breathing with professional tools",
  },
  cta: {
    primary: "Start Free Session",
    secondary: "Save Your Progress", // Supabase auth
    tertiary: "Join Community" // EVM for social
  },
  auth: {
    supabase: {
      context: "Track your progress and see improvement over time",
      benefits: ["Session history", "Progress tracking", "Personalized insights"]
    },
    evm: {
      context: "Connect with the Lens community",
      benefits: ["Share sessions", "Follow instructors", "Community features"]
    },
    flow: {
      context: "Own your breathing patterns as NFTs",
      benefits: ["Mint unique patterns", "Trade with community", "Prove authenticity"]
    }
  }
};
```

### 5.2 **Context-Aware Messaging Components**
**Target**: Create reusable auth explanation components

```typescript
interface AuthExplanationProps {
  authType: 'supabase' | 'evm' | 'flow';
  context: string; // What they're trying to do
  onProceed: () => void;
  onSkip?: () => void;
}
```

### 5.3 **Refactor Existing Content Components**
**Target**: Any hardcoded text in components

- Replace hardcoded strings with config imports
- Add context-aware messaging
- Maintain existing component structure

## 📋 **Phase 6: Analytics & A/B Testing Setup**

### 6.1 **Extend Existing Error Reporting**
**Target**: `src/lib/errors/error-reporter.ts` (already implemented)

```typescript
// Add user journey tracking to existing system
interface UserJourneyEvent {
  step: 'landing' | 'session-start' | 'auth-prompt' | 'auth-complete' | 'feature-use';
  authType?: 'supabase' | 'evm' | 'flow';
  context?: string; // What triggered the auth
  outcome: 'success' | 'abandon' | 'skip' | 'convert';
}
```

### 6.2 **Authentication Conversion Tracking**
```typescript
// Track auth funnel efficiency
interface AuthFunnelMetrics {
  promptShown: { authType: string; context: string };
  authStarted: { authType: string; method: string };
  authCompleted: { authType: string; timeToComplete: number };
  featureUsed: { feature: string; authType: string };
}
```

## 🎯 **Implementation Sequence**

### **Week 1: Authentication Strategy**
1. Create `SmartAuthGate` component
2. Implement context-aware auth logic
3. Remove wallet buttons from navigation/hero
4. Add auth context to existing session orchestrator

### **Week 2: Content & Messaging**
1. Create `messaging.ts` config  
2. Refactor hero section content (wellness-first)
3. Update existing CTAs with context-aware auth
4. Create auth explanation modals

### **Week 3: Progressive Enhancement**
1. Implement just-in-time auth prompts
2. Add engagement tracking for auth timing
3. Hide/show features based on auth level
4. Test anonymous → authenticated user flow

### **Week 4: Responsive Optimization**  
1. Mobile-first CSS for existing components
2. Consolidate Index/EnhancedIndex pages
3. Test mobile vs desktop auth flows
4. Optimize for mobile-first engagement

### **Week 5: Analytics & Refinement**
1. Add auth funnel tracking to existing error system
2. A/B test wellness-first vs current approach
3. Measure auth conversion rates by context
4. Refine based on user behavior metrics

## 🏗️ **Architecture Benefits**

✅ **DRY**: Reuse existing auth components with context-aware props
✅ **CLEAN**: Single responsibility through progressive authentication  
✅ **MODULAR**: Context-aware auth through configuration
✅ **ORGANISED**: Logical auth progression matching user journey
✅ **SEPARATION OF CONCERNS**: Auth only when functionally required

## 🔐 **Authentication Flow Examples**

### **Scenario 1: New User**
```
Homepage → Start Session (no auth) → Complete Session → 
Optional: "Save progress?" (Supabase auth) → Continue anonymous or sign up
```

### **Scenario 2: Engaged User Wants Social**
```
Session Complete → "Share with community" → 
EVM wallet prompt with benefits → Connect → Share to Lens
```

### **Scenario 3: User Discovers NFTs**
```
Browse Marketplace → "Mint your pattern" → 
Flow wallet prompt with benefits → Connect → Mint NFT
```

### **Scenario 4: Instructor Path**
```
Instructor CTA → Supabase signup → Basic instructor tools → 
"Advanced features need social" → EVM wallet → 
"Create NFT courses" → Flow wallet
```

## 📊 **Success Metrics**

### **Primary Metrics**
- **Session start rate** from homepage (should increase)
- **Session completion rate** (anonymous users should have higher completion)
- **Time to first successful session** (should decrease)

### **Authentication Metrics**  
- **Auth prompt acceptance rate** by context (social > NFT > general)
- **Auth completion rate** by type (Supabase > EVM > Flow expected)
- **Feature adoption rate** post-authentication (should increase)

### **Business Metrics**
- **User activation rate** (completing 3+ sessions)
- **Social engagement rate** (actions per EVM-connected user)
- **NFT creation rate** (Flow wallet users creating content)

This approach maintains your beautiful aesthetic while optimizing for your killer use case and reducing cognitive load through contextual, progressive authentication.