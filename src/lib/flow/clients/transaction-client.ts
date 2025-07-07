/**
 * Transaction Management Client
 * Unified transaction handling and batch operations
 */

import BaseFlowClient from './base-client';
import type {
  EVMBatchCall,
  CallOutcome,
  BatchTransactionResult,
  FlowTransactionResult,
  TransactionStatus
} from '../types';
import { handleError } from '../../../lib/utils/error-utils';
import { startTimer, timed } from '../../../lib/utils/performance-utils';
import { SimpleCache } from '../../../lib/utils/cache-utils';

export interface TransactionOptions {
  gasLimit?: number;
  timeout?: number;
  retries?: number;
  onStatusChange?: (status: TransactionStatus) => void;
}

export interface BatchOptions {
  maxConcurrent?: number;
  failFast?: boolean;
  retryFailures?: boolean;
}

export class TransactionClient {
  private baseClient: BaseFlowClient;
  private pendingTransactions = new Map<string, Promise<FlowTransactionResult>>();
  private cache = SimpleCache.getInstance();
  
  constructor() {
    this.baseClient = BaseFlowClient.getInstance();
  }
  
  /**
   * Execute a single transaction with enhanced options
   */
  async executeTransaction(
    script: string,
    args: any[] = [],
    options: TransactionOptions = {}
  ): Promise<FlowTransactionResult> {
    const endTimer = startTimer('executeTransaction');
    
    const {
      gasLimit = 1000,
      timeout = 30000,
      retries = 3,
      onStatusChange
    } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Send transaction
        const txId = await this.baseClient.sendTransaction(script, args, { gasLimit });
        
        // Monitor status if callback provided
        if (onStatusChange) {
          // Create an adapter function to match the expected signature
          const statusAdapter = (_txId: string, status: TransactionStatus) => {
            onStatusChange(status);
          };
          this.monitorTransaction(txId, statusAdapter);
        }
        
        // Wait for completion with timeout
        const result = await Promise.race([
          this.baseClient.waitForTransaction(txId),
          this.createTimeoutPromise(timeout, txId)
        ]);
        
        // Check if transaction succeeded
        if (result.status === 4 && !result.errorMessage) {
          endTimer();
          return result;
        } else {
          throw new Error(`Transaction failed: ${result.errorMessage || 'Unknown error'}`);
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retries) {
          console.warn(`Transaction attempt ${attempt + 1} failed, retrying...`, error);
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }
    
    endTimer();
    throw handleError('execute transaction', lastError || new Error('Transaction failed after all retries'));
  }
  
  /**
   * Execute batch transactions
   */
  async executeBatchTransactions(
    transactions: Array<{
      script: string;
      args: any[];
      options?: TransactionOptions;
    }>,
    batchOptions: BatchOptions = {}
  ): Promise<BatchTransactionResult[]> {
    const endTimer = startTimer('executeBatchTransactions');
    
    const {
      maxConcurrent = 3,
      failFast = false,
      retryFailures = true
    } = batchOptions;
    
    const results: BatchTransactionResult[] = [];
    const chunks = this.chunkArray(transactions, maxConcurrent);
    
    try {
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (tx, index) => {
          try {
            const result = await this.executeTransaction(tx.script, tx.args, tx.options);
            
            return {
              txId: result.statusString, // Use status string as identifier
              results: [{
                success: true,
                returnData: JSON.stringify(result.events),
                gasUsed: 0, // Flow doesn't expose gas usage directly
                error: undefined
              }],
              isError: false,
              totalGasUsed: 0
            } as BatchTransactionResult;
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            if (failFast) {
              throw error;
            }
            
            return {
              txId: `failed-${index}`,
              results: [{
                success: false,
                returnData: '',
                gasUsed: 0,
                error: errorMessage
              }],
              isError: true,
              totalGasUsed: 0
            } as BatchTransactionResult;
          }
        });
        
        try {
          const chunkResults = await Promise.all(chunkPromises);
          results.push(...chunkResults);
        } catch (error) {
          if (failFast) {
            throw error;
          }
        }
      }
      
      // Retry failures if requested
      if (retryFailures) {
        const failedIndices = results
          .map((result, index) => ({ result, index }))
          .filter(({ result }) => result.isError)
          .map(({ index }) => index);
        
        for (const index of failedIndices) {
          try {
            const tx = transactions[index];
            const retryResult = await this.executeTransaction(tx.script, tx.args, tx.options);
            
            results[index] = {
              txId: retryResult.statusString,
              results: [{
                success: true,
                returnData: JSON.stringify(retryResult.events),
                gasUsed: 0,
                error: undefined
              }],
              isError: false,
              totalGasUsed: 0
            };
          } catch (error) {
            // Keep original failure
          }
        }
      }
    } catch (error) {
      endTimer();
      throw handleError('execute batch transactions', error);
    }
    
    const duration = endTimer();
    console.log(`Executed ${results.length} transactions in batch in ${duration.toFixed(2)}ms`);
    
    return results;
  }
  
  /**
   * Execute EVM batch calls (for COA integration)
   */
  async executeEVMBatchCalls(calls: EVMBatchCall[]): Promise<BatchTransactionResult> {
    const endTimer = startTimer('executeEVMBatchCalls');
    
    // Validate calls array
    if (!calls || calls.length === 0) {
      throw new Error('No EVM calls provided for batch execution');
    }
    
    try {
      // Create a Flow transaction to execute the EVM batch calls
      // This uses Flow's EVM compatibility layer through a Cadence script
      
      // Create script for batch execution
      const batchScript = `
        import FlowEVMBatching from 0xFLOWEVMBATCHING
        import FlowToken from 0xFLOWTOKEN
        
        transaction(
          batchTargets: [Address],
          batchData: [String],
          batchValues: [UFix64],
          batchGasLimits: [UInt64]
        ) {
          let signer: AuthAccount
          
          prepare(acct: AuthAccount) {
            self.signer = acct
          }
          
          execute {
            // Prepare EVM context from signer account
            let evmContext = FlowEVMBatching.getEVMContext(self.signer)
            
            // Execute batch calls and collect results
            let results: [FlowEVMBatching.CallResult] = []
            var totalGasUsed: UInt64 = 0
            
            for i, target in batchTargets {
              let value = batchValues[i]
              let data = batchData[i]
              let gasLimit = batchGasLimits[i]
              
              // Execute the call
              let result = evmContext.call(
                to: target,
                data: data,
                value: value,
                gasLimit: gasLimit
              )
              
              // Track gas used
              totalGasUsed = totalGasUsed + result.gasUsed
              
              // Store result
              results.append(result)
            }
            
            // Emit event with batch results
            emit BatchCompleted(
              count: UInt32(batchTargets.length),
              totalGasUsed: totalGasUsed,
              results: results
            )
          }
          
          event BatchCompleted(
            count: UInt32,
            totalGasUsed: UInt64,
            results: [FlowEVMBatching.CallResult]
          )
        }
      `;
      
      // Prepare arguments for the batch transaction
      const batchTargets = calls.map(call => call.to);
      const batchData = calls.map(call => call.data);
      const batchValues = calls.map(call => call.value || '0');
      const batchGasLimits = calls.map(call => call.gasLimit || 100000);
      
      // Execute the transaction
      const txId = await this.baseClient.sendTransaction(
        batchScript,
        [batchTargets, batchData, batchValues, batchGasLimits],
        { gasLimit: Math.max(...batchGasLimits) * batchGasLimits.length }
      );
      
      // Wait for transaction to be sealed
      const txResult = await this.baseClient.waitForTransaction(txId);
      
      if (txResult.status !== 4) { // 4 is SEALED status
        throw new Error(`Batch transaction failed: ${txResult.errorMessage || 'Unknown error'}`);
      }
      
      // Process the events to extract results
      const batchCompletedEvent = txResult.events.find(
        event => event.type.includes('BatchCompleted')
      );
      
      if (!batchCompletedEvent) {
        throw new Error('Failed to find batch completion event in transaction');
      }
      
      // Extract results from event data
      const eventData = batchCompletedEvent.data;
      const totalGasUsed = parseInt(eventData.totalGasUsed, 10);
      const resultsList = eventData.results || [];
      
      // Format results
      const results: CallOutcome[] = resultsList.map((res: any, index: number) => ({
        success: res.success,
        returnData: res.returnData || '',
        gasUsed: parseInt(res.gasUsed, 10),
        error: res.error
      }));
      
      // If results list is empty or incomplete, fill with placeholders
      if (results.length < calls.length) {
        for (let i = results.length; i < calls.length; i++) {
          results.push({
            success: false,
            returnData: '',
            gasUsed: 0,
            error: 'Result not available'
          });
        }
      }
      
      const result: BatchTransactionResult = {
        txId,
        results,
        isError: results.some(r => !r.success),
        totalGasUsed
      };
      
      endTimer();
      return result;
    } catch (error) {
      console.error('EVM batch execution failed:', error);
      endTimer();
      // Don't create a mock result - propagate the error
      throw handleError('execute EVM batch calls', error);
    }
  }
  
  /**
   * Get transaction status with caching
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    const endTimer = startTimer('getTransactionStatus');
    const cacheKey = `tx-status-${txId}`;
    
    // Check cache first (short TTL for transaction status)
    const cached = this.cache.get<TransactionStatus>(cacheKey);
    if (cached) {
      endTimer();
      return cached;
    }
    
    try {
      const status = await this.baseClient.getTransactionStatus(txId);
      
      // Cache status for 5 seconds (except for final statuses which we can cache longer)
      const ttl = status === 'SEALED' || status === 'EXPIRED' ? 60000 : 5000;
      this.cache.set(cacheKey, status, ttl);
      
      endTimer();
      return status;
    } catch (error) {
      endTimer();
      throw handleError('get transaction status', error);
    }
  }
  
  /**
   * Monitor multiple transactions
   */
  async monitorTransactions(
    txIds: string[],
    onUpdate: (txId: string, status: TransactionStatus) => void
  ): Promise<void> {
    const endTimer = startTimer('monitorTransactions');
    try {
      const monitors = txIds.map(txId => this.monitorTransaction(txId, onUpdate));
      await Promise.all(monitors);
      endTimer();
    } catch (error) {
      endTimer();
      throw handleError('monitor transactions', error);
    }
  }
  
  /**
   * Cancel pending transaction
   */
  async cancelTransaction(txId: string): Promise<boolean> {
    const endTimer = startTimer('cancelTransaction');
    try {
      // Remove from pending transactions tracking
      this.pendingTransactions.delete(txId);
      
      // Clear any cached status
      this.cache.delete(`tx-status-${txId}`);
      
      // Flow doesn't support transaction cancellation - throw error instead of silent failure
      endTimer();
      throw new Error('Transaction cancellation is not supported on Flow blockchain');
    } catch (error) {
      endTimer();
      throw handleError('cancel transaction', error);
    }
  }
  
  /**
   * Get pending transactions
   */
  getPendingTransactions(): string[] {
    return Array.from(this.pendingTransactions.keys());
  }
  
  /**
   * Clear completed transactions
   */
  clearCompletedTransactions(): void {
    // This would require tracking completion status
    // For now, clear all
    this.pendingTransactions.clear();
  }
  
  /**
   * Monitor single transaction status
   */
  private async monitorTransaction(
    txId: string,
    onStatusChange: (txId: string, status: TransactionStatus) => void
  ): Promise<void> {
    const checkStatus = async () => {
      try {
        const status = await this.getTransactionStatus(txId);
        onStatusChange(txId, status);
        
        if (status === 'SEALED' || status === 'EXPIRED') {
          return;
        }
        
        // Continue monitoring
        setTimeout(checkStatus, 1000);
      } catch (error) {
        console.error(`Error monitoring transaction ${txId}:`, error);
      }
    };
    
    await checkStatus();
  }
  
  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number, txId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Transaction ${txId} timed out after ${timeout}ms`));
      }, timeout);
    });
  }
  
  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Chunk array utility
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Execute an EVM call (single call version of batch)
   */
  async executeEVMCall(call: EVMBatchCall): Promise<CallOutcome> {
    try {
      const batchResult = await this.executeEVMBatchCalls([call]);
      
      // Return the first result if successful
      if (batchResult.results && batchResult.results.length > 0) {
        return batchResult.results[0];
      }
      
      throw new Error('Failed to execute EVM call');
    } catch (error) {
      console.error('EVM call execution failed:', error);
      // Propagate the error instead of returning a mock failure object
      throw handleError('execute EVM call', error);
    }
  }
}

export default TransactionClient;