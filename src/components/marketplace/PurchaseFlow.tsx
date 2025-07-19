import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { EnhancedCustomPattern } from "../../types/patterns";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { useAccount } from "wagmi";

interface PurchaseFlowProps {
  pattern: EnhancedCustomPattern;
  onPurchaseComplete: (licenseId: string) => void;
  onCancel: () => void;
}

const licenseOptions = [
  {
    id: "personal",
    name: "Personal License",
    price: "0.01 ETH",
    description: "For individual use. Cannot be used for commercial purposes.",
    terms: {
      commercial: false,
      derivatives: false,
      attribution: true,
      royaltyPercentage: 0,
    },
  },
  {
    id: "commercial",
    name: "Commercial License",
    price: "0.1 ETH",
    description: "For use in a commercial project with up to 100 users.",
    terms: {
      commercial: true,
      derivatives: false,
      attribution: true,
      royaltyPercentage: 5,
    },
  },
];

export const PurchaseFlow: React.FC<PurchaseFlowProps> = ({
  pattern,
  onPurchaseComplete,
  onCancel,
}) => {
  const [selectedLicense, setSelectedLicense] = useState("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  // Story Protocol functionality removed

  // Initialize blockchain methods if not already present
  useEffect(() => {
    // Story Protocol methods removed - using simplified flow
  }, [pattern]);

  const handlePurchase = async () => {
    if (!address) {
      setError("Please connect your wallet to purchase a license");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Registering pattern as IP Asset", pattern);

      // Find the selected license details
      const licenseOption = licenseOptions.find(
        (option) => option.id === selectedLicense,
      );
      if (!licenseOption) {
        throw new Error("Invalid license option selected");
      }

      // Ensure blockchain methods are available
      if (!pattern.blockchainMethods) {
        throw new Error("Blockchain methods not initialized");
      }

      // 1. Register the pattern as IP if it doesn't have an ipId yet
      if (!pattern.ipId) {
        // Register the IP using our blockchain methods
        const metadata = await pattern.blockchainMethods.register();
        console.log("Successfully registered IP asset:", metadata.ipId);
      }

      // 2. Set the licensing terms based on the selected license
      await pattern.blockchainMethods.setLicenseTerms(licenseOption.terms);

      console.log("Successfully set license terms for pattern");

      // 3. Generate a license ID (in a real implementation, this would come from the blockchain)
      const licenseId = `license_${pattern.ipId}_${Date.now()}`;

      setIsSuccess(true);
      setTimeout(() => onPurchaseComplete(licenseId), 2000);
    } catch (err) {
      console.error("Purchase failed:", err);
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
          You now have a license for this pattern.
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
      <CardHeader className="p-0">
        <CardTitle>License Pattern</CardTitle>
        <CardDescription>
          Choose a license to unlock this pattern and support the creator.
        </CardDescription>
      </CardHeader>

      <RadioGroup
        value={selectedLicense}
        onValueChange={setSelectedLicense}
        className="space-y-4"
      >
        {licenseOptions.map((option) => (
          <Label
            key={option.id}
            htmlFor={option.id}
            className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary"
          >
            <RadioGroupItem value={option.id} id={option.id} />
            <div className="flex-1">
              <div className="font-semibold">{option.name}</div>
              <div className="text-sm text-muted-foreground">
                {option.description}
              </div>
            </div>
            <div className="font-bold">{option.price}</div>
          </Label>
        ))}
      </RadioGroup>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handlePurchase} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Purchasing...
            </>
          ) : (
            "Confirm Purchase"
          )}
        </Button>
      </div>
    </div>
  );
};
