/**
 * Enhanced Flow Client with Cross-VM Functionality
 * Implements batched transactions, sponsored transactions, and advanced Cadence features
 * Based on FLIP 316 FCL improvements for Flow EVM + Cadence integration
 */

import * as fcl from '@onflow/fcl';
import { config } from '../../config/environment';
import {
  EVMBatchCall,
  CallOutcome,
  BatchTransactionResult,
  encodeFunctionCall,
  parseEVMResults
} from './utils/batch-transactions';
import { handleError } from '../../lib/utils/error-utils';
import { startTimer } from '../../lib/utils/performance-utils';
import { getCache } from '../../lib/utils/cache-utils';

/**
 * Enhanced Flow Client for breathing pattern operations
 */
export class EnhancedFlowClient {
  private static instance: EnhancedFlowClient;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EnhancedFlowClient {
    if (!EnhancedFlowClient.instance) {
      EnhancedFlowClient.instance = new EnhancedFlowClient();
    }
    return EnhancedFlowClient.instance;
  }

  /**
   * Initialize FCL with enhanced configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    fcl.config({
      'accessNode.api': config.flow.accessNode,
      'discovery.wallet': config.flow.discoveryWallet,
      'app.detail.title': 'Imperfect Breath',
      'app.detail.icon': 'https://imperfect-breath.app/icon.png',
      '0xImperfectBreath': config.flow.contractAddress,
      // Enable cross-VM functionality
      'fcl.limit': 9999,
      'fcl.eventsPollRate': 2500
    });

    this.isInitialized = true;
  }

  /**
   * Get current user's Cadence address
   */
  async getCurrentUser(): Promise<{ addr: string | null; loggedIn: boolean }> {
    await this.initialize();
    const user = await fcl.currentUser().snapshot();
    return {
      addr: user.addr || null, // Convert undefined to null to match return type
      loggedIn: !!user.addr
    };
  }

  /**
   * Get user's Cadence Owned Account (COA) for EVM operations
   */
  async getCadenceOwnedAccount(userAddress: string): Promise<{ address: string } | null> {
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
        args: (arg: any, t: any) => [arg(userAddress, t.Address)]
      });

      return result ? { address: result } : null;
    } catch (error) {
      console.error('Failed to get COA:', error);
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
    mustPass: boolean = true
  ): Promise<BatchTransactionResult> {
    const endTimer = startTimer('executeBatchedTransactions');
    await this.initialize();

    try {
      // Convert calls to the format expected by Cadence
      const cadenceCalls = calls.map(call => ({
        to: call.address,
        data: encodeFunctionCall(call),
        gasLimit: call.gas || 100000,
        value: call.value || 0
      }));

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
        args: (arg: any, t: any) => [
          arg(cadenceCalls, t.Array([t.Dictionary({ key: t.String, value: t.AnyStruct })])),
          arg(mustPass, t.Bool)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      });

      // Wait for transaction to be sealed and get results
      const result = await fcl.tx(txId).onceSealed();
      
      // Parse EVM transaction results from events
      const evmResults = parseEVMResults(result.events);

      const duration = endTimer();
      console.log(`Batched transaction completed in ${duration.toFixed(2)}ms`);

      return {
        isPending: false,
        isError: result.status !== 4, // 4 = sealed
        txId,
        results: evmResults
      };

    } catch (error) {
      endTimer(); // Record time even on error
      const appError = handleError('execute batched transactions', error);
      return {
        isPending: false,
        isError: true,
        txId: '',
        results: []
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
    }>
  ): Promise<BatchTransactionResult> {
    const calls: EVMBatchCall[] = patterns.map(pattern => ({
      address: config.flow.contractAddress,
      abi: [
        {
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'inhale', type: 'uint256' },
            { name: 'hold', type: 'uint256' },
            { name: 'exhale', type: 'uint256' },
            { name: 'rest', type: 'uint256' }
          ],
          name: 'mintBreathingPattern',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        }
      ],
      functionName: 'mintBreathingPattern',
      args: [
        '{{USER_ADDRESS}}', // Will be replaced with actual user address
        pattern.name,
        pattern.description,
        pattern.inhale,
        pattern.hold,
        pattern.exhale,
        pattern.rest
      ]
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
    }
  ): Promise<string> {
    const endTimer = startTimer('createSponsoredBreathingSession');
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
        args: (arg: any, t: any) => [
          arg(userAddress, t.Address),
          arg(sessionData.patternId, t.String),
          arg(sessionData.duration.toFixed(2), t.UFix64),
          arg(sessionData.score.toFixed(2), t.UFix64)
        ],
        proposer: fcl.authz, // Sponsor account
        payer: fcl.authz,     // Sponsor pays
        authorizations: [fcl.authz],
        limit: 9999
      });

      endTimer();
      return txId;
    } catch (error) {
      endTimer();
      throw handleError('create sponsored breathing session', error);
    }
  }

  /**
   * Generate random breathing pattern using Flow's native VRF
   * @param basePattern Base pattern to generate variations from
   * @returns Random pattern variation
   */
  async generateRandomBreathingPattern(
    basePattern: {
      name: string;
      inhale: number;
      hold: number;
      exhale: number;
      rest: number;
    }
  ): Promise<{
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
    randomSeed: string;
  }> {
    const endTimer = startTimer('generateRandomBreathingPattern');
    await this.initialize();

    // Check cache first
    const cacheKey = `random-pattern-${basePattern.name}-${basePattern.inhale}-${basePattern.hold}-${basePattern.exhale}-${basePattern.rest}`;
    const cache = getCache();
    const cachedPattern = cache.get<any>(cacheKey);
    
    if (cachedPattern) {
      console.log('Using cached random pattern');
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
        args: (arg: any, t: any) => [
          arg(basePattern.name, t.String),
          arg(basePattern.inhale, t.UInt64),
          arg(basePattern.hold, t.UInt64),
          arg(basePattern.exhale, t.UInt64),
          arg(basePattern.rest, t.UInt64)
        ]
      });

      const pattern = {
        name: result.name,
        inhale: parseInt(result.inhale),
        hold: parseInt(result.hold),
        exhale: parseInt(result.exhale),
        rest: parseInt(result.rest),
        randomSeed: result.randomSeed
      };
      
      // Cache the result for 1 hour
      cache.set(cacheKey, pattern, 60 * 60 * 1000);
      
      const duration = endTimer();
      console.log(`Generated random pattern in ${duration.toFixed(2)}ms`);
      
      return pattern;
    } catch (error) {
      endTimer();
      throw handleError('generate random breathing pattern', error);
    }
  }

  // Removed helper methods that were moved to batch-transactions.ts
}

export default EnhancedFlowClient;
