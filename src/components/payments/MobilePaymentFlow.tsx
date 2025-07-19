import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaymentProcessor, PaymentRequest, PaymentMethod, PaymentResult } from "@/lib/payments/PaymentProcessor";
import {
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobilePaymentFlowProps {
  request: PaymentRequest;
  onSuccess: (result: PaymentResult) => void;
  onCancel: () => void;
  className?: string;
}

type PaymentStep = 'methods' | 'processing' | 'success' | 'error';

export const MobilePaymentFlow: React.FC<MobilePaymentFlowProps> = ({
  request,
  onSuccess,
  onCancel,
  className,
}) => {
  const isMobile = useIsMobile();
  const { getAvailablePaymentMethods, processPayment, handlePostPayment, authState } = usePaymentProcessor();
  
  const [currentStep, setCurrentStep] = useState<PaymentStep>('methods');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available payment methods
  useEffect(() => {
    const methods = getAvailablePaymentMethods(request);
    setPaymentMethods(methods);
    
    // Auto-select best method for mobile
    if (methods.length > 0 && isMobile) {
      // Prefer mobile-friendly methods
      const mobilePreferred = methods.find(m => 
        m.id === 'stripe_apple_pay' || m.id === 'stripe_google_pay'
      ) || methods[0];
      setSelectedMethod(mobilePreferred);
    }
  }, [request, isMobile]);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    setCurrentStep('processing');
    setError(null);

    try {
      const paymentResult = await processPayment(request, selectedMethod);
      
      if (paymentResult.success) {
        await handlePostPayment(request, paymentResult);
        setResult(paymentResult);
        setCurrentStep('success');
        onSuccess(paymentResult);
      } else {
        setError(paymentResult.error || 'Payment failed');
        setCurrentStep('error');
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method.id) {
      case 'stripe_apple_pay':
        return '🍎';
      case 'stripe_google_pay':
        return '🟢';
      case 'stripe_card':
        return <CreditCard className="h-5 w-5" />;
      case 'flow_fusd':
      case 'flow_flow':
        return '🌊';
      case 'lens_eth':
      case 'lens_usdc':
        return '⟠';
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getBlockchainBadge = (method: PaymentMethod) => {
    if (!method.blockchain) return null;
    
    const colors = {
      flow: 'bg-blue-100 text-blue-800',
      ethereum: 'bg-purple-100 text-purple-800',
      lens: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={cn('text-xs', colors[method.blockchain])}>
        {method.blockchain.toUpperCase()}
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount} ${currency}`;
  };

  const calculateTotal = (method: PaymentMethod) => {
    const fees = (request.amount * method.fees.percentage / 100) + method.fees.fixed;
    return request.amount + fees;
  };

  // Only render on mobile or when explicitly requested
  if (!isMobile && className?.includes('force-render') === false) {
    return null;
  }

  return (
    <div className={cn("fixed inset-0 z-50 bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <h1 className="font-semibold">Payment</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentStep === 'methods' && (
          <div className="space-y-6">
            {/* Purchase Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item</span>
                  <span className="font-medium">{request.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {formatAmount(request.amount, request.currency)}
                  </span>
                </div>
                {selectedMethod && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span>
                        {formatAmount(
                          (request.amount * selectedMethod.fees.percentage / 100) + selectedMethod.fees.fixed,
                          selectedMethod.currency
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>
                          {formatAmount(calculateTotal(selectedMethod), selectedMethod.currency)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h3 className="font-semibold">Payment Method</h3>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={cn(
                    "cursor-pointer transition-all touch-manipulation",
                    selectedMethod?.id === method.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:shadow-md"
                  )}
                  onClick={() => setSelectedMethod(method)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          {getPaymentMethodIcon(method)}
                        </div>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.fees.percentage}% + {formatAmount(method.fees.fixed, method.currency)} fee
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getBlockchainBadge(method)}
                        {method.type === 'crypto' && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Fast
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your payment is secured with industry-standard encryption. 
                {selectedMethod?.type === 'crypto' && ' Blockchain transactions are immutable and transparent.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Processing Payment</h3>
              <p className="text-muted-foreground">
                {selectedMethod?.type === 'crypto' 
                  ? 'Confirming blockchain transaction...'
                  : 'Securely processing your payment...'
                }
              </p>
            </div>
            <Progress value={66} className="w-full max-w-xs" />
          </div>
        )}

        {currentStep === 'success' && result && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Payment Successful!</h3>
              <p className="text-muted-foreground">
                Your purchase has been completed successfully.
              </p>
            </div>
            
            {result.receipt && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-base">Receipt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span>{formatAmount(result.receipt.amount, result.receipt.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees</span>
                    <span>{formatAmount(result.receipt.fees, result.receipt.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>{formatAmount(result.receipt.amount + result.receipt.fees, result.receipt.currency)}</span>
                  </div>
                  {result.transactionId && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Transaction ID</span>
                      <span className="font-mono">{result.transactionId.slice(0, 12)}...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Payment Failed</h3>
              <p className="text-muted-foreground">
                {error || 'An error occurred while processing your payment.'}
              </p>
            </div>
            <Button
              onClick={() => setCurrentStep('methods')}
              className="touch-manipulation"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      {currentStep === 'methods' && (
        <div className="p-4 border-t bg-background">
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
            className="w-full touch-manipulation"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {selectedMethod ? formatAmount(calculateTotal(selectedMethod), selectedMethod.currency) : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobilePaymentFlow;