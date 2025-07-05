/**
 * Base Flow Client
 * Core Flow blockchain functionality and connection management
 */

import * as fcl from '@onflow/fcl';
import * as types from '@onflow/types';
import type { 
  FlowConfig, 
  FlowAccount, 
  FlowTransaction, 
  FlowTransactionResult,
  TransactionStatus,
  FlowError 
} from '../types';

export class BaseFlowClient {
  private static instance: BaseFlowClient | null = null;
  private isInitialized = false;
  private config: FlowConfig | null = null;
  
  private constructor() {}
  
  /**
   * Singleton instance
   */
  static getInstance(): BaseFlowClient {
    if (!BaseFlowClient.instance) {
      BaseFlowClient.instance = new BaseFlowClient();
    }
    return BaseFlowClient.instance;
  }
  
  /**
   * Initialize Flow client with configuration
   */
  async initialize(config: FlowConfig): Promise<void> {
    if (this.isInitialized && this.config?.network === config.network) {
      return;
    }
    
    try {
      // Configure FCL
      fcl.config({
        'accessNode.api': config.accessNode,
        'discovery.wallet': config.discoveryWallet,
        'app.detail.title': 'Imperfect Breath',
        'app.detail.icon': '/icon.png',
        '0xProfile': config.contractAddress,
        '0xFlowToken': config.flowTokenAddress,
        '0xFungibleToken': config.fungibleTokenAddress,
      });
      
      this.config = config;
      this.isInitialized = true;
      
      console.log(`Flow client initialized for ${config.network}`);
    } catch (error) {
      console.error('Failed to initialize Flow client:', error);
      throw this.createFlowError('INIT_FAILED', 'Failed to initialize Flow client', error);
    }
  }
  
  /**
   * Get account information
   */
  async getAccount(address: string): Promise<FlowAccount> {
    this.ensureInitialized();
    
    try {
      const account = await fcl.account(address);
      
      return {
        address: account.address,
        balance: account.balance,
        keys: account.keys.map((key: any) => ({
          index: key.index,
          publicKey: key.publicKey,
          signAlgo: key.signAlgo,
          hashAlgo: key.hashAlgo,
          weight: key.weight,
          sequenceNumber: key.sequenceNumber,
          revoked: key.revoked,
        })),
      };
    } catch (error) {
      console.error('Failed to get account:', error);
      throw this.createFlowError('ACCOUNT_FETCH_FAILED', `Failed to get account ${address}`, error);
    }
  }
  
  /**
   * Execute a script (read-only)
   */
  async executeScript<T = any>(script: string, args: any[] = []): Promise<T> {
    this.ensureInitialized();
    
    try {
      const result = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => args.map((value, index) => arg(value, this.inferType(value))),
      });
      
      return result;
    } catch (error) {
      console.error('Script execution failed:', error);
      throw this.createFlowError('SCRIPT_EXECUTION_FAILED', 'Failed to execute script', error);
    }
  }
  
  /**
   * Send a transaction
   */
  async sendTransaction(
    script: string, 
    args: any[] = [], 
    options: {
      gasLimit?: number;
      proposer?: string;
      payer?: string;
      authorizers?: string[];
    } = {}
  ): Promise<string> {
    this.ensureInitialized();
    
    try {
      const txId = await fcl.mutate({
        cadence: script,
        args: (arg: any, t: any) => args.map((value) => arg(value, this.inferType(value))),
        proposer: options.proposer ? fcl.proposer : undefined,
        payer: options.payer ? fcl.payer : undefined,
        authorizations: options.authorizers ? 
          options.authorizers.map(() => fcl.authorization) : 
          [fcl.authz],
        limit: options.gasLimit || 1000,
      });
      
      return txId;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw this.createFlowError('TRANSACTION_FAILED', 'Failed to send transaction', error);
    }
  }
  
  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    this.ensureInitialized();
    
    try {
      const tx = await fcl.tx(txId).snapshot();
      return tx.status as TransactionStatus;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw this.createFlowError('TX_STATUS_FAILED', `Failed to get status for transaction ${txId}`, error);
    }
  }
  
  /**
   * Wait for transaction to be sealed
   */
  async waitForTransaction(txId: string, timeout: number = 30000): Promise<FlowTransactionResult> {
    this.ensureInitialized();
    
    try {
      const result = await fcl.tx(txId).onceSealed();
      
      return {
        status: result.status,
        statusCode: result.statusCode,
        statusString: result.statusString,
        errorMessage: result.errorMessage || '',
        events: result.events || [],
      };
    } catch (error) {
      console.error('Failed to wait for transaction:', error);
      throw this.createFlowError('TX_WAIT_FAILED', `Failed to wait for transaction ${txId}`, error);
    }
  }
  
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    this.ensureInitialized();
    
    try {
      return await fcl.currentUser().snapshot();
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw this.createFlowError('USER_FETCH_FAILED', 'Failed to get current user', error);
    }
  }
  
  /**
   * Authenticate user
   */
  async authenticate(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await fcl.authenticate();
    } catch (error) {
      console.error('Authentication failed:', error);
      throw this.createFlowError('AUTH_FAILED', 'Authentication failed', error);
    }
  }
  
  /**
   * Unauthenticate user
   */
  async unauthenticate(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Unauthentication failed:', error);
      throw this.createFlowError('UNAUTH_FAILED', 'Unauthentication failed', error);
    }
  }
  
  /**
   * Subscribe to user changes
   */
  subscribeToUser(callback: (user: any) => void): () => void {
    this.ensureInitialized();
    
    return fcl.currentUser().subscribe(callback);
  }
  
  /**
   * Get network configuration
   */
  getConfig(): FlowConfig | null {
    return this.config;
  }
  
  /**
   * Check if client is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    this.isInitialized = false;
    this.config = null;
    console.log('Flow client disposed');
  }
  
  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw this.createFlowError('NOT_INITIALIZED', 'Flow client not initialized');
    }
  }
  
  /**
   * Infer Cadence type from JavaScript value
   */
  private inferType(value: any): any {
    if (typeof value === 'string') {
      // Check if it's an address
      if (value.startsWith('0x') && value.length === 18) {
        return types.Address;
      }
      return types.String;
    }
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return types.Int;
      }
      return types.UFix64;
    }
    
    if (typeof value === 'boolean') {
      return types.Bool;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return types.Array(types.String); // Default to string array
      }
      const firstType = this.inferType(value[0]);
      return types.Array(firstType);
    }
    
    if (typeof value === 'object' && value !== null) {
      return types.Dictionary({ key: types.String, value: types.String });
    }
    
    // Default to string
    return types.String;
  }
  
  /**
   * Create standardized Flow error
   */
  private createFlowError(code: string, message: string, originalError?: any): FlowError {
    return {
      code,
      message,
      details: originalError,
    };
  }
}

export default BaseFlowClient;