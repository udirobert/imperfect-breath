/**
 * Enhanced Flow Client with Resilient Connection Management
 * 
 * Extends the base Flow client with automatic reconnection, circuit breaker,
 * and connection pooling for production reliability.
 */

import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { config } from '../../config/environment';
import { BaseFlowClient } from './clients/base-client';
import { connectionManager, ManagedConnection } from '../network/connection-manager';
import { websocketRetry, RetryPredicates } from '../network/retry-policy';
import { ErrorFactory, NetworkError } from '../errors/error-types';
import { handleError } from '../errors/error-types';
import { startTimer } from '../../lib/utils/performance-utils';
import { getCache } from '../../lib/utils/cache-utils';
import { EVMBatchCall, BatchTransactionResult } from './types';

export interface EnhancedFlowConfig {
  // Base Flow configuration
  network: 'testnet' | 'mainnet' | 'emulator';
  accessNode: string;
  discoveryWallet: string;
  contractAddress: string;
  flowTokenAddress: string;
  fungibleTokenAddress: string;
  
  // Connection resilience settings
  enableConnectionPooling?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

/**
 * Enhanced Flow Client with resilient connections
 */
export class EnhancedFlowClient {
  private static enhancedInstance: EnhancedFlowClient | null = null;
  private wsConnection: ManagedConnection | null = null;
  private enhancedConfig: EnhancedFlowConfig | null = null;
  private eventSubscriptions = new Map<string, Set<(event: any) => void>>();

  private baseClient: BaseFlowClient;
  
  private constructor() {
    this.baseClient = BaseFlowClient.getInstance();
  }

  /**
   * Get singleton instance of enhanced client
   */
  static getEnhancedInstance(): EnhancedFlowClient {
    if (!EnhancedFlowClient.enhancedInstance) {
      EnhancedFlowClient.enhancedInstance = new EnhancedFlowClient();
    }
    return EnhancedFlowClient.enhancedInstance;
  }

  /**
   * For backward compatibility
   */
  static getInstance(): EnhancedFlowClient {
    return EnhancedFlowClient.getEnhancedInstance();
  }

  /**
   * Initialize with enhanced configuration
   */
  async initialize(flowConfig?: Partial<EnhancedFlowConfig>): Promise<void> {
    // Build config from environment defaults and overrides
    const baseConfig = {
      network: 'testnet' as 'testnet' | 'mainnet' | 'emulator',
      accessNode: config.flow?.accessNode || 'https://access-testnet.onflow.org',
      discoveryWallet: config.flow?.discoveryWallet || 'https://fcl-discovery.onflow.org/testnet/authn',
      contractAddress: config.flow?.contractAddress || '0xImperfectBreath',
      flowTokenAddress: config.flow?.flowToken || '0x1654653399040a61',
      fungibleTokenAddress: config.flow?.fungibleToken || '0x9a0766d93b6608b7',
    };

    this.enhancedConfig = {
      ...baseConfig,
      enableConnectionPooling: true,
      maxRetries: 5,
      retryDelay: 1000,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...flowConfig,
    };

    // Initialize base client
    await this.baseClient.initialize(this.enhancedConfig);

    // Setup WebSocket connection if enabled
    if (this.enhancedConfig.enableConnectionPooling) {
      await this.setupWebSocketConnection();
    }
  }

  /**
   * Setup WebSocket connection with resilience
   */
  private async setupWebSocketConnection(): Promise<void> {
    if (!this.enhancedConfig) return;

    try {
      // Create WebSocket URL from access node
      const wsUrl = this.enhancedConfig.accessNode.replace(/^http/, 'ws');
      
      this.wsConnection = connectionManager.getConnection(wsUrl, {
        protocols: ['fcl'],
        maxRetries: this.enhancedConfig.maxRetries,
        retryDelay: this.enhancedConfig.retryDelay,
        heartbeatInterval: this.enhancedConfig.heartbeatInterval,
        timeout: this.enhancedConfig.connectionTimeout,
        reconnectOnClose: true,
      });

      // Setup event handlers
      this.wsConnection.addEventListener((event) => {
        switch (event.type) {
          case 'connected':
            console.log('Flow WebSocket connected');
            break;
          case 'disconnected':
            console.warn('Flow WebSocket disconnected');
            break;
          case 'error':
            console.error('Flow WebSocket error:', event.error);
            break;
          case 'message':
            this.handleWebSocketMessage(event.data);
            break;
        }
      });

    } catch (error) {
      console.warn('Failed to setup WebSocket connection:', error);
      // Continue without WebSocket - fallback to HTTP
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: any): void {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      // Handle different message types
      if (data.type === 'event' && data.eventType) {
        this.notifyEventSubscribers(data.eventType, data);
      }
    } catch (error) {
      console.warn('Error processing WebSocket message:', error);
    }
  }

  /**
   * Notify event subscribers
   */
  private notifyEventSubscribers(eventType: string, event: any): void {
    const subscribers = this.eventSubscriptions.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event subscriber for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get current user's Cadence address
   */
  async getCurrentUser(): Promise<{ addr: string | null; loggedIn: boolean }> {
    await this.initialize();
    const user = await fcl.currentUser().snapshot();
    return {
      addr: user.addr || null, // Convert undefined to null to match return type
      loggedIn: !!user.addr,
    };
  }

  /**
   * Get user's Cadence Owned Account (COA) for EVM operations
   */
  async getCadenceOwnedAccount(
    userAddress: string,
  ): Promise<{ address: string } | null> {
    try {
      const script = `
        import EVM from 0x8c5303eaa26202d6

        access(all) fun main(address: Address): String? {
          let account = getAccount(address)
          let storagePath = /storage/evm

          if let coa = account.storage.borrow<&EVM.CadenceOwnedAccount>(from: storagePath) {
            return coa.address().toString()
          }
          return nil
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(userAddress, t.Address)],
      });

      return result ? { address: result } : null;
    } catch (error) {
      console.error("Failed to get COA:", error);
      return null;
    }
  }

  /**
   * Execute batched EVM transactions through Cadence
   */
  /**
   * Execute batched EVM transactions through Cadence
   * @param calls Array of EVM function calls to execute
   * @param mustPass If true, transaction will revert if any call fails
   * @returns Transaction result with status of each call
   */
  async executeBatchedTransactions(
    calls: EVMBatchCall[],
    mustPass: boolean = true,
  ): Promise<BatchTransactionResult> {
    const endTimer = startTimer("executeBatchedTransactions");
    await this.initialize();

    try {
      // Convert calls to the format expected by Cadence
      const cadenceCalls = calls.map((call) => [
        { key: "to", value: call.to },
        { key: "data", value: call.data },
        { key: "gasLimit", value: String(call.gasLimit || 100000) },
        { key: "value", value: String(call.value || 0) },
      ]);

      const transaction = `
        import EVM from 0x8c5303eaa26202d6

        transaction(calls: [{String: AnyStruct}], mustPass: Bool) {
          let coa: auth(EVM.Call) &EVM.CadenceOwnedAccount

          prepare(signer: auth(BorrowValue) & Account) {
            let storagePath = /storage/evm
            self.coa = signer.storage.borrow<auth(EVM.Call) &EVM.CadenceOwnedAccount>(from: storagePath)
              ?? panic("No CadenceOwnedAccount (COA) found at ".concat(storagePath.toString()))
          }

          execute {
            for i, call in calls {
              let to = call["to"] as! String
              let data = call["data"] as! String
              let gasLimit = call["gasLimit"] as! UInt64
              let value = call["value"] as! UInt

              let result = self.coa.call(
                to: EVM.addressFromString(to),
                data: data.decodeHex(),
                gasLimit: gasLimit,
                value: EVM.Balance(attoflow: value)
              )

              if mustPass {
                assert(
                  result.status == EVM.Status.successful,
                  message: "Call index ".concat(i.toString()).concat(" to ").concat(to)
                    .concat(" with calldata ").concat(data).concat(" failed: ")
                    .concat(result.errorMessage)
                )
              }
            }
          }
        }
      `;

      const txId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(
            cadenceCalls,
            t.Array([t.Dictionary({ key: t.String, value: t.String })]),
          ),
          arg(mustPass, t.Bool),
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999,
      });

      // Wait for transaction to be sealed and get results
      const result = await fcl.tx(txId).onceSealed();

      // Parse EVM transaction results from events
      const evmResults = this.parseEVMResults(result.events);

      const duration = endTimer();
      console.log(`Batched transaction completed in ${duration.toFixed(2)}ms`);

      return {
        isError: result.status !== 4, // 4 = sealed
        txId,
        results: evmResults,
        totalGasUsed: evmResults.reduce((total, r) => total + r.gasUsed, 0),
      };
    } catch (error) {
      endTimer(); // Record time even on error
      const appError = handleError("execute batched transactions", error);
      return {
        isError: true,
        txId: "",
        results: [],
        totalGasUsed: 0,
      };
    }
  }

  /**
   * Mint multiple breathing pattern NFTs in a single transaction
   */
  async batchMintBreathingPatterns(
    patterns: Array<{
      name: string;
      description: string;
      inhale: number;
      hold: number;
      exhale: number;
      rest: number;
    }>,
  ): Promise<BatchTransactionResult> {
    const calls: EVMBatchCall[] = patterns.map((pattern) => ({
      to: config.flow.contractAddress,
       data: this.encodeFunctionCall({
         functionName: "mintBreathingPattern",
         args: [
           "{{USER_ADDRESS}}", // Will be replaced with actual user address
           pattern.name,
           pattern.description,
           pattern.inhale,
           pattern.hold,
           pattern.exhale,
           pattern.rest,
         ],
       }),
       gasLimit: 100000,
       value: "0",
    }));

    return this.executeBatchedTransactions(calls);
  }

  /**
   * Create sponsored transaction for walletless onboarding
   * @param userAddress User address to sponsor
   * @param sessionData Breathing session data
   * @returns Transaction ID
   */
  async createSponsoredBreathingSession(
    userAddress: string,
    sessionData: {
      patternId: string;
      duration: number;
      score: number;
    },
  ): Promise<string> {
    const endTimer = startTimer("createSponsoredBreathingSession");
    await this.initialize();

    try {
      const transaction = `
        import ImperfectBreath from 0xImperfectBreath

        transaction(userAddress: Address, patternId: String, duration: UFix64, score: UFix64) {
          prepare(sponsor: AuthAccount) {
            // Sponsor pays for the transaction
            let userAccount = getAccount(userAddress)

            // Log breathing session data
            ImperfectBreath.logBreathingSession(
              user: userAddress,
              patternId: patternId,
              duration: duration,
              score: score
            )
          }
        }
      `;

      const txId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(userAddress, t.Address),
          arg(sessionData.patternId, t.String),
          arg(sessionData.duration.toFixed(2), t.UFix64),
          arg(sessionData.score.toFixed(2), t.UFix64),
        ],
        proposer: fcl.authz, // Sponsor account
        payer: fcl.authz, // Sponsor pays
        authorizations: [fcl.authz],
        limit: 9999,
      });

      endTimer();
      return txId;
    } catch (error) {
      endTimer();
      throw handleError("create sponsored breathing session", error);
    }
  }

  /**
   * Generate random breathing pattern using Flow's native VRF
   * @param basePattern Base pattern to generate variations from
   * @returns Random pattern variation
   */
  async generateRandomBreathingPattern(basePattern: {
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
  }): Promise<{
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
    randomSeed: string;
  }> {
    const endTimer = startTimer("generateRandomBreathingPattern");
    await this.initialize();

    // Check cache first
    const cacheKey = `random-pattern-${basePattern.name}-${basePattern.inhale}-${basePattern.hold}-${basePattern.exhale}-${basePattern.rest}`;
    const cache = getCache();
    const cachedPattern = cache.get<{
      name: string;
      inhale: number;
      hold: number;
      exhale: number;
      rest: number;
      randomSeed: string;
    }>(cacheKey);

    if (cachedPattern) {
      console.log("Using cached random pattern");
      endTimer();
      return cachedPattern;
    }

    try {
      const script = `
        access(all) fun main(
          baseName: String,
          baseInhale: UInt64,
          baseHold: UInt64,
          baseExhale: UInt64,
          baseRest: UInt64
        ): {String: AnyStruct} {
          // Use Flow's native randomness
          let randomSeed = revertibleRandom<UInt64>()

          // Generate variations based on random seed
          let inhaleVariation = (randomSeed % 3) + 1 // 1-3 second variation
          let holdVariation = (randomSeed % 5) + 1   // 1-5 second variation
          let exhaleVariation = (randomSeed % 4) + 1 // 1-4 second variation
          let restVariation = (randomSeed % 2) + 1   // 1-2 second variation

          return {
            "name": baseName.concat(" Variation ").concat(randomSeed.toString()),
            "inhale": baseInhale + inhaleVariation,
            "hold": baseHold + holdVariation,
            "exhale": baseExhale + exhaleVariation,
            "rest": baseRest + restVariation,
            "randomSeed": randomSeed.toString()
          }
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [
          arg(basePattern.name, t.String),
          arg(basePattern.inhale, t.UInt64),
          arg(basePattern.hold, t.UInt64),
          arg(basePattern.exhale, t.UInt64),
          arg(basePattern.rest, t.UInt64),
        ],
      });

      const pattern = {
        name: result.name,
        inhale: parseInt(result.inhale),
        hold: parseInt(result.hold),
        exhale: parseInt(result.exhale),
        rest: parseInt(result.rest),
        randomSeed: result.randomSeed,
      };

      // Cache the result for 1 hour
      cache.set(cacheKey, pattern, 60 * 60 * 1000);

      const duration = endTimer();
      console.log(`Generated random pattern in ${duration.toFixed(2)}ms`);

      return pattern;
    } catch (error) {
      endTimer();
      throw handleError("generate random breathing pattern", error);
    }
  }

  /**
   * Parse EVM results from Flow transaction events
   */
  private parseEVMResults(events: any[]): any[] {
    return events
      .filter(event => event.type.includes('EVM'))
      .map(event => ({
        success: event.data?.status === 'successful',
        gasUsed: parseInt(event.data?.gasUsed || '0'),
        returnData: event.data?.returnData || '',
        error: event.data?.errorMessage || null,
      }));
  }

  /**
   * Encode function call data
   */
  private encodeFunctionCall(call: { functionName: string; args: any[] }): string {
    // Simple encoding for demo - in production use proper ABI encoding
    const encoded = `${call.functionName}(${call.args.join(',')})`;
    return Buffer.from(encoded).toString('hex');
  }
}

export default EnhancedFlowClient;
