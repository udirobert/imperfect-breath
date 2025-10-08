/**
 * Subscription Access Hook
 * Provides easy access to subscription status and feature availability
 */

import { useState, useEffect } from 'react';
import { revenueCat, type SubscriptionStatus } from '@/lib/monetization/revenueCat';

export interface SubscriptionAccess {
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  hasFeatureAccess: (feature: string) => boolean;
  refreshStatus: () => Promise<void>;
}

export const useSubscriptionAccess = (): SubscriptionAccess => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await revenueCat.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Failed to load subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription status');
      // Fallback to basic tier on error
      setSubscriptionStatus({
        tier: 'basic',
        isActive: true,
        features: ['Core breathing patterns', 'Local progress tracking', 'Basic session analytics', 'Offline access']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasFeatureAccess = (feature: string): boolean => {
    if (!subscriptionStatus) return false;
    
    // Feature access mapping based on subscription tiers
    const featureAccessMap: { [key: string]: string[] } = {
      ai_coaching: ['premium', 'pro'],
      ai_analysis: ['premium', 'pro'],
      streaming_feedback: ['premium', 'pro'],
      streaming_metrics: ['pro'],
      persona_insights: ['pro'],
      cloud_sync: ['premium', 'pro'],
      custom_patterns: ['premium', 'pro'],
      nft_creation: ['pro'],
      web3_features: ['pro'],
      instructor_tools: ['pro'],
      advanced_analytics: ['premium', 'pro'],
    };

    const requiredTiers = featureAccessMap[feature] || [];
    return requiredTiers.includes(subscriptionStatus.tier);
  };

  const refreshStatus = async () => {
    await loadSubscriptionStatus();
  };

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  return {
    subscriptionStatus,
    isLoading,
    error,
    hasFeatureAccess,
    refreshStatus,
  };
};

// Convenience hooks for specific features
export const useAIFeatureAccess = () => {
  const { hasFeatureAccess, subscriptionStatus, isLoading } = useSubscriptionAccess();
  
  return {
    canUseAICoaching: hasFeatureAccess('ai_coaching'),
    canUseAIAnalysis: hasFeatureAccess('ai_analysis'),
    canUseStreamingFeedback: hasFeatureAccess('streaming_feedback'),
    canUseStreamingMetrics: hasFeatureAccess('streaming_metrics'),
    canUsePersonaInsights: hasFeatureAccess('persona_insights'),
    subscriptionTier: subscriptionStatus?.tier || 'basic',
    isLoading,
  };
};

export const useWebFeatureAccess = () => {
  const { hasFeatureAccess, subscriptionStatus, isLoading } = useSubscriptionAccess();
  
  return {
    canUseCloudSync: hasFeatureAccess('cloud_sync'),
    canCreateCustomPatterns: hasFeatureAccess('custom_patterns'),
    canUseNFTCreation: hasFeatureAccess('nft_creation'),
    canUseWeb3Features: hasFeatureAccess('web3_features'),
    canUseInstructorTools: hasFeatureAccess('instructor_tools'),
    canUseAdvancedAnalytics: hasFeatureAccess('advanced_analytics'),
    subscriptionTier: subscriptionStatus?.tier || 'basic',
    isLoading,
  };
};