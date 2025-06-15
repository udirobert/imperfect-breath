import type {
  LicenseTerms,
  LicenseAgreement,
  TomoWallet,
  Transaction,
  BlockchainError,
  TimeFrame,
  PaginationParams,
} from "@/types/blockchain";
import type { CustomPattern } from "@/lib/ai/providers";
import { blockchainConfig } from "@/lib/blockchain/config";

// Mock blockchain implementation - replace with actual blockchain calls
const mockBlockchainService = {
  purchaseLicense: async (
    patternId: string,
    terms: LicenseTerms,
    buyerWallet: string,
  ): Promise<Transaction> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: buyerWallet,
      to: "0x" + Math.random().toString(16).substr(2, 40), // Contract address
      value: terms.price.toString(),
      gasUsed: "150000",
      gasPrice: "20000000000",
      status: "confirmed",
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(Math.random() * 1000000),
    };
  },

  validateLicense: async (licenseId: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return Math.random() > 0.1; // 90% success rate for demo
  },

  revokeLicense: async (licenseId: string): Promise<Transaction> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: "0x" + Math.random().toString(16).substr(2, 40),
      to: "0x0000000000000000000000000000000000000000",
      value: "0",
      gasUsed: "50000",
      gasPrice: "20000000000",
      status: "confirmed",
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(Math.random() * 1000000),
    };
  },
};

export class LicenseManager {
  private static instance: LicenseManager;

  private constructor() {}

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  /**
   * Purchase a license for a breathing pattern
   */
  async purchaseLicense(
    patternId: string,
    terms: LicenseTerms,
    buyer: TomoWallet,
  ): Promise<LicenseAgreement> {
    try {
      if (!buyer.address) {
        throw new Error("Buyer wallet address is required");
      }

      // Validate license terms
      this.validateLicenseTerms(terms);

      // Get pattern information
      const pattern = await this.getPattern(patternId);
      if (!pattern) {
        throw new Error("Pattern not found");
      }

      // Check if user already has an active license
      const existingLicense = await this.hasActiveLicense(
        patternId,
        buyer.address,
      );
      if (existingLicense && terms.type !== "exclusive") {
        throw new Error("User already has an active license for this pattern");
      }

      // Execute blockchain transaction
      const transaction = await mockBlockchainService.purchaseLicense(
        patternId,
        terms,
        buyer.address,
      );

      // Create license agreement
      const licenseAgreement: LicenseAgreement = {
        id: `license_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternId,
        licenseeId: buyer.address,
        licensorId: pattern.creator,
        terms,
        transactionHash: transaction.hash,
        purchaseDate: new Date().toISOString(),
        expiryDate: terms.duration
          ? new Date(
              Date.now() + terms.duration * 24 * 60 * 60 * 1000,
            ).toISOString()
          : undefined,
        status: "active",
        usageCount: 0,
      };

      // Store license agreement
      await this.storeLicenseAgreement(licenseAgreement);

      // Update pattern statistics
      await this.updatePatternStats(patternId, "license_purchased");

      console.log(`✅ License purchased successfully:`, licenseAgreement.id);

      return licenseAgreement;
    } catch (error) {
      console.error("License purchase failed:", error);
      throw this.handleLicenseError(error);
    }
  }

  /**
   * Get all licenses for a user
   */
  async getUserLicenses(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<LicenseAgreement[]> {
    try {
      const licenses: LicenseAgreement[] = [];

      // Mock database lookup - replace with actual database query
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("license_agreement_")) {
          const license = JSON.parse(localStorage.getItem(key) || "{}");
          if (license.licenseeId === userId) {
            licenses.push(license);
          }
        }
      }

      // Apply pagination if provided
      if (pagination) {
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        return licenses.slice(startIndex, endIndex);
      }

      return licenses;
    } catch (error) {
      console.error("Failed to get user licenses:", error);
      return [];
    }
  }

  /**
   * Get all licenses for a pattern
   */
  async getPatternLicenses(
    patternId: string,
    pagination?: PaginationParams,
  ): Promise<LicenseAgreement[]> {
    try {
      const licenses: LicenseAgreement[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("license_agreement_")) {
          const license = JSON.parse(localStorage.getItem(key) || "{}");
          if (license.patternId === patternId) {
            licenses.push(license);
          }
        }
      }

      // Apply pagination if provided
      if (pagination) {
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        return licenses.slice(startIndex, endIndex);
      }

      return licenses;
    } catch (error) {
      console.error("Failed to get pattern licenses:", error);
      return [];
    }
  }

  /**
   * Validate if user can use a pattern
   */
  async validateLicenseUsage(
    userId: string,
    patternId: string,
  ): Promise<boolean> {
    try {
      const license = await this.getActiveLicense(patternId, userId);

      if (!license) {
        return false;
      }

      // Check if license is expired
      if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
        await this.expireLicense(license.id);
        return false;
      }

      // Check usage limits
      if (
        license.terms.maxUsers &&
        license.usageCount >= license.terms.maxUsers
      ) {
        return false;
      }

      // Validate on blockchain
      const isValid = await mockBlockchainService.validateLicense(license.id);

      if (isValid) {
        // Increment usage count
        await this.incrementUsageCount(license.id);
      }

      return isValid;
    } catch (error) {
      console.error("License validation failed:", error);
      return false;
    }
  }

  /**
   * Get active license for a user and pattern
   */
  async getActiveLicense(
    patternId: string,
    userId: string,
  ): Promise<LicenseAgreement | null> {
    try {
      const userLicenses = await this.getUserLicenses(userId);

      return (
        userLicenses.find(
          (license) =>
            license.patternId === patternId &&
            license.status === "active" &&
            (!license.expiryDate || new Date(license.expiryDate) > new Date()),
        ) || null
      );
    } catch (error) {
      console.error("Failed to get active license:", error);
      return null;
    }
  }

  /**
   * Revoke a license
   */
  async revokeLicense(licenseId: string, reason: string): Promise<Transaction> {
    try {
      const license = await this.getLicenseById(licenseId);

      if (!license) {
        throw new Error("License not found");
      }

      if (license.status !== "active") {
        throw new Error("License is not active");
      }

      // Execute blockchain transaction
      const transaction = await mockBlockchainService.revokeLicense(licenseId);

      // Update license status
      license.status = "revoked";
      await this.updateLicenseAgreement(license);

      console.log(`✅ License revoked successfully:`, licenseId);

      return transaction;
    } catch (error) {
      console.error("License revocation failed:", error);
      throw this.handleLicenseError(error);
    }
  }

  /**
   * Get license by ID
   */
  async getLicenseById(licenseId: string): Promise<LicenseAgreement | null> {
    try {
      const stored = localStorage.getItem(`license_agreement_${licenseId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to get license by ID:", error);
      return null;
    }
  }

  /**
   * Get available license terms for a pattern
   */
  async getAvailableLicenseTerms(patternId: string): Promise<LicenseTerms[]> {
    try {
      // Mock license terms - in production, this would come from the pattern creator's settings
      const basePrice = 0.01; // ETH

      return [
        {
          id: `personal_${patternId}`,
          type: "personal",
          price: basePrice,
          currency: "ETH",
          duration: 365, // 1 year
          attribution: true,
          modifications: false,
          resale: false,
          maxUsers: 1,
        },
        {
          id: `commercial_${patternId}`,
          type: "commercial",
          price: basePrice * 10,
          currency: "ETH",
          duration: 365, // 1 year
          attribution: true,
          modifications: true,
          resale: false,
          maxUsers: 100,
        },
        {
          id: `exclusive_${patternId}`,
          type: "exclusive",
          price: basePrice * 100,
          currency: "ETH",
          attribution: false,
          modifications: true,
          resale: true,
        },
      ];
    } catch (error) {
      console.error("Failed to get available license terms:", error);
      return [];
    }
  }

  /**
   * Calculate license pricing based on usage and demand
   */
  async calculateDynamicPricing(
    patternId: string,
    licenseType: string,
  ): Promise<number> {
    try {
      const basePrice = 0.01; // ETH
      const licenses = await this.getPatternLicenses(patternId);

      // Simple demand-based pricing
      const demandMultiplier = Math.min(1 + licenses.length * 0.1, 3);

      const typeMultipliers = {
        personal: 1,
        commercial: 10,
        exclusive: 100,
      };

      const typeMultiplier =
        typeMultipliers[licenseType as keyof typeof typeMultipliers] || 1;

      return basePrice * typeMultiplier * demandMultiplier;
    } catch (error) {
      console.error("Failed to calculate dynamic pricing:", error);
      return 0.01; // fallback price
    }
  }

  /**
   * Private helper methods
   */

  private validateLicenseTerms(terms: LicenseTerms): void {
    if (
      !terms.type ||
      !["personal", "commercial", "exclusive"].includes(terms.type)
    ) {
      throw new Error("Invalid license type");
    }

    if (terms.price <= 0) {
      throw new Error("License price must be greater than 0");
    }

    if (terms.duration && terms.duration <= 0) {
      throw new Error("License duration must be greater than 0");
    }
  }

  private async getPattern(patternId: string): Promise<CustomPattern | null> {
    try {
      const stored = localStorage.getItem(`pattern_${patternId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to get pattern:", error);
      return null;
    }
  }

  private async hasActiveLicense(
    patternId: string,
    userId: string,
  ): Promise<boolean> {
    const license = await this.getActiveLicense(patternId, userId);
    return !!license;
  }

  private async storeLicenseAgreement(
    license: LicenseAgreement,
  ): Promise<void> {
    try {
      localStorage.setItem(
        `license_agreement_${license.id}`,
        JSON.stringify(license),
      );
    } catch (error) {
      console.error("Failed to store license agreement:", error);
      throw error;
    }
  }

  private async updateLicenseAgreement(
    license: LicenseAgreement,
  ): Promise<void> {
    try {
      localStorage.setItem(
        `license_agreement_${license.id}`,
        JSON.stringify(license),
      );
    } catch (error) {
      console.error("Failed to update license agreement:", error);
      throw error;
    }
  }

  private async incrementUsageCount(licenseId: string): Promise<void> {
    try {
      const license = await this.getLicenseById(licenseId);
      if (license) {
        license.usageCount += 1;
        await this.updateLicenseAgreement(license);
      }
    } catch (error) {
      console.error("Failed to increment usage count:", error);
    }
  }

  private async expireLicense(licenseId: string): Promise<void> {
    try {
      const license = await this.getLicenseById(licenseId);
      if (license) {
        license.status = "expired";
        await this.updateLicenseAgreement(license);
      }
    } catch (error) {
      console.error("Failed to expire license:", error);
    }
  }

  private async updatePatternStats(
    patternId: string,
    event: string,
  ): Promise<void> {
    try {
      // Mock implementation - in production, update pattern statistics
      const statsKey = `pattern_stats_${patternId}`;
      const stats = JSON.parse(localStorage.getItem(statsKey) || "{}");

      stats[event] = (stats[event] || 0) + 1;
      stats.lastUpdated = new Date().toISOString();

      localStorage.setItem(statsKey, JSON.stringify(stats));
    } catch (error) {
      console.error("Failed to update pattern stats:", error);
    }
  }

  private handleLicenseError(error: unknown): BlockchainError {
    if (error instanceof Error) {
      return {
        code: "LICENSE_ERROR",
        message: error.message,
        details: error,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: "UNKNOWN_LICENSE_ERROR",
      message: "An unknown error occurred during license operation",
      details: error,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const licenseManager = LicenseManager.getInstance();

// Helper functions for license validation
export const validateLicenseForPattern = async (
  userId: string,
  patternId: string,
): Promise<boolean> => {
  return licenseManager.validateLicenseUsage(userId, patternId);
};

export const getUserActiveLicenses = async (
  userId: string,
): Promise<LicenseAgreement[]> => {
  const allLicenses = await licenseManager.getUserLicenses(userId);
  return allLicenses.filter(
    (license) =>
      license.status === "active" &&
      (!license.expiryDate || new Date(license.expiryDate) > new Date()),
  );
};

export const formatLicensePrice = (price: number, currency: string): string => {
  return `${price.toFixed(4)} ${currency}`;
};

export const getLicenseStatusColor = (status: string): string => {
  const colors = {
    active: "green",
    expired: "orange",
    revoked: "red",
  };
  return colors[status as keyof typeof colors] || "gray";
};
