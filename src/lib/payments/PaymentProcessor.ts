/**
 * Simplified Blockchain Payment Handler
 * 
 * Handles on-chain payments for:
 * - Flow Blockchain: NFT purchases and marketplace transactions
 * - Lens Protocol: Social tipping and creator support
 */

import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

export interface BlockchainPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata: {
    type: 'nft_purchase' | 'tip';
    itemId?: string;
    creatorAddress?: string;
    blockchain: 'flow' | 'lens';
  };
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  receipt?: {
    amount: number;
    currency: string;
    timestamp: Date;
    blockchain: string;
  };
}

export class BlockchainPaymentHandler {
  private authState: any;

  constructor(authState: any) {
    this.authState = authState;
  }

  /**
   * Process blockchain payment directly
   */
  async processPayment(request: BlockchainPaymentRequest): Promise<PaymentResult> {
    try {
      switch (request.metadata.blockchain) {
        case 'flow':
          return await this.processFlowPayment(request);
        case 'lens':
          return await this.processLensPayment(request);
        default:
          throw new Error('Unsupported blockchain');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Process Flow blockchain payments (NFT purchases)
   */
  private async processFlowPayment(request: BlockchainPaymentRequest): Promise<PaymentResult> {
    if (!this.authState.flow.connected) {
      throw new Error('Flow wallet not connected');
    }

    // Use Flow's native payment capabilities
    const txHash = await this.authState.flow.purchaseNFT({
      itemId: request.metadata.itemId,
      amount: request.amount,
      currency: request.currency,
    });

    return {
      success: true,
      transactionHash: txHash,
      receipt: {
        amount: request.amount,
        currency: request.currency,
        timestamp: new Date(),
        blockchain: 'flow',
      },
    };
  }

  /**
   * Process Lens payments (social tipping)
   */
  private async processLensPayment(request: BlockchainPaymentRequest): Promise<PaymentResult> {
    if (!this.authState.lens.connected) {
      throw new Error('Lens Protocol not connected');
    }

    // Use Lens Protocol for social payments
    const txHash = await this.authState.lens.sendTip({
      recipientAddress: request.metadata.creatorAddress,
      amount: request.amount,
      currency: request.currency,
    });

    return {
      success: true,
      transactionHash: txHash,
      receipt: {
        amount: request.amount,
        currency: request.currency,
        timestamp: new Date(),
        blockchain: 'lens',
      },
    };
  }

  /**
   * Handle post-payment actions
   */
  async handlePostPayment(request: BlockchainPaymentRequest, result: PaymentResult): Promise<void> {
    if (!result.success) return;

    switch (request.metadata.type) {
      case 'nft_purchase':
        await this.handleNFTPurchase(request, result);
        break;
      case 'tip':
        await this.handleCreatorTip(request, result);
        break;
    }
  }

  private async handleNFTPurchase(request: BlockchainPaymentRequest, result: PaymentResult) {
    // NFT ownership is handled automatically by Flow blockchain
    console.log('NFT purchased:', request.metadata.itemId, 'tx:', result.transactionHash);
  }

  private async handleCreatorTip(request: BlockchainPaymentRequest, result: PaymentResult) {
    // Create social post about the tip via Lens Protocol
    if (this.authState.lens.connected) {
      await this.authState.lens.createPost({
        content: `Sent a tip of ${request.amount} ${request.currency} to support great breathing patterns! 🌬️`,
        tags: ['tip', 'support', 'breathing'],
      });
    }
  }
}

/**
 * React hook for blockchain payments
 */
export const useBlockchainPayments = () => {
  const authState = useUnifiedAuth();
  const handler = new BlockchainPaymentHandler(authState);

  return {
    processPayment: handler.processPayment.bind(handler),
    handlePostPayment: handler.handlePostPayment.bind(handler),
    authState,
  };
};