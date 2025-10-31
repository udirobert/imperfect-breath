/**
 * RevenueCat Sync Hook
 *
 * Syncs RevenueCat subscription status to the auth store for UI integration.
 * Provides subscription tier, active status, and features for components.
 */

import { useEffect, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  revenueCatService,
  type UserSubscription,
} from "../lib/monetization/revenueCat";

export const useRevenueCatSync = () => {
  const setRevenueCatState = useAuthStore((s) => s.setRevenueCatState);

  const syncSubscriptionStatus = useCallback(async () => {
    try {
      const isAvailable = revenueCatService.isRevenueCatAvailable();

      if (!isAvailable) {
        // Set basic tier for web/unavailable platforms
        setRevenueCatState(false, false, "basic", true, [
          "Core breathing patterns",
          "Local progress tracking",
          "Basic session analytics",
          "Offline access",
        ]);
        return;
      }

      // Get subscription status from RevenueCat
      const subscriptionStatus: UserSubscription =
        await revenueCatService.getSubscriptionStatus();

      setRevenueCatState(
        true,
        true,
        subscriptionStatus.tier as "basic" | "premium" | "pro",
        subscriptionStatus.isActive,
        subscriptionStatus.features,
      );
    } catch (error) {
      console.error("Failed to sync RevenueCat status:", error);
      // Fallback to basic tier on error
      setRevenueCatState(false, false, "basic", true, [
        "Core breathing patterns",
        "Local progress tracking",
        "Basic session analytics",
        "Offline access",
      ]);
    }
  }, [setRevenueCatState]);

  // Sync on mount and when auth changes
  useEffect(() => {
    syncSubscriptionStatus();
  }, [syncSubscriptionStatus]);

  return {
    syncSubscriptionStatus,
  };
};
