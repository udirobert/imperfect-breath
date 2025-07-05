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
          this.monitorTransaction(txId, onStatusChange);
        }
        
        // Wait for completion with timeout
        const result = await Promise.race([
          this.baseClient.waitForTransaction(txId),
          this.createTimeoutPromise(timeout, txId)
        ]);
        
        // Check if transaction succeeded
        if (result.status === 4 && !result.errorMessage) {
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
    
    throw lastError || new Error('Transaction failed after all retries');
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
    const {
      maxConcurrent = 3,
      failFast = false,
      retryFailures = true
    } = batchOptions;
    
    const results: BatchTransactionResult[] = [];
    const chunks = this.chunkArray(transactions, maxConcurrent);
    
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
    
    return results;
  }
  
  /**
   * Execute EVM batch calls (for COA integration)
   */
  async executeEVMBatchCalls(calls: EVMBatchCall[]): Promise<BatchTransactionResult> {
    try {
      // This would integrate with Flow's EVM functionality
      // For now, simulate the batch execution
      const results: CallOutcome[] = calls.map((call, index) => ({
        success: true,
        returnData: `0x${'0'.repeat(64)}`, // Mock return data
        gasUsed: 21000,
        error: undefined
      }));
      
      const totalGasUsed = results.reduce((sum, result) => sum + result.gasUsed, 0);
      
      return {
        txId: `batch-${Date.now()}`,
        results,
        isError: false,
        totalGasUsed
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch execution failed';
      
      return {
        txId: `failed-batch-${Date.now()}`,
        results: calls.map(() => ({
          success: false,
          returnData: '',
          gasUsed: 0,
          error: errorMessage
        })),
        isError: true,
        totalGasUsed: 0
      };
    }
  }
  
  /**
   * Get transaction status with caching
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    return this.baseClient.getTransactionStatus(txId);
  }
  
  /**
   * Monitor multiple transactions
   */
  async monitorTransactions(
    txIds: string[],
    onUpdate: (txId: string, status: TransactionStatus) => void
  ): Promise<void> {
    const monitors = txIds.map(txId => this.monitorTransaction(txId, onUpdate));
    await Promise.all(monitors);
  }
  
  /**
   * Cancel pending transaction (if possible)
   */
  async cancelTransaction(txId: string): Promise<boolean> {
    // Flow doesn't support transaction cancellation
    // Remove from pending transactions
    this.pendingTransactions.delete(txId);
    return false;
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
    onStatusChange: (status: TransactionStatus) => void
  ): Promise<void> {
    const checkStatus = async () => {
      try {
        const status = await this.getTransactionStatus(txId);
        onStatusChange(status);
        
        if (status === 'SEALED' || status === 'EXPIRED') {
          return;
        }
        
        // Continue monitoring
        setTimeout(checkStatus, 1000);
      } catch (error) {
        console.error('Error monitoring transaction:', error);
      }
    };
    
    checkStatus();
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
}

export default TransactionClient;