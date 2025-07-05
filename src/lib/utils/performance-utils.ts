/**
 * Performance Utilities
 * 
 * Simple performance monitoring and profiling tools
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