import { apiClient } from './unified-client';
import type { MarketplacePattern } from "../../types/marketplace";

/**
 * Fetches marketplace patterns from the blockchain
 */
export async function getPatterns(): Promise<MarketplacePattern[]> {
  const response = await apiClient.request('social', '/api/marketplace/patterns');
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch marketplace patterns');
  }
  
  return response.data;
}

/**
 * Fetches a specific pattern by ID
 */
export async function getPatternById(id: string): Promise<MarketplacePattern | null> {
  const response = await apiClient.request('social', `/api/marketplace/patterns/${id}`);
  
  if (!response.success) {
    // Check if it's a 404 error (pattern not found)
    if (response.error && response.error.includes('404')) {
      return null;
    }
    throw new Error(response.error || `Failed to fetch pattern ${id}`);
  }
  
  return response.data;
}

/**
 * Fetches the user's purchased patterns
 * @param userId Optional user ID - will try to get from local storage if not provided
 */
export async function getPurchasedPatterns(userId?: string): Promise<MarketplacePattern[]> {
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
  
  // License manager implementation using unified client
  try {
    const response = await apiClient.request('patterns', `/purchased?userId=${userId}`);
    if (response.success && response.data) {
      return response.data as MarketplacePattern[];
    }
    console.warn("No purchased patterns found for user");
    return [];
  } catch (error) {
    console.error("Failed to fetch purchased patterns:", error);
    return [];
  }
}