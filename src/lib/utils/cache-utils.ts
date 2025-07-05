/**
 * Cache Utilities
 * 
 * Simple in-memory caching for expensive operations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // Timestamp when this entry expires
}

/**
 * Simple in-memory cache
 */
export class SimpleCache {
  private static instance: SimpleCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxEntries: number;
  
  private constructor(maxEntries: number = 100) {
    this.maxEntries = maxEntries;
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(maxEntries: number = 100): SimpleCache {
    if (!SimpleCache.instance) {
      SimpleCache.instance = new SimpleCache(maxEntries);
    }
    return SimpleCache.instance;
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number = 60000): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs
    });
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    // Return undefined if entry not found or expired
    if (!entry || Date.now() > entry.expiry) {
      if (entry) {
        // Clean up expired entry
        this.cache.delete(key);
      }
      return undefined;
    }
    
    return entry.data as T;
  }
  
  /**
   * Check if key exists in cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return !!entry && Date.now() <= entry.expiry;
  }
  
  /**
   * Remove a key from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Get a value from cache or compute it if not available
   * @param key Cache key
   * @param producer Function to produce value if not in cache
   * @param ttlMs Time to live in milliseconds
   * @returns Cached or newly computed value
   */
  async getOrCompute<T>(
    key: string, 
    producer: () => Promise<T>, 
    ttlMs: number = 60000
  ): Promise<T> {
    // Check cache first
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // Not in cache, compute the value
    const value = await producer();
    
    // Cache the result
    this.set(key, value, ttlMs);
    
    return value;
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Remove expired entries from the cache
   * @returns Number of entries removed
   */
  cleanExpired(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Evict the oldest entry from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Convenience function to get the default cache instance
export function getCache(): SimpleCache {
  return SimpleCache.getInstance();
}