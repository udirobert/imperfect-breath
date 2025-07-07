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
import { handleError } from '../../../lib/utils/error-utils';
import { startTimer, timed } from '../../../lib/utils/performance-utils';
import { getCache } from '../../../lib/utils/cache-utils';

export class BaseFlowClient {
  private static instance: BaseFlowClient | null = null;
  private isInitialized = false;
  private config: FlowConfig | null = null;
  private cache = getCache();
  
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
    const endTimer = startTimer('initialize');
    
    if (this.isInitialized && this.config?.network === config.network) {
      endTimer();
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
      
      const duration = endTimer();
      console.log(`Flow client initialized for ${config.network} in ${duration.toFixed(2)}ms`);
    } catch (error) {
      endTimer();
      throw handleError('initialize Flow client', error);
    }
  }
  
  /**
   * Get account information
   */
  async getAccount(address: string): Promise<FlowAccount> {
    const endTimer = startTimer('getAccount');
    this.ensureInitialized();
    
    // Check cache first
    const cacheKey = `account-${address}`;
    const cached = this.cache.get<FlowAccount>(cacheKey);
    if (cached) {
      endTimer();
      return cached;
    }
    
    try {
      const account = await fcl.account(address);
      
      const result = {
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
      
      // Cache account info for 60 seconds
      this.cache.set(cacheKey, result, 60000);
      
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw handleError(`get account ${address}`, error);
    }
  }
  
  /**
   * Execute a script (read-only)
   */
  async executeScript<T = any>(script: string, args: any[] = []): Promise<T> {
    const endTimer = startTimer('executeScript');
    this.ensureInitialized();
    
    try {
      const result = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => args.map((value, index) => arg(value, this.inferType(value))),
      });
      
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw handleError('execute script', error);
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
    const endTimer = startTimer('sendTransaction');
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
      
      endTimer();
      return txId;
    } catch (error) {
      endTimer();
      throw handleError('send transaction', error);
    }
  }
  
  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    const endTimer = startTimer('getTransactionStatus');
    this.ensureInitialized();
    
    try {
      const tx = await fcl.tx(txId).snapshot();
      endTimer();
      // Cast through unknown to avoid type error
      return tx.status as unknown as TransactionStatus;
    } catch (error) {
      endTimer();
      throw handleError(`get status for transaction ${txId}`, error);
    }
  }
  
  /**
   * Wait for transaction to be sealed
   */
  async waitForTransaction(txId: string, timeout: number = 30000): Promise<FlowTransactionResult> {
    const endTimer = startTimer('waitForTransaction');
    this.ensureInitialized();
    
    try {
      const result = await fcl.tx(txId).onceSealed();
      
      const txResult = {
        status: result.status,
        statusCode: result.statusCode,
        statusString: result.statusString,
        errorMessage: result.errorMessage || '',
        events: result.events || [],
      };
      
      endTimer();
      return txResult;
    } catch (error) {
      endTimer();
      throw handleError(`wait for transaction ${txId}`, error);
    }
  }
  
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    const endTimer = startTimer('getCurrentUser');
    this.ensureInitialized();
    
    try {
      const user = await fcl.currentUser().snapshot();
      endTimer();
      return user;
    } catch (error) {
      endTimer();
      throw handleError('get current user', error);
    }
  }
  
  /**
   * Authenticate user
   */
  async authenticate(): Promise<void> {
    const endTimer = startTimer('authenticate');
    this.ensureInitialized();
    
    try {
      await fcl.authenticate();
      endTimer();
    } catch (error) {
      endTimer();
      throw handleError('authenticate user', error);
    }
  }
  
  /**
   * Unauthenticate user
   */
  async unauthenticate(): Promise<void> {
    const endTimer = startTimer('unauthenticate');
    this.ensureInitialized();
    
    try {
      await fcl.unauthenticate();
      endTimer();
    } catch (error) {
      endTimer();
      throw handleError('unauthenticate user', error);
    }
  }
  
  /**
   * Subscribe to user changes
   */
  subscribeToUser(callback: (user: any) => void): () => void {
    this.ensureInitialized();
    console.log('Subscribing to user changes');
    // Cast the return value to the correct type
    return fcl.currentUser().subscribe(callback) as unknown as () => void;
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
      throw handleError('ensure client is initialized', new Error('Flow client not initialized'));
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
   * Get the current account address
   */
  getCurrentUserAddress(): string | null {
    if (!this.isInitialized) {
      return null;
    }
    
    try {
      // Access the current user synchronously
      const currentUser = fcl.currentUser();
      const user = currentUser.snapshot();
      
      // Safely access properties with type assertions
      return user && typeof user === 'object' && 'addr' in user
        ? user.addr as string
        : null;
    } catch (error) {
      console.warn('Failed to get current account address:', error);
      return null;
    }
  }
}

export default BaseFlowClient;