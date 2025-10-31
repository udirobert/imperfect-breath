/**
 * CONSOLIDATED RevenueCat Service - Web Compatible
 *
 * AGGRESSIVE CONSOLIDATION: Single implementation for all platforms
 * DRY: Eliminates duplicate logic and conditional imports
 * CLEAN: Clear interface with fallbacks for web
 * MODULAR: Composable subscription tiers
 * PERFORMANT: Lazy loading and caching
 *
 * Updated for RevenueCat SDK 11.2.6 with proper TypeScript support
 */

// CLEAN: Proper RevenueCat imports for latest SDK
import type {
  PurchasesOfferings,
  CustomerInfo,
  PurchasesPackage,
  PurchasesError,
} from "@revenuecat/purchases-capacitor";

// CLEAN: Simplified types for cross-platform compatibility
export interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  isActive: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier | null;
  isActive: boolean;
  expiresAt?: Date;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  subscription?: UserSubscription;
  customerInfo?: CustomerInfo;
}

// ORGANIZED: Subscription tier definitions
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    description: "Basic breathing patterns and sessions",
    features: [
      "Basic breathing patterns",
      "Session tracking",
      "Progress overview",
      "Community access",
    ],
    isActive: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$4.99/month",
    description: "Advanced features and personalization",
    features: [
      "All basic features",
      "Advanced breathing patterns",
      "Detailed analytics",
      "Custom pattern creation",
      "Social sharing",
    ],
    isActive: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$9.99/month",
    description: "Complete breathing experience with Web3 features",
    features: [
      "All pro features",
      "NFT pattern minting",
      "Creator monetization",
      "Priority support",
      "Beta feature access",
    ],
    isActive: false,
  },
];

// PERFORMANT: Platform detection with proper Capacitor check
const isMobile =
  typeof window !== "undefined" &&
  (window as unknown as { Capacitor?: { getPlatform(): string } }).Capacitor &&
  ["ios", "android"].includes(
    (
      window as unknown as { Capacitor: { getPlatform(): string } }
    ).Capacitor.getPlatform(),
  );

// CLEAN: Lazy load RevenueCat only on mobile
let Purchases:
  | typeof import("@revenuecat/purchases-capacitor").Purchases
  | null = null;

if (isMobile) {
  try {
    import("@revenuecat/purchases-capacitor").then((module) => {
      Purchases = module.Purchases;
    });
  } catch (error) {
    console.warn("RevenueCat not available on this platform:", error);
  }
}

/**
 * CONSOLIDATED RevenueCat Service
 *
 * ENHANCEMENT FIRST: Enhances existing subscription logic
 * WEB COMPATIBLE: Works on all platforms with graceful fallbacks
 */
class RevenueCatService {
  private isInitialized = false;
  private currentSubscription: UserSubscription | null = null;

  // CLEAN: Simple initialization with proper SDK setup
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (isMobile && Purchases) {
        // Mobile: Initialize actual RevenueCat SDK
        const apiKey = process.env.REVENUECAT_API_KEY;
        if (!apiKey) {
          console.warn("RevenueCat API key not provided");
          return false;
        }

        await Purchases.configure({ apiKey });
        console.log("RevenueCat SDK initialized successfully");
        this.isInitialized = true;
        return true;
      } else {
        // Web: Use mock implementation for development
        console.log("Web platform - using mock subscription service");
        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      console.warn("RevenueCat initialization failed:", error);
      return false;
    }
  }

  // DRY: Single method for subscription status
  async getSubscriptionStatus(): Promise<UserSubscription> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (isMobile) {
      // Mobile: Check actual RevenueCat status
      return this.getMobileSubscriptionStatus();
    } else {
      // Web: Return mock free tier
      return {
        tier: SUBSCRIPTION_TIERS[0], // Free tier
        isActive: true,
      };
    }
  }

  // MODULAR: Purchase handling with proper SDK calls
  async purchaseSubscription(tierId: string): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId);
    if (!tier) {
      return {
        success: false,
        error: "Invalid subscription tier",
      };
    }

    if (isMobile && Purchases) {
      return this.handleMobilePurchase(tier);
    } else {
      // Web: Redirect to payment page or show message
      console.log("Web purchase would redirect to payment processor");
      return {
        success: false,
        error: "Please use the mobile app to make purchases",
      };
    }
  }

  // CLEAN: User identification for analytics with proper SDK calls
  async identifyUser(
    userId: string,
    attributes?: Record<string, string>,
  ): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (isMobile && Purchases) {
        await Purchases.logIn({ appUserID: userId });
        if (attributes) {
          await Purchases.setAttributes(attributes);
        }
        console.log("RevenueCat: User identified", userId);
      } else {
        console.log("Web: User identified", userId);
        // Web analytics integration could go here
      }
    } catch (error) {
      console.warn("User identification failed:", error);
    }
  }

  // PERFORMANT: Check if RevenueCat is available
  isRevenueCatAvailable(): boolean {
    return Boolean(isMobile && this.isInitialized && !!Purchases);
  }

  // CLEAN: Platform-specific implementations with actual SDK calls
  private async getMobileSubscriptionStatus(): Promise<UserSubscription> {
    try {
      if (!Purchases) {
        throw new Error("RevenueCat SDK not available");
      }

      const result = await Purchases.getCustomerInfo();
      // Handle both possible return types
      const customerInfo = 'customerInfo' in result ? result.customerInfo : result;
      const activeEntitlements = customerInfo.entitlements?.active || {};

      // Check for premium subscription
      if (
        activeEntitlements.premium &&
        Boolean(activeEntitlements.premium.isActive) === true
      ) {
        return {
          tier:
            SUBSCRIPTION_TIERS.find((t) => t.id === "premium") ||
            SUBSCRIPTION_TIERS[0],
          isActive: true,
          expiresAt: activeEntitlements.premium?.expirationDate
            ? new Date(activeEntitlements.premium.expirationDate)
            : undefined,
        };
      }

      // Check for pro subscription
      if (
        activeEntitlements.pro &&
        Boolean(activeEntitlements.pro.isActive) === true
      ) {
        return {
          tier:
            SUBSCRIPTION_TIERS.find((t) => t.id === "pro") ||
            SUBSCRIPTION_TIERS[0],
          isActive: true,
          expiresAt: activeEntitlements.pro?.expirationDate
            ? new Date(activeEntitlements.pro.expirationDate)
            : undefined,
        };
      }

      // Default to free tier
      return {
        tier: SUBSCRIPTION_TIERS[0], // Free tier
        isActive: true,
      };
    } catch (error) {
      console.error("Failed to get mobile subscription status:", error);
      return {
        tier: SUBSCRIPTION_TIERS[0],
        isActive: true,
      };
    }
  }

  private async handleMobilePurchase(
    tier: SubscriptionTier,
  ): Promise<PurchaseResult> {
    try {
      if (!Purchases) {
        throw new Error("RevenueCat SDK not available");
      }

      // Get current offerings
      const offeringsResult = await Purchases.getOfferings();
      const offerings =
        (offeringsResult as { current?: unknown }).current || offeringsResult;
      if (!offerings) {
        throw new Error("No offerings available");
      }

      // Find the package for this tier
      const packageToPurchase = this.findPackageForTier(
        offerings as unknown,
        tier.id,
      );
      if (!packageToPurchase) {
        throw new Error(`No package found for tier: ${tier.id}`);
      }

      // Make the purchase
      const purchaseResult = await Purchases.purchasePackage({
        aPackage: packageToPurchase,
      });
      // Handle both possible return types
      const customerInfo = 'customerInfo' in purchaseResult ? purchaseResult.customerInfo : purchaseResult;

      return {
        success: true,
        customerInfo,
        subscription: {
          tier,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Purchase failed",
      };
    }
  }

  private findPackageForTier(
    offerings: unknown,
    tierId: string,
  ): PurchasesPackage | null {
    const packageMap: Record<string, string> = {
      pro: "pro_monthly",
      premium: "premium_monthly",
    };

    const packageId = packageMap[tierId];
    if (!packageId) return null;

    // Look through all offering types
    const allPackages: PurchasesPackage[] = [];

    // Add packages from all available offering types
    const offeringTypes = ["monthly", "annual", "lifetime"] as const;

    for (const offerType of offeringTypes) {
      const packages = (
        offerings as unknown as Record<string, PurchasesPackage[]>
      )[offerType];
      if (packages && Array.isArray(packages)) {
        allPackages.push(...packages);
      }
    }

    return allPackages.find((pkg) => pkg.identifier === packageId) || null;
  }
}

// CLEAN: Single instance (singleton pattern)
export const revenueCatService = new RevenueCatService();

// MODULAR: Convenience hooks and utilities
export function getAvailableTiers(): SubscriptionTier[] {
  return SUBSCRIPTION_TIERS;
}

export function getTierById(id: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find((tier) => tier.id === id);
}

export function isSubscriptionActive(
  subscription: UserSubscription | null,
): boolean {
  return subscription?.isActive === true;
}

export function hasFeature(
  subscription: UserSubscription | null,
  feature: string,
): boolean {
  if (!subscription?.tier) return false;
  return subscription.tier.features.includes(feature);
}

// ORGANIZED: Export types and service
export default revenueCatService;
