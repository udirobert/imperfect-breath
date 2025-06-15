import type {
  EarningsReport,
  RevenueTransaction,
  RevenueAnalytics,
  WithdrawalTransaction,
  TimeFrame,
  TomoWallet,
  BlockchainError,
} from "@/types/blockchain";
import type { CustomPattern } from "@/lib/ai/providers";
import { blockchainConfig } from "@/lib/blockchain/config";

// Mock blockchain service for revenue operations
const mockBlockchainService = {
  getCreatorEarnings: async (
    creatorId: string,
    timeframe: TimeFrame,
  ): Promise<EarningsReport> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock earnings data
    const baseEarnings = Math.random() * 5; // 0-5 ETH
    const periodMultiplier = {
      "7d": 0.2,
      "30d": 1,
      "90d": 2.5,
      "1y": 10,
      all: 15,
    };

    const totalEarnings = baseEarnings * periodMultiplier[timeframe];
    const periodEarnings = baseEarnings * periodMultiplier[timeframe] * 0.3;

    // Generate mock transactions
    const transactions: RevenueTransaction[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: `tx_${Date.now()}_${i}`,
        patternId: `pattern_${Math.floor(Math.random() * 10)}`,
        licenseId: `license_${Date.now()}_${i}`,
        amount: Math.random() * 0.1,
        currency: "ETH",
        date: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        type: Math.random() > 0.7 ? "royalty" : "license",
        buyer: `0x${Math.random().toString(16).substr(2, 40)}`,
      }),
    );

    return {
      totalEarnings,
      periodEarnings,
      currency: "ETH",
      transactions: transactions.slice(0, 10), // Return latest 10
      breakdown: {
        personal: totalEarnings * 0.6,
        commercial: totalEarnings * 0.3,
        exclusive: totalEarnings * 0.1,
      },
    };
  },

  withdrawEarnings: async (
    creatorId: string,
    amount: number,
  ): Promise<WithdrawalTransaction> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: "0x" + Math.random().toString(16).substr(2, 40),
      to: "0x" + Math.random().toString(16).substr(2, 40),
      value: amount.toString(),
      gasUsed: "21000",
      gasPrice: "20000000000",
      status: "confirmed",
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(Math.random() * 1000000),
      amount,
      currency: "ETH",
      withdrawalAddress: "0x" + Math.random().toString(16).substr(2, 40),
    };
  },

  getPatternAnalytics: async (patternId: string): Promise<RevenueAnalytics> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const totalRevenue = Math.random() * 2;
    const licensesSold = Math.floor(Math.random() * 500);

    return {
      patternId,
      totalRevenue,
      licensesSold,
      averagePrice: totalRevenue / Math.max(licensesSold, 1),
      topLicenseType: ["personal", "commercial", "exclusive"][
        Math.floor(Math.random() * 3)
      ],
      monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 7),
        revenue: Math.random() * 0.5,
        licenses: Math.floor(Math.random() * 50),
      })),
    };
  },
};

export class RevenueManager {
  private static instance: RevenueManager;

  private constructor() {}

  static getInstance(): RevenueManager {
    if (!RevenueManager.instance) {
      RevenueManager.instance = new RevenueManager();
    }
    return RevenueManager.instance;
  }

  /**
   * Get earnings report for a creator
   */
  async getCreatorEarnings(
    creatorId: string,
    timeframe: TimeFrame,
  ): Promise<EarningsReport> {
    try {
      if (!creatorId) {
        throw new Error("Creator ID is required");
      }

      const earnings = await mockBlockchainService.getCreatorEarnings(
        creatorId,
        timeframe,
      );

      // Store in cache for quick access
      this.cacheEarningsReport(creatorId, timeframe, earnings);

      console.log(`✅ Retrieved earnings for creator ${creatorId}:`, earnings);

      return earnings;
    } catch (error) {
      console.error("Failed to get creator earnings:", error);
      throw this.handleRevenueError(error);
    }
  }

  /**
   * Withdraw earnings to wallet
   */
  async withdrawEarnings(
    creatorId: string,
    amount: number,
    wallet: TomoWallet,
  ): Promise<WithdrawalTransaction> {
    try {
      if (!wallet.address) {
        throw new Error("Wallet address is required for withdrawal");
      }

      if (amount <= 0) {
        throw new Error("Withdrawal amount must be greater than 0");
      }

      // Check available balance
      const earnings = await this.getCreatorEarnings(creatorId, "all");
      if (amount > earnings.totalEarnings) {
        throw new Error("Insufficient balance for withdrawal");
      }

      // Execute withdrawal transaction
      const transaction = await mockBlockchainService.withdrawEarnings(
        creatorId,
        amount,
      );

      // Update local earnings cache
      await this.updateEarningsAfterWithdrawal(creatorId, amount);

      // Record withdrawal in transaction history
      await this.recordWithdrawal(creatorId, transaction);

      console.log(
        `✅ Withdrawal completed for ${amount} ETH:`,
        transaction.hash,
      );

      return transaction;
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw this.handleRevenueError(error);
    }
  }

  /**
   * Get revenue analytics for a specific pattern
   */
  async getRevenueAnalytics(patternId: string): Promise<RevenueAnalytics> {
    try {
      if (!patternId) {
        throw new Error("Pattern ID is required");
      }

      const analytics =
        await mockBlockchainService.getPatternAnalytics(patternId);

      // Cache analytics data
      this.cachePatternAnalytics(patternId, analytics);

      console.log(
        `✅ Retrieved analytics for pattern ${patternId}:`,
        analytics,
      );

      return analytics;
    } catch (error) {
      console.error("Failed to get revenue analytics:", error);
      throw this.handleRevenueError(error);
    }
  }

  /**
   * Set royalty percentage for a pattern
   */
  async setRoyaltyPercentage(
    patternId: string,
    percentage: number,
  ): Promise<void> {
    try {
      if (percentage < 0 || percentage > 50) {
        throw new Error("Royalty percentage must be between 0 and 50");
      }

      // In production, this would update the smart contract
      const settings = this.getPatternSettings(patternId);
      settings.royaltyPercentage = percentage;
      this.savePatternSettings(patternId, settings);

      console.log(
        `✅ Updated royalty percentage for pattern ${patternId}: ${percentage}%`,
      );
    } catch (error) {
      console.error("Failed to set royalty percentage:", error);
      throw this.handleRevenueError(error);
    }
  }

  /**
   * Get aggregated earnings across all patterns for a creator
   */
  async getAggregatedEarnings(creatorId: string): Promise<{
    totalEarnings: number;
    monthlyGrowth: number;
    topPerformingPattern: string;
    recentTransactions: RevenueTransaction[];
  }> {
    try {
      const earnings = await this.getCreatorEarnings(creatorId, "all");
      const lastMonthEarnings = await this.getCreatorEarnings(creatorId, "30d");
      const previousMonthEarnings = lastMonthEarnings.periodEarnings * 0.8; // Mock previous month

      const monthlyGrowth =
        previousMonthEarnings > 0
          ? ((lastMonthEarnings.periodEarnings - previousMonthEarnings) /
              previousMonthEarnings) *
            100
          : 0;

      // Find top performing pattern (mock)
      const patterns = await this.getCreatorPatterns(creatorId);
      const topPerformingPattern = patterns.length > 0 ? patterns[0].id : "";

      return {
        totalEarnings: earnings.totalEarnings,
        monthlyGrowth,
        topPerformingPattern,
        recentTransactions: earnings.transactions.slice(0, 5),
      };
    } catch (error) {
      console.error("Failed to get aggregated earnings:", error);
      throw this.handleRevenueError(error);
    }
  }

  /**
   * Generate earnings forecast based on historical data
   */
  async generateEarningsForecast(
    creatorId: string,
    months: number = 6,
  ): Promise<{
    projectedEarnings: number;
    confidenceLevel: number;
    factors: string[];
  }> {
    try {
      const earnings = await this.getCreatorEarnings(creatorId, "all");
      const monthlyAverage = earnings.totalEarnings / 12; // Assume 1 year of data

      // Simple projection with some randomness
      const growthRate = 1.1; // 10% growth
      const projectedEarnings = monthlyAverage * months * growthRate;

      return {
        projectedEarnings,
        confidenceLevel: 0.75,
        factors: [
          "Historical earning trends",
          "Pattern popularity growth",
          "Market demand patterns",
          "Seasonal variations",
        ],
      };
    } catch (error) {
      console.error("Failed to generate earnings forecast:", error);
      throw this.handleRevenueError(error);
    }
  }

  /**
   * Private helper methods
   */

  private cacheEarningsReport(
    creatorId: string,
    timeframe: TimeFrame,
    earnings: EarningsReport,
  ): void {
    try {
      const cacheKey = `earnings_${creatorId}_${timeframe}`;
      const cacheData = {
        earnings,
        timestamp: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to cache earnings report:", error);
    }
  }

  private cachePatternAnalytics(
    patternId: string,
    analytics: RevenueAnalytics,
  ): void {
    try {
      const cacheKey = `analytics_${patternId}`;
      const cacheData = {
        analytics,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to cache pattern analytics:", error);
    }
  }

  private async updateEarningsAfterWithdrawal(
    creatorId: string,
    amount: number,
  ): Promise<void> {
    try {
      // Update cached earnings to reflect withdrawal
      const cacheKeys = ["7d", "30d", "90d", "1y", "all"].map(
        (tf) => `earnings_${creatorId}_${tf}`,
      );

      cacheKeys.forEach((key) => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data = JSON.parse(cached);
          data.earnings.totalEarnings = Math.max(
            0,
            data.earnings.totalEarnings - amount,
          );
          localStorage.setItem(key, JSON.stringify(data));
        }
      });
    } catch (error) {
      console.warn("Failed to update earnings cache after withdrawal:", error);
    }
  }

  private async recordWithdrawal(
    creatorId: string,
    transaction: WithdrawalTransaction,
  ): Promise<void> {
    try {
      const withdrawalRecord = {
        id: transaction.hash,
        creatorId,
        amount: transaction.amount,
        currency: transaction.currency,
        timestamp: transaction.timestamp,
        status: transaction.status,
      };

      // Store withdrawal record
      const withdrawals = JSON.parse(
        localStorage.getItem(`withdrawals_${creatorId}`) || "[]",
      );
      withdrawals.unshift(withdrawalRecord);

      // Keep only last 50 withdrawals
      if (withdrawals.length > 50) {
        withdrawals.splice(50);
      }

      localStorage.setItem(
        `withdrawals_${creatorId}`,
        JSON.stringify(withdrawals),
      );
    } catch (error) {
      console.warn("Failed to record withdrawal:", error);
    }
  }

  private getPatternSettings(patternId: string): { royaltyPercentage: number } {
    try {
      const settings = localStorage.getItem(`pattern_settings_${patternId}`);
      return settings ? JSON.parse(settings) : { royaltyPercentage: 10 };
    } catch (error) {
      return { royaltyPercentage: 10 };
    }
  }

  private savePatternSettings(
    patternId: string,
    settings: { royaltyPercentage: number },
  ): void {
    try {
      localStorage.setItem(
        `pattern_settings_${patternId}`,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.warn("Failed to save pattern settings:", error);
    }
  }

  private async getCreatorPatterns(
    creatorId: string,
  ): Promise<CustomPattern[]> {
    try {
      // Mock pattern retrieval
      const patterns: CustomPattern[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("pattern_")) {
          const pattern = JSON.parse(localStorage.getItem(key) || "{}");
          if (pattern.creator === creatorId) {
            patterns.push(pattern);
          }
        }
      }
      return patterns;
    } catch (error) {
      console.error("Failed to get creator patterns:", error);
      return [];
    }
  }

  private handleRevenueError(error: unknown): BlockchainError {
    if (error instanceof Error) {
      return {
        code: "REVENUE_ERROR",
        message: error.message,
        details: error,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: "UNKNOWN_REVENUE_ERROR",
      message: "An unknown error occurred during revenue operation",
      details: error,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const revenueManager = RevenueManager.getInstance();

// Helper functions for revenue management
export const formatCurrency = (
  amount: number,
  currency: string = "ETH",
): string => {
  return `${amount.toFixed(4)} ${currency}`;
};

export const calculateRoyalty = (
  licensePrice: number,
  royaltyPercentage: number,
): number => {
  return (licensePrice * royaltyPercentage) / 100;
};

export const getRevenueGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const formatRevenueGrowth = (growth: number): string => {
  const sign = growth >= 0 ? "+" : "";
  return `${sign}${growth.toFixed(1)}%`;
};

export const getRevenueColor = (growth: number): string => {
  if (growth > 0) return "text-green-600";
  if (growth < 0) return "text-red-600";
  return "text-gray-600";
};

// Revenue period helpers
export const getRevenuePeriodLabel = (timeframe: TimeFrame): string => {
  const labels = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 3 months",
    "1y": "Last year",
    all: "All time",
  };
  return labels[timeframe];
};

export const getRevenueMetrics = (earnings: EarningsReport) => {
  const metrics = {
    totalRevenue: earnings.totalEarnings,
    averagePerTransaction:
      earnings.transactions.length > 0
        ? earnings.totalEarnings / earnings.transactions.length
        : 0,
    licensesSold: earnings.transactions.filter((t) => t.type === "license")
      .length,
    royaltiesEarned: earnings.transactions.filter((t) => t.type === "royalty")
      .length,
    topLicenseType:
      Object.entries(earnings.breakdown).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0] || "personal",
  };

  return metrics;
};
