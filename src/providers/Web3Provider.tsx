import React, { createContext, useContext, useEffect, useState } from "react";
import { useFlow } from "@/hooks/useFlow";
import { useLens } from "@/hooks/useLens";
import { config, debugLog } from "@/config/environment";

// Multichain user identity
export interface MultiChainUser {
  flowAddress?: string;
  lensProfile?: any; // Will be typed properly when Lens integration is complete
  storyIPAssets?: any[]; // Will be typed properly when Story integration is complete
  isConnected: boolean;
}

interface Web3ContextType {
  user: MultiChainUser;
  isLoading: boolean;
  error: string | null;
  
  // Flow blockchain methods
  flowLogin: () => Promise<void>;
  flowLogout: () => Promise<void>;
  
  // Lens protocol methods
  lensLogin: () => Promise<void>;
  lensLogout: () => Promise<void>;
  
  // Story protocol methods (to be implemented)
  storyConnect: () => Promise<void>;
  
  // Utility methods
  connectAll: () => Promise<void>;
  disconnectAll: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MultiChainUser>({
    isConnected: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize blockchain hooks
  const flow = useFlow();
  const lens = useLens();

  // Update user state when blockchain connections change
  useEffect(() => {
    const updateUser = () => {
      const newUser: MultiChainUser = {
        flowAddress: flow.user.loggedIn ? flow.user.addr : undefined,
        lensProfile: lens.profile,
        isConnected: Boolean(flow.user.loggedIn || lens.profile)
      };
      
      setUser(newUser);
      debugLog('User state updated:', newUser);
    };

    updateUser();
  }, [flow.user, lens.profile]);

  // Aggregate loading states
  useEffect(() => {
    setIsLoading(flow.isLoading || lens.isLoading);
  }, [flow.isLoading, lens.isLoading]);

  // Aggregate error states
  useEffect(() => {
    const errors = [flow.error, lens.error].filter(Boolean);
    setError(errors.length > 0 ? errors.join('; ') : null);
  }, [flow.error, lens.error]);

  const flowLogin = async () => {
    try {
      setError(null);
      await flow.logIn();
      
      // Set up user collection if needed
      if (flow.user.loggedIn && flow.user.addr) {
        const hasCollection = await flow.checkUserCollection(flow.user.addr);
        if (!hasCollection) {
          debugLog('Setting up user collection...');
          await flow.setupUserCollection();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Flow login failed';
      setError(errorMessage);
      console.error('Flow login error:', err);
    }
  };

  const flowLogout = async () => {
    try {
      setError(null);
      await flow.logOut();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Flow logout failed';
      setError(errorMessage);
      console.error('Flow logout error:', err);
    }
  };

  const lensLogin = async () => {
    try {
      setError(null);
      await lens.login();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lens login failed';
      setError(errorMessage);
      console.error('Lens login error:', err);
    }
  };

  const lensLogout = async () => {
    try {
      setError(null);
      await lens.logout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lens logout failed';
      setError(errorMessage);
      console.error('Lens logout error:', err);
    }
  };

  const storyConnect = async () => {
    // TODO: Implement Story Protocol connection
    console.log('Story Protocol connection not yet implemented');
  };

  const connectAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        flowLogin(),
        lensLogin(),
        storyConnect()
      ]);
    } catch (err) {
      console.error('Failed to connect to all chains:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        flowLogout(),
        lensLogout()
      ]);
    } catch (err) {
      console.error('Failed to disconnect from all chains:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    // Refresh user data from all connected chains
    debugLog('Refreshing user data...');
    // Implementation will be added as each chain integration is completed
  };

  const contextValue: Web3ContextType = {
    user,
    isLoading,
    error,
    flowLogin,
    flowLogout,
    lensLogin,
    lensLogout,
    storyConnect,
    connectAll,
    disconnectAll,
    refreshUserData
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};