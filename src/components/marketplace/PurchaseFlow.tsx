import React, { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { EnhancedCustomPattern } from "../../types/patterns";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface PurchaseFlowProps {
  pattern: EnhancedCustomPattern;
  onPurchaseComplete: (licenseId: string) => void;
  onCancel: () => void;
}

export const PurchaseFlow: React.FC<PurchaseFlowProps> = ({
  pattern,
  onPurchaseComplete,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const licenseId = `license_${pattern.id}_${Date.now()}`;
      setIsSuccess(true);
      setTimeout(() => onPurchaseComplete(licenseId), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete purchase",
      );
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Purchase Successful!</h3>
        <p className="text-muted-foreground">
          You now have access to this pattern.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => setError(null)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Purchase Pattern</h3>
        <p className="text-sm text-muted-foreground">
          Complete your purchase to access this premium pattern.
        </p>
      </div>
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handlePurchase} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Confirm Purchase"
          )}
        </Button>
      </div>
    </div>
  );
};
