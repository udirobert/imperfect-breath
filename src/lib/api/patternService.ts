import { licenseManager } from "../../lib/licensing/licenseManager";
import { handleError } from "../../lib/utils/error-utils";
import type { MarketplacePattern } from "../../types/marketplace";

/**
 * Fetches marketplace patterns from the blockchain
 */
export async function getPatterns(): Promise<MarketplacePattern[]> {
  try {
    // Fetch patterns from the Lens Chain API
    const response = await fetch('/api/marketplace/patterns');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch patterns: ${response.statusText}`);
    }
    
    const patterns = await response.json();
    return patterns;
  } catch (error) {
    throw handleError("fetch marketplace patterns", error);
  }
}

/**
 * Fetches a specific pattern by ID
 */
export async function getPatternById(id: string): Promise<MarketplacePattern | null> {
  try {
    // Fetch pattern directly from the blockchain
    const response = await fetch(`/api/marketplace/patterns/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch pattern: ${response.statusText}`);
    }
    
    const pattern = await response.json();
    return pattern;
  } catch (error) {
    throw handleError(`fetch pattern ${id}`, error);
  }
}

/**
 * Fetches the user's purchased patterns
 * @param userId Optional user ID - will try to get from local storage if not provided
 */
export async function getPurchasedPatterns(userId?: string): Promise<MarketplacePattern[]> {
  try {
    // If no userId provided, try to get from local storage or auth state
    if (!userId) {
      // Try to get current user from localStorage or session storage
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          userId = userData.address || userData.id || userData.userId;
        } catch (e) {
          console.warn("Failed to parse current user data", e);
        }
      }
      
      // If still no userId, return empty array - can't fetch without a user
      if (!userId) {
        console.warn("No user ID available for fetching purchased patterns");
        return [];
      }
    }
    
    // Get user licenses from the license manager
    const licenses = await licenseManager.getUserLicenses(userId);
    
    // Fetch the corresponding patterns
    const patternPromises = licenses.map(license =>
      getPatternById(license.patternId)
    );
    
    const patterns = await Promise.all(patternPromises);
    
    // Filter out null patterns (in case any licenses point to deleted patterns)
    return patterns.filter(pattern => pattern !== null) as MarketplacePattern[];
  } catch (error) {
    throw handleError("fetch purchased patterns", error);
  }
}