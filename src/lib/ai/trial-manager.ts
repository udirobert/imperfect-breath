/**
 * AI Trial Manager
 * Manages free trial usage for AI analysis features
 */

import { TieredStorageManager } from '../crypto/tiered-storage';

export interface TrialStatus {
  hasUsedTrial: boolean;
  trialUsageCount: number;
  maxTrialUsage: number;
  canUseTrial: boolean;
}

export class AITrialManager {
  private static readonly TRIAL_KEY = 'ai_trial_usage';
  private static readonly MAX_TRIAL_USAGE = 1; // One free analysis

  /**
   * Initialize the trial system
   */
  static async initialize(): Promise<void> {
    await TieredStorageManager.initialize();
  }

  /**
   * Get current trial status
   */
  static async getTrialStatus(): Promise<TrialStatus> {
    try {
      const usageData = await TieredStorageManager.getAPIKey(this.TRIAL_KEY);
      const trialUsageCount = usageData ? parseInt(usageData, 10) : 0;
      
      return {
        hasUsedTrial: trialUsageCount > 0,
        trialUsageCount,
        maxTrialUsage: this.MAX_TRIAL_USAGE,
        canUseTrial: trialUsageCount < this.MAX_TRIAL_USAGE
      };
    } catch (error) {
      console.warn('Failed to get trial status:', error);
      return {
        hasUsedTrial: false,
        trialUsageCount: 0,
        maxTrialUsage: this.MAX_TRIAL_USAGE,
        canUseTrial: true
      };
    }
  }

  /**
   * Use one trial analysis
   */
  static async useTrial(): Promise<boolean> {
    try {
      const status = await this.getTrialStatus();
      
      if (!status.canUseTrial) {
        return false;
      }

      const newCount = status.trialUsageCount + 1;
      await TieredStorageManager.setAPIKey(this.TRIAL_KEY, newCount.toString());
      
      return true;
    } catch (error) {
      console.error('Failed to use trial:', error);
      return false;
    }
  }

  /**
   * Check if user has configured their own API keys
   */
  static async hasUserApiKeys(): Promise<boolean> {
    try {
      const providers = ['openai', 'anthropic', 'google'];
      
      for (const provider of providers) {
        const apiKey = await TieredStorageManager.getAPIKey(`api_key_${provider}`);
        if (apiKey && apiKey.trim().length > 0) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Failed to check user API keys:', error);
      return false;
    }
  }

  /**
   * Determine if AI analysis should use server keys or user keys
   */
  static async getAnalysisMode(): Promise<'trial' | 'user' | 'blocked'> {
    try {
      const hasUserKeys = await this.hasUserApiKeys();
      
      // If user has their own keys, always use those
      if (hasUserKeys) {
        return 'user';
      }

      // Check trial status
      const trialStatus = await this.getTrialStatus();
      
      if (trialStatus.canUseTrial) {
        return 'trial';
      }

      // Trial exhausted and no user keys
      return 'blocked';
    } catch (error) {
      console.error('Failed to determine analysis mode:', error);
      return 'blocked';
    }
  }

  /**
   * Reset trial (for development/testing only)
   */
  static async resetTrial(): Promise<void> {
    if (import.meta.env.DEV) {
      TieredStorageManager.removeAPIKey(this.TRIAL_KEY);
      console.log('Trial reset (development mode)');
    }
  }

  /**
   * Get user-friendly trial message
   */
  static async getTrialMessage(): Promise<string> {
    const status = await this.getTrialStatus();
    const hasUserKeys = await this.hasUserApiKeys();

    if (hasUserKeys) {
      return "Using your configured AI providers";
    }

    if (status.canUseTrial) {
      return `Free trial: ${status.maxTrialUsage - status.trialUsageCount} analysis remaining`;
    }

    return "Free trial exhausted. Add your API keys to continue using AI analysis.";
  }
}

export default AITrialManager;