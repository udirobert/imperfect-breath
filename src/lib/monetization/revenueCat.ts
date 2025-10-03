/**
 * RevenueCat Configuration and Subscription Management
 *
 * ENHANCEMENT: Adds monetization capabilities to Imperfect Breath
 * CLEAN: Centralized subscription logic with clear separation of concerns
 * MODULAR: Composable subscription tiers and purchase handling
 */

import React from "react";
import {
  Purchases,
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

// Type definitions for better type safety
interface SubscriptionStatus {
  tier: string;
  isActive: boolean;
  expiresAt?: Date;
  features: string[];
}

interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

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

// Import secure configuration management
import { 
  loadRevenueCatConfig, 
  getRevenueCatKeyForPlatform, 
  isValidRevenueCatKey,
  createMockRevenueCatConfig,
  type RevenueCatConfig,
  type SecureRevenueCatConfig 
} from './revenueCatConfig';

// Subscription Tiers
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: string;
  packageId: string;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Core breathing patterns and local progress",
    features: [
      "Core breathing patterns",
      "Local progress tracking",
      "Basic session analytics",
      "Offline access",
    ],
    price: "Free",
    packageId: "",
  },
  {
    id: "premium",
    name: "Premium",
    description: "AI coaching, cloud sync, and advanced patterns",
    features: [
      "All Basic features",
      "AI coaching with Zen agent",
      "Cloud synchronization",
      "Advanced breathing patterns",
      "Detailed session analytics",
      "Heart rate monitoring",
      "Custom pattern creation",
    ],
    price: "$4.99/month",
    packageId: "premium_monthly",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Web3 features, NFTs, and instructor tools",
    features: [
      "All Premium features",
      "NFT creation and minting",
      "Web3 social features",
      "Instructor certification",
      "Pattern marketplace access",
      "Advanced biometrics",
      "Priority support",
      "Early feature access",
    ],
    price: "$9.99/month",
    packageId: "pro_monthly",
  },
];

// In-App Purchase Items
export interface PurchaseItem {
  id: string;
  name: string;
  description: string;
  price: string;
  packageId: string;
  type: "consumable" | "non_consumable";
}

export const PURCHASE_ITEMS: PurchaseItem[] = [
  {
    id: "ai_session_pack",
    name: "AI Coaching Sessions (10 pack)",
    description: "10 premium AI coaching sessions",
    price: "$4.99",
    packageId: "ai_sessions_10",
    type: "consumable",
  },
  {
    id: "custom_pattern_unlock",
    name: "Custom Pattern Creation",
    description: "Unlock ability to create custom breathing patterns",
    price: "$4.99",
    packageId: "custom_patterns",
    type: "non_consumable",
  },
  {
    id: "nft_minting_credits",
    name: "NFT Minting Credits (5 pack)",
    description: "5 credits for minting breathing session NFTs",
    price: "$9.99",
    packageId: "nft_credits_5",
    type: "consumable",
  },
  {
    id: "premium_pattern_pack_1",
    name: "Advanced Patterns Pack",
    description: "Unlock 15 advanced breathing patterns",
    price: "$2.99",
    packageId: "patterns_advanced",
    type: "non_consumable",
  },
];

// RevenueCat Service Class
export class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;
  private currentOfferings: PurchasesOffering | null = null;
  private customerInfo: CustomerInfo | null = null;
  private secureConfig: SecureRevenueCatConfig | null = null;

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  /**
   * Initialize RevenueCat SDK with secure configuration
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load secure configuration
      this.secureConfig = await loadRevenueCatConfig();
      
      if (!this.secureConfig.isAvailable || !this.secureConfig.config) {
        console.warn(
          "RevenueCat configuration not available:",
          this.secureConfig.error || "Configuration unavailable"
        );
        console.info("Running in demo mode without RevenueCat integration");
        return false;
      }

      // Determine platform and get appropriate API key
      const platform = this.getPlatform();
      const apiKey = getRevenueCatKeyForPlatform(this.secureConfig.config, platform);

      // Validate the API key
      if (!isValidRevenueCatKey(apiKey, platform)) {
        console.warn(
          `Invalid RevenueCat API key for ${platform} platform. Using demo mode.`
        );
        return false;
      }

      console.log(`Initializing RevenueCat for ${platform} platform...`);

      // Configure RevenueCat
      await Purchases.configure({ apiKey });

      // Get initial customer info
      try {
        const customerInfoResult = await Purchases.getCustomerInfo();
        // Handle both direct CustomerInfo and wrapped response
        this.customerInfo =
          "customerInfo" in customerInfoResult
            ? customerInfoResult.customerInfo
            : customerInfoResult;
      } catch (error) {
        console.warn(
          "Failed to get initial customer info, continuing without",
          error,
        );
        this.customerInfo = null;
      }

      // Load offerings
      await this.loadOfferings();

      this.isInitialized = true;
      console.log("RevenueCat initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize RevenueCat:", error);
      return false;
    }
  }

  /**
   * Load available offerings from RevenueCat
   */
  public async loadOfferings(): Promise<void> {
    try {
      const offerings = await Purchases.getOfferings();
      this.currentOfferings = offerings.current;
    } catch (error) {
      console.error("Failed to load offerings:", error);
    }
  }

  /**
   * Get current subscription status
   */
  public async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      try {
        const customerInfoResult = await Purchases.getCustomerInfo();
        // Handle both direct CustomerInfo and wrapped response
        this.customerInfo =
          "customerInfo" in customerInfoResult
            ? customerInfoResult.customerInfo
            : customerInfoResult;
      } catch (error) {
        console.warn("Failed to get customer info", error);
        this.customerInfo = null;
      }

      // Check for active subscriptions
      const activeEntitlements = this.customerInfo?.entitlements?.active || {};

      if (activeEntitlements.pro) {
        return {
          tier: "pro",
          isActive: true,
          expiresAt: new Date(activeEntitlements.pro.expirationDate || ""),
          features:
            SUBSCRIPTION_TIERS.find((t) => t.id === "pro")?.features || [],
        };
      }

      if (activeEntitlements.premium) {
        return {
          tier: "premium",
          isActive: true,
          expiresAt: new Date(activeEntitlements.premium.expirationDate || ""),
          features:
            SUBSCRIPTION_TIERS.find((t) => t.id === "premium")?.features || [],
        };
      }

      // Default to basic (free) tier
      return {
        tier: "basic",
        isActive: true,
        features:
          SUBSCRIPTION_TIERS.find((t) => t.id === "basic")?.features || [],
      };
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      return {
        tier: "basic",
        isActive: true,
        features:
          SUBSCRIPTION_TIERS.find((t) => t.id === "basic")?.features || [],
      };
    }
  }

  /**
   * Purchase a subscription
   */
  public async purchaseSubscription(
    packageId: string,
  ): Promise<PurchaseResult> {
    try {
      if (!this.currentOfferings) {
        await this.loadOfferings();
      }

      const targetPackage = this.findPackage(packageId);
      if (!targetPackage) {
        return { success: false, error: "Package not found" };
      }

      const result = await Purchases.purchasePackage({
        aPackage: targetPackage,
      });
      if (result && "customerInfo" in result) {
        this.customerInfo = result.customerInfo;
      }

      return { success: true, customerInfo: result.customerInfo };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Purchase failed:", error);
      return {
        success: false,
        error: errorMessage || "Purchase failed",
      };
    }
  }

  /**
   * Purchase an in-app item
   */
  public async purchaseItem(packageId: string): Promise<PurchaseResult> {
    return this.purchaseSubscription(packageId); // Same logic for now
  }

  /**
   * Restore purchases
   */
  public async restorePurchases(): Promise<PurchaseResult> {
    try {
      const result = await Purchases.restorePurchases();
      if (result && "customerInfo" in result) {
        this.customerInfo = result.customerInfo;
      }
      return { success: true, customerInfo: result.customerInfo };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Restore failed:", error);
      return {
        success: false,
        error: errorMessage || "Restore failed",
      };
    }
  }

  /**
   * Check if user has specific feature access
   */
  public async hasFeatureAccess(feature: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus();

    // Feature mapping
    const featureMap: { [key: string]: string[] } = {
      ai_coaching: ["premium", "pro"],
      cloud_sync: ["premium", "pro"],
      custom_patterns: ["premium", "pro"],
      nft_creation: ["pro"],
      web3_features: ["pro"],
      instructor_tools: ["pro"],
      advanced_analytics: ["premium", "pro"],
    };

    const requiredTiers = featureMap[feature] || [];
    return requiredTiers.includes(status.tier);
  }

  /**
   * Get available packages for purchase
   */
  public getAvailablePackages(): PurchasesPackage[] {
    if (!this.currentOfferings) {
      return [];
    }

    const packages: PurchasesPackage[] = [];

    if (Array.isArray(this.currentOfferings.monthly)) {
      packages.push(...this.currentOfferings.monthly);
    }
    if (Array.isArray(this.currentOfferings.annual)) {
      packages.push(...this.currentOfferings.annual);
    }
    if (Array.isArray(this.currentOfferings.lifetime)) {
      packages.push(...this.currentOfferings.lifetime);
    }

    return packages;
  }

  /**
   * Set user attributes for analytics
   */
  public async setUserAttributes(attributes: {
    [key: string]: string;
  }): Promise<void> {
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error("Failed to set user attributes:", error);
    }
  }

  /**
   * Log in user (for cross-platform sync)
   */
  public async loginUser(userId: string): Promise<void> {
    try {
      try {
        const result = await Purchases.logIn({ appUserID: userId });
        if (result && "customerInfo" in result) {
          this.customerInfo = result.customerInfo;
        }
      } catch (error) {
        console.error("Failed to login user:", error);
      }
    } catch (error) {
      console.error("Failed to login user:", error);
    }
  }

  /**
   * Log out user
   */
  public async logoutUser(): Promise<void> {
    try {
      try {
        const result = await Purchases.logOut();
        if (result && "customerInfo" in result) {
          this.customerInfo = result.customerInfo;
        }
      } catch (error) {
        console.error("Failed to logout user:", error);
      }
    } catch (error) {
      console.error("Failed to logout user:", error);
    }
  }

  /**
   * Check if RevenueCat is available and properly configured
   */
  public isRevenueCatAvailable(): boolean {
    return this.secureConfig?.isAvailable === true && this.isInitialized;
  }

  /**
   * Get configuration status for debugging
   */
  public getConfigurationStatus(): {
    isAvailable: boolean;
    isInitialized: boolean;
    error?: string;
  } {
    return {
      isAvailable: this.secureConfig?.isAvailable === true,
      isInitialized: this.isInitialized,
      error: this.secureConfig?.error
    };
  }

  // Private helper methods
  private getPlatform(): "ios" | "android" {
    // For Capacitor, we can check the platform
    if (
      typeof window !== "undefined" &&
      (window as unknown as { Capacitor?: { getPlatform(): string } }).Capacitor
    ) {
      return (
        window as unknown as { Capacitor: { getPlatform(): string } }
      ).Capacitor.getPlatform() === "ios"
        ? "ios"
        : "android";
    }
    return "android"; // Default to Android
  }

  private findPackage(packageId: string): PurchasesPackage | null {
    if (!this.currentOfferings) return null;

    const allPackages: PurchasesPackage[] = [];

    if (Array.isArray(this.currentOfferings.monthly)) {
      allPackages.push(...this.currentOfferings.monthly);
    }
    if (Array.isArray(this.currentOfferings.annual)) {
      allPackages.push(...this.currentOfferings.annual);
    }
    if (Array.isArray(this.currentOfferings.lifetime)) {
      allPackages.push(...this.currentOfferings.lifetime);
    }

    return allPackages.find((pkg) => pkg.identifier === packageId) || null;
  }
}

// Export singleton instance
export const revenueCat = RevenueCatService.getInstance();

// React Hook for using RevenueCat in components
export function useRevenueCat() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    React.useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initializeRevenueCat = async () => {
      setIsLoading(true);
      const initialized = await revenueCat.initialize();
      setIsInitialized(initialized);

      if (initialized) {
        const status = await revenueCat.getSubscriptionStatus();
        setSubscriptionStatus(status);
      }

      setIsLoading(false);
    };

    initializeRevenueCat();
  }, []);

  const purchaseSubscription = async (packageId: string) => {
    return await revenueCat.purchaseSubscription(packageId);
  };

  const purchaseItem = async (packageId: string) => {
    return await revenueCat.purchaseItem(packageId);
  };

  const restorePurchases = async () => {
    return await revenueCat.restorePurchases();
  };

  const hasFeatureAccess = async (feature: string) => {
    return await revenueCat.hasFeatureAccess(feature);
  };

  return {
    isInitialized,
    subscriptionStatus,
    isLoading,
    purchaseSubscription,
    purchaseItem,
    restorePurchases,
    hasFeatureAccess,
    SUBSCRIPTION_TIERS,
    PURCHASE_ITEMS,
  };
}


