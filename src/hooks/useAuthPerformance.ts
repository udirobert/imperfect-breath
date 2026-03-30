/**
 * Auth Performance Monitoring Hook
 * 
 * PERFORMANT: Tracks auth performance metrics
 * CLEAN: Centralized performance monitoring
 * ORGANIZED: Structured performance data collection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { development } from '@/config/environment';

interface AuthPerformanceMetrics {
  authFlowStartTime: number | null;
  methodSelectionTime: number | null;
  authCompletionTime: number | null;
  totalAuthTime: number | null;
  componentLoadTimes: Record<string, number>;
  lazyLoadTimes: Record<string, number>;
  methodSwitchCount: number;
  errorCount: number;
  retryCount: number;
  isSlowConnection: boolean;
  shouldOptimize: boolean;
}

interface PerformanceEvent {
  type: 'auth_start' | 'method_select' | 'component_load' | 'auth_complete' | 'error' | 'retry';
  timestamp: number;
  data?: unknown;
}

const DEFAULT_METRICS: AuthPerformanceMetrics = {
  authFlowStartTime: null,
  methodSelectionTime: null,
  authCompletionTime: null,
  totalAuthTime: null,
  componentLoadTimes: {},
  lazyLoadTimes: {},
  methodSwitchCount: 0,
  errorCount: 0,
  retryCount: 0,
  isSlowConnection: false,
  shouldOptimize: false,
};

export const useAuthPerformance = () => {
  const [metrics, setMetrics] = useState<AuthPerformanceMetrics>(DEFAULT_METRICS);
  const [events, setEvents] = useState<PerformanceEvent[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const connection = (navigator as { connection?: { effectiveType?: string; downlink?: number } }).connection;
    if (connection) {
      const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                              connection.effectiveType === '2g' ||
                              (connection.downlink !== undefined && connection.downlink < 1);
      setMetrics(prev => ({ ...prev, isSlowConnection }));
    }
  }, []);

  const addEvent = useCallback((type: PerformanceEvent['type'], data?: unknown) => {
    const event: PerformanceEvent = {
      type,
      timestamp: performance.now(),
      data,
    };
    setEvents(prev => [...prev, event]);
    if (development.debugMode) {
      console.log(`[Auth Performance] ${type}:`, event);
    }
  }, []);

  const startAuthFlow = useCallback(() => {
    if (startTimeRef.current !== null) {
      return;
    }
    startTimeRef.current = performance.now();
    setMetrics(prev => ({
      ...prev,
      authFlowStartTime: startTimeRef.current!,
    }));
    addEvent('auth_start');
  }, [addEvent]);

  const trackMethodSelection = useCallback((method: string) => {
    const now = performance.now();
    const selectionTime = startTimeRef.current ? now - startTimeRef.current : 0;
    setMetrics(prev => ({
      ...prev,
      methodSelectionTime: selectionTime,
      methodSwitchCount: prev.methodSwitchCount + 1,
    }));
    addEvent('method_select', { method, selectionTime });
  }, [addEvent]);

  const trackComponentLoad = useCallback((componentName: string, loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      componentLoadTimes: {
        ...prev.componentLoadTimes,
        [componentName]: loadTime,
      },
    }));
    addEvent('component_load', { componentName, loadTime });
  }, [addEvent]);

  const trackLazyLoad = useCallback((componentName: string) => {
    const startTime = performance.now();
    return () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        lazyLoadTimes: {
          ...prev.lazyLoadTimes,
          [componentName]: loadTime,
        },
      }));
      addEvent('component_load', { componentName, loadTime, lazy: true });
    };
  }, [addEvent]);

  const completeAuthFlow = useCallback((success: boolean, method?: string) => {
    const now = performance.now();
    const totalTime = startTimeRef.current ? now - startTimeRef.current : 0;
    setMetrics(prev => ({
      ...prev,
      authCompletionTime: now,
      totalAuthTime: totalTime,
    }));
    addEvent('auth_complete', { success, method, totalTime });
    startTimeRef.current = null;
  }, [addEvent]);

  const trackError = useCallback((error: string, context?: string) => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
    }));
    addEvent('error', { error, context });
  }, [addEvent]);

  const trackRetry = useCallback((method: string, attempt: number) => {
    setMetrics(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));
    addEvent('retry', { method, attempt });
  }, [addEvent]);

  const getPerformanceSummary = useCallback(() => {
    const avgComponentLoadTime = Object.values(metrics.componentLoadTimes)
      .reduce((sum, time) => sum + time, 0) / Object.keys(metrics.componentLoadTimes).length || 0;
    const avgLazyLoadTime = Object.values(metrics.lazyLoadTimes)
      .reduce((sum, time) => sum + time, 0) / Object.keys(metrics.lazyLoadTimes).length || 0;
    return {
      totalAuthTime: metrics.totalAuthTime,
      avgComponentLoadTime,
      avgLazyLoadTime,
      methodSwitchCount: metrics.methodSwitchCount,
      errorCount: metrics.errorCount,
      retryCount: metrics.retryCount,
      isSlowConnection: metrics.isSlowConnection,
      shouldOptimize: metrics.totalAuthTime ? metrics.totalAuthTime > 5000 : false,
      events: events.length,
    };
  }, [metrics, events]);

  const getOptimizationRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    if (metrics.totalAuthTime && metrics.totalAuthTime > 5000) {
      recommendations.push('Consider preloading wallet components');
    }
    if (metrics.methodSwitchCount > 3) {
      recommendations.push('Consider showing preferred method first');
    }
    if (metrics.errorCount > 2) {
      recommendations.push('Improve error handling and user guidance');
    }
    if (metrics.isSlowConnection) {
      recommendations.push('Enable aggressive lazy loading for slow connections');
    }
    const avgLazyLoadTime = Object.values(metrics.lazyLoadTimes)
      .reduce((sum, time) => sum + time, 0) / Object.keys(metrics.lazyLoadTimes).length || 0;
    if (avgLazyLoadTime > 2000) {
      recommendations.push('Optimize lazy loading bundle sizes');
    }
    return recommendations;
  }, [metrics]);

  const resetMetrics = useCallback(() => {
    setMetrics(DEFAULT_METRICS);
    setEvents([]);
    startTimeRef.current = null;
  }, []);

  return {
    metrics,
    events,
    startAuthFlow,
    trackMethodSelection,
    trackComponentLoad,
    trackLazyLoad,
    completeAuthFlow,
    trackError,
    trackRetry,
    resetMetrics,
    getPerformanceSummary,
    getOptimizationRecommendations,
    isSlowConnection: metrics.isSlowConnection,
    shouldOptimize: metrics.shouldOptimize,
  };
};
