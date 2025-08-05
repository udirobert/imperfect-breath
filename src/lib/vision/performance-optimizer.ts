/**
 * Performance Optimizer for Vision System
 * Implements intelligent throttling, batching, and resource management
 */

import { startTimer, getMetrics } from '../utils/performance-utils';

interface OptimizationStrategy {
  name: string;
  condition: (metrics: PerformanceSnapshot) => boolean;
  apply: () => OptimizationResult;
}

interface PerformanceSnapshot {
  cpuUsage: number;
  memoryUsage: number;
  frameRate: number;
  processingTime: number;
  batteryLevel?: number;
  thermalState?: string;
}

interface OptimizationResult {
  strategy: string;
  changes: string[];
  expectedImprovement: number; // percentage
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private strategies: OptimizationStrategy[] = [];
  private currentOptimizations: Set<string> = new Set();
  private performanceHistory: PerformanceSnapshot[] = [];
  private readonly MAX_HISTORY = 30; // Keep 30 seconds of history

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize optimization strategies
   */
  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'aggressive-throttling',
        condition: (metrics) => metrics.cpuUsage > 80 || metrics.processingTime > 100,
        apply: () => ({
          strategy: 'aggressive-throttling',
          changes: ['Reduce processing frequency to 5 FPS', 'Skip intermediate frames'],
          expectedImprovement: 40
        })
      },
      {
        name: 'resolution-downscale',
        condition: (metrics) => metrics.cpuUsage > 70 && metrics.frameRate < 10,
        apply: () => ({
          strategy: 'resolution-downscale',
          changes: ['Reduce input resolution by 50%', 'Use bilinear downsampling'],
          expectedImprovement: 30
        })
      },
      {
        name: 'model-simplification',
        condition: (metrics) => metrics.memoryUsage > 85,
        apply: () => ({
          strategy: 'model-simplification',
          changes: ['Switch to lightweight model', 'Reduce landmark precision'],
          expectedImprovement: 25
        })
      },
      {
        name: 'background-processing',
        condition: (metrics) => metrics.cpuUsage > 60 && 'requestIdleCallback' in window,
        apply: () => ({
          strategy: 'background-processing',
          changes: ['Move processing to idle callbacks', 'Use Web Workers'],
          expectedImprovement: 20
        })
      },
      {
        name: 'thermal-throttling',
        condition: (metrics) => metrics.thermalState === 'critical' || metrics.thermalState === 'serious',
        apply: () => ({
          strategy: 'thermal-throttling',
          changes: ['Reduce processing frequency', 'Pause non-essential features'],
          expectedImprovement: 35
        })
      },
      {
        name: 'battery-conservation',
        condition: (metrics) => (metrics.batteryLevel || 100) < 20,
        apply: () => ({
          strategy: 'battery-conservation',
          changes: ['Minimal processing mode', 'Disable real-time feedback'],
          expectedImprovement: 50
        })
      }
    ];
  }

  /**
   * Analyze current performance and apply optimizations
   */
  public optimizePerformance(currentMetrics: PerformanceSnapshot): OptimizationResult[] {
    const endTimer = startTimer('performance-optimization');
    
    try {
      // Add to history
      this.performanceHistory.push(currentMetrics);
      if (this.performanceHistory.length > this.MAX_HISTORY) {
        this.performanceHistory.shift();
      }

      const results: OptimizationResult[] = [];
      
      // Check each strategy
      for (const strategy of this.strategies) {
        if (strategy.condition(currentMetrics) && !this.currentOptimizations.has(strategy.name)) {
          const result = strategy.apply();
          results.push(result);
          this.currentOptimizations.add(strategy.name);
          
          console.log(`Applied optimization strategy: ${strategy.name}`, result.changes);
        }
      }

      // Remove optimizations that are no longer needed
      this.removeUnnecessaryOptimizations(currentMetrics);

      return results;
      
    } finally {
      endTimer();
    }
  }

  /**
   * Remove optimizations that are no longer needed
   */
  private removeUnnecessaryOptimizations(currentMetrics: PerformanceSnapshot): void {
    const toRemove: string[] = [];
    
    for (const optimizationName of this.currentOptimizations) {
      const strategy = this.strategies.find(s => s.name === optimizationName);
      if (strategy && !strategy.condition(currentMetrics)) {
        // Check if performance has been stable for a while
        const recentMetrics = this.performanceHistory.slice(-5);
        const isStable = recentMetrics.every(m => !strategy.condition(m));
        
        if (isStable) {
          toRemove.push(optimizationName);
        }
      }
    }
    
    toRemove.forEach(name => {
      this.currentOptimizations.delete(name);
      console.log(`Removed optimization: ${name}`);
    });
  }

  /**
   * Get current optimization status
   */
  public getOptimizationStatus(): {
    activeOptimizations: string[];
    performanceTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  } {
    const trend = this.calculatePerformanceTrend();
    const recommendations = this.generateRecommendations();
    
    return {
      activeOptimizations: Array.from(this.currentOptimizations),
      performanceTrend: trend,
      recommendations
    };
  }

  /**
   * Calculate performance trend from history
   */
  private calculatePerformanceTrend(): 'improving' | 'stable' | 'declining' {
    if (this.performanceHistory.length < 5) return 'stable';
    
    const recent = this.performanceHistory.slice(-5);
    const older = this.performanceHistory.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, m) => sum + m.cpuUsage + m.memoryUsage, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.cpuUsage + m.memoryUsage, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 10) return 'declining';
    if (difference < -10) return 'improving';
    return 'stable';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const latest = this.performanceHistory[this.performanceHistory.length - 1];
    
    if (!latest) return recommendations;
    
    if (latest.cpuUsage > 80) {
      recommendations.push('Consider reducing video quality or frame rate');
    }
    
    if (latest.memoryUsage > 85) {
      recommendations.push('Close other browser tabs to free up memory');
    }
    
    if (latest.frameRate < 10) {
      recommendations.push('Enable frame skipping for smoother performance');
    }
    
    if (latest.processingTime > 100) {
      recommendations.push('Switch to a lighter vision model');
    }
    
    if (this.currentOptimizations.size === 0 && latest.cpuUsage < 50) {
      recommendations.push('Performance is good - consider enabling higher quality features');
    }
    
    return recommendations;
  }

  /**
   * Force apply specific optimization
   */
  public forceOptimization(strategyName: string): OptimizationResult | null {
    const strategy = this.strategies.find(s => s.name === strategyName);
    if (!strategy) return null;
    
    const result = strategy.apply();
    this.currentOptimizations.add(strategyName);
    
    return result;
  }

  /**
   * Remove specific optimization
   */
  public removeOptimization(strategyName: string): boolean {
    return this.currentOptimizations.delete(strategyName);
  }

  /**
   * Get performance metrics summary
   */
  public getPerformanceSummary(): {
    averageCPU: number;
    averageMemory: number;
    averageFrameRate: number;
    optimizationCount: number;
    uptimeSeconds: number;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        averageCPU: 0,
        averageMemory: 0,
        averageFrameRate: 0,
        optimizationCount: 0,
        uptimeSeconds: 0
      };
    }
    
    const history = this.performanceHistory;
    
    return {
      averageCPU: history.reduce((sum, m) => sum + m.cpuUsage, 0) / history.length,
      averageMemory: history.reduce((sum, m) => sum + m.memoryUsage, 0) / history.length,
      averageFrameRate: history.reduce((sum, m) => sum + m.frameRate, 0) / history.length,
      optimizationCount: this.currentOptimizations.size,
      uptimeSeconds: history.length // Assuming 1 second intervals
    };
  }

  /**
   * Reset all optimizations and history
   */
  public reset(): void {
    this.currentOptimizations.clear();
    this.performanceHistory = [];
    console.log('Performance optimizer reset');
  }
}