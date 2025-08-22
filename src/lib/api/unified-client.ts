/**
 * Unified API Client
 * 
 * Centralizes all backend communication with consistent error handling,
 * retry logic, and service discovery.
 */

import { config } from '../../config/environment';
import { withRetry } from '../utils/retry-utils';
import { NetworkError, AppError } from '../errors/error-types';
import { supabase } from '../../integrations/supabase/client';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    cached?: boolean;
    provider?: string;
    timestamp?: string;
  };
}

export interface ServiceEndpoint {
  name: string;
  baseUrl: string;
  healthCheck: string;
  timeout: number;
  retries: number;
  requiresAuth: boolean;
}

/**
 * Service registry with health checking
 */
class ServiceRegistry {
  private services: Map<string, ServiceEndpoint> = new Map();
  private healthStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // AI Analysis Service
    this.registerService({
      name: 'ai',
      baseUrl: window.location.origin,
      healthCheck: '/api/health',
      timeout: 30000,
      retries: 3,
      requiresAuth: false,
    });

    // Vision Processing Service
    this.registerService({
      name: 'vision',
      baseUrl: 'http://localhost:8000',
      healthCheck: '/api/health/vision',
      timeout: 10000,
      retries: 2,
      requiresAuth: false,
    });

    // Social/Pattern Service (Express)
    this.registerService({
      name: 'social',
      baseUrl: window.location.origin,
      healthCheck: '/api/health',
      timeout: 15000,
      retries: 3,
      requiresAuth: true,
    });

    // Flow Blockchain
    this.registerService({
      name: 'flow',
      baseUrl: config.flow.accessNode,
      healthCheck: '/blocks?height=sealed',
      timeout: 20000,
      retries: 5,
      requiresAuth: false,
    });

    // Lens Protocol
    this.registerService({
      name: 'lens',
      baseUrl: config.lens.apiUrl,
      healthCheck: '/health',
      timeout: 15000,
      retries: 3,
      requiresAuth: true,
    });
  }

  registerService(service: ServiceEndpoint) {
    this.services.set(service.name, service);
    this.healthStatus.set(service.name, false);
  }

  async getService(name: string): Promise<ServiceEndpoint | null> {
    const service = this.services.get(name);
    if (!service) return null;

    // Check if we need to run health check
    const lastCheck = this.lastHealthCheck.get(name) || 0;
    if (Date.now() - lastCheck > this.HEALTH_CHECK_INTERVAL) {
      await this.checkServiceHealth(name);
    }

    return service;
  }

  async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    if (!service) return false;

    try {
      const response = await fetch(`${service.baseUrl}${service.healthCheck}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      const isHealthy = response.ok;
      this.healthStatus.set(serviceName, isHealthy);
      this.lastHealthCheck.set(serviceName, Date.now());
      
      return isHealthy;
    } catch (error) {
      console.warn(`Health check failed for ${serviceName}:`, error);
      this.healthStatus.set(serviceName, false);
      this.lastHealthCheck.set(serviceName, Date.now());
      return false;
    }
  }

  isServiceHealthy(serviceName: string): boolean {
    return this.healthStatus.get(serviceName) || false;
  }

  getAllServicesHealth(): Record<string, boolean> {
    const health: Record<string, boolean> = {};
    for (const [name, status] of this.healthStatus) {
      health[name] = status;
    }
    return health;
  }
}

/**
 * Unified API Client with service discovery and resilience
 */
export class UnifiedAPIClient {
  private static instance: UnifiedAPIClient;
  private serviceRegistry: ServiceRegistry;
  private authToken: string | null = null;

  private constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.initializeAuth();
  }

  static getInstance(): UnifiedAPIClient {
    if (!UnifiedAPIClient.instance) {
      UnifiedAPIClient.instance = new UnifiedAPIClient();
    }
    return UnifiedAPIClient.instance;
  }

  private async initializeAuth() {
    // Subscribe to Supabase auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.authToken = session?.access_token || null;
    });

    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.authToken = session?.access_token || null;
  }

  /**
   * Make authenticated request to any service
   */
  async request<T = any>(
    serviceName: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const service = await this.serviceRegistry.getService(serviceName);
    
    if (!service) {
      throw new NetworkError(`Service '${serviceName}' not found`);
    }

    const url = `${service.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add any additional headers from options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Add authentication if required
    if (service.requiresAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(service.timeout),
    };

    return withRetry(async () => {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            { service: serviceName, endpoint, status: response.status }
          );
        }

        const data = await response.json();
        
        return {
          success: true,
          data,
          metadata: {
            provider: serviceName,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        if (error instanceof NetworkError) {
          throw error;
        }
        
        throw new NetworkError(
          `Request failed: ${error instanceof Error ? error.message : String(error)}`,
          { service: serviceName, endpoint }
        );
      }
    }, {
      maxAttempts: service.retries,
      initialDelayMs: 1000,
      retryableErrors: ['network error', 'timeout', '502', '503', '504'],
    });
  }

  /**
   * AI Analysis with fallback
   */
  async analyzeSession(provider: string, sessionData: any): Promise<APIResponse> {
    try {
      return await this.request('ai', '/api/ai-analysis', {
        method: 'POST',
        body: JSON.stringify({ provider, sessionData, analysisType: 'session' }),
      });
    } catch (error) {
      console.warn('AI analysis failed, using fallback:', error);
      
      // Return fallback response
      return {
        success: true,
        data: {
          overallScore: 75,
          suggestions: ['Continue practicing regularly', 'Focus on consistency'],
          nextSteps: ['Practice daily', 'Try longer sessions'],
          encouragement: 'Great session! Keep up the good work.',
        },
        metadata: {
          provider: 'fallback',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Vision Processing with graceful degradation
   */
  async processVision(sessionId: string, frameData: any): Promise<APIResponse> {
    const isHealthy = this.serviceRegistry.isServiceHealthy('vision');
    
    if (!isHealthy) {
      console.info('Vision service unavailable, continuing without analysis');
      return {
        success: true,
        data: { metrics: null, fallback: true },
        metadata: { provider: 'fallback' },
      };
    }

    return this.request('vision', '/api/vision/process', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, ...frameData }),
    });
  }

  /**
   * Social/Lens Integration
   */
  async shareBreathingSession(sessionData: any): Promise<APIResponse> {
    return this.request('social', '/api/social/share', {
      method: 'POST',
      body: JSON.stringify({
        type: 'BREATHING_SESSION',
        content: `Completed ${sessionData.patternName} with ${sessionData.score}% focus!`,
        metadata: { breathingPattern: sessionData },
      }),
    });
  }

  /**
   * Flow Blockchain Operations
   */
  async mintPattern(patternData: any): Promise<APIResponse> {
    return this.request('flow', '/api/flow/mint-pattern', {
      method: 'POST',
      body: JSON.stringify(patternData),
    });
  }

  /**
   * Health Check for all services
   */
  async getSystemHealth(): Promise<Record<string, boolean>> {
    const services = ['ai', 'vision', 'social', 'flow', 'lens'];
    const healthPromises = services.map(service => 
      this.serviceRegistry.checkServiceHealth(service)
    );
    
    await Promise.allSettled(healthPromises);
    return this.serviceRegistry.getAllServicesHealth();
  }

  /**
   * Get service status for monitoring
   */
  getServiceStatus() {
    return {
      healthy: this.serviceRegistry.getAllServicesHealth(),
      auth: !!this.authToken,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const apiClient = UnifiedAPIClient.getInstance();

// Convenience methods
export const api = {
  ai: {
    analyzeSession: (provider: string, data: any) => apiClient.analyzeSession(provider, data),
  },
  vision: {
    process: (sessionId: string, data: any) => apiClient.processVision(sessionId, data),
  },
  social: {
    share: (data: any) => apiClient.shareBreathingSession(data),
  },
  flow: {
    mint: (data: any) => apiClient.mintPattern(data),
  },
  health: () => apiClient.getSystemHealth(),
  status: () => apiClient.getServiceStatus(),
};