/**
 * Unified Payment Processing System
 * 
 * Handles payments across multiple chains while respecting their specific utilities:
 * - Flow Blockchain: NFT purchases and marketplace transactions
 * - Traditional Payments: Fiat onboarding and accessibility
 * - Story Protocol: IP licensing and royalty distributions
 * - Lens Protocol: Social tipping and creator support
 */

import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

export interface PaymentMethod {
  id: string;
  type: 'crypto' | 'fiat';
  name: string;
  icon: string;
  blockchain?: 'flow' | 'ethereum' | 'lens';
  currency: string;
  available: boolean;
  fees: {
    percentage: number;
    fixed: number;
  };
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata: {
    type: 'nft_purchase' | 'pattern_license' | 'subscription' | 'tip';
    itemId?: string;
    creatorAddress?: string;
    blockchain?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  blockchainTxHash?: string;
  error?: string;
  receipt?: {
    amount: number;
    currency: string;
    fees: number;
    netAmount: number;
    timestamp: Date;
  };
}

export class PaymentProcessor {
  private authState: any;

  constructor(authState: any) {
    this.authState = authState;
  }

  /**
   * Get available payment methods based on user's auth level and purchase type
   */
  getAvailablePaymentMethods(request: PaymentRequest): PaymentMethod[] {
    const methods: PaymentMethod[] = [];

    // Fiat payment methods (always available for accessibility)
    methods.push({
      id: 'stripe_card',
      type: 'fiat',
      name: 'Credit/Debit Card',
      icon: '💳',
      currency: 'USD',
      available: true,
      fees: { percentage: 2.9, fixed: 0.30 },
    });

    methods.push({
      id: 'stripe_apple_pay',
      type: 'fiat',
      name: 'Apple Pay',
      icon: '🍎',
      currency: 'USD',
      available: this.isApplePayAvailable(),
      fees: { percentage: 2.9, fixed: 0.30 },
    });

    methods.push({
      id: 'stripe_google_pay',
      type: 'fiat',
      name: 'Google Pay',
      icon: '🟢',
      currency: 'USD',
      available: this.isGooglePayAvailable(),
      fees: { percentage: 2.9, fixed: 0.30 },
    });

    // Crypto payment methods (based on auth level and blockchain connections)
    if (this.authState.walletConnected) {
      // Flow blockchain payments (for NFTs and marketplace)
      if (this.authState.flow.connected && request.metadata.type === 'nft_purchase') {
        methods.push({
          id: 'flow_fusd',
          type: 'crypto',
          name: 'Flow USD',
          icon: '🌊',
          blockchain: 'flow',
          currency: 'FUSD',
          available: true,
          fees: { percentage: 0.5, fixed: 0 },
        });

        methods.push({
          id: 'flow_flow',
          type: 'crypto',
          name: 'FLOW Token',
          icon: '🌊',
          blockchain: 'flow',
          currency: 'FLOW',
          available: true,
          fees: { percentage: 0.5, fixed: 0 },
        });
      }

      // Ethereum/Lens payments (for social features and tipping)
      if (this.authState.lens.connected && request.metadata.type === 'tip') {
        methods.push({
          id: 'lens_eth',
          type: 'crypto',
          name: 'Ethereum',
          icon: '⟠',
          blockchain: 'ethereum',
          currency: 'ETH',
          available: true,
          fees: { percentage: 0.1, fixed: 0 },
        });

        methods.push({
          id: 'lens_usdc',
          type: 'crypto',
          name: 'USD Coin',
          icon: '💵',
          blockchain: 'ethereum',
          currency: 'USDC',
          available: true,
          fees: { percentage: 0.1, fixed: 0 },
        });
      }
    }

    return methods.filter(method => method.available);
  }

  /**
   * Process payment using the selected method
   */
  async processPayment(
    request: PaymentRequest,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      switch (paymentMethod.type) {
        case 'fiat':
          return await this.processFiatPayment(request, paymentMethod);
        case 'crypto':
          return await this.processCryptoPayment(request, paymentMethod);
        default:
          throw new Error('Unsupported payment method type');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  /**
   * Process fiat payments via Stripe
   */
  private async processFiatPayment(
    request: PaymentRequest,
    method: PaymentMethod
  ): Promise<PaymentResult> {
    // Calculate fees
    const fees = (request.amount * method.fees.percentage / 100) + method.fees.fixed;
    const totalAmount = request.amount + fees;

    // Create Stripe payment intent
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(totalAmount * 100), // Stripe expects cents
        currency: method.currency.toLowerCase(),
        payment_method_types: this.getStripePaymentMethods(method.id),
        metadata: {
          ...request.metadata,
          originalAmount: request.amount,
          fees: fees,
        },
      }),
    });

    const { clientSecret, paymentIntentId } = await response.json();

    // For demo purposes, simulate successful payment
    // In production, this would integrate with Stripe's client-side SDK
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      transactionId: paymentIntentId,
      receipt: {
        amount: request.amount,
        currency: method.currency,
        fees: fees,
        netAmount: request.amount,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Process crypto payments on respective blockchains
   */
  private async processCryptoPayment(
    request: PaymentRequest,
    method: PaymentMethod
  ): Promise<PaymentResult> {
    switch (method.blockchain) {
      case 'flow':
        return await this.processFlowPayment(request, method);
      case 'ethereum':
      case 'lens':
        return await this.processEthereumPayment(request, method);
      default:
        throw new Error('Unsupported blockchain for payment');
    }
  }

  /**
   * Process Flow blockchain payments (NFT purchases)
   */
  private async processFlowPayment(
    request: PaymentRequest,
    method: PaymentMethod
  ): Promise<PaymentResult> {
    if (!this.authState.flow.connected) {
      throw new Error('Flow blockchain not connected');
    }

    // Use Flow's native payment capabilities
    const txHash = await this.authState.flow.purchaseNFT({
      itemId: request.metadata.itemId,
      amount: request.amount,
      currency: method.currency,
    });

    return {
      success: true,
      transactionId: `flow_${Date.now()}`,
      blockchainTxHash: txHash,
      receipt: {
        amount: request.amount,
        currency: method.currency,
        fees: request.amount * method.fees.percentage / 100,
        netAmount: request.amount * (1 - method.fees.percentage / 100),
        timestamp: new Date(),
      },
    };
  }

  /**
   * Process Ethereum/Lens payments (social features)
   */
  private async processEthereumPayment(
    request: PaymentRequest,
    method: PaymentMethod
  ): Promise<PaymentResult> {
    if (!this.authState.lens.connected) {
      throw new Error('Lens Protocol not connected');
    }

    // Use Lens Protocol for social payments
    const txHash = await this.authState.lens.sendTip({
      recipientAddress: request.metadata.creatorAddress,
      amount: request.amount,
      currency: method.currency,
    });

    return {
      success: true,
      transactionId: `lens_${Date.now()}`,
      blockchainTxHash: txHash,
      receipt: {
        amount: request.amount,
        currency: method.currency,
        fees: request.amount * method.fees.percentage / 100,
        netAmount: request.amount * (1 - method.fees.percentage / 100),
        timestamp: new Date(),
      },
    };
  }

  /**
   * Handle post-payment actions based on purchase type
   */
  async handlePostPayment(
    request: PaymentRequest,
    result: PaymentResult
  ): Promise<void> {
    if (!result.success) return;

    switch (request.metadata.type) {
      case 'nft_purchase':
        await this.handleNFTPurchase(request, result);
        break;
      case 'pattern_license':
        await this.handlePatternLicense(request, result);
        break;
      case 'tip':
        await this.handleCreatorTip(request, result);
        break;
      case 'subscription':
        await this.handleSubscription(request, result);
        break;
    }
  }

  private async handleNFTPurchase(request: PaymentRequest, result: PaymentResult) {
    // Grant NFT access
    // Update user's collection
    // Trigger Flow blockchain minting if needed
    console.log('Handling NFT purchase:', request.metadata.itemId);
  }

  private async handlePatternLicense(request: PaymentRequest, result: PaymentResult) {
    // Register license via Story Protocol
    // Grant pattern access
    // Set up royalty distribution
    if (this.authState.story.connected) {
      await this.authState.story.createLicense({
        patternId: request.metadata.itemId,
        licenseeAddress: this.authState.walletAddress,
        amount: request.amount,
      });
    }
  }

  private async handleCreatorTip(request: PaymentRequest, result: PaymentResult) {
    // Record tip in social system
    // Notify creator via Lens Protocol
    if (this.authState.lens.connected) {
      await this.authState.lens.createPost({
        content: `Sent a tip of ${request.amount} ${request.currency} to support great breathing patterns! 🌬️`,
        tags: ['tip', 'support', 'breathing'],
      });
    }
  }

  private async handleSubscription(request: PaymentRequest, result: PaymentResult) {
    // Update subscription status
    // Grant premium features
    console.log('Handling subscription:', request.amount);
  }

  // Utility methods
  private isApplePayAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'ApplePaySession' in window && 
           ApplePaySession.canMakePayments();
  }

  private isGooglePayAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'google' in window && 
           'payments' in (window as any).google;
  }

  private getStripePaymentMethods(methodId: string): string[] {
    switch (methodId) {
      case 'stripe_card':
        return ['card'];
      case 'stripe_apple_pay':
        return ['card', 'apple_pay'];
      case 'stripe_google_pay':
        return ['card', 'google_pay'];
      default:
        return ['card'];
    }
  }
}

/**
 * React hook for payment processing
 */
export const usePaymentProcessor = () => {
  const authState = useUnifiedAuth();
  const processor = new PaymentProcessor(authState);

  return {
    getAvailablePaymentMethods: processor.getAvailablePaymentMethods.bind(processor),
    processPayment: processor.processPayment.bind(processor),
    handlePostPayment: processor.handlePostPayment.bind(processor),
    authState,
  };
};