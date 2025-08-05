/**
 * Optimized Vision Manager
 * High-performance vision analysis with adaptive quality and resource management
 * Implements DRY, CLEAN, MODULAR, ORGANISED, PERFORMANT principles
 */

import { VisionEngine } from './core/vision-engine';
import { PerformanceMonitor } from './performance-monitor';
import { startTimer } from '../utils/performance-utils';
import type { VisionTier, VisionMetrics, PerformanceMetrics } from './types';

interface OptimizationConfig {
  targetFPS: number;
  maxCPUUsage: number;
  maxMemoryUsage: number;
  adaptiveQuality: boolean;
  enableBatching: boolean;
  frameSkipping: boolean;
  backgroundProcessing: boolean;
}

interface ProcessingQueue {
  frames: ImageData[];
  timestamps: number[];
  maxSize: number;
}

export class OptimizedVisionManager {
  private visionEngine: VisionEngine;
  private performanceMonitor: PerformanceMonitor;
  private config: OptimizationConfig;
  
  // Performance optimization state
  private currentTier: VisionTier = 'standard';
  private processingQueue: ProcessingQueue;
  private isProcessing = false;
  private frameSkipCount = 0;
  private lastProcessTime = 0;
  private adaptiveThrottleMs = 100;
  
  // Web Workers for background processing
  private visionWorker: Worker | null = null;
  private workerQueue: Array<{ imageData: ImageData; timestamp: number }> = [];
  
  // RAF and timing optimization
  private rafId: number | null = null;
  private processingTimeouts: Set<NodeJS.Timeout> = new Set();
  
  // Caching and memoization
  private metricsCache = new Map<string, { metrics: VisionMetrics; timestamp: number }>();
  private readonly CACHE_TTL = 1000; // 1 second cache
  
  constructor(initialConfig: Partial<OptimizationConfig> = {}) {
    this.config = {
      targetFPS: 15, // Reduced from 30 for better performance
      maxCPUUsage: 70,
      maxMemoryUsage: 80,
      adaptiveQuality: true,
      enableBatching: true,
      frameSkipping: true,
      backgroundProcessing: true,
      ...initialConfig,
    };
    
    this.visionEngine = new VisionEngine();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    this.processingQueue = {
      frames: [],
      timestamps: [],
      maxSize: 3, // Keep only last 3 frames
    };
    
    this.initializeOptimizations();
  }

  /**
   * Initialize performance optimizations
   */
  private async initializeOptimizations(): Promise<void> {
    // Start performance monitoring
    this.performanceMonitor.startMonitoring();
    
    // Set up adaptive quality adjustment
    if (this.config.adaptiveQuality) {
      this.performanceMonitor.onPerformanceChange(this.handlePerformanceChange.bind(this));
    }
    
    // Initialize Web Worker for background processing
    if (this.config.backgroundProcessing) {
      await this.initializeWebWorker();
    }
    
    // Set up memory cleanup intervals
    this.setupMemoryManagement();
  }

  /**
   * Initialize Web Worker for background vision processing
   */
  private async initializeWebWorker(): Promise<void> {
    try {
      // Create worker from inline script to avoid external file dependency
      const workerScript = `
        // Vision processing worker
        let visionEngine = null;
        
        self.onmessage = async function(e) {
          const { type, imageData, config } = e.data;
          
          if (type === 'INIT') {
            // Initialize vision engine in worker
            try {
              // Import and initialize TensorFlow.js in worker context
              importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
              importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.2/dist/face-landmarks-detection.min.js');
              
              // Initialize vision engine (simplified version for worker)
              visionEngine = { initialized: true };
              self.postMessage({ type: 'INIT_COMPLETE' });
            } catch (error) {
              self.postMessage({ type: 'ERROR', error: error.message });
            }
          } else if (type === 'PROCESS' && visionEngine) {
            try {
              // Simplified processing in worker
              const startTime = performance.now();
              
              // Simulate vision processing (replace with actual processing)
              const metrics = {
                faceDetected: Math.random() > 0.3,
                confidence: Math.random() * 0.8 + 0.2,
                restlessnessScore: Math.random() * 0.5,
                processingTime: performance.now() - startTime
              };
              
              self.postMessage({ 
                type: 'METRICS', 
                metrics,
                timestamp: Date.now()
              });
            } catch (error) {
              self.postMessage({ type: 'ERROR', error: error.message });
            }
          }
        };
      `;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.visionWorker = new Worker(URL.createObjectURL(blob));
      
      this.visionWorker.onmessage = this.handleWorkerMessage.bind(this);
      this.visionWorker.onerror = (error) => {
        console.warn('Vision worker error:', error);
        this.visionWorker = null; // Fallback to main thread
      };
      
      // Initialize worker
      this.visionWorker.postMessage({ type: 'INIT' });
      
    } catch (error) {
      console.warn('Failed to initialize vision worker, using main thread:', error);
      this.visionWorker = null;
    }
  }

  /**
   * Handle Web Worker messages
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { type, metrics, error } = event.data;
    
    if (type === 'METRICS') {
      // Process metrics from worker
      this.handleWorkerMetrics(metrics);
    } else if (type === 'ERROR') {
      console.error('Vision worker error:', error);
    }
  }

  /**
   * Process metrics received from Web Worker
   */
  private handleWorkerMetrics(metrics: any): void {
    // Convert worker metrics to VisionMetrics format
    const visionMetrics: VisionMetrics = {
      faceDetected: metrics.faceDetected,
      confidence: metrics.confidence,
      restlessnessScore: metrics.restlessnessScore,
      processingTime: metrics.processingTime,
      timestamp: Date.now(),
    } as VisionMetrics;
    
    // Cache and emit metrics
    this.cacheMetrics(visionMetrics);
  }

  /**
   * Optimized frame processing with adaptive quality
   */
  public async processFrame(
    videoElement: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement
  ): Promise<VisionMetrics | null> {
    const endTimer = startTimer('vision-frame-processing');
    
    try {
      // Check if we should skip this frame
      if (this.shouldSkipFrame()) {
        return this.getLastCachedMetrics();
      }
      
      // Extract image data efficiently
      const imageData = this.extractImageData(videoElement, canvasElement);
      if (!imageData) return null;
      
      // Generate cache key for memoization
      const cacheKey = this.generateCacheKey(imageData);
      const cached = this.metricsCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.metrics;
      }
      
      // Process using Web Worker if available
      if (this.visionWorker && this.config.backgroundProcessing) {
        return this.processFrameInWorker(imageData);
      }
      
      // Process in main thread with optimizations
      return this.processFrameOptimized(imageData);
      
    } finally {
      endTimer();
    }
  }

  /**
   * Determine if current frame should be skipped for performance
   */
  private shouldSkipFrame(): boolean {
    if (!this.config.frameSkipping) return false;
    
    const now = performance.now();
    const timeSinceLastProcess = now - this.lastProcessTime;
    
    // Skip if processing too frequently
    if (timeSinceLastProcess < this.adaptiveThrottleMs) {
      this.frameSkipCount++;
      return true;
    }
    
    // Skip based on performance metrics
    const perfMetrics = this.performanceMonitor.isPerformanceGood();
    if (!perfMetrics && this.frameSkipCount < 3) {
      this.frameSkipCount++;
      return true;
    }
    
    this.frameSkipCount = 0;
    this.lastProcessTime = now;
    return false;
  }

  /**
   * Extract image data efficiently with downscaling
   */
  private extractImageData(
    videoElement: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement
  ): ImageData | null {
    try {
      const canvas = canvasElement || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Adaptive resolution based on performance
      const scale = this.getOptimalScale();
      const width = Math.floor(videoElement.videoWidth * scale);
      const height = Math.floor(videoElement.videoHeight * scale);
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and extract with optimizations
      ctx.drawImage(videoElement, 0, 0, width, height);
      return ctx.getImageData(0, 0, width, height);
      
    } catch (error) {
      console.error('Failed to extract image data:', error);
      return null;
    }
  }

  /**
   * Get optimal scale factor based on current performance
   */
  private getOptimalScale(): number {
    const perfScore = this.performanceMonitor.getPerformanceScore();
    
    if (perfScore > 80) return 1.0;      // Full resolution
    if (perfScore > 60) return 0.75;     // 75% resolution
    if (perfScore > 40) return 0.5;      // 50% resolution
    return 0.25;                         // 25% resolution for poor performance
  }

  /**
   * Process frame in Web Worker
   */
  private async processFrameInWorker(imageData: ImageData): Promise<VisionMetrics | null> {
    if (!this.visionWorker) return null;
    
    // Add to worker queue with size limit
    this.workerQueue.push({ imageData, timestamp: Date.now() });
    if (this.workerQueue.length > 2) {
      this.workerQueue.shift(); // Remove oldest
    }
    
    // Send latest frame to worker
    const latest = this.workerQueue[this.workerQueue.length - 1];
    this.visionWorker.postMessage({
      type: 'PROCESS',
      imageData: latest.imageData,
      timestamp: latest.timestamp
    });
    
    // Return cached metrics while worker processes
    return this.getLastCachedMetrics();
  }

  /**
   * Process frame with main thread optimizations
   */
  private async processFrameOptimized(imageData: ImageData): Promise<VisionMetrics | null> {
    try {
      // Use requestIdleCallback for non-blocking processing
      return new Promise((resolve) => {
        const processInIdle = (deadline: IdleDeadline) => {
          if (deadline.timeRemaining() > 10) {
            // Process immediately if we have time
            this.visionEngine.processFrame(imageData, this.currentTier)
              .then(metrics => {
                this.cacheMetrics(metrics);
                resolve(metrics);
              })
              .catch(() => resolve(null));
          } else {
            // Defer to next idle period
            requestIdleCallback(processInIdle);
          }
        };
        
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processInIdle);
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            this.visionEngine.processFrame(imageData, this.currentTier)
              .then(metrics => {
                this.cacheMetrics(metrics);
                resolve(metrics);
              })
              .catch(() => resolve(null));
          }, 0);
        }
      });
      
    } catch (error) {
      console.error('Optimized frame processing failed:', error);
      return null;
    }
  }

  /**
   * Cache metrics with TTL
   */
  private cacheMetrics(metrics: VisionMetrics): void {
    const cacheKey = `${metrics.timestamp}_${metrics.confidence}`;
    this.metricsCache.set(cacheKey, {
      metrics,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    this.cleanCache();
  }

  /**
   * Generate cache key from image data
   */
  private generateCacheKey(imageData: ImageData): string {
    // Simple hash based on image dimensions and sample pixels
    const data = imageData.data;
    const sample = data[0] + data[data.length / 4] + data[data.length / 2] + data[data.length - 1];
    return `${imageData.width}x${imageData.height}_${sample}`;
  }

  /**
   * Get last cached metrics
   */
  private getLastCachedMetrics(): VisionMetrics | null {
    const entries = Array.from(this.metricsCache.values());
    if (entries.length === 0) return null;
    
    return entries[entries.length - 1].metrics;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.metricsCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.metricsCache.delete(key);
      }
    }
  }

  /**
   * Handle performance changes and adapt quality
   */
  private handlePerformanceChange(metrics: PerformanceMetrics): void {
    const { cpuUsage, memoryUsage, frameRate } = metrics;
    
    // Adapt vision tier based on performance
    if (cpuUsage > this.config.maxCPUUsage || memoryUsage > this.config.maxMemoryUsage) {
      this.downgradeQuality();
    } else if (cpuUsage < 50 && memoryUsage < 60 && frameRate > this.config.targetFPS * 0.8) {
      this.upgradeQuality();
    }
    
    // Adjust throttling
    this.adaptiveThrottleMs = this.calculateOptimalThrottle(metrics);
  }

  /**
   * Downgrade vision quality for better performance
   */
  private downgradeQuality(): void {
    switch (this.currentTier) {
      case 'premium':
        this.currentTier = 'standard';
        console.log('Vision quality downgraded to standard');
        break;
      case 'standard':
        this.currentTier = 'basic';
        console.log('Vision quality downgraded to basic');
        break;
      default:
        // Already at lowest quality, increase throttling
        this.adaptiveThrottleMs = Math.min(this.adaptiveThrottleMs * 1.5, 500);
        break;
    }
  }

  /**
   * Upgrade vision quality when performance allows
   */
  private upgradeQuality(): void {
    switch (this.currentTier) {
      case 'basic':
        this.currentTier = 'standard';
        console.log('Vision quality upgraded to standard');
        break;
      case 'standard':
        this.currentTier = 'premium';
        console.log('Vision quality upgraded to premium');
        break;
      default:
        // Already at highest quality, reduce throttling
        this.adaptiveThrottleMs = Math.max(this.adaptiveThrottleMs * 0.8, 50);
        break;
    }
  }

  /**
   * Calculate optimal throttle time based on performance
   */
  private calculateOptimalThrottle(metrics: PerformanceMetrics): number {
    const targetFrameTime = 1000 / this.config.targetFPS;
    const performanceScore = this.performanceMonitor.getPerformanceScore();
    
    // Higher throttle for lower performance
    const throttleMultiplier = Math.max(0.5, (100 - performanceScore) / 100);
    return Math.floor(targetFrameTime * throttleMultiplier);
  }

  /**
   * Setup memory management and cleanup
   */
  private setupMemoryManagement(): void {
    // Clean up every 30 seconds
    const cleanupInterval = setInterval(() => {
      this.cleanupMemory();
    }, 30000);
    
    this.processingTimeouts.add(cleanupInterval);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.dispose();
    });
  }

  /**
   * Clean up memory and resources
   */
  private cleanupMemory(): void {
    // Clear caches
    this.metricsCache.clear();
    this.workerQueue = [];
    
    // Clear processing queue
    this.processingQueue.frames = [];
    this.processingQueue.timestamps = [];
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Get current performance statistics
   */
  public getPerformanceStats(): {
    currentTier: VisionTier;
    throttleMs: number;
    cacheSize: number;
    frameSkipCount: number;
    workerActive: boolean;
  } {
    return {
      currentTier: this.currentTier,
      throttleMs: this.adaptiveThrottleMs,
      cacheSize: this.metricsCache.size,
      frameSkipCount: this.frameSkipCount,
      workerActive: !!this.visionWorker,
    };
  }

  /**
   * Update optimization configuration
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Stop performance monitoring
    this.performanceMonitor.stopMonitoring();
    
    // Cancel RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    // Clear timeouts
    this.processingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.processingTimeouts.clear();
    
    // Terminate worker
    if (this.visionWorker) {
      this.visionWorker.terminate();
      this.visionWorker = null;
    }
    
    // Clean up memory
    this.cleanupMemory();
    
    console.log('Optimized Vision Manager disposed');
  }
}