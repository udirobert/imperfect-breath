import { useState, useEffect, useCallback, useRef } from "react";
import * as fcl from "@onflow/fcl";
import { revenueCatAuthIntegration } from "../../lib/monetization/revenueCatAuthIntegration";

// Flow user type definition
interface FlowUser {
  loggedIn: boolean;
  addr: string | null;
  services?: unknown[];
  [key: string]: unknown;
}

// Singleton pattern to prevent multiple FCL subscriptions
class FlowAuthManager {
  private static instance: FlowAuthManager;
  private user: unknown = null;
  private subscribers: Set<(user: unknown) => void> = new Set();
  private isInitialized = false;
  private unsubscribe: (() => void) | null = null;

  static getInstance(): FlowAuthManager {
    if (!FlowAuthManager.instance) {
      FlowAuthManager.instance = new FlowAuthManager();
    }
    return FlowAuthManager.instance;
  }

  private constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Single FCL subscription for entire app
    this.unsubscribe = fcl.currentUser.subscribe(async (user: unknown) => {
      this.user = user;
      await this.notifySubscribers(user);
    });
  }

  subscribe(callback: (user: unknown) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current user if available
    if (this.user) {
      callback(this.user);
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private async notifySubscribers(user: unknown) {
    // Sync with RevenueCat when user logs in
    const userObj = user as { loggedIn?: boolean; addr?: string };
    if (userObj?.loggedIn && userObj?.addr) {
      try {
        await revenueCatAuthIntegration.handleFlowAuth(userObj.addr!, false);
      } catch (error) {
        console.error('Failed to sync Flow user with RevenueCat:', error);
      }
    }
    
    this.subscribers.forEach(callback => callback(user));
  }

  getCurrentUser() {
    return this.user;
  }

  async authenticate() {
    try {
      return await fcl.authenticate();
    } catch (error) {
      console.error("Flow authentication failed:", error);
      throw error;
    }
  }

  async unauthenticate() {
    try {
      return await fcl.unauthenticate();
    } catch (error) {
      console.error("Flow unauthentication failed:", error);
      throw error;
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.subscribers.clear();
    this.isInitialized = false;
    FlowAuthManager.instance = null as unknown as FlowAuthManager;
  }
}

export const useFlowAuth = () => {
  const [user, setUser] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const managerRef = useRef<FlowAuthManager>();

  useEffect(() => {
    // Get singleton instance
    managerRef.current = FlowAuthManager.getInstance();
    
    // Subscribe to user changes
    const unsubscribe = managerRef.current.subscribe((newUser) => {
      setUser(newUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    if (!managerRef.current) return { success: false, error: "Flow manager not initialized" };
    
    try {
      setIsLoading(true);
      await managerRef.current.authenticate();
      return { success: true };
    } catch (error) {
      console.error("Flow login failed:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Login failed" 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!managerRef.current) return { success: false, error: "Flow manager not initialized" };
    
    try {
      setIsLoading(true);
      await managerRef.current.unauthenticate();
      return { success: true };
    } catch (error) {
      console.error("Flow logout failed:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Logout failed" 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const flowUser = user as FlowUser | null;
  
  return {
    // Flow user state
    user,
    isLoading,
    isLoggedIn: !!flowUser?.loggedIn,
    address: flowUser?.addr || null,
    
    // Flow user info object
    flowUser: flowUser?.loggedIn && flowUser.addr
      ? {
          address: flowUser.addr,
          loggedIn: flowUser.loggedIn,
          services: flowUser.services || [],
        }
      : null,

    // Authentication methods
    login,
    logout,
    
    // Helper properties
    hasFlowAccount: !!flowUser?.loggedIn,
    flowAddress: flowUser?.addr || null,
  };
};

// Export manager for cleanup in tests or app teardown
export { FlowAuthManager };