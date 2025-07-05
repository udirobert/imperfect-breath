import type { IPerformanceMonitor, PerformanceMetrics } from './types';

export class PerformanceMonitor implements IPerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];
  
  // Performance tracking
  private frameCount = 0;
  private droppedFrames = 0;
  private lastFrameTime = 0;
  private cpuUsageHistory: number[] = [];
  private memoryUsageHistory: number[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.resetCounters();
    
    // Monitor every 2 seconds
    this.monitoringInterval = setInterval(async () => {
      const metrics = await this.getCurrentMetrics();
      this.notifyCallbacks(metrics);
    }, 2000);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const [cpuUsage, memoryUsage, frameRate, batteryImpact] = await Promise.all([
      this.estimateCPUUsage(),
      this.getMemoryUsage(),
      this.calculateFrameRate(),
      this.estimateBatteryImpact()
    ]);

    return {
      cpuUsage,
      memoryUsage,
      frameRate,
      frameDrops: this.droppedFrames,
      batteryImpact,
      thermalState: await this.estimateThermalState()
    };
  }

  onPerformanceChange(callback: (metrics: PerformanceMetrics) => void): void {
    this.callbacks.push(callback);
  }

  // Frame tracking methods
  recordFrame(): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const timeDiff = now - this.lastFrameTime;
      const expectedFrameTime = 1000 / 30; // Assuming 30 FPS target
      
      if (timeDiff > expectedFrameTime * 1.5) {
        this.droppedFrames++;
      }
    }
    
    this.frameCount++;
    this.lastFrameTime = now;
  }

  recordDroppedFrame(): void {
    this.droppedFrames++;
  }

  private async estimateCPUUsage(): Promise<number> {
    // Use performance timing to estimate CPU usage
    const start = performance.now();
    
    // Perform a small computational task
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += Math.random();
    }
    
    const end = performance.now();
    const executionTime = end - start;
    
    // Normalize to a 0-100 scale (this is a rough estimate)
    const cpuUsage = Math.min((executionTime / 10) * 100, 100);
    
    // Keep history for smoothing
    this.cpuUsageHistory.push(cpuUsage);
    if (this.cpuUsageHistory.length > 10) {
      this.cpuUsageHistory.shift();
    }
    
    // Return smoothed average
    return this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const totalMB = memory.totalJSHeapSize / (1024 * 1024);
      
      const usage = (usedMB / totalMB) * 100;
      
      // Keep history for smoothing
      this.memoryUsageHistory.push(usage);
      if (this.memoryUsageHistory.length > 10) {
        this.memoryUsageHistory.shift();
      }
      
      return this.memoryUsageHistory.reduce((a, b) => a + b, 0) / this.memoryUsageHistory.length;
    }
    
    return 0; // Memory API not available
  }

  private calculateFrameRate(): number {
    const timeWindow = 2000; // 2 seconds
    const expectedFrames = (timeWindow / 1000) * 30; // Assuming 30 FPS target
    const actualFrames = this.frameCount;
    
    // Reset counter for next measurement
    this.frameCount = 0;
    
    return Math.min((actualFrames / expectedFrames) * 30, 30);
  }

  private async estimateBatteryImpact(): Promise<number> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        
        // Estimate impact based on discharge rate and current usage
        if (battery.dischargingTime && battery.dischargingTime < Infinity) {
          // Higher discharge rate = higher impact
          const normalDischargeTime = 8 * 60 * 60; // 8 hours normal
          const impact = Math.max(0, Math.min(100, 
            ((normalDischargeTime - battery.dischargingTime) / normalDischargeTime) * 100
          ));
          return impact;
        }
      }
    } catch {
      // Battery API not supported
    }
    
    // Fallback: estimate based on CPU and memory usage
    const cpuUsage = this.cpuUsageHistory[this.cpuUsageHistory.length - 1] || 0;
    const memoryUsage = this.memoryUsageHistory[this.memoryUsageHistory.length - 1] || 0;
    
    return (cpuUsage * 0.7 + memoryUsage * 0.3);
  }

  private async estimateThermalState(): Promise<string> {
    // This is a heuristic approach since thermal APIs aren't widely available
    const cpuUsage = this.cpuUsageHistory[this.cpuUsageHistory.length - 1] || 0;
    const batteryImpact = await this.estimateBatteryImpact();
    
    if (cpuUsage > 90 || batteryImpact > 80) {
      return 'critical';
    } else if (cpuUsage > 70 || batteryImpact > 60) {
      return 'serious';
    } else if (cpuUsage > 50 || batteryImpact > 40) {
      return 'fair';
    }
    
    return 'nominal';
  }

  private resetCounters(): void {
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = 0;
    this.cpuUsageHistory = [];
    this.memoryUsageHistory = [];
  }

  private notifyCallbacks(metrics: PerformanceMetrics): void {
    this.callbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in performance callback:', error);
      }
    });
  }

  // Utility methods for external components
  getAverageFrameRate(windowSize: number = 10): number {
    // This would require more sophisticated tracking
    // For now, return the last calculated frame rate
    return this.calculateFrameRate();
  }

  isPerformanceGood(): boolean {
    const lastCpuUsage = this.cpuUsageHistory[this.cpuUsageHistory.length - 1] || 0;
    const lastMemoryUsage = this.memoryUsageHistory[this.memoryUsageHistory.length - 1] || 0;
    
    return lastCpuUsage < 70 && lastMemoryUsage < 80 && this.droppedFrames < 5;
  }

  getPerformanceScore(): number {
    const lastCpuUsage = this.cpuUsageHistory[this.cpuUsageHistory.length - 1] || 0;
    const lastMemoryUsage = this.memoryUsageHistory[this.memoryUsageHistory.length - 1] || 0;
    const frameDropRatio = this.droppedFrames / Math.max(this.frameCount, 1);
    
    // Calculate composite score (0-100, higher is better)
    const cpuScore = Math.max(0, 100 - lastCpuUsage);
    const memoryScore = Math.max(0, 100 - lastMemoryUsage);
    const frameScore = Math.max(0, 100 - (frameDropRatio * 100));
    
    return (cpuScore * 0.4 + memoryScore * 0.3 + frameScore * 0.3);
  }
}
