/**
 * Enhanced System Health Monitor
 *
 * Provides real-time visibility into backend service health and connectivity.
 * Enhanced with service registry capabilities and detailed monitoring.
 */

import React, { useState, useEffect, useCallback } from "react";
import { api, apiClient } from "../../lib/api/unified-client";
import { development, config } from "../../config/environment";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Activity,
  Server,
  Clock,
  Zap,
} from "lucide-react";

interface ServiceHealth {
  name: string;
  healthy: boolean;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  uptime?: number;
  version?: string;
  endpoint?: string;
}

interface ServiceRegistry {
  registered: string[];
  health: Record<string, boolean>;
  lastUpdate: string;
  totalServices: number;
  healthyServices: number;
}

interface SystemHealthProps {
  showInDevelopment?: boolean;
  compact?: boolean;
  onHealthChange?: (health: Record<string, boolean>) => void;
  showServiceRegistry?: boolean;
  autoRefreshInterval?: number;
}

export const SystemHealthMonitor: React.FC<SystemHealthProps> = ({
  showInDevelopment = true,
  compact = false,
  onHealthChange,
  showServiceRegistry = true,
  autoRefreshInterval = 60000,
}) => {
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [serviceRegistry, setServiceRegistry] =
    useState<ServiceRegistry | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Don't show in production unless explicitly enabled
  const shouldShow = development.debugMode || showInDevelopment;

  const checkSystemHealth = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      const startTime = Date.now();

      // Get both health status and service registry information
      const healthPromise = Promise.race([
        api.health(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout")), 8000)
        ),
      ]) as Promise<Record<string, boolean>>;

      const statusPromise = Promise.race([
        api.status(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Status check timeout")), 8000)
        ),
      ]);

      const [health, status] = await Promise.all([
        healthPromise,
        statusPromise,
      ]);

      const endTime = Date.now();
      const totalResponseTime = endTime - startTime;

      // Process health data with enhanced information
      const healthArray: ServiceHealth[] = Object.entries(health).map(
        ([name, healthy]) => ({
          name,
          healthy,
          lastCheck: new Date(),
          responseTime: totalResponseTime / Object.keys(health).length, // Average response time
          endpoint: getServiceEndpoint(name),
          version: getServiceVersion(name),
        })
      );

      // Update service registry information
      const registryData: ServiceRegistry = {
        registered: (status as any)?.registered || Object.keys(health),
        health: health,
        lastUpdate: (status as any)?.timestamp || new Date().toISOString(),
        totalServices: Object.keys(health).length,
        healthyServices: Object.values(health).filter(Boolean).length,
      };

      setServiceHealth(healthArray);
      setServiceRegistry(registryData);
      setLastUpdate(new Date());

      // Notify parent component
      if (onHealthChange) {
        onHealthChange(health);
      }
    } catch (error) {
      console.error("Health check failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);

      // Update with error state for fallback services
      const fallbackServices = ["ai", "social", "vision", "flow", "lens"];
      const errorHealth: ServiceHealth[] = fallbackServices.map((name) => ({
        name,
        healthy: false,
        lastCheck: new Date(),
        error: errorMessage,
        endpoint: getServiceEndpoint(name),
      }));

      setServiceHealth(errorHealth);

      // Create error registry
      const errorRegistry: ServiceRegistry = {
        registered: fallbackServices,
        health: Object.fromEntries(
          fallbackServices.map((name) => [name, false])
        ),
        lastUpdate: new Date().toISOString(),
        totalServices: fallbackServices.length,
        healthyServices: 0,
      };

      setServiceRegistry(errorRegistry);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, onHealthChange]);

  // Helper functions
  const getServiceEndpoint = (serviceName: string): string => {
    const endpoints: Record<string, string> = {
      ai: config.services.ai.url.replace(/^https?:\/\//, ''),
      social: config.services.social.url.replace(/^https?:\/\//, ''),
      vision: config.services.vision.url.replace(/^https?:\/\//, ''),
      flow: "rest-testnet.onflow.org",
      lens: "api-v2.lens.dev",
    };
    return endpoints[serviceName] || "unknown";
  };

  const getServiceVersion = (serviceName: string): string => {
    // Could be enhanced to fetch actual versions
    const versions: Record<string, string> = {
      ai: "v1.0",
      social: "v1.0",
      vision: "v1.0",
      flow: "testnet",
      lens: "v2",
    };
    return versions[serviceName] || "unknown";
  };

  // Auto-refresh health status
  useEffect(() => {
    if (!shouldShow) return;

    checkSystemHealth();

    const interval = setInterval(checkSystemHealth, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [shouldShow, autoRefreshInterval, checkSystemHealth]);

  if (!shouldShow) {
    return null;
  }

  const getServiceIcon = (service: ServiceHealth) => {
    if (isChecking) {
      return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
    }

    if (service.healthy) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getServiceDisplayName = (name: string) => {
    const displayNames: Record<string, string> = {
      ai: "AI Analysis",
      vision: "Computer Vision",
      social: "Social/Lens",
      flow: "Flow Blockchain",
      lens: "Lens Protocol",
    };
    return displayNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getHealthPercentage = () => {
    if (!serviceRegistry) return 0;
    return Math.round(
      (serviceRegistry.healthyServices / serviceRegistry.totalServices) * 100
    );
  };

  if (compact) {
    const healthyCount = serviceHealth.filter((s) => s.healthy).length;
    const totalCount = serviceHealth.length;
    const healthPercentage = getHealthPercentage();

    return (
      <Card className="w-auto">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="font-medium">System Health</span>
            </div>

            <div className="flex space-x-1">
              {serviceHealth.map((service) => (
                <div key={service.name} className="relative group">
                  {getServiceIcon(service)}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="font-medium">
                      {getServiceDisplayName(service.name)}
                    </div>
                    <div>
                      Status: {service.healthy ? "Healthy" : "Unhealthy"}
                    </div>
                    {service.responseTime && (
                      <div>Response: {service.responseTime}ms</div>
                    )}
                    {service.endpoint && (
                      <div>Endpoint: {service.endpoint}</div>
                    )}
                    {service.error && (
                      <div className="text-red-300">Error: {service.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Badge
              variant={
                healthPercentage >= 80
                  ? "default"
                  : healthPercentage >= 50
                  ? "secondary"
                  : "destructive"
              }
            >
              {healthyCount}/{totalCount} ({healthPercentage}%)
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={checkSystemHealth}
              disabled={isChecking}
              className="h-6 px-2"
            >
              <RefreshCw
                className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {error && (
            <div className="mt-2 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Health Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">System Health Monitor</CardTitle>
            </div>
            <div className="flex items-center space-x-3">
              {serviceRegistry && (
                <Badge
                  variant={
                    getHealthPercentage() >= 80
                      ? "default"
                      : getHealthPercentage() >= 50
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {serviceRegistry.healthyServices}/
                  {serviceRegistry.totalServices} Services (
                  {getHealthPercentage()}%)
                </Badge>
              )}
              <div className="text-sm text-gray-500 flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>
                  Last updated:{" "}
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkSystemHealth}
                disabled={isChecking}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${isChecking ? "animate-spin" : ""}`}
                />
                {isChecking ? "Checking..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-red-800">
                  Health Check Failed
                </div>
                <div className="text-sm text-red-600">{error}</div>
              </div>
            </div>
          )}

          {/* Service Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceHealth.map((service) => (
              <div
                key={service.name}
                className={`p-3 border rounded-lg transition-colors ${
                  service.healthy
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getServiceIcon(service)}
                    <span className="font-medium text-sm">
                      {getServiceDisplayName(service.name)}
                    </span>
                  </div>
                  <Badge
                    variant={service.healthy ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {service.healthy ? "Online" : "Offline"}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-gray-600">
                  {service.endpoint && (
                    <div className="flex items-center space-x-1">
                      <Server className="w-3 h-3" />
                      <span>{service.endpoint}</span>
                    </div>
                  )}

                  {service.responseTime && (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>{Math.round(service.responseTime)}ms response</span>
                    </div>
                  )}

                  {service.version && (
                    <div className="text-gray-500">
                      Version: {service.version}
                    </div>
                  )}

                  {service.error && (
                    <div className="text-red-600 mt-1">
                      Error: {service.error}
                    </div>
                  )}

                  <div className="text-gray-500">
                    Last check: {service.lastCheck.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {serviceHealth.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="mb-2">No health data available</div>
              <Button
                variant="outline"
                onClick={checkSystemHealth}
                disabled={isChecking}
              >
                {isChecking ? "Checking..." : "Run Health Check"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Registry Information */}
      {showServiceRegistry && serviceRegistry && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Service Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-600">Total Services</div>
                <div className="text-lg font-semibold">
                  {serviceRegistry.totalServices}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">
                  Healthy Services
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {serviceRegistry.healthyServices}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Health Score</div>
                <div className="text-lg font-semibold">
                  {getHealthPercentage()}%
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">
                  Last Registry Update
                </div>
                <div className="text-sm">
                  {new Date(serviceRegistry.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="font-medium text-gray-600 mb-2">
                Registered Services
              </div>
              <div className="flex flex-wrap gap-2">
                {serviceRegistry.registered.map((serviceName) => (
                  <Badge
                    key={serviceName}
                    variant="outline"
                    className="text-xs"
                  >
                    {getServiceDisplayName(serviceName)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
