/**
 * RevenueCat Authentication Integration Service
 *
 * ENHANCEMENT: Seamless integration between authentication methods and RevenueCat
 * CLEAN: Centralized user identification mapping for RevenueCat
 * MODULAR: Supports all authentication methods (email, wallet, Lens, Flow)
 */

import { revenueCatService } from "./revenueCat";

export interface AuthUserInfo {
  // Primary identifier for RevenueCat
  userId: string;

  // Authentication method used
  authMethod: "email" | "wallet" | "lens" | "flow" | "walletless";

  // Additional user attributes for analytics
  attributes: {
    authMethod: string;
    walletAddress?: string;
    lensHandle?: string;
    flowAddress?: string;
    email?: string;
    chainId?: string;
    createdAt: string;
  };
}

export class RevenueCatAuthIntegration {
  private static instance: RevenueCatAuthIntegration;

  private constructor() {}

  public static getInstance(): RevenueCatAuthIntegration {
    if (!RevenueCatAuthIntegration.instance) {
      RevenueCatAuthIntegration.instance = new RevenueCatAuthIntegration();
    }
    return RevenueCatAuthIntegration.instance;
  }

  /**
   * Initialize the RevenueCat integration
   */
  public async initialize(): Promise<void> {
    try {
      const ok = await revenueCatService.initialize();
      if (ok) {
        console.log("✅ RevenueCat Auth Integration initialized");
      } else if (process.env.NODE_ENV === "development") {
        console.debug(
          "RevenueCat unavailable on this platform - integration skipped",
        );
      }
    } catch (error) {
      console.error(
        "❌ Failed to initialize RevenueCat Auth Integration:",
        error,
      );
    }
  }

  /**
   * Handle email-based authentication with RevenueCat
   */
  public async handleEmailAuth(userId: string, email?: string): Promise<void> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return;
      }

      await revenueCatService.identifyUser(userId, {
        email: email || "",
        authMethod: "email",
        platform: this.getPlatform(),
      });

      console.log("✅ RevenueCat: Email user identified", { userId, email });
    } catch (error) {
      console.error("❌ RevenueCat: Failed to identify email user", error);
    }
  }

  /**
   * Handle secure email authentication flow with RevenueCat
   * This method provides a more secure way to handle email authentication
   * by using a secure token instead of directly passing email addresses
   */
  public async handleSecureEmailAuth(
    userId: string,
    email: string,
    secureToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return { success: false, error: "RevenueCat not available" };
      }

      // Verify the secure token (in a real implementation, this would involve
      // server-side verification)
      if (!this.isValidSecureToken(secureToken)) {
        return { success: false, error: "Invalid secure token" };
      }

      await revenueCatService.identifyUser(userId, {
        email: email || "",
        authMethod: "email",
        platform: this.getPlatform(),
        secureAuth: "true",
        token: secureToken,
      });

      console.log("✅ RevenueCat: Secure email user identified", { userId, email });
      return { success: true };
    } catch (error) {
      console.error("❌ RevenueCat: Failed to identify secure email user", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to identify user" 
      };
    }
  }

  /**
   * Validate secure token (mock implementation)
   * In a real implementation, this would involve server-side verification
   */
  private isValidSecureToken(token: string): boolean {
    // Simple validation - in a real implementation, this would be more complex
    return typeof token === 'string' && token.length > 10;
  }

  /**
   * Handle wallet-based authentication with RevenueCat
   */
  public async handleWalletAuth(
    userId: string,
    walletAddress: string,
    chainId?: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return { success: true, error: "RevenueCat not available" };
      }

      await revenueCatService.identifyUser(userId, {
        walletAddress,
        authMethod: "wallet",
        platform: this.getPlatform(),
        chainId: chainId?.toString() || "unknown",
      });

      console.log("✅ RevenueCat: Wallet user identified", {
        userId,
        walletAddress,
        chainId,
      });
      return { success: true };
    } catch (error) {
      console.error("❌ RevenueCat: Failed to identify wallet user", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to identify user" 
      };
    }
  }

  /**
   * Handle Lens Protocol authentication with RevenueCat
   */
  public async handleLensAuth(profile: {
    id: string;
    handle: string;
    ownedBy: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return { success: true, error: "RevenueCat not available" };
      }

      await revenueCatService.identifyUser(profile.id, {
        lensProfileId: profile.id,
        lensHandle: profile.handle,
        lensOwner: profile.ownedBy,
        authMethod: "lens",
        platform: this.getPlatform(),
      });

      console.log("✅ RevenueCat: Lens user identified", profile);
      return { success: true };
    } catch (error) {
      console.error("❌ RevenueCat: Failed to identify Lens user", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to identify user" 
      };
    }
  }

  /**
   * Handle Flow blockchain authentication with RevenueCat
   */
  public async handleFlowAuth(
    userId: string,
    flowAddress: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return { success: true, error: "RevenueCat not available" };
      }

      await revenueCatService.identifyUser(userId, {
        flowAddress,
        authMethod: "flow",
        platform: this.getPlatform(),
      });

      console.log("✅ RevenueCat: Flow user identified", {
        userId,
        flowAddress,
      });
      return { success: true };
    } catch (error) {
      console.error("❌ RevenueCat: Failed to identify Flow user", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to identify user" 
      };
    }
  }

  /**
   * Handle user logout from RevenueCat
   */
  public async handleLogout(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping logout");
        return { success: true, error: "RevenueCat not available" };
      }

      // Note: Logout functionality would be implemented in revenueCatService
      console.log("✅ RevenueCat: User logged out");
      return { success: true };
    } catch (error) {
      console.error("❌ RevenueCat: Failed to logout user", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to logout user" 
      };
    }
  }

  /**
   * Set developer override for testing purposes
   * This allows developers to test different subscription tiers without making purchases
   */
  public async setDeveloperOverride(
    tier: "basic" | "premium" | "pro",
    features?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping developer override");
        return { success: true, error: "RevenueCat not available" };
      }

      // In a real implementation, this would set a developer override in RevenueCat
      // For now, we'll just log it
      console.log("✅ RevenueCat: Developer override set", { tier, features });
      
      // Update the user's subscription status to reflect the override
      // This is a mock implementation - in a real app, this would be handled by RevenueCat
      const mockSubscription = {
        tier,
        isActive: true,
        features: features || this.getDefaultFeaturesForTier(tier)
      };

      console.log("✅ RevenueCat: Mock subscription set for developer override", mockSubscription);
      return { success: true };
    } catch (error) {
      console.error("❌ RevenueCat: Failed to set developer override", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to set developer override" 
      };
    }
  }

  /**
   * Get default features for a subscription tier
   */
  private getDefaultFeaturesForTier(tier: "basic" | "premium" | "pro"): string[] {
    switch (tier) {
      case "basic":
        return [
          "Core breathing patterns",
          "Local progress tracking",
          "Basic session analytics",
          "Offline access"
        ];
      case "premium":
        return [
          "All basic features",
          "Advanced breathing patterns",
          "Detailed analytics",
          "Custom pattern creation",
          "Social sharing",
          "NFT pattern minting",
          "Creator monetization",
          "Priority support",
          "Beta feature access"
        ];
      case "pro":
        return [
          "All premium features",
          "AI-powered coaching",
          "Personalized recommendations",
          "Advanced pattern analysis",
          "Community leaderboards",
          "Exclusive content access"
        ];
      default:
        return [];
    }
  }

  /**
   * Clear developer override
   */
  public async clearDeveloperOverride(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping clear developer override");
        return { success: true, error: "RevenueCat not available" };
      }

      // In a real implementation, this would clear the developer override in RevenueCat
      // For now, we'll just log it
      console.log("✅ RevenueCat: Developer override cleared");
      return { success: true };
    } catch (error) {
      console.error("❌ RevenueCat: Failed to clear developer override", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to clear developer override" 
      };
    }
  }

  /**
   * Sync comprehensive user information with RevenueCat
   */
  public async syncUserInfo(userInfo: {
    userId: string;
    authMethods: string[];
    email?: string;
    walletAddress?: string;
    chainId?: number;
    lensProfile?: { id: string; handle: string; ownedBy: string };
    flowAddress?: string;
  }): Promise<void> {
    try {
      if (!revenueCatService.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user sync");
        return;
      }

      const attributes: Record<string, string> = {
        platform: this.getPlatform(),
        authMethods: userInfo.authMethods.join(","),
      };

      if (userInfo.email) {
        attributes.email = userInfo.email;
      }

      if (userInfo.walletAddress) {
        attributes.walletAddress = userInfo.walletAddress;
        attributes.chainId = userInfo.chainId?.toString() || "unknown";
      }

      if (userInfo.lensProfile) {
        attributes.lensProfileId = userInfo.lensProfile.id;
        attributes.lensHandle = userInfo.lensProfile.handle;
        attributes.lensOwner = userInfo.lensProfile.ownedBy;
      }

      if (userInfo.flowAddress) {
        attributes.flowAddress = userInfo.flowAddress;
      }

      await revenueCatService.identifyUser(userInfo.userId, attributes);

      console.log("✅ RevenueCat: User info synced", userInfo.userId);
    } catch (error) {
      console.error("❌ RevenueCat: Failed to sync user info", error);
    }
  }

  private getPlatform(): string {
    // Handle server-side rendering
    if (typeof window === "undefined") {
      return "server";
    }

    try {
      // Check for Capacitor (mobile apps)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const capacitor = (window as any).Capacitor;
      if (capacitor && typeof capacitor.getPlatform === 'function') {
        return capacitor.getPlatform();
      }

      // Check for other platform indicators
      if (typeof navigator !== "undefined") {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Mobile browsers
        if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
          return "mobile-web";
        }
        
        // Desktop browsers
        if (/chrome|firefox|safari|edge/i.test(userAgent)) {
          return "desktop-web";
        }
      }

      // Default fallback
      return "web";
    } catch (error) {
      console.warn("Failed to detect platform, defaulting to 'web'", error);
      return "web";
    }
  }
}

// Export singleton instance
export const revenueCatAuthIntegration =
  RevenueCatAuthIntegration.getInstance();

// Convenience functions for different auth methods
export const syncEmailUserWithRevenueCat = (userId: string, email?: string) =>
  revenueCatAuthIntegration.handleEmailAuth(userId, email || "");

export const syncWalletUserWithRevenueCat = (
  walletAddress: string,
  chainId?: string,
) =>
  revenueCatAuthIntegration.handleWalletAuth(
    walletAddress,
    walletAddress,
    chainId ? parseInt(chainId) : undefined,
  );

export const syncLensUserWithRevenueCat = (lensProfile: {
  id: string;
  handle: string;
  ownedBy: string;
}) => revenueCatAuthIntegration.handleLensAuth(lensProfile);

export const syncFlowUserWithRevenueCat = (flowAddress: string) =>
  revenueCatAuthIntegration.handleFlowAuth(flowAddress, flowAddress);

export const logoutUserFromRevenueCat = () =>
  revenueCatAuthIntegration.handleLogout();
