/**
 * Streaming Metrics Display Component
 * Shows real-time and historical streaming performance metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Wifi,
  Server,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { streamingMetricsManager, type StreamingMetrics } from '@/lib/ai/streaming-metrics';

interface StreamingMetricsDisplayProps {
  sessionId?: string;
  showHistorical?: boolean;
  compact?: boolean;
}

export const StreamingMetricsDisplay: React.FC<StreamingMetricsDisplayProps> = ({
  sessionId,
  showHistorical = false,
  compact = false
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<Partial<StreamingMetrics> | null>(null);
  const [historicalMetrics, setHistoricalMetrics] = useState<StreamingMetrics[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateMetrics = () => {
      if (sessionId) {
        const collector = streamingMetricsManager.getCollector(sessionId);
        if (collector) {
          setCurrentMetrics(collector.getCurrentMetrics());
        }
      }

      if (showHistorical) {
        setHistoricalMetrics(streamingMetricsManager.getHistoricalMetrics(10));
        setAggregatedStats(streamingMetricsManager.getAggregatedStats());
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [sessionId, showHistorical, refreshKey]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getPerformanceGrade = (metrics: StreamingMetrics): { grade: string; color: string } => {
    const collector = streamingMetricsManager.getCollector('temp');
    if (!collector) return { grade: 'N/A', color: 'gray' };
    
    // Create temporary collector to get performance summary
    const tempCollector = streamingMetricsManager.createCollector('temp');
    Object.assign(tempCollector, { metrics });
    const summary = tempCollector.getPerformanceSummary();
    
    const colorMap = {
      'A': 'green',
      'B': 'blue',
      'C': 'yellow',
      'D': 'orange',
      'F': 'red'
    };

    return {
      grade: summary.grade,
      color: colorMap[summary.grade] || 'gray'
    };
  };

  if (compact && currentMetrics) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Wifi className="h-4 w-4" />
        <span>{formatBytes(currentMetrics.totalBytesReceived || 0)}</span>
        <span>•</span>
        <span>{formatBytes(currentMetrics.throughputBytesPerSecond || 0)}/s</span>
        {currentMetrics.errorCount && currentMetrics.errorCount > 0 && (
          <>
            <span>•</span>
            <Badge variant="destructive" className="text-xs">
              {currentMetrics.errorCount} errors
            </Badge>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Streaming Performance
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey(prev => prev + 1)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Session</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Connection Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Connection Time:</span>
                      <span>{formatDuration(currentMetrics.connectionTime || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>First Byte:</span>
                      <span>{formatDuration(currentMetrics.firstByteTime || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Provider:</span>
                      <Badge variant="outline">{currentMetrics.provider}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Throughput Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Throughput
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Speed:</span>
                      <span>{formatBytes(currentMetrics.throughputBytesPerSecond || 0)}/s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Data:</span>
                      <span>{formatBytes(currentMetrics.totalBytesReceived || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Chunks:</span>
                      <span>{currentMetrics.chunksReceived || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Quality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Latency:</span>
                      <span>{formatDuration(currentMetrics.latency || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Jitter:</span>
                      <span>{formatDuration(currentMetrics.jitter || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Errors:</span>
                      <span className={currentMetrics.errorCount && currentMetrics.errorCount > 0 ? 'text-red-500' : 'text-green-500'}>
                        {currentMetrics.errorCount || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active streaming session</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          {aggregatedStats && historicalMetrics.length > 0 ? (
            <>
              {/* Aggregated Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{aggregatedStats.totalSessions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Throughput</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatBytes(aggregatedStats.averageThroughput)}/s
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatDuration(aggregatedStats.averageLatency)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {(100 - aggregatedStats.averageErrorRate).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Recent Sessions</CardTitle>
                  <CardDescription>Last 10 streaming sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {historicalMetrics.map((metrics, index) => {
                      const { grade, color } = getPerformanceGrade(metrics);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`text-${color}-600 border-${color}-200`}>
                              {grade}
                            </Badge>
                            <span className="text-sm font-medium">{metrics.provider}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(metrics.totalDuration)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span>{formatBytes(metrics.throughputBytesPerSecond)}/s</span>
                            {metrics.errorCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {metrics.errorCount} errors
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Provider Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Provider Performance</CardTitle>
                  <CardDescription>Performance comparison by AI provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(aggregatedStats.providerStats).map(([provider, stats]: [string, any]) => (
                      <div key={provider} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{provider}</span>
                          <span className="text-sm text-muted-foreground">
                            {stats.sessions} sessions
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Avg Throughput: </span>
                            <span>{formatBytes(stats.avgThroughput)}/s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Error Rate: </span>
                            <span className={stats.avgErrorRate > 5 ? 'text-red-500' : 'text-green-500'}>
                              {stats.avgErrorRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No historical data available</p>
                  <p className="text-sm">Complete some streaming sessions to see analytics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};