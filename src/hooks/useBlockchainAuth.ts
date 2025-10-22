/**
 * Unified Blockchain Authentication Hook
 * 
 * ENHANCEMENT FIRST: Enhances existing Lens/Flow hooks with proper SDK integration
 * AGGRESSIVE CONSOLIDATION: Replaces redundant auth logic
 * DRY: Single source of truth for blockchain operations
 * CLEAN: Clear separation of concerns
 * MODULAR: Composable and reusable
 * PERFORMANT: Efficient state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { blockchainAuthService } from '../services/blockchain/BlockchainAuthService';
import type { SignableMessage } from 'viem';

// Auth state interface
interface BlockchainAuthState {
  isAuthenticated: {
    lens: boolean;
    flow: boolean;
    both: boolean;
  };
  isInitializing: boolean;
  isAuthenticating: boolean;
  isProcessingPayment: boolean;
  error: string | null;
  lensSession: unknown; // SessionClient from Lens SDK
  flowUser: unknown; // Flow user object
}

// Payment result interface
interface PaymentResult {
  success: boolean;
  txId?: string;
  error?: string;
}

// Subscription plan interface
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
}

export const useBlockchainAuth = () => {
  const [state, setState] = useState<BlockchainAuthState>({
    isAuthenticated: {
      lens: false,
      flow: false,
      both: false,
    },
    isInitializing: true,
    isAuthenticating: false,
    isProcessingPayment: false,
    error: null,
    lensSession: null,
    flowUser: null,
  });

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const initRef = useRef(false);

  // Initialize and resume session on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        // Initialize with testnet configuration
        await blockchainAuthService.initializeLens({
          appId: '0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7', // Testnet app ID
          environment: (await import('@lens-protocol/client')).testnet,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        });

        await blockchainAuthService.initializeFlow({
          network: 'testnet',
          accessNode: 'https://rest-testnet.onflow.org',
          discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
        });

        // Resume existing session
        const sessionResult = await blockchainAuthService.resumeSession();
        
        setState(prev => ({
          ...prev,
          isInitializing: false,
          isAuthenticated: {
            lens: !!sessionResult.lensSession,
            flow: !!sessionResult.flowUser?.addr && sessionResult.flowUser.loggedIn,
            both: !!(sessionResult.lensSession && sessionResult.flowUser?.addr && sessionResult.flowUser.loggedIn),
          },
          lensSession: sessionResult.lensSession || null,
          flowUser: sessionResult.flowUser || null,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isInitializing: false,
          error: error instanceof Error ? error.message : 'Initialization failed',
        }));
      }
    };

    initialize();
  }, []);

  // Update auth state when blockchain changes occur
  useEffect(() => {
    const updateAuthState = () => {
      const authStatus = blockchainAuthService.isAuthenticated();
      setState(prev => ({
        ...prev,
        isAuthenticated: {
          ...authStatus,
          both: authStatus.lens && authStatus.flow,
        },
      }));
    };

    // Set up listeners if needed
    // For now, just call manually after auth operations
  }, []);

  // Authenticate to both Lens and Flow
  const authenticateBoth = useCallback(async () => {
    if (!isConnected || !address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    if (!signMessageAsync) {
      setState(prev => ({ ...prev, error: 'Sign message function not available' }));
      return { success: false, error: 'Sign message function not available' };
    }

    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const result = await blockchainAuthService.authenticateBoth(
        address,
        async (message: SignableMessage) => {
          return await signMessageAsync({ message });
        }
      );

      if (result.success) {
        const authStatus = blockchainAuthService.isAuthenticated();
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          isAuthenticated: {
            ...authStatus,
            both: authStatus.lens && authStatus.flow,
          },
          lensSession: result.lensSession || prev.lensSession,
          flowUser: result.flowUser || prev.flowUser,
        }));
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          error: result.error || 'Authentication failed',
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, isConnected, signMessageAsync]);

  // Authenticate to Lens only
  const authenticateLens = useCallback(async () => {
    if (!isConnected || !address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return { success: false, error: 'Wallet not connected' };
    }

    if (!signMessageAsync) {
      setState(prev => ({ ...prev, error: 'Sign message function not available' }));
      return { success: false, error: 'Sign message function not available' };
    }

    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const result = await blockchainAuthService.authenticateLens(
        address,
        async (message: SignableMessage) => {
          return await signMessageAsync({ message });
        }
      );

      if (result.success && result.lensSession) {
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          isAuthenticated: {
            ...prev.isAuthenticated,
            lens: true,
            both: prev.isAuthenticated.flow && true,
          },
          lensSession: result.lensSession,
        }));
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          error: result.error || 'Lens authentication failed',
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lens authentication failed';
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [address, isConnected, signMessageAsync]);

  // Authenticate to Flow only
  const authenticateFlow = useCallback(async () => {
    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const result = await blockchainAuthService.authenticateFlow();

      if (result.success) {
        const flowUser = blockchainAuthService.getCurrentFlowUser();
        const authStatus = blockchainAuthService.isAuthenticated();
        
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          isAuthenticated: {
            ...authStatus,
            both: authStatus.lens && authStatus.flow,
          },
          flowUser,
        }));
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
          error: result.error || 'Flow authentication failed',
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Flow authentication failed';
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout from both services
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isAuthenticating: true }));
    
    try {
      await blockchainAuthService.logout();
      
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        isAuthenticated: {
          lens: false,
          flow: false,
          both: false,
        },
        lensSession: null,
        flowUser: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  }, []);

  // Execute Flow payment
  const executePayment = useCallback(async (amount: string, recipient: string): Promise<PaymentResult> => {
    setState(prev => ({ ...prev, isProcessingPayment: true, error: null }));

    try {
      const result = await blockchainAuthService.executeFlowPayment(amount, recipient);

      if (result.success) {
        setState(prev => ({
          ...prev,
          isProcessingPayment: false,
        }));
        return result;
      } else {
        setState(prev => ({
          ...prev,
          isProcessingPayment: false,
          error: result.error || 'Payment failed',
        }));
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setState(prev => ({
        ...prev,
        isProcessingPayment: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Subscribe to a plan using Flow
  const subscribeToPlan = useCallback(async (plan: SubscriptionPlan): Promise<PaymentResult> => {
    setState(prev => ({ ...prev, isProcessingPayment: true, error: null }));

    try {
      const result = await blockchainAuthService.subscribe(plan);

      if (result.success) {
        setState(prev => ({
          ...prev,
          isProcessingPayment: false,
        }));
        return result;
      } else {
        setState(prev => ({
          ...prev,
          isProcessingPayment: false,
          error: result.error || 'Subscription failed',
        }));
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription failed';
      setState(prev => ({
        ...prev,
        isProcessingPayment: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Refresh auth status
  const refreshAuthStatus = useCallback(() => {
    const authStatus = blockchainAuthService.isAuthenticated();
    setState(prev => ({
      ...prev,
      isAuthenticated: {
        ...authStatus,
        both: authStatus.lens && authStatus.flow,
      },
    }));
  }, []);

  return {
    // State
    state,
    isAuthenticated: state.isAuthenticated.both,
    isLensAuthenticated: state.isAuthenticated.lens,
    isFlowAuthenticated: state.isAuthenticated.flow,
    
    // Authentication methods
    authenticateBoth,
    authenticateLens,
    authenticateFlow,
    logout,
    
    // Payment methods
    executePayment,
    subscribeToPlan,
    
    // Utilities
    refreshAuthStatus,
    
    // Direct access to auth service for advanced use
    authService: blockchainAuthService,
  };
};