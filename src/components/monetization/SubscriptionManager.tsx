/**
 * Subscription Manager - RevenueCat Integration UI
 *
 * ENHANCEMENT: Adds monetization UI while maintaining design consistency
 * CLEAN: Reuses existing UI components and patterns
 * MODULAR: Composable subscription tiers and purchase flows
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Check,
  Crown,
  Sparkles,
  Zap,
  Heart,
  Brain,
  Palette,
  Users,
  Shield,
  Star,
  Loader2,
  AlertCircle,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  revenueCatService,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/lib/monetization/revenueCat";
import { useRevenueCatStatus } from "@/stores/authStore";

// Type definitions for component
interface RecommendationItem {
  patternId: string;
  pattern: { name: string };
  confidence: number;
  reason: string;
  timeToEffect: string;
  matchPercentage: number;
  explanation: string;
  badge: string;
}

interface SubscriptionManagerProps {
  className?: string;
  showCurrentPlan?: boolean;
  variant?: "compact" | "full";
}

const TIER_ICONS = {
  basic: Heart,
  premium: Sparkles,
  pro: Crown,
};

const TIER_COLORS = {
  basic: "bg-gray-500",
  premium: "bg-blue-500",
  pro: "bg-purple-500",
};

const TIER_GRADIENTS = {
  basic: "from-gray-400 to-gray-600",
  premium: "from-blue-400 to-blue-600",
  pro: "from-purple-400 to-purple-600",
};

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  className,
  showCurrentPlan = true,
  variant = "full",
}) => {
  const rc = useRevenueCatStatus();
  const isInitialized = rc.isAvailable;
  const subscriptionStatus = {
    tier: rc.subscriptionTier,
    isActive: rc.isSubscriptionActive,
    features: rc.features,
  };
  const isLoading = false;

  const [purchasingTier, setPurchasingTier] = useState<string | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [showPurchaseItems, setShowPurchaseItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const purchaseSubscription = async (packageId: string) =>
    revenueCatService.purchaseSubscription(packageId);
  // Note: purchaseItem functionality removed as PURCHASE_ITEMS is not exported
  const purchaseItem = async (packageId: string) => {
    console.warn("Purchase item functionality not available");
    return { success: false, error: "Not implemented" };
  };
  const restorePurchases = async () => revenueCatService.restorePurchases();
  const hasFeatureAccess = async (feature: string) =>
    revenueCatService.hasFeatureAccess(feature);

  const handlePurchaseSubscription = async (tier: SubscriptionTier) => {
    if (!isInitialized || tier.id === "basic") return;

    setPurchasingTier(tier.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await purchaseSubscription(tier.packageId);

      if (result.success) {
        setSuccess(`Successfully subscribed to ${tier.name}!`);
      } else {
        setError(result.error || "Purchase failed");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Purchase failed";
      setError(errorMessage);
    } finally {
      setPurchasingTier(null);
    }
  };

  const handlePurchaseItem = async (item: PurchaseItem) => {
    if (!isInitialized) return;

    setPurchasingItem(item.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await purchaseItem(item.packageId);

      if (result.success) {
        setSuccess(`Successfully purchased ${item.name}!`);
      } else {
        setError(result.error || "Purchase failed");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Purchase failed";
      setError(errorMessage);
    } finally {
      setPurchasingItem(null);
    }
  };

  const handleRestore = async () => {
    if (!isInitialized) return;

    setError(null);
    setSuccess(null);

    try {
      const result = await restorePurchases();

      if (result.success) {
        setSuccess("Purchases restored successfully!");
      } else {
        setError(result.error || "Restore failed");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Restore failed";
      setError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading subscription info...</span>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <Alert className="mx-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Subscription features are currently unavailable. Please try again
          later.
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Current Plan Display */}
        {showCurrentPlan && subscriptionStatus && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon =
                    TIER_ICONS[
                      subscriptionStatus.tier as keyof typeof TIER_ICONS
                    ] || Heart;
                  return <Icon className="h-4 w-4" />;
                })()}
                <CardTitle className="text-sm">
                  Current Plan: {subscriptionStatus.tier}
                </CardTitle>
                <Badge
                  variant={
                    subscriptionStatus.tier === "basic"
                      ? "secondary"
                      : "default"
                  }
                >
                  {subscriptionStatus.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {subscriptionStatus.features.length} features available
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Upgrade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-4xl max-w-[95vw]">
                    <DialogHeader>
                      <DialogTitle>Choose Your Plan</DialogTitle>
                      <DialogDescription>
                        Unlock more features and enhance your breathing practice
                      </DialogDescription>
                    </DialogHeader>
                    <SubscriptionManager
                      variant="full"
                      showCurrentPlan={false}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Coins className="h-4 w-4 mr-1" />
                Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Quick Purchases</DialogTitle>
                <DialogDescription>
                  Unlock individual features
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {/* PURCHASE_ITEMS removed as it's not exported from revenueCat.ts */}
                <div className="text-sm text-muted-foreground">
                  Individual purchase items not currently available
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" onClick={handleRestore}>
            Restore
          </Button>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn("space-y-6", className)}>
      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      {showCurrentPlan && subscriptionStatus && (
        <Card
          className={cn(
            "border-2",
            subscriptionStatus.tier !== "basic"
              ? "border-primary"
              : "border-muted",
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon =
                    TIER_ICONS[
                      subscriptionStatus.tier as keyof typeof TIER_ICONS
                    ] || Heart;
                  return (
                    <div
                      className={cn(
                        "p-2 rounded-lg text-white",
                        TIER_COLORS[
                          subscriptionStatus.tier as keyof typeof TIER_COLORS
                        ] || "bg-gray-500",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  );
                })()}
                <div>
                  <CardTitle className="capitalize">
                    {subscriptionStatus.tier} Plan
                  </CardTitle>
                  <CardDescription>
                    {subscriptionStatus.isActive
                      ? "Currently active"
                      : "Not active"}

                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={
                  subscriptionStatus.tier === "basic" ? "secondary" : "default"
                }
              >
                Current
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {subscriptionStatus.features
                .slice(0, 6)
                .map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-500" />
                    {feature}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Tiers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const Icon =
              TIER_ICONS[tier.id as keyof typeof TIER_ICONS] || Heart;
            const isCurrentTier = subscriptionStatus?.tier === tier.id;
            const isPurchasing = purchasingTier === tier.id;

            return (
              <Card
                key={tier.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-200",
                  isCurrentTier && "ring-2 ring-primary",
                  tier.id === "pro" && "border-purple-200 shadow-lg",
                )}
              >
                {/* Popular badge for Pro tier */}
                {tier.id === "pro" && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg text-white",
                        TIER_COLORS[tier.id as keyof typeof TIER_COLORS] ||
                          "bg-gray-500",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <div className="text-2xl font-bold">{tier.price}</div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  {tier.id === "basic" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isCurrentTier ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="h-4 w-4 mr-2" />
                      Subscribed
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        tier.id === "pro" &&
                          "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
                      )}
                      onClick={() => handlePurchaseSubscription(tier)}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Subscribe to ${tier.name}`
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Individual Purchases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Individual Purchases</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPurchaseItems(!showPurchaseItems)}
          >
            {showPurchaseItems ? "Hide" : "Show"} Items
          </Button>
        </div>

        {showPurchaseItems && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PURCHASE_ITEMS removed as it's not exported from revenueCat.ts */}
            <div className="text-sm text-muted-foreground">
              Individual purchase items not currently available
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={handleRestore}>
          <Shield className="h-4 w-4 mr-2" />
          Restore Purchases
        </Button>

        <div className="text-xs text-muted-foreground">
          Secure payments powered by RevenueCat
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
