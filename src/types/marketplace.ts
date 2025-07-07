import type { LicenseTerms } from "./blockchain";
import type { CustomPattern } from "../lib/ai/providers";

/**
 * Represents a pattern available in the marketplace
 */
export interface MarketplacePattern extends CustomPattern {
  rating: number;
  reviews: number;
  downloads: number;
  featured: boolean;
  price: number;
  currency: string;
  creatorName: string;
  creatorAvatar?: string;
  previewUrl?: string;
  tags: string[];
}

/**
 * License information for a purchased pattern
 */
export interface PatternLicense {
  id: string;
  patternId: string;
  terms: LicenseTerms;
  purchaseDate: string;
  expiryDate?: string;
}