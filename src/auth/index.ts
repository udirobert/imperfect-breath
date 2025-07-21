// Main auth hook and types
export { useAuth, useBasicAuth, useWeb3Auth, useFlowOnlyAuth, useFullAuth } from "./useAuth";
export type { AuthFeatures, AuthState, AuthActions } from "./useAuth";

// Individual composables (for advanced use cases)
export { useBaseAuth } from "./composables/useBaseAuth";
export { useBlockchainAuth } from "./composables/useBlockchainAuth";
export { useFlowAuth, FlowAuthManager } from "./composables/useFlowAuth";
export { useLensAuth } from "./composables/useLensAuth";

// Auth gate components
export { 
  AuthGate, 
  BasicAuthGate, 
  Web3AuthGate, 
  FlowAuthGate, 
  FullAuthGate 
} from "./components/AuthGate";