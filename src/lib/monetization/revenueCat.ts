/**
 * RevenueCat Configuration and Subscription Management
 *
 * ENHANCEMENT: Adds monetization capabilities to Imperfect Breath
 * CLEAN: Centralized subscription logic with clear separation of concerns
 * MODULAR: Composable subscription tiers and purchase handling
 * WEB COMPATIBLE: Includes fallback for web browsers with mock implementation
 */

import React from "react";

// Type definitions for RevenueCat interfaces (for web compatibility)
// Proper type definitions for RevenueCat
interface PurchasesOfferingType {
  monthly?: PurchasesPackageType[];
  annual?: PurchasesPackageType[];
  lifetime?: PurchasesPackageType[];
}

interface CustomerInfoType {
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  entitlements: {
    active: { [key: string]: EntitlementInfo };
  };
}

interface EntitlementInfo {
  expirationDate?: string;
  isActive: boolean;
  identifier: string;
  productIdentifier: string;
}

interface PurchasesPackageType {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

// Conditional import for RevenueCat - only available on mobile platforms
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Purchases: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PurchasesOffering: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CustomerInfo: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PurchasesPackage: any = null;

// Check if we're in a mobile environment before importing
const isMobile = typeof window !== "undefined" && 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Capacitor && 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ['ios', 'android'].includes((window as any).Capacitor.getPlatform());

if (isMobile) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const revenueCatModule = require("@revenuecat/purchases-capacitor");
    Purchases = revenueCatModule.Purchases;
    PurchasesOffering = revenueCatModule.PurchasesOffering;
    CustomerInfo = revenueCatModule.CustomerInfo;
    PurchasesPackage = revenueCatModule.PurchasesPackage;
  } catch (error) {
    console.warn("RevenueCat Capacitor plugin not available:", error);
  }
}

// Type definitions for better type safety
export interface SubscriptionStatus {
  tier: string;
  isActive: boolean;
  expiresAt?: Date;
  features: string[];
}

interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfoType;
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
      "AI session analysis with scientific insights",
      "Streaming AI feedback during sessions",
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
      "Advanced AI analysis with persona insights",
      "Real-time streaming performance metrics",
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
  private currentOfferings: PurchasesOfferingType | null = null;
  private customerInfo: CustomerInfoType | null = null;
  private secureConfig: SecureRevenueCatConfig | null = null;
  private isWebPlatform = false;
  private hasWarnedUnavailable = false;

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
      // Only initialize on mobile platforms with Capacitor
      if (!isMobile) {
        if (!this.hasWarnedUnavailable) {
          this.hasWarnedUnavailable = true;
          if (import.meta.env.DEV) {
            console.info("RevenueCat is only available on mobile platforms");
          }
        }
        return false;
      }

      // Load secure configuration
      this.secureConfig = await loadRevenueCatConfig();
      
      if (!this.secureConfig.isAvailable || !this.secureConfig.config) {
        if (import.meta.env.DEV) {
          console.warn(
            "RevenueCat configuration not available:",
            this.secureConfig.error || "Configuration unavailable"
          );
        }
        return false;
      }

      // Determine platform and get appropriate API key
      const platform = this.getPlatform();
      
      if (platform === "web") {
        if (import.meta.env.DEV) {
          console.info("RevenueCat is not supported on web platform");
        }
        return false;
      }
      
      const apiKey = getRevenueCatKeyForPlatform(this.secureConfig.config, platform as "ios" | "android");

      // Validate the API key
      if (!isValidRevenueCatKey(apiKey, platform as "ios" | "android")) {
        console.warn(
          `Invalid RevenueCat API key for ${platform} platform.`
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
      if (!isMobile || !this.isInitialized) {
        console.warn("RevenueCat not available - cannot load offerings");
        return;
      }
      
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
      if (!isMobile) {
        // Return basic tier for non-mobile platforms
        return {
          tier: "basic",
          isActive: true,
          features:
            SUBSCRIPTION_TIERS.find((t) => t.id === "basic")?.features || [],
        };
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        // Return basic tier if initialization failed
        return {
          tier: "basic",
          isActive: true,
          features:
            SUBSCRIPTION_TIERS.find((t) => t.id === "basic")?.features || [],
        };
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

      if (activeEntitlements.pro && activeEntitlements.pro.isActive) {
        return {
          tier: "pro",
          isActive: true,
          expiresAt: activeEntitlements.pro.expirationDate ? new Date(activeEntitlements.pro.expirationDate) : undefined,
          features:
            SUBSCRIPTION_TIERS.find((t) => t.id === "pro")?.features || [],
        };
      }

      if (activeEntitlements.premium && activeEntitlements.premium.isActive) {
        return {
          tier: "premium",
          isActive: true,
          expiresAt: activeEntitlements.premium.expirationDate ? new Date(activeEntitlements.premium.expirationDate) : undefined,
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
      if (!isMobile) {
        return {
          success: false,
          error: "Purchases are only available on mobile platforms"
        };
      }

      if (!this.currentOfferings) {
        await this.loadOfferings();
      }

      const packageToPurchase = this.findPackage(packageId);
      if (!packageToPurchase) {
        return {
          success: false,
          error: `Package ${packageId} not found`,
        };
      }

      const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
      
      // Handle both direct CustomerInfo and wrapped response
      const customerInfo = "customerInfo" in purchaseResult 
        ? purchaseResult.customerInfo 
        : purchaseResult;

      this.customerInfo = customerInfo;

      return {
        success: true,
        customerInfo: customerInfo,
      };
    } catch (error: any) {
      console.error("Purchase failed:", error);
      return {
        success: false,
        error: error.message || "Purchase failed",
      };
    }
  }

  public async purchaseItem(packageId: string): Promise<PurchaseResult> {
    // Same implementation as purchaseSubscription for one-time purchases
    return this.purchaseSubscription(packageId);
  }

  public async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!isMobile) {
        return {
          success: false,
          error: "Restore purchases is only available on mobile platforms"
        };
      }

      const restoreResult = await Purchases.restorePurchases();
      
      // Handle both direct CustomerInfo and wrapped response
      const customerInfo = "customerInfo" in restoreResult 
        ? restoreResult.customerInfo 
        : restoreResult;

      this.customerInfo = customerInfo;

      return {
        success: true,
        customerInfo: customerInfo,
      };
    } catch (error: any) {
      console.error("Restore purchases failed:", error);
      return {
        success: false,
        error: error.message || "Restore purchases failed",
      };
    }
  }

  public async hasFeatureAccess(feature: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      return status.features.includes(feature);
    } catch (error) {
      console.error("Failed to check feature access:", error);
      return false;
    }
  }

  public getAvailablePackages(): PurchasesPackageType[] {
    if (!this.currentOfferings) return [];

    const allPackages: PurchasesPackageType[] = [];

    if (this.currentOfferings.monthly) {
      allPackages.push(...this.currentOfferings.monthly);
    }
    if (this.currentOfferings.annual) {
      allPackages.push(...this.currentOfferings.annual);
    }
    if (this.currentOfferings.lifetime) {
      allPackages.push(...this.currentOfferings.lifetime);
    }

    return allPackages;
  }

  public async setUserAttributes(attributes: {
    [key: string]: string;
  }): Promise<void> {
    try {
      if (!isMobile || !this.isInitialized) {
        console.warn("RevenueCat not available - cannot set user attributes");
        return;
      }

      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error("Failed to set user attributes:", error);
    }
  }

  public async loginUser(userId: string): Promise<void> {
    try {
      if (!isMobile || !this.isInitialized) {
        console.warn("RevenueCat not available - cannot login user");
        return;
      }

      await Purchases.logIn(userId);
      
      // Refresh customer info after login
      try {
        const customerInfoResult = await Purchases.getCustomerInfo();
        this.customerInfo =
          "customerInfo" in customerInfoResult
            ? customerInfoResult.customerInfo
            : customerInfoResult;
      } catch (error) {
        console.warn("Failed to refresh customer info after login", error);
      }
    } catch (error) {
      console.error("Failed to login user:", error);
    }
  }

  public async logoutUser(): Promise<void> {
    try {
      if (!isMobile || !this.isInitialized) {
        console.warn("RevenueCat not available - cannot logout user");
        return;
      }

      await Purchases.logOut();
      
      // Clear customer info after logout
      this.customerInfo = null;
    } catch (error) {
      console.error("Failed to logout user:", error);
    }
  }

  public isRevenueCatAvailable(): boolean {
    return isMobile && this.isInitialized;
  }

  public getConfigurationStatus(): {
    isAvailable: boolean;
    isInitialized: boolean;
    error?: string;
  } {
    return {
      isAvailable: isMobile,
      isInitialized: this.isInitialized,
      error: !isMobile ? "RevenueCat is only available on mobile platforms" : undefined,
    };
  }

  private getPlatform(): "ios" | "android" | "web" {
    // Check if we're in a Capacitor environment
    if (typeof window !== "undefined" && (window as any).Capacitor) {
      const platform = (
        window as unknown as { Capacitor: { getPlatform(): string } }
      ).Capacitor.getPlatform();
      
      if (platform === "ios") return "ios";
      if (platform === "android") return "android";
    }
    
    // Default to web for browser environments
    return "web";
  }

  private findPackage(packageId: string): PurchasesPackageType | null {
    if (!this.currentOfferings) return null;

    const allPackages: PurchasesPackageType[] = [];

    if (this.currentOfferings.monthly) {
      allPackages.push(...this.currentOfferings.monthly);
    }
    if (this.currentOfferings.annual) {
      allPackages.push(...this.currentOfferings.annual);
    }
    if (this.currentOfferings.lifetime) {
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


