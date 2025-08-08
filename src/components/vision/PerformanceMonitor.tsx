/**
 * Performance Monitor Component
 * Real-time performance visualization for vision system
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Activity,
  Cpu,
  MemoryStick,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { PerformanceOptimizer } from "../../lib/vision/performance-optimizer";

interface PerformanceMonitorProps {
  isVisible?: boolean;
  compact?: boolean;
  performanceData?: {
    cpuUsage: number;
    memoryUsage: number;
    frameRate: number;
    processingTime: number;
    batteryLevel: number;
    thermalState: string;
  };
  onOptimizationChange?: (optimizations: string[]) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = true,
  compact = false,
  performanceData: externalPerformanceData,
  onOptimizationChange,
}) => {
  const [internalPerformanceData, setInternalPerformanceData] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    frameRate: 0,
    processingTime: 0,
    batteryLevel: 100,
    thermalState: "nominal" as string,
  });

  // Use external performance data if provided, otherwise don't show any data
  const performanceData = externalPerformanceData || null;

  // Check if we have real performance data to display
  const hasRealData =
    !!externalPerformanceData &&
    (externalPerformanceData.cpuUsage > 0 ||
      externalPerformanceData.memoryUsage > 0 ||
      externalPerformanceData.frameRate > 0);

  const [optimizationStatus, setOptimizationStatus] = useState({
    activeOptimizations: [] as string[],
    performanceTrend: "stable" as "improving" | "stable" | "declining",
    recommendations: [] as string[],
  });

  const [performanceSummary, setPerformanceSummary] = useState({
    averageCPU: 0,
    averageMemory: 0,
    averageFrameRate: 0,
    optimizationCount: 0,
    uptimeSeconds: 0,
  });

  const optimizer = PerformanceOptimizer.getInstance();

  // Accept actual performance data as props
  useEffect(() => {
    if (!isVisible) return;

    // Only use internal metrics if no external performance data is provided
    if (!externalPerformanceData) {
      // Don't show any data if no real performance data is available
      // This respects the user's preference to not show fake data
      return;
    }

    // Update optimization status based on real data
    const optimizations = optimizer.optimizePerformance(
      externalPerformanceData
    );
    const status = optimizer.getOptimizationStatus();
    const summary = optimizer.getPerformanceSummary();

    setOptimizationStatus(status);
    setPerformanceSummary(summary);

    // Notify parent of optimization changes
    if (onOptimizationChange && optimizations.length > 0) {
      onOptimizationChange(status.activeOptimizations);
    }
  }, [isVisible, externalPerformanceData, onOptimizationChange]);

  if (!isVisible || !performanceData) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (value: number, isInverted = false) => {
    if (isInverted) {
      // For metrics where higher is better (like frame rate)
      if (value > 70) return "text-green-600";
      if (value > 40) return "text-yellow-600";
      return "text-red-600";
    } else {
      // For metrics where lower is better (like CPU usage)
      if (value < 30) return "text-green-600";
      if (value < 70) return "text-yellow-600";
      return "text-red-600";
    }
  };

  const getProgressColor = (value: number, isInverted = false) => {
    if (isInverted) {
      if (value > 70) return "bg-green-500";
      if (value > 40) return "bg-yellow-500";
      return "bg-red-500";
    } else {
      if (value < 30) return "bg-green-500";
      if (value < 70) return "bg-yellow-500";
      return "bg-red-500";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-lg text-xs">
        <Activity className="h-3 w-3" />
        <span className={getPerformanceColor(performanceData.cpuUsage || 0)}>
          CPU: {Math.round(performanceData.cpuUsage || 0)}%
        </span>
        <span
          className={getPerformanceColor(performanceData.frameRate || 0, true)}
        >
          FPS: {Math.round(performanceData.frameRate || 0)}
        </span>
        {optimizationStatus.activeOptimizations.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {optimizationStatus.activeOptimizations.length} opts
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-800 flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Activity className="h-3 w-3 text-white" />
          </div>
          Performance Monitor
          {getTrendIcon(optimizationStatus.performanceTrend)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real-time Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                CPU
              </span>
              <span
                className={getPerformanceColor(performanceData.cpuUsage || 0)}
              >
                {Math.round(performanceData.cpuUsage || 0)}%
              </span>
            </div>
            <Progress value={performanceData.cpuUsage || 0} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" />
                Memory
              </span>
              <span
                className={getPerformanceColor(
                  performanceData.memoryUsage || 0
                )}
              >
                {Math.round(performanceData.memoryUsage || 0)}%
              </span>
            </div>
            <Progress
              value={performanceData.memoryUsage || 0}
              className="h-1"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                FPS
              </span>
              <span
                className={getPerformanceColor(
                  performanceData.frameRate || 0,
                  true
                )}
              >
                {Math.round(performanceData.frameRate || 0)}
              </span>
            </div>
            <Progress
              value={((performanceData.frameRate || 0) / 30) * 100}
              className="h-1"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Process
              </span>
              <span
                className={getPerformanceColor(
                  performanceData.processingTime || 0
                )}
              >
                {Math.round(performanceData.processingTime || 0)}ms
              </span>
            </div>
            <Progress
              value={Math.min(
                ((performanceData.processingTime || 0) / 200) * 100,
                100
              )}
              className="h-1"
            />
          </div>
        </div>

        {/* Active Optimizations */}
        {optimizationStatus.activeOptimizations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              Active Optimizations
            </div>
            <div className="flex flex-wrap gap-1">
              {optimizationStatus.activeOptimizations.map((opt) => (
                <Badge
                  key={opt}
                  variant="secondary"
                  className="text-xs bg-orange-100 text-orange-800"
                >
                  {opt.replace("-", " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {optimizationStatus.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">
              Recommendations
            </div>
            <div className="space-y-1">
              {optimizationStatus.recommendations
                .slice(0, 2)
                .map((rec, index) => (
                  <div
                    key={index}
                    className="text-xs text-gray-600 bg-blue-50 p-2 rounded"
                  >
                    {rec}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
          <div className="text-center">
            <div className="text-xs text-gray-500">Avg CPU</div>
            <div className="text-sm font-medium">
              {Math.round(performanceSummary.averageCPU)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Avg FPS</div>
            <div className="text-sm font-medium">
              {Math.round(performanceSummary.averageFrameRate)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Uptime</div>
            <div className="text-sm font-medium">
              {Math.floor(performanceSummary.uptimeSeconds / 60)}m
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
