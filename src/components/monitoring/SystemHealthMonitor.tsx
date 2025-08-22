/**
 * System Health Monitor
 *
 * Provides real-time visibility into backend service health and connectivity.
 * Useful for development and production monitoring.
 */

import React, { useState, useEffect } from "react";
import { api, apiClient } from "../../lib/api/unified-client";
import { development } from "../../config/environment";

interface ServiceHealth {
  name: string;
  healthy: boolean;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

interface SystemHealthProps {
  showInDevelopment?: boolean;
  compact?: boolean;
  onHealthChange?: (health: Record<string, boolean>) => void;
}

export const SystemHealthMonitor: React.FC<SystemHealthProps> = ({
  showInDevelopment = true,
  compact = false,
  onHealthChange,
}) => {
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Don't show in production unless explicitly enabled
  const shouldShow = development.debugMode || showInDevelopment;

  const checkSystemHealth = async () => {
    if (isChecking) return;

    setIsChecking(true);

    try {
      const startTime = Date.now();

      // Use the unified API client for real health checks
      const health = await api.health();
      const endTime = Date.now();

      const healthArray: ServiceHealth[] = Object.entries(health).map(
        ([name, healthy]) => ({
          name,
          healthy,
          lastCheck: new Date(),
          responseTime: endTime - startTime,
        })
      );

      setServiceHealth(healthArray);
      setLastUpdate(new Date());

      // Notify parent component
      if (onHealthChange) {
        onHealthChange(health);
      }
    } catch (error) {
      console.error("Health check failed:", error);

      // Update with error state
      const errorHealth: ServiceHealth[] = [
        "ai",
        "vision",
        "social",
        "flow",
        "lens",
      ].map((name) => ({
        name,
        healthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      }));

      setServiceHealth(errorHealth);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-refresh health status
  useEffect(() => {
    if (!shouldShow) return;

    checkSystemHealth();

    const interval = setInterval(checkSystemHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const getServiceIcon = (service: ServiceHealth) => {
    if (isChecking) {
      return (
        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
      );
    }

    return (
      <div
        className={`w-3 h-3 rounded-full ${
          service.healthy ? "bg-green-500" : "bg-red-500"
        }`}
        title={service.error || (service.healthy ? "Healthy" : "Unhealthy")}
      />
    );
  };

  const getServiceDisplayName = (name: string) => {
    const displayNames: Record<string, string> = {
      ai: "AI Analysis",
      vision: "Computer Vision",
      social: "Social/Lens",
      flow: "Flow Blockchain",
      lens: "Lens Protocol",
    };
    return displayNames[name] || name;
  };

  if (compact) {
    const healthyCount = serviceHealth.filter((s) => s.healthy).length;
    const totalCount = serviceHealth.length;

    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="flex space-x-1">
          {serviceHealth.map((service) => (
            <div key={service.name} className="relative group">
              {getServiceIcon(service)}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {getServiceDisplayName(service.name)}:{" "}
                {service.healthy ? "Healthy" : "Unhealthy"}
                {service.responseTime && ` (${service.responseTime}ms)`}
              </div>
            </div>
          ))}
        </div>
        <span>
          {healthyCount}/{totalCount} services healthy
        </span>
        <button
          onClick={checkSystemHealth}
          disabled={isChecking}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {isChecking ? "Checking..." : "Refresh"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated:{" "}
            {lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"}
          </span>
          <button
            onClick={checkSystemHealth}
            disabled={isChecking}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? "Checking..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {serviceHealth.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div className="flex items-center space-x-3">
              {getServiceIcon(service)}
              <span className="font-medium">
                {getServiceDisplayName(service.name)}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {service.responseTime && <span>{service.responseTime}ms</span>}
              <span>{service.healthy ? "Healthy" : "Unhealthy"}</span>
              {service.error && (
                <span className="text-red-600 text-xs" title={service.error}>
                  Error
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {serviceHealth.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          <p>No health data available</p>
          <button
            onClick={checkSystemHealth}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Run health check
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for monitoring system health
 */
export const useSystemHealth = () => {
  const [health, setHealth] = useState<Record<string, boolean>>({});
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Use unified API client for real health checks
        const healthStatus = await api.health();
        setHealth(healthStatus);

        // Check if all critical services are healthy
        const criticalServices = ["ai", "social"]; // Services critical for basic functionality
        const criticalHealthy = criticalServices.every(
          (service) => healthStatus[service]
        );
        setIsHealthy(criticalHealthy);
      } catch (error) {
        console.error("Health check failed:", error);
        setIsHealthy(false);
        // Set all services as unhealthy on error
        setHealth({
          ai: false,
          vision: false,
          social: false,
          flow: false,
          lens: false,
        });
      }
    };

    checkHealth();

    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    health,
    isHealthy,
    hasVisionService: health.vision || false,
    hasFlowService: health.flow || false,
    hasLensService: health.lens || false,
  };
};

export default SystemHealthMonitor;
