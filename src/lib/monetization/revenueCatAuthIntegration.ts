/**
 * RevenueCat Authentication Integration Service
 * 
 * ENHANCEMENT: Seamless integration between authentication methods and RevenueCat
 * CLEAN: Centralized user identification mapping for RevenueCat
 * MODULAR: Supports all authentication methods (email, wallet, Lens, Flow)
 */

import { revenueCat, RevenueCatService } from './revenueCat';

export interface AuthUserInfo {
  // Primary identifier for RevenueCat
  userId: string;
  
  // Authentication method used
  authMethod: 'email' | 'wallet' | 'lens' | 'flow' | 'walletless';
  
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
  private revenueCat: RevenueCatService;

  private constructor() {
    this.revenueCat = RevenueCatService.getInstance();
  }

  public static getInstance(): RevenueCatAuthIntegration {
    if (!RevenueCatAuthIntegration.instance) {
      RevenueCatAuthIntegration.instance = new RevenueCatAuthIntegration();
    }
    return RevenueCatAuthIntegration.instance;
  }

  /**
   * Initialize the RevenueCat auth integration
   */
  public async initialize(): Promise<void> {
    try {
      await this.revenueCat.initialize();
      console.log('✅ RevenueCat Auth Integration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat Auth Integration:', error);
    }
  }

  /**
   * Handle email-based authentication with RevenueCat
   */
  public async handleEmailAuth(userId: string, email: string): Promise<void> {
    try {
      // Check if RevenueCat is available (handles web platform gracefully)
      if (!this.revenueCat.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return;
      }

      await this.revenueCat.loginUser(userId);
      
      const attributes = {
        email,
        authMethod: 'email',
        platform: this.getPlatform()
      };
      
      await this.revenueCat.setUserAttributes(attributes);
      
      console.log('✅ RevenueCat: Email user identified', { userId, email });
    } catch (error) {
      console.error('❌ RevenueCat: Failed to identify email user', error);
    }
  }

  /**
   * Handle wallet-based authentication with RevenueCat
   */
  public async handleWalletAuth(
    userId: string, 
    walletAddress: string, 
    chainId?: number
  ): Promise<void> {
    try {
      if (!this.revenueCat.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return;
      }

      await this.revenueCat.loginUser(userId);
      
      const attributes = {
        walletAddress,
        authMethod: 'wallet',
        platform: this.getPlatform(),
        chainId: chainId?.toString() || 'unknown'
      };
      
      await this.revenueCat.setUserAttributes(attributes);
      
      console.log('✅ RevenueCat: Wallet user identified', { userId, walletAddress, chainId });
    } catch (error) {
      console.error('❌ RevenueCat: Failed to identify wallet user', error);
    }
  }

  /**
   * Handle Lens Protocol authentication with RevenueCat
   */
  public async handleLensAuth(profile: {
    id: string;
    handle: string;
    ownedBy: string;
  }): Promise<void> {
    try {
      if (!this.revenueCat.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return;
      }

      await this.revenueCat.loginUser(profile.id);
      
      const attributes = {
        lensProfileId: profile.id,
        lensHandle: profile.handle,
        lensOwner: profile.ownedBy,
        authMethod: 'lens',
        platform: this.getPlatform()
      };
      
      await this.revenueCat.setUserAttributes(attributes);
      
      console.log('✅ RevenueCat: Lens user identified', profile);
    } catch (error) {
      console.error('❌ RevenueCat: Failed to identify Lens user', error);
    }
  }

  /**
   * Handle Flow blockchain authentication with RevenueCat
   */
  public async handleFlowAuth(userId: string, flowAddress: string): Promise<void> {
    try {
      if (!this.revenueCat.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user identification");
        return;
      }

      await this.revenueCat.loginUser(userId);
      
      const attributes = {
        flowAddress,
        authMethod: 'flow',
        platform: this.getPlatform()
      };
      
      await this.revenueCat.setUserAttributes(attributes);
      
      console.log('✅ RevenueCat: Flow user identified', { userId, flowAddress });
    } catch (error) {
      console.error('❌ RevenueCat: Failed to identify Flow user', error);
    }
  }

  /**
   * Handle user logout from RevenueCat
   */
  public async handleLogout(): Promise<void> {
    try {
      if (!this.revenueCat.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping logout");
        return;
      }

      await this.revenueCat.logoutUser();
      console.log('✅ RevenueCat: User logged out');
    } catch (error) {
      console.error('❌ RevenueCat: Failed to logout user', error);
    }
  }

  /**
   * Sync comprehensive user information with RevenueCat
   */
  public async syncUserInfo(userInfo: {
    userId: string;
    email?: string;
    walletAddress?: string;
    chainId?: number;
    lensProfile?: {
      id: string;
      handle: string;
      ownedBy: string;
    };
    flowAddress?: string;
    authMethods: string[];
  }): Promise<void> {
    try {
      if (!this.revenueCat.isRevenueCatAvailable()) {
        console.log("RevenueCat not available - skipping user sync");
        return;
      }

      await this.revenueCat.loginUser(userInfo.userId);
      
      const attributes: { [key: string]: string } = {
        platform: this.getPlatform(),
        authMethods: userInfo.authMethods.join(',')
      };

      if (userInfo.email) {
        attributes.email = userInfo.email;
      }

      if (userInfo.walletAddress) {
        attributes.walletAddress = userInfo.walletAddress;
        attributes.chainId = userInfo.chainId?.toString() || 'unknown';
      }

      if (userInfo.lensProfile) {
        attributes.lensProfileId = userInfo.lensProfile.id;
        attributes.lensHandle = userInfo.lensProfile.handle;
        attributes.lensOwner = userInfo.lensProfile.ownedBy;
      }

      if (userInfo.flowAddress) {
        attributes.flowAddress = userInfo.flowAddress;
      }
      
      await this.revenueCat.setUserAttributes(attributes);
      
      console.log('✅ RevenueCat: User info synced', userInfo.userId);
    } catch (error) {
      console.error('❌ RevenueCat: Failed to sync user info', error);
    }
  }

  private getPlatform(): string {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const capacitor = (window as any).Capacitor;
      if (capacitor) {
        return capacitor.getPlatform();
      }
      return 'web';
    }
    return 'unknown';
  }
}

// Export singleton instance
export const revenueCatAuthIntegration = RevenueCatAuthIntegration.getInstance();

// Convenience functions for different auth methods
export const syncEmailUserWithRevenueCat = (userId: string, email?: string) => 
  revenueCatAuthIntegration.handleEmailAuth(userId, email || '');

export const syncWalletUserWithRevenueCat = (walletAddress: string, chainId?: string) => 
  revenueCatAuthIntegration.handleWalletAuth(walletAddress, walletAddress, chainId ? parseInt(chainId) : undefined);

export const syncLensUserWithRevenueCat = (lensProfile: { id: string; handle: string; ownedBy: string }) => 
  revenueCatAuthIntegration.handleLensAuth(lensProfile);

export const syncFlowUserWithRevenueCat = (flowAddress: string) => 
  revenueCatAuthIntegration.handleFlowAuth(flowAddress, flowAddress);

export const logoutUserFromRevenueCat = () => 
  revenueCatAuthIntegration.handleLogout();