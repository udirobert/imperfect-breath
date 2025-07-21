import { useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";

export const useBlockchainAuth = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const connectWallet = useCallback(async () => {
    try {
      if (isConnected) {
        console.log("Wallet already connected:", address);
        return { success: true };
      }

      // Use first available connector
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
        return { success: true };
      }
      
      return { success: false, error: "No wallet connector available" };
    } catch (error) {
      console.error("Wallet connection failed:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Connection failed" 
      };
    }
  }, [isConnected, address, connect, connectors]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (isConnected) {
        disconnect();
      }
      return { success: true };
    } catch (error) {
      console.error("Wallet disconnect failed:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Disconnect failed" 
      };
    }
  }, [isConnected, disconnect]);

  return {
    // Wallet state
    address,
    isConnected,
    isConnecting,
    chain: chain?.name,
    chainId: chain?.id,
    
    // Wallet info object
    wallet: isConnected
      ? {
          address,
          chain: chain?.name,
          chainId: chain?.id,
          isConnected,
        }
      : null,

    // Connection methods
    connectWallet,
    disconnectWallet,
    
    // Available connectors
    connectors,
    
    // Helper properties
    hasWallet: isConnected && !!address,
    currentChain: chain?.name || null,
    currentChainId: chain?.id || null,
  };
};