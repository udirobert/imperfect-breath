import * as fcl from "@onflow/fcl";

export interface FlowConfig {
  network: string;
  accessNode: string;
  discoveryWallet: string;
  contractAddress: string;
  flowTokenAddress: string;
  fungibleTokenAddress: string;
  evmRpcUrl?: string; // Optional EVM RPC endpoint
}

export class FlowConfigService {
  private config: FlowConfig;
  private isConfigured = false;

  constructor() {
    this.config = this.getConfigFromEnvironment();
    this.setupFCL();
  }

  private getConfigFromEnvironment(): FlowConfig {
    const network = import.meta.env.VITE_FLOW_NETWORK || "testnet";

    // Default configurations for different networks
    const networkConfigs = {
      testnet: {
        accessNode: "https://rest-testnet.onflow.org",
        discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
        flowTokenAddress: "0x7e60df042a9c0868",
        fungibleTokenAddress: "0x9a0766d93b6608b7",
        evmRpcUrl: "https://testnet.evm.nodes.onflow.org",
      },
      mainnet: {
        accessNode: "https://rest-mainnet.onflow.org",
        discoveryWallet: "https://fcl-discovery.onflow.org/authn",
        flowTokenAddress: "0x1654653399040a61",
        fungibleTokenAddress: "0xf233dcee88fe0abe",
        evmRpcUrl: "https://mainnet.evm.nodes.onflow.org",
      },
      emulator: {
        accessNode: "http://127.0.0.1:8888",
        discoveryWallet: "http://localhost:8701/fcl/authn",
        flowTokenAddress: "0x0ae53cb6e3f42a79",
        fungibleTokenAddress: "0xee82856bf20e2aa6",
        evmRpcUrl: "http://127.0.0.1:8545", // Local EVM emulator
      },
    };

    const defaultConfig =
      networkConfigs[network as keyof typeof networkConfigs] ||
      networkConfigs.testnet;

    return {
      network,
      accessNode:
        import.meta.env.VITE_FLOW_ACCESS_API || defaultConfig.accessNode,
      discoveryWallet:
        import.meta.env.VITE_FLOW_DISCOVERY_WALLET ||
        defaultConfig.discoveryWallet,
      contractAddress:
        import.meta.env.VITE_IMPERFECT_BREATH_ADDRESS || "0xb8404e09b36b6623",
      flowTokenAddress:
        import.meta.env.VITE_FLOW_TOKEN_ADDRESS ||
        defaultConfig.flowTokenAddress,
      fungibleTokenAddress:
        import.meta.env.VITE_FUNGIBLE_TOKEN_ADDRESS ||
        defaultConfig.fungibleTokenAddress,
      evmRpcUrl:
        import.meta.env.VITE_FLOW_EVM_RPC_URL || defaultConfig.evmRpcUrl,
    };
  }

  private setupFCL(): void {
    try {
      fcl.config({
        "accessNode.api": this.config.accessNode,
        "discovery.wallet": this.config.discoveryWallet,
        "0xImperfectBreath": this.config.contractAddress,
        "0xFlowToken": this.config.flowTokenAddress,
        "0xFungibleToken": this.config.fungibleTokenAddress,
        "fcl.accountProof.resolver": async () => ({
          appIdentifier: "ImperfectBreath",
          nonce: Math.random().toString(36).substring(2, 15),
        }),
      });

      this.isConfigured = true;
      console.log(
        "✅ FCL configured successfully for network:",
        this.config.network,
      );
      console.log("📋 Contract address:", this.config.contractAddress);
    } catch (error) {
      console.error("❌ Failed to configure FCL:", error);
      throw new Error("Flow configuration failed");
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): FlowConfig {
    return { ...this.config };
  }

  /**
   * Check if FCL is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return fcl.currentUser();
  }

  /**
   * Authenticate user
   */
  async authenticate(): Promise<unknown> {
    try {
      return await fcl.authenticate();
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async unauthenticate(): Promise<void> {
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await fcl.currentUser().snapshot();
      return user.loggedIn === true;
    } catch (error) {
      console.error("Failed to check authentication status:", error);
      return false;
    }
  }

  /**
   * Get user address
   */
  async getUserAddress(): Promise<string | null> {
    try {
      const user = await fcl.currentUser().snapshot();
      return user.addr || null;
    } catch (error) {
      console.error("Failed to get user address:", error);
      return null;
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribeToAuth(callback: (user: unknown) => void): () => void {
    return fcl.currentUser().subscribe(callback) as () => void;
  }

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<unknown> {
    try {
      return await fcl.send([fcl.getAccount(address)]).then(fcl.decode);
    } catch (error) {
      console.error("Failed to get account:", error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<unknown> {
    try {
      return await fcl.tx(transactionId).snapshot();
    } catch (error) {
      console.error("Failed to get transaction status:", error);
      throw error;
    }
  }

  /**
   * Wait for transaction to be sealed
   */
  async waitForTransaction(transactionId: string): Promise<unknown> {
    try {
      return await fcl.tx(transactionId).onceSealed();
    } catch (error) {
      console.error("Failed to wait for transaction:", error);
      throw error;
    }
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.contractAddress) {
      errors.push("VITE_IMPERFECT_BREATH_ADDRESS is not configured");
    }

    if (!this.config.accessNode) {
      errors.push("VITE_FLOW_ACCESS_API is not configured");
    }

    if (!this.config.discoveryWallet) {
      errors.push("VITE_FLOW_DISCOVERY_WALLET is not configured");
    }

    // Validate contract address format
    if (
      this.config.contractAddress &&
      !this.config.contractAddress.match(/^0x[a-fA-F0-9]{16}$/)
    ) {
      errors.push(
        "Contract address format is invalid (should be 0x followed by 16 hex characters)",
      );
    }

    // Validate network
    if (!["testnet", "mainnet", "emulator"].includes(this.config.network)) {
      errors.push(
        "Invalid network specified (should be testnet, mainnet, or emulator)",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get network explorer URL for transaction
   */
  getTransactionUrl(transactionId: string): string {
    const baseUrls = {
      testnet: "https://testnet.flowscan.org/transaction",
      mainnet: "https://flowscan.org/transaction",
      emulator: "#", // No explorer for emulator
    };

    const baseUrl =
      baseUrls[this.config.network as keyof typeof baseUrls] ||
      baseUrls.testnet;
    return `${baseUrl}/${transactionId}`;
  }

  /**
   * Get network explorer URL for account
   */
  getAccountUrl(address: string): string {
    const baseUrls = {
      testnet: "https://testnet.flowscan.org/account",
      mainnet: "https://flowscan.org/account",
      emulator: "#", // No explorer for emulator
    };

    const baseUrl =
      baseUrls[this.config.network as keyof typeof baseUrls] ||
      baseUrls.testnet;
    return `${baseUrl}/${address}`;
  }

  /**
   * Format Flow amount for display
   */
  formatFlowAmount(amount: string | number): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(num);
  }

  /**
   * Convert Flow amount to fixed decimal string
   */
  toFlowAmount(amount: number): string {
    return amount.toFixed(8);
  }
}

// Create singleton instance
export const flowConfig = new FlowConfigService();

// Re-export FCL for convenience
export { fcl };

// Export types for external use
export type { FlowConfig as FlowConfigType };
