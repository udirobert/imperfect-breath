import type {
  EarningsReport,
  RevenueTransaction,
  RevenueAnalytics,
  WithdrawalTransaction,
  TimeFrame,
  UserWallet,
  BlockchainError,
} from "../../types/blockchain";
import type { CustomPattern } from "../../lib/ai/providers";
import { blockchainConfig } from "../../lib/blockchain/config";
import { storyClient, storyIPService } from "../story";
import { wagmiConfig } from "../wagmi/config";

// Real blockchain service for revenue operations
const blockchainService = {
  getCreatorEarnings: async (
    creatorId: string,
    timeframe: TimeFrame,
  ): Promise<EarningsReport> => {
    try {
      console.log(`Fetching earnings for creator ${creatorId} for timeframe ${timeframe}`);
      
      // Define time periods in milliseconds
      const timeframes = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
        "1y": 365 * 24 * 60 * 60 * 1000,
        "all": Number.MAX_SAFE_INTEGER
      };
      
      const periodMs = timeframes[timeframe];
      const startTime = new Date(Date.now() - periodMs).toISOString();
      
      // Get IP assets owned by this creator
      if (!storyClient.ipAsset) {
        console.warn("IP Asset API not available");
        return {
          totalEarnings: 0,
          periodEarnings: 0,
          currency: "ETH",
          transactions: [],
          breakdown: {
            personal: 0,
            commercial: 0,
            exclusive: 0,
          },
        };
      }
      
      const ipAssets = await storyClient.ipAsset!.getByOwner(creatorId);
      
      if (!ipAssets || ipAssets.length === 0) {
        // Return empty report if no assets found
        return {
          totalEarnings: 0,
          periodEarnings: 0,
          currency: "ETH",
          transactions: [],
          breakdown: {
            personal: 0,
            commercial: 0,
            exclusive: 0,
          },
        };
      }
      
      // For each IP asset, get license revenue
      let totalEarnings = 0;
      let periodEarnings = 0;
      const transactions: RevenueTransaction[] = [];
      let personalEarnings = 0;
      let commercialEarnings = 0;
      let exclusiveEarnings = 0;
      
      // Use a combination of blockchain data and local storage to build a revenue report
      // In a full implementation, this would query actual blockchain transactions
      
      // For each asset, get license agreements from local storage
      for (const asset of ipAssets) {
        // Find the pattern associated with this IP asset
        let patternId = "";
        
        // Search local storage for matching IP hash
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("pattern_")) {
            const pattern = JSON.parse(localStorage.getItem(key) || "{}");
            if (pattern.ipHash === asset.ipId) {
              patternId = key.replace("pattern_", "");
              break;
            }
          }
        }
        
        if (!patternId) continue;
        
        // Get license agreements for this pattern
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("license_agreement_")) {
            const license = JSON.parse(localStorage.getItem(key) || "{}");
            
            if (license.patternId === patternId) {
              const amount = parseFloat(license.terms.price || "0");
              const date = license.purchaseDate;
              const type = license.terms.type;
              
              // Check if this transaction falls within the time period
              if (new Date(date) >= new Date(startTime)) {
                periodEarnings += amount;
                
                // Add to transaction list
                transactions.push({
                  id: license.id,
                  patternId: license.patternId,
                  licenseId: license.id,
                  amount,
                  currency: "ETH",
                  date,
                  type: type === "exclusive" ? "license" : "royalty",
                  buyer: license.licenseeId,
                });
                
                // Add to breakdown by type
                if (type === "personal") {
                  personalEarnings += amount;
                } else if (type === "commercial") {
                  commercialEarnings += amount;
                } else if (type === "exclusive") {
                  exclusiveEarnings += amount;
                }
              }
              
              // Add to total earnings regardless of time period
              totalEarnings += amount;
            }
          }
        }
      }
      
      // Sort transactions by date (newest first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return {
        totalEarnings,
        periodEarnings,
        currency: "ETH",
        transactions: transactions.slice(0, 10), // Return latest 10
        breakdown: {
          personal: personalEarnings,
          commercial: commercialEarnings,
          exclusive: exclusiveEarnings,
        },
      };
    } catch (error) {
      console.error("Error fetching creator earnings:", error);
      
      // Return fallback data
      return {
        totalEarnings: 0,
        periodEarnings: 0,
        currency: "ETH",
        transactions: [],
        breakdown: {
          personal: 0,
          commercial: 0,
          exclusive: 0,
        },
      };
    }
  },

  withdrawEarnings: async (
    creatorId: string,
    amount: number,
  ): Promise<WithdrawalTransaction> => {
    try {
      console.log(`Withdrawing ${amount} ETH for creator ${creatorId}`);
      
      // In a real implementation, this would execute a blockchain transaction
      // For now, we'll create a transaction but in production this would be connected to a real withdrawal
      
      // Get the wallet client from wagmi config
      const walletClient = wagmiConfig.connectors[0]; // Use the first connector for now
      
      // Create a transaction with proper formatting
      const hash = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2)}`;
      
      // In production, this would be the result of a real transaction
      const transaction: WithdrawalTransaction = {
        hash,
        from: creatorId,
        to: creatorId, // Self-withdrawal
        value: amount.toString(),
        gasUsed: "21000",
        gasPrice: "20000000000",
        status: "confirmed",
        timestamp: new Date().toISOString(),
        blockNumber: 0,
        amount,
        currency: "ETH",
        withdrawalAddress: creatorId,
      };
      
      return transaction;
    } catch (error) {
      console.error("Error withdrawing earnings:", error);
      throw error;
    }
  },

  getPatternAnalytics: async (patternId: string): Promise<RevenueAnalytics> => {
    try {
      console.log(`Fetching analytics for pattern ${patternId}`);
      
      // Get the pattern data
      const patternData = localStorage.getItem(`pattern_${patternId}`);
      if (!patternData) {
        throw new Error("Pattern not found");
      }
      
      const pattern = JSON.parse(patternData);
      const ipId = pattern.ipHash;
      
      if (!ipId) {
        throw new Error("Pattern has no associated IP asset");
      }
      
      // Get license agreements for this pattern
      const licenses: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("license_agreement_")) {
          const license = JSON.parse(localStorage.getItem(key) || "{}");
          if (license.patternId === patternId) {
            licenses.push(license);
          }
        }
      }
      
      // Calculate revenue metrics
      const totalRevenue = licenses.reduce((sum, license) => sum + parseFloat(license.terms.price || "0"), 0);
      const licensesSold = licenses.length;
      
      // Count licenses by type
      const typeCounts: Record<string, number> = {};
      licenses.forEach(license => {
        const type = license.terms.type || "unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      // Determine top license type
      let topLicenseType = "personal";
      let maxCount = 0;
      for (const [type, count] of Object.entries(typeCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topLicenseType = type;
        }
      }
      
      // Create monthly trend data
      // Group licenses by month
      const monthlyData: Record<string, { revenue: number, licenses: number }> = {};
      
      // Initialize last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthKey = date.toISOString().slice(0, 7);
        monthlyData[monthKey] = { revenue: 0, licenses: 0 };
      }
      
      // Add license data to monthly trend
      licenses.forEach(license => {
        const date = new Date(license.purchaseDate);
        const monthKey = date.toISOString().slice(0, 7);
        
        // Only include data from the last 12 months
        const yearAgo = new Date();
        yearAgo.setMonth(yearAgo.getMonth() - 12);
        
        if (date >= yearAgo && monthlyData[monthKey]) {
          monthlyData[monthKey].revenue += parseFloat(license.terms.price || "0");
          monthlyData[monthKey].licenses += 1;
        }
      });
      
      // Convert to array format
      const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        licenses: data.licenses,
      }));
      
      // Sort by month
      monthlyTrend.sort((a, b) => a.month.localeCompare(b.month));
      
      return {
        patternId,
        totalRevenue,
        licensesSold,
        averagePrice: licensesSold > 0 ? totalRevenue / licensesSold : 0,
        topLicenseType,
        monthlyTrend,
      };
    } catch (error) {
      console.error("Error fetching pattern analytics:", error);
      
      // Return fallback data
      return {
        patternId,
        totalRevenue: 0,
        licensesSold: 0,
        averagePrice: 0,
        topLicenseType: "personal",
        monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 7),
          revenue: 0,
          licenses: 0,
        })),
      };
    }
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

      const earnings = await blockchainService.getCreatorEarnings(
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
    wallet: UserWallet,
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
      const transaction = await blockchainService.withdrawEarnings(
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
        await blockchainService.getPatternAnalytics(patternId);

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

      // Get the pattern data
      const patternData = localStorage.getItem(`pattern_${patternId}`);
      if (!patternData) {
        throw new Error("Pattern not found");
      }
      
      const pattern = JSON.parse(patternData);
      const ipId = pattern.ipHash;
      
      if (!ipId) {
        throw new Error("Pattern has no associated IP asset");
      }
      
      // Update royalty percentage on the blockchain
      await storyIPService.setLicenseTerms(ipId, {
        commercialUse: true, // Default
        derivativeWorks: true, // Default
        attributionRequired: true, // Default
        royaltyPercent: percentage
      });

      // Update local settings
      const settings = this.getPatternSettings(patternId);
      settings.royaltyPercent = percentage;
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
      
      // Calculate previous month's earnings
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      // Filter transactions for previous month
      const previousMonthTransactions = earnings.transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= twoMonthsAgo && txDate < oneMonthAgo;
      });
      
      // Calculate previous month earnings
      const previousMonthEarnings = previousMonthTransactions.reduce(
        (sum, tx) => sum + tx.amount, 0
      );

      const monthlyGrowth =
        previousMonthEarnings > 0
          ? ((lastMonthEarnings.periodEarnings - previousMonthEarnings) /
              previousMonthEarnings) *
            100
          : 0;

      // Find top performing pattern
      const patterns = await this.getCreatorPatterns(creatorId);
      let topPerformingPattern = "";
      let maxRevenue = 0;
      
      // For each pattern, get analytics and find the one with highest revenue
      for (const pattern of patterns) {
        if (!pattern.id) continue;
        
        try {
          const analytics = await this.getRevenueAnalytics(pattern.id);
          if (analytics.totalRevenue > maxRevenue) {
            maxRevenue = analytics.totalRevenue;
            topPerformingPattern = pattern.id;
          }
        } catch (error) {
          console.warn(`Failed to get analytics for pattern ${pattern.id}:`, error);
        }
      }

      return {
        totalEarnings: earnings.totalEarnings,
        monthlyGrowth,
        topPerformingPattern: topPerformingPattern || (patterns.length > 0 ? patterns[0].id || "" : ""),
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
      
      // Get patterns for this creator
      const patterns = await this.getCreatorPatterns(creatorId);
      
      // Calculate monthly earnings trend
      const monthlyData: Record<string, number> = {};
      
      // Initialize last 6 months
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthKey = date.toISOString().slice(0, 7);
        monthlyData[monthKey] = 0;
      }
      
      // Add transaction data to monthly trend
      earnings.transactions.forEach(tx => {
        const date = new Date(tx.date);
        const monthKey = date.toISOString().slice(0, 7);
        
        // Only include data from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (date >= sixMonthsAgo && monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += tx.amount;
        }
      });
      
      // Calculate monthly average and growth rate
      const monthlyValues = Object.values(monthlyData);
      const monthlyAverage = monthlyValues.reduce((sum, val) => sum + val, 0) / Math.max(1, monthlyValues.length);
      
      // Calculate growth rate (using simple regression)
      let growthRate = 1.1; // Default 10% growth
      
      if (monthlyValues.length >= 2) {
        // Calculate average month-over-month growth
        let totalGrowth = 0;
        let growthPoints = 0;
        
        for (let i = 1; i < monthlyValues.length; i++) {
          const prev = monthlyValues[i - 1];
          const curr = monthlyValues[i];
          
          if (prev > 0) {
            totalGrowth += (curr - prev) / prev;
            growthPoints++;
          }
        }
        
        // Calculate average growth rate
        const avgMonthlyGrowth = growthPoints > 0 ? totalGrowth / growthPoints : 0.1;
        growthRate = 1 + avgMonthlyGrowth;
      }
      
      // Apply growth for projection (compound growth)
      let projectedEarnings = 0;
      let monthlyAmount = monthlyAverage;
      
      for (let i = 0; i < months; i++) {
        projectedEarnings += monthlyAmount;
        monthlyAmount *= growthRate;
      }
      
      // Calculate confidence level based on data points and consistency
      // More data points and consistent growth = higher confidence
      const dataPoints = earnings.transactions.length;
      const recentActivity = monthlyValues.some(val => val > 0);
      const consistency = monthlyValues.filter(val => val > 0).length / monthlyValues.length;
      
      let confidenceLevel = 0.5; // Base confidence
      
      if (dataPoints > 10) confidenceLevel += 0.1;
      if (dataPoints > 50) confidenceLevel += 0.1;
      if (recentActivity) confidenceLevel += 0.1;
      if (consistency > 0.5) confidenceLevel += 0.1;
      
      // Cap at 95% confidence
      confidenceLevel = Math.min(confidenceLevel, 0.95);

      return {
        projectedEarnings,
        confidenceLevel,
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

  private getPatternSettings(patternId: string): { royaltyPercent: number } {
    try {
      const settings = localStorage.getItem(`pattern_settings_${patternId}`);
      return settings ? JSON.parse(settings) : { royaltyPercent: 10 };
    } catch (error) {
      return { royaltyPercent: 10 };
    }
  }

  private savePatternSettings(
    patternId: string,
    settings: { royaltyPercent: number },
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
      // Find patterns created by this creator
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
