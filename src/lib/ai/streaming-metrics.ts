/**
 * Streaming Performance Metrics and Monitoring System
 * Provides comprehensive metrics collection and analysis for AI streaming operations
 */

export interface StreamingMetrics {
  // Connection metrics
  connectionTime: number;
  firstByteTime: number;
  totalDuration: number;
  
  // Data transfer metrics
  totalBytesReceived: number;
  chunksReceived: number;
  averageChunkSize: number;
  throughputBytesPerSecond: number;
  
  // Performance metrics
  latency: number;
  jitter: number;
  packetLoss: number;
  
  // Error metrics
  retryCount: number;
  errorCount: number;
  timeoutCount: number;
  
  // Quality metrics
  completionRate: number;
  streamStability: number;
  
  // Provider metrics
  provider: string;
  endpoint: string;
  
  // Timestamps
  startTime: number;
  endTime: number;
  
  // Additional context
  sessionId?: string;
  userId?: string;
}

export interface StreamingEvent {
  type: 'connection_start' | 'first_byte' | 'chunk_received' | 'error' | 'timeout' | 'retry' | 'connection_end';
  timestamp: number;
  data?: any;
  error?: string;
}

export class StreamingMetricsCollector {
  private metrics: Partial<StreamingMetrics> = {};
  private events: StreamingEvent[] = [];
  private chunkSizes: number[] = [];
  private chunkTimestamps: number[] = [];
  private isCollecting = false;

  constructor(
    private sessionId?: string,
    private userId?: string,
    private provider?: string,
    private endpoint?: string
  ) {
    this.reset();
  }

  /**
   * Reset metrics for a new streaming session
   */
  reset(): void {
    this.metrics = {
      connectionTime: 0,
      firstByteTime: 0,
      totalDuration: 0,
      totalBytesReceived: 0,
      chunksReceived: 0,
      averageChunkSize: 0,
      throughputBytesPerSecond: 0,
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      retryCount: 0,
      errorCount: 0,
      timeoutCount: 0,
      completionRate: 0,
      streamStability: 0,
      provider: this.provider || 'unknown',
      endpoint: this.endpoint || 'unknown',
      startTime: 0,
      endTime: 0,
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.events = [];
    this.chunkSizes = [];
    this.chunkTimestamps = [];
    this.isCollecting = false;
  }

  /**
   * Start collecting metrics for a streaming session
   */
  startCollection(): void {
    this.isCollecting = true;
    this.metrics.startTime = Date.now();
    this.addEvent('connection_start');
  }

  /**
   * Record connection established
   */
  recordConnectionEstablished(): void {
    if (!this.isCollecting) return;
    
    const now = Date.now();
    this.metrics.connectionTime = now - (this.metrics.startTime || now);
    this.addEvent('connection_start', { connectionTime: this.metrics.connectionTime });
  }

  /**
   * Record first byte received
   */
  recordFirstByte(): void {
    if (!this.isCollecting) return;
    
    const now = Date.now();
    this.metrics.firstByteTime = now - (this.metrics.startTime || now);
    this.addEvent('first_byte', { firstByteTime: this.metrics.firstByteTime });
  }

  /**
   * Record chunk received
   */
  recordChunkReceived(chunkSize: number): void {
    if (!this.isCollecting) return;
    
    const now = Date.now();
    this.metrics.chunksReceived = (this.metrics.chunksReceived || 0) + 1;
    this.metrics.totalBytesReceived = (this.metrics.totalBytesReceived || 0) + chunkSize;
    
    this.chunkSizes.push(chunkSize);
    this.chunkTimestamps.push(now);
    
    // Calculate average chunk size
    this.metrics.averageChunkSize = this.metrics.totalBytesReceived / this.metrics.chunksReceived;
    
    // Calculate throughput
    const duration = (now - (this.metrics.startTime || now)) / 1000; // Convert to seconds
    if (duration > 0) {
      this.metrics.throughputBytesPerSecond = this.metrics.totalBytesReceived / duration;
    }
    
    // Calculate jitter (variation in chunk timing)
    if (this.chunkTimestamps.length > 1) {
      const intervals = [];
      for (let i = 1; i < this.chunkTimestamps.length; i++) {
        intervals.push(this.chunkTimestamps[i] - this.chunkTimestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      this.metrics.jitter = Math.sqrt(variance);
    }
    
    this.addEvent('chunk_received', { 
      chunkSize, 
      totalBytes: this.metrics.totalBytesReceived,
      throughput: this.metrics.throughputBytesPerSecond 
    });
  }

  /**
   * Record error occurrence
   */
  recordError(error: string): void {
    if (!this.isCollecting) return;
    
    this.metrics.errorCount = (this.metrics.errorCount || 0) + 1;
    this.addEvent('error', { error });
  }

  /**
   * Record timeout occurrence
   */
  recordTimeout(): void {
    if (!this.isCollecting) return;
    
    this.metrics.timeoutCount = (this.metrics.timeoutCount || 0) + 1;
    this.addEvent('timeout');
  }

  /**
   * Record retry attempt
   */
  recordRetry(): void {
    if (!this.isCollecting) return;
    
    this.metrics.retryCount = (this.metrics.retryCount || 0) + 1;
    this.addEvent('retry', { retryCount: this.metrics.retryCount });
  }

  /**
   * End collection and finalize metrics
   */
  endCollection(completed: boolean = true): StreamingMetrics {
    if (!this.isCollecting) return this.metrics as StreamingMetrics;
    
    this.isCollecting = false;
    this.metrics.endTime = Date.now();
    this.metrics.totalDuration = this.metrics.endTime - (this.metrics.startTime || this.metrics.endTime);
    
    // Calculate completion rate
    this.metrics.completionRate = completed ? 100 : 0;
    
    // Calculate stream stability (inverse of error rate)
    const totalEvents = this.metrics.chunksReceived || 1;
    const errorEvents = (this.metrics.errorCount || 0) + (this.metrics.timeoutCount || 0);
    this.metrics.streamStability = Math.max(0, 100 - (errorEvents / totalEvents) * 100);
    
    // Calculate latency (average time between chunks)
    if (this.chunkTimestamps.length > 1) {
      const intervals = [];
      for (let i = 1; i < this.chunkTimestamps.length; i++) {
        intervals.push(this.chunkTimestamps[i] - this.chunkTimestamps[i - 1]);
      }
      this.metrics.latency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }
    
    this.addEvent('connection_end', { 
      completed,
      totalDuration: this.metrics.totalDuration,
      completionRate: this.metrics.completionRate 
    });
    
    return this.metrics as StreamingMetrics;
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics(): Partial<StreamingMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get all recorded events
   */
  getEvents(): StreamingEvent[] {
    return [...this.events];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check connection time
    if ((this.metrics.connectionTime || 0) > 5000) {
      issues.push('Slow connection establishment');
      recommendations.push('Check network connectivity and server response time');
      score -= 15;
    }

    // Check first byte time
    if ((this.metrics.firstByteTime || 0) > 3000) {
      issues.push('High time to first byte');
      recommendations.push('Optimize server processing or use edge caching');
      score -= 10;
    }

    // Check throughput
    if ((this.metrics.throughputBytesPerSecond || 0) < 1000) {
      issues.push('Low throughput');
      recommendations.push('Check bandwidth limitations or server capacity');
      score -= 20;
    }

    // Check error rate
    const errorRate = ((this.metrics.errorCount || 0) + (this.metrics.timeoutCount || 0)) / Math.max(1, this.metrics.chunksReceived || 1);
    if (errorRate > 0.1) {
      issues.push('High error rate');
      recommendations.push('Investigate network stability and server reliability');
      score -= 25;
    }

    // Check jitter
    if ((this.metrics.jitter || 0) > 1000) {
      issues.push('High jitter (inconsistent timing)');
      recommendations.push('Check for network congestion or server load issues');
      score -= 10;
    }

    // Check retry count
    if ((this.metrics.retryCount || 0) > 3) {
      issues.push('Frequent retries required');
      recommendations.push('Improve connection stability and error handling');
      score -= 15;
    }

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      grade,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  private addEvent(type: StreamingEvent['type'], data?: any, error?: string): void {
    this.events.push({
      type,
      timestamp: Date.now(),
      data,
      error
    });
  }
}

/**
 * Global metrics manager for tracking streaming performance across sessions
 */
export class StreamingMetricsManager {
  private static instance: StreamingMetricsManager;
  private collectors: Map<string, StreamingMetricsCollector> = new Map();
  private historicalMetrics: StreamingMetrics[] = [];

  static getInstance(): StreamingMetricsManager {
    if (!StreamingMetricsManager.instance) {
      StreamingMetricsManager.instance = new StreamingMetricsManager();
    }
    return StreamingMetricsManager.instance;
  }

  /**
   * Create a new metrics collector for a streaming session
   */
  createCollector(
    sessionId: string,
    userId?: string,
    provider?: string,
    endpoint?: string
  ): StreamingMetricsCollector {
    const collector = new StreamingMetricsCollector(sessionId, userId, provider, endpoint);
    this.collectors.set(sessionId, collector);
    return collector;
  }

  /**
   * Get collector for a session
   */
  getCollector(sessionId: string): StreamingMetricsCollector | undefined {
    return this.collectors.get(sessionId);
  }

  /**
   * Finalize and store metrics for a session
   */
  finalizeSession(sessionId: string, completed: boolean = true): StreamingMetrics | undefined {
    const collector = this.collectors.get(sessionId);
    if (!collector) return undefined;

    const metrics = collector.endCollection(completed);
    this.historicalMetrics.push(metrics);
    this.collectors.delete(sessionId);

    // Keep only last 100 sessions to prevent memory bloat
    if (this.historicalMetrics.length > 100) {
      this.historicalMetrics = this.historicalMetrics.slice(-100);
    }

    return metrics;
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(limit?: number): StreamingMetrics[] {
    return limit ? this.historicalMetrics.slice(-limit) : [...this.historicalMetrics];
  }

  /**
   * Get aggregated performance statistics
   */
  getAggregatedStats(): {
    averageThroughput: number;
    averageLatency: number;
    averageErrorRate: number;
    averageCompletionRate: number;
    totalSessions: number;
    providerStats: Record<string, { sessions: number; avgThroughput: number; avgErrorRate: number }>;
  } {
    if (this.historicalMetrics.length === 0) {
      return {
        averageThroughput: 0,
        averageLatency: 0,
        averageErrorRate: 0,
        averageCompletionRate: 0,
        totalSessions: 0,
        providerStats: {}
      };
    }

    const totalSessions = this.historicalMetrics.length;
    const providerStats: Record<string, { sessions: number; avgThroughput: number; avgErrorRate: number }> = {};

    let totalThroughput = 0;
    let totalLatency = 0;
    let totalErrorRate = 0;
    let totalCompletionRate = 0;

    for (const metrics of this.historicalMetrics) {
      totalThroughput += metrics.throughputBytesPerSecond;
      totalLatency += metrics.latency;
      totalCompletionRate += metrics.completionRate;
      
      const errorRate = ((metrics.errorCount + metrics.timeoutCount) / Math.max(1, metrics.chunksReceived)) * 100;
      totalErrorRate += errorRate;

      // Provider stats
      if (!providerStats[metrics.provider]) {
        providerStats[metrics.provider] = { sessions: 0, avgThroughput: 0, avgErrorRate: 0 };
      }
      providerStats[metrics.provider].sessions++;
      providerStats[metrics.provider].avgThroughput += metrics.throughputBytesPerSecond;
      providerStats[metrics.provider].avgErrorRate += errorRate;
    }

    // Calculate averages for provider stats
    for (const provider in providerStats) {
      const stats = providerStats[provider];
      stats.avgThroughput /= stats.sessions;
      stats.avgErrorRate /= stats.sessions;
    }

    return {
      averageThroughput: totalThroughput / totalSessions,
      averageLatency: totalLatency / totalSessions,
      averageErrorRate: totalErrorRate / totalSessions,
      averageCompletionRate: totalCompletionRate / totalSessions,
      totalSessions,
      providerStats
    };
  }
}

// Export singleton instance
export const streamingMetricsManager = StreamingMetricsManager.getInstance();