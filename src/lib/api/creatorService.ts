import type { CreatorStats, PatternStats } from "../../types/creator";
import { handleError } from "../../lib/utils/error-utils";

/**
 * Fetches creator's patterns from the blockchain
 */
export async function getCreatorPatterns(): Promise<PatternStats[]> {
  try {
    // Fetch patterns from the Lens Chain API
    const response = await fetch('/api/creator/patterns');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creator patterns: ${response.statusText}`);
    }
    
    const patterns = await response.json();
    return patterns;
  } catch (error) {
    throw handleError("fetch creator patterns", error);
  }
}

/**
 * Fetches creator statistics from the blockchain
 */
export async function getCreatorStats(): Promise<CreatorStats> {
  try {
    // Fetch stats from the Lens Chain API
    const response = await fetch('/api/creator/stats');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creator stats: ${response.statusText}`);
    }
    
    const stats = await response.json();
    return stats;
  } catch (error) {
    throw handleError("fetch creator stats", error);
  }
}

/**
 * Updates a pattern's metadata on the blockchain
 */
export async function updatePattern(pattern: PatternStats): Promise<PatternStats> {
  try {
    const response = await fetch(`/api/creator/patterns/${pattern.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pattern)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update pattern: ${response.statusText}`);
    }
    
    const updatedPattern = await response.json();
    return updatedPattern;
  } catch (error) {
    throw handleError(`update pattern ${pattern.id}`, error);
  }
}

/**
 * Creates a new pattern on the blockchain
 */
export async function createPattern(pattern: Omit<PatternStats, 'id'>): Promise<PatternStats> {
  try {
    const response = await fetch('/api/creator/patterns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pattern)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create pattern: ${response.statusText}`);
    }
    
    const newPattern = await response.json();
    return newPattern;
  } catch (error) {
    throw handleError("create pattern", error);
  }
}