// CLEAN: Single export point for auth domain
// Main auth hook and types
export { useAuth, useBasicAuth, useWeb3Auth, useFlowOnlyAuth, useFullAuth } from "./useAuth";
export type { AuthFeatures, AuthState, AuthActions } from "./useAuth";

// ORGANIZED: Auth method definitions and context
export { AUTH_METHODS, getRecommendedAuthMethods, getAuthMethodDisplay, getRequiredFeatures } from "./auth-methods";
export type { AuthMethod, AuthContext } from "./auth-methods";

// MODULAR: Reusable auth components
export { AuthMethodCard } from "./components/AuthMethodCard";

// PERFORMANT: Performance optimization components and hooks
export { useAuthPerformance } from "./performance/useAuthPerformance";
export { useAuthPreferences } from "../hooks/useAuthPreferences";

// Individual composables (for advanced use cases)
export { useBlockchainAuth } from "./composables/useBlockchainAuth";
export { useFlowAuth, FlowAuthManager } from "./composables/useFlowAuth";
export { useLensAuth } from "./composables/useLensAuth";

// CONSOLIDATED: Single auth gate with all functionality
export { 
  ConsolidatedAuthGate as AuthGate,
  BasicAuthGate, 
  Web3AuthGate, 
  FlowAuthGate, 
  FullAuthGate 
} from "./components/ConsolidatedAuthGate";

// CLEAN: Default export for main auth gate
export { default as SmartAuthGate } from "./components/ConsolidatedAuthGate";