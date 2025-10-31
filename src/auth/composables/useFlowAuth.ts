import { useState, useEffect, useCallback, useRef } from "react";
import * as fcl from "@onflow/fcl";
import * as sdk from "@onflow/sdk";
import { revenueCatAuthIntegration } from "../../lib/monetization/revenueCatAuthIntegration";

// SYSTEMATIC FIX: Latest Flow Forte SDK imports
// Updated for Forte network upgrade with scheduled transactions and Flow Actions

// SYSTEMATIC FIX: Flow Forte user type definition with new capabilities
interface FlowUser {
  loggedIn: boolean;
  addr: string | null;
  services?: unknown[];
  cid?: string;
  expiresAt?: number;
  f_type?: string;
  f_vsn?: string;
  [key: string]: unknown;
}

// Flow Actions support (Forte upgrade)
interface FlowActionCapability {
  scheduledTransactions: boolean;
  flowActions: boolean;
  webAuthN: boolean;
}

// SYSTEMATIC FIX: Enhanced singleton for Flow Forte features
class FlowAuthManager {
  private static instance: FlowAuthManager;
  private user: FlowUser | null = null;
  private subscribers: Set<(user: FlowUser | null) => void> = new Set();
  private isInitialized = false;
  private unsubscribe: (() => void) | null = null;
  private capabilities: FlowActionCapability = {
    scheduledTransactions: false,
    flowActions: false,
    webAuthN: false,
  };

  static getInstance(): FlowAuthManager {
    if (!FlowAuthManager.instance) {
      FlowAuthManager.instance = new FlowAuthManager();
    }
    return FlowAuthManager.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true;

    // SYSTEMATIC FIX: Configure FCL for Flow Forte network
    await fcl.config({
      "app.detail.title": "Imperfect Breath",
      "app.detail.icon": "https://imperfectbreath.app/icon.png",
      "accessNode.api":
        process.env.FLOW_ACCESS_NODE || "https://rest-mainnet.onflow.org",
      "discovery.wallet":
        process.env.FLOW_DISCOVERY_WALLET ||
        "https://fcl-discovery.onflow.org/authn",
      "flow.network": process.env.FLOW_NETWORK || "mainnet",
    });

    // Check for Forte capabilities
    try {
      await this.checkForteCapabilities();
    } catch (error) {
      console.warn("Failed to check Flow Forte capabilities:", error);
    }

    // Single FCL subscription for entire app
    this.unsubscribe = fcl.currentUser.subscribe(async (user: FlowUser) => {
      this.user = user;
      await this.notifySubscribers(user);
    }) as () => void;
  }

  subscribe(callback: (user: FlowUser | null) => void): () => void {
    this.subscribers.add(callback);

    // Immediately call with current user if available
    if (this.user) {
      callback(this.user);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private async notifySubscribers(user: unknown) {
    // Sync with RevenueCat when user logs in
    const userObj = user as { loggedIn?: boolean; addr?: string };
    if (userObj?.loggedIn && userObj?.addr) {
      try {
        await revenueCatAuthIntegration.handleFlowAuth(
          userObj.addr!,
          userObj.addr!,
        );
      } catch (error) {
        console.error("Failed to sync Flow user with RevenueCat:", error);
      }
    }

    this.subscribers.forEach((callback) => callback(user as FlowUser | null));
  }

  private async checkForteCapabilities() {
    try {
      // SYSTEMATIC FIX: Check for Flow Forte network features
      const nodeInfo = await sdk
        .send([sdk.getNodeVersionInfo()])
        .then(sdk.decode);

      // Check if node supports Forte features by examining the version info
      // In a real implementation, we would check specific features based on the node version
      const versionInfo = nodeInfo as { network?: { name?: string; version?: string } };
      const isForteNetwork = versionInfo.network?.name?.toLowerCase().includes('forte') || 
                            versionInfo.network?.version?.includes('forte');
      
      // Check for scheduled transactions support (Forte feature)
      const hasScheduledTransactions = typeof (fcl as any).scheduleTransaction === 'function';
      
      // Check for Flow Actions support
      const hasFlowActions = typeof (fcl as any).actions === 'object';
      
      // Check for WebAuthn support
      const hasWebAuthN = typeof (fcl as any).webAuthn === 'object';

      this.capabilities = {
        scheduledTransactions: isForteNetwork && hasScheduledTransactions,
        flowActions: isForteNetwork && hasFlowActions,
        webAuthN: isForteNetwork && hasWebAuthN,
      };

      console.log("Flow Forte capabilities detected:", this.capabilities);
    } catch (error) {
      console.warn("Unable to detect Flow Forte capabilities:", error);
      this.capabilities = {
        scheduledTransactions: false,
        flowActions: false,
        webAuthN: false,
      };
    }
  }

  getCapabilities(): FlowActionCapability {
    return { ...this.capabilities };
  }

  getCurrentUser() {
    return this.user;
  }

  /**
   * Schedule a transaction for future execution (Flow Forte feature)
   * @param transaction The transaction to schedule
   * @param executionTime The time when the transaction should be executed
   */
  async scheduleTransaction(
    transaction: any,
    executionTime: Date
  ): Promise<{ success: boolean; error?: string; transactionId?: string }> {
    // Check if scheduled transactions are supported
    if (!this.capabilities.scheduledTransactions) {
      return { 
        success: false, 
        error: "Scheduled transactions not supported on this network" 
      };
    }

    try {
      // In a real implementation, we would use the Flow Forte SDK to schedule the transaction
      // This is a mock implementation for now
      const scheduledTx = {
        id: `scheduled-tx-${Date.now()}`,
        transaction,
        scheduledFor: executionTime.toISOString(),
        status: 'scheduled'
      };

      console.log("Transaction scheduled:", scheduledTx);
      return { 
        success: true, 
        transactionId: scheduledTx.id 
      };
    } catch (error) {
      console.error("Failed to schedule transaction:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to schedule transaction" 
      };
    }
  }

  /**
   * Get scheduled transactions for the current user
   */
  async getScheduledTransactions(): Promise<{ success: boolean; error?: string; transactions?: any[] }> {
    // Check if scheduled transactions are supported
    if (!this.capabilities.scheduledTransactions) {
      return { 
        success: false, 
        error: "Scheduled transactions not supported on this network" 
      };
    }

    try {
      // In a real implementation, we would fetch scheduled transactions from the Flow Forte network
      // This is a mock implementation for now
      const transactions = [
        // Mock scheduled transactions
      ];

      return { 
        success: true, 
        transactions 
      };
    } catch (error) {
      console.error("Failed to fetch scheduled transactions:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch scheduled transactions" 
      };
    }
  }

  /**
   * Cancel a scheduled transaction
   * @param transactionId The ID of the scheduled transaction to cancel
   */
  async cancelScheduledTransaction(
    transactionId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Check if scheduled transactions are supported
    if (!this.capabilities.scheduledTransactions) {
      return { 
        success: false, 
        error: "Scheduled transactions not supported on this network" 
      };
    }

    try {
      // In a real implementation, we would cancel the scheduled transaction on the Flow Forte network
      // This is a mock implementation for now
      console.log("Scheduled transaction cancelled:", transactionId);
      return { success: true };
    } catch (error) {
      console.error("Failed to cancel scheduled transaction:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to cancel scheduled transaction" 
      };
    }
  }

  async authenticate() {
    try {
      return await fcl.authenticate();
    } catch (error) {
      console.error("Flow authentication failed:", error);
      throw error;
    }
  }

  async unauthenticate() {
    try {
      return await fcl.unauthenticate();
    } catch (error) {
      console.error("Flow unauthentication failed:", error);
      throw error;
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.subscribers.clear();
    this.isInitialized = false;
    FlowAuthManager.instance = null as unknown as FlowAuthManager;
  }
}

export const useFlowAuth = () => {
  const [user, setUser] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const managerRef = useRef<FlowAuthManager>();

  useEffect(() => {
    // Get singleton instance
    managerRef.current = FlowAuthManager.getInstance();

    // Subscribe to user changes
    const unsubscribe = managerRef.current.subscribe((newUser) => {
      setUser(newUser);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const login = useCallback(async () => {
    if (!managerRef.current)
      return { success: false, error: "Flow manager not initialized" };

    try {
      setIsLoading(true);
      await managerRef.current.authenticate();
      return { success: true };
    } catch (error) {
      console.error("Flow login failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!managerRef.current)
      return { success: false, error: "Flow manager not initialized" };

    try {
      setIsLoading(true);
      await managerRef.current.unauthenticate();
      return { success: true };
    } catch (error) {
      console.error("Flow logout failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Logout failed",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const flowUser = user as FlowUser | null;

  return {
    // Flow user state
    user,
    isLoading,
    isLoggedIn: !!flowUser?.loggedIn,
    address: flowUser?.addr || null,

    // Flow user info object
    flowUser:
      flowUser?.loggedIn && flowUser.addr
        ? {
            address: flowUser.addr,
            loggedIn: flowUser.loggedIn,
            services: flowUser.services || [],
          }
        : null,

    // Authentication methods
    login,
    logout,

    // Helper properties
    hasFlowAccount: !!flowUser?.loggedIn,
    flowAddress: flowUser?.addr || null,

    // SYSTEMATIC FIX: Flow Forte capabilities
    capabilities: managerRef.current?.getCapabilities() || {
      scheduledTransactions: false,
      flowActions: false,
      webAuthN: false,
    },

    // Scheduled transaction methods (Flow Forte features)
    scheduleTransaction: managerRef.current?.scheduleTransaction.bind(managerRef.current),
    getScheduledTransactions: managerRef.current?.getScheduledTransactions.bind(managerRef.current),
    cancelScheduledTransaction: managerRef.current?.cancelScheduledTransaction.bind(managerRef.current),
  };
};

// Export manager for cleanup in tests or app teardown
export { FlowAuthManager };
