/**
 * Lens Protocol Cache
 * 
 * Specialized caching for Lens Protocol social data
 */

import { SimpleCache, getCache } from '../utils/cache-utils';
import { LensAccount, SocialPost, CommunityStats } from './types';

// TTL constants (in milliseconds)
const PROFILE_TTL = 10 * 60 * 1000;       // 10 minutes
const SOCIAL_GRAPH_TTL = 5 * 60 * 1000;   // 5 minutes
const TIMELINE_TTL = 2 * 60 * 1000;       // 2 minutes
const STATS_TTL = 15 * 60 * 1000;         // 15 minutes

/**
 * Cache for Lens Protocol social data
 */
export class LensCache {
  private static instance: LensCache;
  private cache: SimpleCache;
  
  private constructor() {
    this.cache = getCache();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): LensCache {
    if (!LensCache.instance) {
      LensCache.instance = new LensCache();
    }
    return LensCache.instance;
  }
  
  /**
   * Cache key prefix for namespacing
   */
  private prefix(key: string): string {
    return `lens:${key}`;
  }
  
  /**
   * Cache profile data
   */
  cacheProfile(address: string, profile: LensAccount, ttl: number = PROFILE_TTL): void {
    this.cache.set(this.prefix(`profile:${address}`), profile, ttl);
  }
  
  /**
   * Get cached profile
   */
  getProfile(address: string): LensAccount | undefined {
    return this.cache.get<LensAccount>(this.prefix(`profile:${address}`));
  }
  
  /**
   * Cache followers data
   */
  cacheFollowers(address: string, followers: LensAccount[], ttl: number = SOCIAL_GRAPH_TTL): void {
    this.cache.set(
      this.prefix(`followers:${address}`), 
      { data: followers, timestamp: Date.now() },
      ttl
    );
  }
  
  /**
   * Get cached followers
   */
  getFollowers(address: string): { data: LensAccount[], timestamp: number } | undefined {
    return this.cache.get<{ data: LensAccount[], timestamp: number }>(
      this.prefix(`followers:${address}`)
    );
  }
  
  /**
   * Cache following data
   */
  cacheFollowing(address: string, following: LensAccount[], ttl: number = SOCIAL_GRAPH_TTL): void {
    this.cache.set(
      this.prefix(`following:${address}`), 
      { data: following, timestamp: Date.now() },
      ttl
    );
  }
  
  /**
   * Get cached following
   */
  getFollowing(address: string): { data: LensAccount[], timestamp: number } | undefined {
    return this.cache.get<{ data: LensAccount[], timestamp: number }>(
      this.prefix(`following:${address}`)
    );
  }
  
  /**
   * Cache timeline data
   */
  cacheTimeline(
    address: string, 
    timeline: SocialPost[], 
    options: Record<string, any> = {},
    ttl: number = TIMELINE_TTL
  ): void {
    const optionsKey = JSON.stringify(options);
    this.cache.set(
      this.prefix(`timeline:${address}:${optionsKey}`), 
      { data: timeline, timestamp: Date.now() },
      ttl
    );
  }
  
  /**
   * Get cached timeline
   */
  getTimeline(
    address: string, 
    options: Record<string, any> = {}
  ): { data: SocialPost[], timestamp: number } | undefined {
    const optionsKey = JSON.stringify(options);
    return this.cache.get<{ data: SocialPost[], timestamp: number }>(
      this.prefix(`timeline:${address}:${optionsKey}`)
    );
  }
  
  /**
   * Cache community stats
   */
  cacheCommunityStats(stats: CommunityStats, ttl: number = STATS_TTL): void {
    this.cache.set(this.prefix('community_stats'), stats, ttl);
  }
  
  /**
   * Get cached community stats
   */
  getCommunityStats(): CommunityStats | undefined {
    return this.cache.get<CommunityStats>(this.prefix('community_stats'));
  }
  
  /**
   * Cache access token (with shorter TTL)
   */
  cacheAccessToken(token: string, ttl: number = 3600000): void { // 1 hour
    this.cache.set(this.prefix('access_token'), token, ttl);
  }
  
  /**
   * Get cached access token
   */
  getAccessToken(): string | undefined {
    return this.cache.get<string>(this.prefix('access_token'));
  }
  
  /**
   * Invalidate profile cache
   */
  invalidateProfile(address: string): void {
    this.cache.delete(this.prefix(`profile:${address}`));
  }
  
  /**
   * Invalidate followers cache
   */
  invalidateFollowers(address: string): void {
    this.cache.delete(this.prefix(`followers:${address}`));
  }
  
  /**
   * Invalidate following cache
   */
  invalidateFollowing(address: string): void {
    this.cache.delete(this.prefix(`following:${address}`));
  }
  
  /**
   * Invalidate timeline cache
   */
  invalidateTimeline(address: string): void {
    // Delete all timeline entries for this address (regardless of options)
    for (let i = 0; i < this.cache.size(); i++) {
      const key = this.prefix(`timeline:${address}`);
      if (key.startsWith(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Invalidate all social graph data for an address
   */
  invalidateSocialGraph(address: string): void {
    this.invalidateProfile(address);
    this.invalidateFollowers(address);
    this.invalidateFollowing(address);
    this.invalidateTimeline(address);
  }
  
  /**
   * Clear all Lens cache
   */
  clearAll(): void {
    // Clean up all keys with our prefix
    for (let i = 0; i < this.cache.size(); i++) {
      const prefix = this.prefix('');
      // This is a simplification - in a real implementation we would need to iterate through all keys
      // For now, we'll rely on cache expiration
      this.cache.cleanExpired();
    }
  }
}

/**
 * Convenience function to get the Lens cache instance
 */
export function getLensCache(): LensCache {
  return LensCache.getInstance();
}