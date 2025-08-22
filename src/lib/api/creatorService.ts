import type { CreatorStats, PatternStats } from "../../types/creator";
import { apiClient } from './unified-client';

/**
 * Fetches creator's patterns from the blockchain
 */
export async function getCreatorPatterns(): Promise<PatternStats[]> {
  const response = await apiClient.request('social', '/api/creator/patterns');
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch creator patterns');
  }
  
  return response.data;
}

/**
 * Fetches creator statistics from the blockchain
 */
export async function getCreatorStats(): Promise<CreatorStats> {
  const response = await apiClient.request('social', '/api/creator/stats');
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch creator stats');
  }
  
  return response.data;
}

/**
 * Updates a pattern's metadata on the blockchain
 */
export async function updatePattern(pattern: PatternStats): Promise<PatternStats> {
  const response = await apiClient.request('social', `/api/creator/patterns/${pattern.id}`, {
    method: 'PUT',
    body: JSON.stringify(pattern),
  });
  
  if (!response.success) {
    throw new Error(response.error || `Failed to update pattern ${pattern.id}`);
  }
  
  return response.data;
}

/**
 * Creates a new pattern on the blockchain
 */
export async function createPattern(pattern: Omit<PatternStats, 'id'>): Promise<PatternStats> {
  const response = await apiClient.request('social', '/api/creator/patterns', {
    method: 'POST',
    body: JSON.stringify(pattern),
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to create pattern');
  }
  
  return response.data;
}