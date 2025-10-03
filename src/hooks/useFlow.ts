/**\n * Consolidated Flow Hook
 * Single source of truth for all Flow blockchain functionality
 *
 * @version 3.0.0
 * @updated Lens V3 migration - 2025-05-07
 */

import { useState, useEffect, useCallback, useRef } from "react";
import BaseFlowClient from "../lib/flow/clients/base-client";
import NFTClient from "../lib/flow/clients/nft-client";
import TransactionClient from "../lib/flow/clients/transaction-client";
import type {
  FlowConfig,
  FlowState,
  FlowUser,
  COAInfo,
  BreathingPatternAttributes,
  NFTMetadata,
  RoyaltyInfo,
  BreathingPatternNFT,
  MarketplaceListing,
  PurchaseResult,
  BatchTransactionResult,
  EVMBatchCall,
  FlowAccount,
  TransactionStatus,
  FlowTransactionResult,
} from "../lib/flow/types";

interface UseFlowConfig {
  network?: "testnet" | "mainnet" | "emulator";
  autoConnect?: boolean;
  enableCOA?: boolean;
}

interface UseFlowReturn {
  // State
  state: FlowState;
  user: FlowUser | null;
  coaInfo: COAInfo | null;

  // Loading states
  isLoading: boolean;
  isConnecting: boolean;
  isMinting: boolean;
  isTransacting: boolean;

  // Error handling
  error: string | null;

  // Core actions
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // Account management
  setupAccount: () => Promise<string>;
  getAccountInfo: (address?: string) => Promise<FlowAccount>;

  // NFT operations
  mintBreathingPattern: (
    attributes: BreathingPatternAttributes,
    metadata: NFTMetadata,
    recipient?: string,
    royalties?: RoyaltyInfo[],
  ) => Promise<string>;
  transferNFT: (nftId: string, recipient: string) => Promise<string>;
  purchaseNFT: (nftId: string, price: number, marketplaceAddress: string) => Promise<string>;
  getNFTs: (address?: string) => Promise<BreathingPatternNFT[]>;
  getNFT: (
    nftId: string,
    address?: string,
  ) => Promise<BreathingPatternNFT | null>;

  // Batch operations
  batchMintPatterns: (
    patterns: Array<{
      attributes: BreathingPatternAttributes;
      metadata: NFTMetadata;
      recipient?: string;
      royalties?: RoyaltyInfo[];
    }>,
  ) => Promise<string[]>;

  // Transaction management
  executeTransaction: (
    script: string,
    args?: unknown[],
  ) => Promise<FlowTransactionResult>;
  getTransactionStatus: (txId: string) => Promise<TransactionStatus>;
  waitForTransaction: (txId: string) => Promise<FlowTransactionResult>;

  // EVM/COA operations
  executeEVMBatch: (calls: EVMBatchCall[]) => Promise<BatchTransactionResult>;
  getCOAInfo: () => Promise<COAInfo | null>;

  // Utilities
  clearError: () => void;
  refreshData: () => Promise<void>;
  dispose: () => void;
}

export const useFlow = (config: UseFlowConfig = {}): UseFlowReturn => {
  const {
    network = "testnet",
    autoConnect = false,
    enableCOA = false,
  } = config;

  // Client instances - use singleton pattern properly
  const baseClient = useRef<BaseFlowClient>(BaseFlowClient.getInstance());
  const nftClient = useRef<NFTClient>(new NFTClient());
  const transactionClient = useRef<TransactionClient>(new TransactionClient());

  // State
  const [state, setState] = useState<FlowState>({
    isInitialized: false,
    isConnected: false,
    isLoading: false,
    error: null,
    user: null,
    coaInfo: null,
  });

  const [user, setUser] = useState<FlowUser | null>(null);
  const [coaInfo, setCOAInfo] = useState<COAInfo | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // User subscription - track if this instance has subscribed
  const userUnsubscribe = useRef<(() => void) | null>(null);
  const hasSubscribed = useRef<boolean>(false);

  /**
   * Initialize Flow client
   */
  const initialize = useCallback(async () => {
    // Check if base client is already initialized for this network
    if (baseClient.current.isReady() && baseClient.current.getConfig()?.network === network) {
      setState((prev) => ({
        ...prev,
        isInitialized: true,
      }));
      
      // Only subscribe if this instance hasn't subscribed yet
      if (!hasSubscribed.current) {
        userUnsubscribe.current = baseClient.current.subscribeToUser((user) => {
          setUser(user);
          setState((prev) => ({
            ...prev,
            user,
            isConnected: user?.loggedIn || false,
          }));
        });
        hasSubscribed.current = true;
        console.log("Subscribing to user changes");
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const flowConfig: FlowConfig = {
        network,
        accessNode:
          network === "testnet"
            ? "https://rest-testnet.onflow.org"
            : "https://rest-mainnet.onflow.org",
        discoveryWallet:
          network === "testnet"
            ? "https://fcl-discovery.onflow.org/testnet/authn"
            : "https://fcl-discovery.onflow.org/authn",
        contractAddress:
          network === "testnet" ? "0xf8d6e0586b0a20c7" : "0x1234567890abcdef", // Replace with mainnet address
        fungibleTokenAddress:
          network === "testnet" ? "0x9a0766d93b6608b7" : "0xf233dcee88fe0abe",
        flowTokenAddress:
          network === "testnet" ? "0x7e60df042a9c0868" : "0x1654653399040a61",
      };

      await baseClient.current.initialize(flowConfig);

      // Only subscribe if this instance hasn't subscribed yet
      if (!hasSubscribed.current) {
        userUnsubscribe.current = baseClient.current.subscribeToUser((user) => {
          setUser(user);
          setState((prev) => ({
            ...prev,
            user,
            isConnected: user?.loggedIn || false,
          }));
        });
        hasSubscribed.current = true;
        console.log("Subscribing to user changes");
      }

      setState((prev) => ({
        ...prev,
        isInitialized: true,
      }));

      console.log("Flow client initialized");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Flow initialization failed";
      setError(errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [network]);

  /**
   * Connect to Flow wallet
   */
  const connect = useCallback(async () => {
    if (!state.isInitialized) {
      await initialize();
    }

    setIsConnecting(true);
    setError(null);

    try {
      await baseClient.current.authenticate();
      console.log("Connected to Flow wallet");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      setError(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [state.isInitialized, initialize]);

  /**
   * Disconnect from Flow wallet
   */
  const disconnect = useCallback(async () => {
    try {
      await baseClient.current.unauthenticate();
      setUser(null);
      setCOAInfo(null);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        user: null,
        coaInfo: null,
      }));

      console.log("Disconnected from Flow wallet");
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }, []);

  /**
   * Setup account for NFT collection
   */
  const setupAccount = useCallback(async (): Promise<string> => {
    if (!state.isConnected) {
      throw new Error("Not connected to Flow wallet");
    }

    setIsTransacting(true);
    try {
      return await nftClient.current.setupAccount();
    } finally {
      setIsTransacting(false);
    }
  }, [state.isConnected]);

  /**
   * Get account information
   */
  const getAccountInfo = useCallback(
    async (address?: string): Promise<FlowAccount> => {
      const targetAddress = address || user?.addr;
      if (!targetAddress) {
        throw new Error("No address provided and user not connected");
      }

      return baseClient.current.getAccount(targetAddress);
    },
    [user?.addr],
  );

  /**
   * Mint breathing pattern NFT
   */
  const mintBreathingPattern = useCallback(
    async (
      attributes: BreathingPatternAttributes,
      metadata: NFTMetadata,
      recipient?: string,
      royalties: RoyaltyInfo[] = [],
    ): Promise<string> => {
      if (!state.isConnected || !user?.addr) {
        throw new Error("Not connected to Flow wallet");
      }

      setIsMinting(true);
      try {
        const targetRecipient = recipient || user.addr;
        return await nftClient.current.mintBreathingPattern(
          attributes,
          metadata,
          targetRecipient,
          royalties,
        );
      } finally {
        setIsMinting(false);
      }
    },
    [state.isConnected, user?.addr],
  );

  /**
   * Transfer NFT
   */
  const transferNFT = useCallback(
    async (nftId: string, recipient: string): Promise<string> => {
      if (!state.isConnected) {
        throw new Error("Not connected to Flow wallet");
      }

      setIsTransacting(true);
      try {
        return await nftClient.current.transferNFT(nftId, recipient);
      } finally {
        setIsTransacting(false);
      }
    },
    [state.isConnected],
  );

  /**
   * Purchase NFT from marketplace
   */
  const purchaseNFT = useCallback(
    async (nftId: string, price: number, marketplaceAddress: string): Promise<string> => {
      if (!state.isConnected) {
        throw new Error("Not connected to Flow wallet");
      }

      setIsTransacting(true);
      try {
        return await nftClient.current.purchaseNFT(nftId, price, marketplaceAddress);
      } finally {
        setIsTransacting(false);
      }
    },
    [state.isConnected],
  );

  /**
   * Get NFTs for an account
   */
  const getNFTs = useCallback(
    async (address?: string): Promise<BreathingPatternNFT[]> => {
      const targetAddress = address || user?.addr;
      if (!targetAddress) {
        return [];
      }

      return nftClient.current.getAllNFTs(targetAddress);
    },
    [user?.addr],
  );

  /**
   * Get single NFT
   */
  const getNFT = useCallback(
    async (
      nftId: string,
      address?: string,
    ): Promise<BreathingPatternNFT | null> => {
      const targetAddress = address || user?.addr;
      if (!targetAddress) {
        return null;
      }

      return nftClient.current.getNFTMetadata(targetAddress, nftId);
    },
    [user?.addr],
  );

  /**
   * Batch mint patterns
   */
  const batchMintPatterns = useCallback(
    async (
      patterns: Array<{
        attributes: BreathingPatternAttributes;
        metadata: NFTMetadata;
        recipient?: string;
        royalties?: RoyaltyInfo[];
      }>,
    ): Promise<string[]> => {
      if (!state.isConnected || !user?.addr) {
        throw new Error("Not connected to Flow wallet");
      }

      setIsMinting(true);
      try {
        const patternsWithRecipients = patterns.map((pattern) => ({
          ...pattern,
          recipient: pattern.recipient || user.addr!,
          royalties: pattern.royalties || [],
        }));

        return await nftClient.current.batchMintPatterns(
          patternsWithRecipients,
        );
      } finally {
        setIsMinting(false);
      }
    },
    [state.isConnected, user?.addr],
  );

  /**
   * Execute transaction
   */
  const executeTransaction = useCallback(
    async (
      script: string,
      args: unknown[] = [],
    ): Promise<FlowTransactionResult> => {
      if (!state.isConnected) {
        throw new Error("Not connected to Flow wallet");
      }

      setIsTransacting(true);
      try {
        return await transactionClient.current.executeTransaction(script, args);
      } finally {
        setIsTransacting(false);
      }
    },
    [state.isConnected],
  );

  /**
   * Get transaction status
   */
  const getTransactionStatus = useCallback(
    async (txId: string): Promise<TransactionStatus> => {
      return transactionClient.current.getTransactionStatus(txId);
    },
    [],
  );

  /**
   * Wait for transaction
   */
  const waitForTransaction = useCallback(
    async (txId: string): Promise<FlowTransactionResult> => {
      return baseClient.current.waitForTransaction(txId);
    },
    [],
  );

  /**
   * Execute EVM batch calls
   */
  const executeEVMBatch = useCallback(
    async (calls: EVMBatchCall[]): Promise<BatchTransactionResult> => {
      if (!state.isConnected) {
        throw new Error("Not connected to Flow wallet");
      }

      setIsTransacting(true);
      try {
        return await transactionClient.current.executeEVMBatchCalls(calls);
      } finally {
        setIsTransacting(false);
      }
    },
    [state.isConnected],
  );

  /**
   * Get COA information
   */
  const getCOAInfo = useCallback(async (): Promise<COAInfo | null> => {
    if (!user?.addr) {
      return null;
    }

    try {
      // Make a real query to get COA information from Flow
      const coaScript = `
        import CoaClient from 0xCoaClient

        pub fun main(address: Address): {String: AnyStruct} {
          let coaInfo = CoaClient.getCoaInfo(address)
          return {
            "address": coaInfo.address.toString(),
            "balance": coaInfo.balance,
            "isInitialized": coaInfo.isInitialized
          }
        }
      `;

      const result = await baseClient.current.executeScript(coaScript, [
        { value: user.addr, type: "Address" },
      ]);

      if (!result) {
        return null;
      }

      return {
        address: result.address,
        balance: parseFloat(result.balance),
        isInitialized: result.isInitialized,
      };
    } catch (error) {
      console.error("Failed to get COA info:", error);
      return null;
    }
  }, [user?.addr]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async () => {
    if (!state.isConnected || !user?.addr) {
      return;
    }

    try {
      // Refresh COA info if enabled
      if (enableCOA) {
        const coa = await getCOAInfo();
        setCOAInfo(coa);
      }

      // Could refresh other data here
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [state.isConnected, user?.addr, enableCOA, getCOAInfo]);

  /**
   * Dispose of resources
   */
  const dispose = useCallback(() => {
    if (userUnsubscribe.current) {
      userUnsubscribe.current();
      userUnsubscribe.current = null;
      hasSubscribed.current = false;
    }

    // Don't dispose the singleton base client, just reset local state
    setState({
      isInitialized: false,
      isConnected: false,
      isLoading: false,
      error: null,
      user: null,
      coaInfo: null,
    });

    setUser(null);
    setCOAInfo(null);
    setError(null);

    console.log("Flow hook instance disposed");
  }, []);

  // Initialize on mount - fixed dependency array
  useEffect(() => {
    let mounted = true;
    
    const initializeFlow = async () => {
      try {
        await initialize();
        
        if (!mounted) return;
        
        // Auto-connect if requested
        if (autoConnect) {
          try {
            await connect();

            if (!mounted) return;

            // Get COA info if enabled after connection
            if (enableCOA) {
              const coa = await getCOAInfo();
              if (mounted) {
                setCOAInfo(coa);
              }
            }
          } catch (connectError) {
            console.warn("Auto-connect failed:", connectError);
          }
        }
      } catch (error) {
        console.error("Flow initialization failed:", error);
      }
    };

    initializeFlow();

    return () => {
      mounted = false;
      if (userUnsubscribe.current) {
        userUnsubscribe.current();
        userUnsubscribe.current = null;
        hasSubscribed.current = false;
      }
    };
  }, [network, autoConnect, enableCOA]); // Only depend on config values, not functions

  // Update state when user changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      user,
      isConnected: user?.loggedIn || false,
    }));
  }, [user]);

  return {
    // State
    state,
    user,
    coaInfo,

    // Loading states
    isLoading,
    isConnecting,
    isMinting,
    isTransacting,

    // Error handling
    error,

    // Core actions
    initialize,
    connect,
    disconnect,

    // Account management
    setupAccount,
    getAccountInfo,

    // NFT operations
    mintBreathingPattern,
    transferNFT,
    purchaseNFT,
    getNFTs,
    getNFT,

    // Batch operations
    batchMintPatterns,

    // Transaction management
    executeTransaction,
    getTransactionStatus,
    waitForTransaction,

    // EVM/COA operations
    executeEVMBatch,
    getCOAInfo,

    // Utilities
    clearError,
    refreshData,
    dispose,
  };
};