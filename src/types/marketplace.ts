import type { CustomPattern } from "../lib/patternStorage";

// License terms for pattern usage
export interface LicenseTerms {
  type: "personal" | "commercial" | "exclusive";
  duration: number; // in days
  price: number;
  currency: string;
  restrictions?: string[];
  transferable: boolean;
}

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