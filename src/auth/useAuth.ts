import { useMemo } from "react";
import { useBaseAuth } from "./composables/useBaseAuth";
import { useBlockchainAuth } from "./composables/useBlockchainAuth";
import { useFlowAuth } from "./composables/useFlowAuth";
import { useLensAuth } from "./composables/useLensAuth";

export interface AuthFeatures {
  blockchain?: boolean;
  flow?: boolean;
  lens?: boolean;
}

export interface AuthState {
  // Core auth (always available)
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Blockchain auth (optional)
  wallet?: {
    address: string | undefined;
    chain: string | undefined;
    chainId: number | undefined;
    isConnected: boolean;
  } | null;
  
  // Flow auth (optional)
  flowUser?: {
    address: string;
    loggedIn: boolean;
    services: any[];
  } | null;
  
  // Lens auth (optional)
  lensProfile?: {
    id: string;
    handle: string;
    name?: string;
    bio?: string;
    picture?: string;
    ownedBy: string;
  } | null;
}

export interface AuthActions {
  // Core auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  
  // Blockchain actions (conditional)
  connectWallet?: () => Promise<{ success: boolean; error?: string }>;
  disconnectWallet?: () => Promise<{ success: boolean; error?: string }>;
  
  // Flow actions (conditional)
  loginFlow?: () => Promise<{ success: boolean; error?: string }>;
  logoutFlow?: () => Promise<{ success: boolean; error?: string }>;
  
  // Lens actions (conditional)
  refreshLensProfile?: () => Promise<void>;
  clearLensProfile?: () => void;
}

/**
 * Main auth composer hook - only loads requested features
 * 
 * @param features - Which auth features to enable
 * @returns Combined auth state and actions
 */
export const useAuth = (features: AuthFeatures = {}) => {
  // Core auth (always loaded)
  const baseAuth = useBaseAuth();
  
  // Conditional blockchain auth
  const blockchainAuth = features.blockchain ? useBlockchainAuth() : null;
  
  // Conditional Flow auth
  const flowAuth = features.flow ? useFlowAuth() : null;
  
  // Conditional Lens auth (requires blockchain)
  const lensAuth = (features.lens && features.blockchain) ? useLensAuth() : null;

  // Compose auth state
  const authState: AuthState = useMemo(() => ({
    // Core auth state
    user: baseAuth.user,
    isAuthenticated: baseAuth.isAuthenticated,
    isLoading: baseAuth.loading ||
               (blockchainAuth?.isConnecting) ||
               (flowAuth?.isLoading) ||
               (lensAuth?.isLoading) ||
               false,
    
    // Conditional blockchain state
    ...(features.blockchain && blockchainAuth && {
      wallet: blockchainAuth.wallet,
    }),
    
    // Conditional Flow state
    ...(features.flow && flowAuth && {
      flowUser: flowAuth.flowUser,
    }),
    
    // Conditional Lens state
    ...(features.lens && lensAuth && {
      lensProfile: lensAuth.lensProfile,
    }),
  }), [
    baseAuth.user,
    baseAuth.isAuthenticated,
    baseAuth.loading,
    blockchainAuth?.wallet,
    blockchainAuth?.isConnecting,
    flowAuth?.flowUser,
    flowAuth?.isLoading,
    lensAuth?.lensProfile,
    lensAuth?.isLoading,
    features.blockchain,
    features.flow,
    features.lens,
  ]);

  // Compose auth actions
  const authActions: AuthActions = useMemo(() => ({
    // Core auth actions
    login: async (email: string, password: string) => {
      try {
        await baseAuth.loginWithEmail(email, password);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Login failed"
        };
      }
    },
    logout: async () => {
      try {
        await baseAuth.logout();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Logout failed"
        };
      }
    },
    register: async (email: string, password: string) => {
      try {
        await baseAuth.signUpWithEmail(email, password);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Registration failed"
        };
      }
    },
    
    // Conditional blockchain actions
    ...(features.blockchain && blockchainAuth && {
      connectWallet: blockchainAuth.connectWallet,
      disconnectWallet: blockchainAuth.disconnectWallet,
    }),
    
    // Conditional Flow actions
    ...(features.flow && flowAuth && {
      loginFlow: flowAuth.login,
      logoutFlow: flowAuth.logout,
    }),
    
    // Conditional Lens actions
    ...(features.lens && lensAuth && {
      refreshLensProfile: lensAuth.refreshProfile,
      clearLensProfile: lensAuth.clearProfile,
    }),
  }), [
    baseAuth.loginWithEmail,
    baseAuth.logout,
    baseAuth.signUpWithEmail,
    blockchainAuth?.connectWallet,
    blockchainAuth?.disconnectWallet,
    flowAuth?.login,
    flowAuth?.logout,
    lensAuth?.refreshProfile,
    lensAuth?.clearProfile,
    features.blockchain,
    features.flow,
    features.lens,
  ]);

  // Helper properties
  const helpers = useMemo(() => ({
    // Core helpers
    hasUser: baseAuth.isAuthenticated,
    
    // Blockchain helpers
    hasWallet: blockchainAuth?.hasWallet || false,
    walletAddress: blockchainAuth?.address || null,
    currentChain: blockchainAuth?.currentChain || null,
    
    // Flow helpers
    hasFlowAccount: flowAuth?.hasFlowAccount || false,
    flowAddress: flowAuth?.flowAddress || null,
    
    // Lens helpers
    hasLensProfile: lensAuth?.hasLensProfile || false,
    lensHandle: lensAuth?.lensHandle || null,
    
    // Combined helpers
    isFullyConnected: baseAuth.isAuthenticated && 
                     (!features.blockchain || blockchainAuth?.hasWallet) &&
                     (!features.flow || flowAuth?.hasFlowAccount) &&
                     (!features.lens || lensAuth?.hasLensProfile),
  }), [
    baseAuth.isAuthenticated,
    blockchainAuth?.hasWallet,
    blockchainAuth?.address,
    blockchainAuth?.currentChain,
    flowAuth?.hasFlowAccount,
    flowAuth?.flowAddress,
    lensAuth?.hasLensProfile,
    lensAuth?.lensHandle,
    features.blockchain,
    features.flow,
    features.lens,
  ]);

  return {
    ...authState,
    ...authActions,
    ...helpers,
  };
};

// Convenience hooks for common feature combinations
export const useBasicAuth = () => useAuth({});
export const useWeb3Auth = () => useAuth({ blockchain: true });
export const useFlowOnlyAuth = () => useAuth({ flow: true });
export const useFullAuth = () => useAuth({ blockchain: true, flow: true, lens: true });