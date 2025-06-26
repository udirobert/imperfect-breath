import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import type { EnhancedCustomPattern } from "@/types/patterns";
import { demoStoryIntegration } from "@/lib/story/storyClient";

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
  },
  {
    id: "commercial",
    name: "Commercial License",
    price: "0.1 ETH",
    description: "For use in a commercial project with up to 100 users.",
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

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const ipId = await demoStoryIntegration.registerPatternDemo(pattern);
      await demoStoryIntegration.attachLicenseDemo(ipId);
      // In a real scenario, we would get a real license ID from the transaction
      const mockLicenseId = `license_${Date.now()}`;
      setIsSuccess(true);
      setTimeout(() => onPurchaseComplete(mockLicenseId), 2000);
    } catch (error) {
      console.error("Purchase failed:", error);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Purchase Successful!</h3>
        <p className="text-muted-foreground">
          You now have a license for "{pattern.name}".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CardHeader className="p-0">
        <CardTitle>License "{pattern.name}"</CardTitle>
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
