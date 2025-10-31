import React from 'react';
import { SimpleCache, getCache } from './cache-utils';

/**
 * Performance Utilities
 * 
 * Simple performance monitoring and profiling tools
 * Enhanced with optimization utilities for better application performance
 */

interface PerformanceMetric {
  count: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  lastTime: number;
}

// Store performance metrics
const metrics: Record<string, PerformanceMetric> = {};

/**
 * Custom hook for memoizing expensive computations with time-based expiration
 * @param factory Function that computes the value
 * @param deps Dependencies that, when changed, cause recomputation
 * @param ttlMs Time to live in milliseconds (default: 5 minutes)
 * @param key Optional cache key for cross-component caching
 * @returns Memoized value
 */
export function useTimedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  ttlMs: number = 300000, // 5 minutes default
  key?: string
): T {
  // If we have a cache key, use the shared cache
  if (key) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => {
      const cache = getCache();
      return cache.getOrCompute(key, () => factory(), ttlMs);
    }, deps);
  }
  
  // Otherwise, use standard React memoization
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(factory, deps);
}

/**
 * Custom hook for memoizing async functions with caching
 * @param asyncFactory Async function that computes the value
 * @param deps Dependencies that, when changed, cause recomputation
 * @param ttlMs Time to live in milliseconds (default: 5 minutes)
 * @param key Optional cache key for cross-component caching
 * @returns Memoized async function
 */
export function useAsyncTimedMemo<T>(
  asyncFactory: () => Promise<T>,
  deps: React.DependencyList,
  ttlMs: number = 300000, // 5 minutes default
  key?: string
): () => Promise<T> {
  const cache = getCache();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(async () => {
    // If we have a cache key, use the shared cache
    if (key && cache.has(key)) {
      const cachedValue = cache.get<T>(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }
    
    // Compute the value
    const value = await asyncFactory();
    
    // Cache the result if we have a key
    if (key) {
      cache.set(key, value, ttlMs);
    }
    
    return value;
  }, deps);
}

/**
 * Higher-order component for memoizing components with props comparison
 * @param Component Component to memoize
 * @param propsAreEqual Function to compare props for equality
 * @returns Memoized component
 */
export function memoWithProps<T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): T {
  return React.memo(Component, propsAreEqual) as T;
}

/**
 * Utility for creating a debounced version of a function
 * @param func Function to debounce
 * @param waitMs Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Utility for creating a throttled version of a function
 * @param func Function to throttle
 * @param waitMs Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let lastExecTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastExecTime > waitMs) {
      func(...args);
      lastExecTime = now;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, waitMs - (now - lastExecTime));
    }
  };
}

/**
 * Custom hook for debouncing a value
 * @param value Value to debounce
 * @param delayMs Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Custom hook for throttling a value
 * @param value Value to throttle
 * @param delayMs Delay in milliseconds
 * @returns Throttled value
 */
export function useThrottle<T>(value: T, delayMs: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastExecuted = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (Date.now() >= lastExecuted.current + delayMs) {
      setThrottledValue(value);
      lastExecuted.current = Date.now();
    }
  }, [value, delayMs]);

  return throttledValue;
}

/**
 * Utility for preloading components
 * @param importFunc Function that imports the component
 * @returns Promise that resolves when component is preloaded
 */
export async function preloadComponent(importFunc: () => Promise<any>): Promise<void> {
  try {
    await importFunc();
  } catch (error) {
    console.warn('Failed to preload component:', error);
  }
}

/**
 * Utility for creating a resource loader with caching
 */
export class ResourceLoader {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  static async load<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs: number = 300000 // 5 minutes
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    
    const data = await loader();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
    
    return data;
  }
  
  static clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Start a performance timer
 * @param label Identifier for the operation being timed
 * @returns Function to call when operation completes (returns duration in ms)
 */
export function startTimer(label: string): () => number {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    
    // Initialize metrics if first time seeing this label
    if (!metrics[label]) {
      metrics[label] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastTime: 0
      };
    }
    
    // Update metrics
    metrics[label].count++;
    metrics[label].totalTime += duration;
    metrics[label].lastTime = duration;
    metrics[label].minTime = Math.min(metrics[label].minTime, duration);
    metrics[label].maxTime = Math.max(metrics[label].maxTime, duration);
    
    return duration;
  };
}

/**
 * Get average execution time for a labeled operation
 * @param label Identifier for the operation
 * @returns Average time in milliseconds
 */
export function getAverageTime(label: string): number {
  if (!metrics[label] || metrics[label].count === 0) {
    return 0;
  }
  
  return metrics[label].totalTime / metrics[label].count;
}

/**
 * Get detailed metrics for a labeled operation
 * @param label Identifier for the operation
 * @returns Object with performance metrics or null if no data
 */
export function getMetrics(label: string): Record<string, number> | null {
  if (!metrics[label] || metrics[label].count === 0) {
    return null;
  }
  
  const m = metrics[label];
  return {
    count: m.count,
    avgTime: m.totalTime / m.count,
    minTime: m.minTime,
    maxTime: m.maxTime,
    lastTime: m.lastTime,
    totalTime: m.totalTime
  };
}

/**
 * Log all performance metrics to console
 */
export function logPerformance(): void {
  console.log('Performance metrics:');
  console.table(
    Object.entries(metrics).map(([label, m]) => ({
      operation: label,
      calls: m.count,
      avgTime: (m.totalTime / m.count).toFixed(2) + 'ms',
      minTime: m.minTime.toFixed(2) + 'ms',
      maxTime: m.maxTime.toFixed(2) + 'ms',
      lastTime: m.lastTime.toFixed(2) + 'ms',
      totalTime: m.totalTime.toFixed(2) + 'ms'
    }))
  );
}

/**
 * Clear all performance metrics
 */
export function clearMetrics(): void {
  Object.keys(metrics).forEach(key => {
    delete metrics[key];
  });
}

/**
 * Decorator function to automatically time a method
 * @param target Object class
 * @param propertyKey Method name
 * @param descriptor Method descriptor
 */
export function timed(label?: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const methodLabel = label || `${target.constructor.name}.${propertyKey}`;
      const endTimer = startTimer(methodLabel);
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle promises
        if (result instanceof Promise) {
          return result.finally(() => {
            endTimer();
          });
        }
        
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    };
    
    return descriptor;
  };
}