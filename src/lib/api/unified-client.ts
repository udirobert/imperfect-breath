/**
 * Unified API Client with Request Orchestration
 * 
 * Centralizes all backend communication with consistent error handling,
 * retry logic, service discovery, and intelligent request orchestration.
 * 
 * ENHANCED: Now includes dependency management, parallel request coordination,
 * and advanced fallback strategies following the blueprint's methodology.
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
    orchestration?: {
      requestId?: string;
      dependencies?: string[];
      executionTime?: number;
      fallbackUsed?: boolean;
    };
  };
}

export interface RequestOrchestration {
  id: string;
  dependencies: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  fallback?: () => Promise<APIResponse>;
  cacheable?: boolean;
  cacheKey?: string;
}

export interface BatchRequest {
  requests: Array<{
    id: string;
    serviceName: string;
    endpoint: string;
    options?: RequestInit;
    orchestration?: Partial<RequestOrchestration>;
  }>;
  strategy: 'parallel' | 'sequential' | 'prioritized';
  failFast?: boolean;
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
  private failureCounts: Map<string, number> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  constructor() {
    this.initializeServices();
    
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('🔧 Unified API Client initialized with services:', Array.from(this.services.keys()));
    }
  }

  private initializeServices() {
    // AI Analysis Service (Essential - uses Netlify Functions in production, localhost in dev)
    this.registerService({
      name: 'ai',
      baseUrl: config.services.ai.url,
      healthCheck: '/health',
      timeout: config.services.ai.timeout,
      retries: config.services.ai.retries,
      requiresAuth: false,
    });

    // Social/Pattern Service (Essential - same as AI service)
    this.registerService({
      name: 'social',
      baseUrl: config.services.social.url,
      healthCheck: '/health',
      timeout: config.services.social.timeout,
      retries: config.services.social.retries,
      requiresAuth: false,
    });

    // Vision Processing Service (Optional - with fallback to AI service)
    const visionEnabled = import.meta.env.VITE_ENABLE_VISION_PROCESSING === 'true';

    if (visionEnabled) {
      if (config.services.vision.url !== config.services.ai.url) {
        // Register standalone vision service if configured differently
        this.registerService({
          name: 'vision',
          baseUrl: config.services.vision.url,
          healthCheck: '/health',
          timeout: config.services.vision.timeout,
          retries: config.services.vision.retries,
          requiresAuth: false,
        });
      } else {
        // Use AI service as vision service (integrated mode)
        this.registerService({
          name: 'vision',
          baseUrl: config.services.ai.url,
          healthCheck: '/health',
          timeout: config.services.vision.timeout,
          retries: config.services.vision.retries,
          requiresAuth: false,
        });
      }
    }

    // Flow Blockchain (Optional - register if enabled)
    const flowEnabled = import.meta.env.VITE_ENABLE_FLOW_BLOCKCHAIN === 'true';
    const flowAccessNode = import.meta.env.VITE_FLOW_ACCESS_API;
    if (flowEnabled && flowAccessNode) {
      this.registerService({
        name: 'flow',
        baseUrl: flowAccessNode,
        healthCheck: '/v1/blocks?height=sealed', // Correct Flow REST API endpoint
        timeout: 20000,
        retries: 5,
        requiresAuth: false,
      });
    }

    // Lens Protocol (Optional - register if enabled)
    const lensEnabled = import.meta.env.VITE_ENABLE_LENS_INTEGRATION === 'true';
    const lensEnvironment = import.meta.env.VITE_LENS_ENVIRONMENT;
    if (lensEnabled && lensEnvironment) {
      const lensApiUrl = lensEnvironment === 'testnet' 
        ? 'https://api.testnet.lens.xyz'
        : 'https://api.lens.xyz';
      
      this.registerService({
        name: 'lens',
        baseUrl: lensApiUrl,
        healthCheck: '/ping', // More reliable health check endpoint
        timeout: 10000,
        retries: 2,
        requiresAuth: false,
      });
    }
  }

  registerService(service: ServiceEndpoint) {
    this.services.set(service.name, service);
    this.healthStatus.set(service.name, false);
    
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`✅ Registered service: ${service.name} -> ${service.baseUrl}`);
    }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for health checks
      
      // Use GET for external services, HEAD for local services
      const method = service.baseUrl.includes('localhost') ? 'HEAD' : 'GET';
      
      const response = await fetch(`${service.baseUrl}${service.healthCheck}`, {
        method,
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Accept': '*/*'
        }
      });
      
      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      this.healthStatus.set(serviceName, isHealthy);
      this.lastHealthCheck.set(serviceName, Date.now());
      
      // Reset failure count on success
      if (isHealthy) {
        this.failureCounts.delete(serviceName);
      }
      
      return isHealthy;
    } catch (error) {
      // Only log first failure and then every 10th failure to reduce spam
      const failures = this.failureCounts.get(serviceName) || 0;
      if (failures === 0 || failures % 10 === 0) {
        console.warn(`Health check failed for ${serviceName}:`, error instanceof Error ? error.message : 'Unknown error');
      }
      this.failureCounts.set(serviceName, failures + 1);
      this.healthStatus.set(serviceName, false);
      this.lastHealthCheck.set(serviceName, Date.now());
      return false;
    }
  }

  isServiceHealthy(serviceName: string): boolean {
    return this.healthStatus.get(serviceName) || false;
  }

  /**
   * Get list of registered services
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
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
 * Unified API Client with service discovery, resilience, and request orchestration
 */
export class UnifiedAPIClient {
  private static instance: UnifiedAPIClient;
  private serviceRegistry: ServiceRegistry;
  private authToken: string | null = null;
  private requestCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private pendingRequests: Map<string, Promise<APIResponse>> = new Map();
  private requestQueue: Array<{ id: string; request: () => Promise<APIResponse>; priority: number }> = [];
  private isProcessingQueue = false;

  private constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.initializeAuth();
    this.startRequestQueueProcessor();
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
      // CLEAN: Explicit format for Hetzner server AI analysis
      const requestBody = {
        provider,
        session_data: sessionData, // Match Hetzner server format
        analysis_type: 'session'
      };

      return await this.request('ai', '/api/ai-analysis', {
        method: 'POST',
        body: JSON.stringify(requestBody),
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
    const registeredServices = this.serviceRegistry.getRegisteredServices();
    
    // Set a 5-second timeout for the entire health check operation
    const timeoutPromise = new Promise<Record<string, boolean>>((_, reject) => {
      setTimeout(() => reject(new Error('System health check timeout')), 5000);
    });
    
    const healthCheckPromise = (async () => {
      const healthPromises = registeredServices.map(async (service) => {
        try {
          // Individual service timeout of 2 seconds
          const servicePromise = this.serviceRegistry.checkServiceHealth(service);
          const timeoutPromise = new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Service timeout')), 2000)
          );
          
          return await Promise.race([servicePromise, timeoutPromise]);
        } catch (error) {
          // Log timeout failures only occasionally to avoid spam
          console.warn(`Health check failed for ${service}:`, error instanceof Error ? error.message : 'Unknown error');
          return false;
        }
      });
      
      await Promise.allSettled(healthPromises);
      return this.serviceRegistry.getAllServicesHealth();
    })();
    
    try {
      return await Promise.race([healthCheckPromise, timeoutPromise]);
    } catch (error) {
      console.warn('System health check failed:', error instanceof Error ? error.message : 'Unknown error');
      // Return last known health status or all false
      const fallbackHealth: Record<string, boolean> = {};
      registeredServices.forEach(service => {
        fallbackHealth[service] = this.serviceRegistry.isServiceHealthy(service);
      });
      return fallbackHealth;
    }
  }

  /**
   * ORCHESTRATION: Execute batch requests with dependency management
   */
  async executeBatch(batch: BatchRequest): Promise<Record<string, APIResponse>> {
    const results: Record<string, APIResponse> = {};
    const requestsById = new Map(batch.requests.map(r => [r.id, r]));
    
    if (batch.strategy === 'parallel') {
      // Execute all requests in parallel
      const promises = batch.requests.map(async (req) => {
        const result = await this.executeWithOrchestration(req);
        return { id: req.id, result };
      });
      
      const settled = await Promise.allSettled(promises);
      settled.forEach((promise, index) => {
        if (promise.status === 'fulfilled') {
          results[promise.value.id] = promise.value.result;
        } else if (!batch.failFast) {
          const requestId = batch.requests[index]?.id || 'unknown';
          results[requestId] = {
            success: false,
            error: promise.reason?.message || 'Request failed'
          };
        }
      });
    } else if (batch.strategy === 'sequential') {
      // Execute requests in sequence
      for (const req of batch.requests) {
        try {
          results[req.id] = await this.executeWithOrchestration(req);
        } catch (error) {
          results[req.id] = {
            success: false,
            error: error instanceof Error ? error.message : 'Request failed'
          };
          if (batch.failFast) break;
        }
      }
    } else if (batch.strategy === 'prioritized') {
      // Sort by priority and execute with dependency resolution
      const sorted = batch.requests.sort((a, b) => {
        const aPriority = this.getPriorityValue(a.orchestration?.priority || 'medium');
        const bPriority = this.getPriorityValue(b.orchestration?.priority || 'medium');
        return bPriority - aPriority;
      });
      
      for (const req of sorted) {
        // Check dependencies
        const deps = req.orchestration?.dependencies || [];
        const depsResolved = deps.every(depId => results[depId]?.success);
        
        if (depsResolved) {
          try {
            results[req.id] = await this.executeWithOrchestration(req);
          } catch (error) {
            results[req.id] = {
              success: false,
              error: error instanceof Error ? error.message : 'Request failed'
            };
            if (batch.failFast) break;
          }
        } else {
          results[req.id] = {
            success: false,
            error: 'Dependencies not resolved'
          };
        }
      }
    }
    
    return results;
  }

  /**
   * ORCHESTRATION: Execute single request with orchestration features
   */
  private async executeWithOrchestration(req: {
    id: string;
    serviceName: string;
    endpoint: string;
    options?: RequestInit;
    orchestration?: Partial<RequestOrchestration>;
  }): Promise<APIResponse> {
    const startTime = Date.now();
    const requestId = req.orchestration?.id || req.id;
    
    // Check cache first
    if (req.orchestration?.cacheable && req.orchestration?.cacheKey) {
      const cached = this.getFromCache(req.orchestration.cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cached: true,
            orchestration: {
              requestId,
              executionTime: Date.now() - startTime,
              dependencies: req.orchestration.dependencies || []
            }
          }
        };
      }
    }
    
    // Deduplicate identical pending requests
    const requestKey = `${req.serviceName}:${req.endpoint}:${JSON.stringify(req.options)}`;
    if (this.pendingRequests.has(requestKey)) {
      return await this.pendingRequests.get(requestKey)!;
    }
    
    // Execute request
    const requestPromise = this.request(req.serviceName, req.endpoint, req.options)
      .catch(async (error) => {
        // Try fallback if available
        if (req.orchestration?.fallback) {
          console.warn(`Request ${requestId} failed, trying fallback:`, error.message);
          const fallbackResult = await req.orchestration.fallback();
          return {
            ...fallbackResult,
            metadata: {
              ...fallbackResult.metadata,
              orchestration: {
                requestId,
                executionTime: Date.now() - startTime,
                dependencies: req.orchestration.dependencies || [],
                fallbackUsed: true
              }
            }
          };
        }
        throw error;
      })
      .finally(() => {
        this.pendingRequests.delete(requestKey);
      });
    
    this.pendingRequests.set(requestKey, requestPromise);
    const result = await requestPromise;
    
    // Cache result if cacheable
    if (req.orchestration?.cacheable && req.orchestration?.cacheKey) {
      this.setCache(req.orchestration.cacheKey, result, 300000); // 5 minutes default TTL
    }
    
    // Add orchestration metadata
    return {
      ...result,
      metadata: {
        ...result.metadata,
        orchestration: {
          requestId,
          executionTime: Date.now() - startTime,
          dependencies: req.orchestration?.dependencies || [],
          fallbackUsed: false
        }
      }
    };
  }

  /**
   * ORCHESTRATION: Priority queue processing
   */
  private async startRequestQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessingQueue && this.requestQueue.length > 0) {
        this.processRequestQueue();
      }
    }, 100);
  }

  private async processRequestQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      // Sort by priority
      this.requestQueue.sort((a, b) => b.priority - a.priority);
      const { request } = this.requestQueue.shift()!;
      
      try {
        await request();
      } catch (error) {
        console.warn('Queued request failed:', error);
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * ORCHESTRATION: Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.requestCache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number) {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getPriorityValue(priority: 'low' | 'medium' | 'high' | 'critical'): number {
    const values = { low: 1, medium: 2, high: 3, critical: 4 };
    return values[priority] || 2;
  }

  /**
   * ORCHESTRATION: Smart session analysis with dependency coordination
   */
  async orchestrateSessionAnalysis(sessionData: any): Promise<APIResponse> {
    const batch: BatchRequest = {
      requests: [
        {
          id: 'ai-analysis',
          serviceName: 'ai',
          endpoint: '/api/ai-analysis',
          options: {
            method: 'POST',
            body: JSON.stringify({ provider: 'openai', sessionData, analysisType: 'session' })
          },
          orchestration: {
            priority: 'high',
            cacheable: true,
            cacheKey: `session-analysis-${sessionData.sessionId}`,
            fallback: async () => ({
              success: true,
              data: {
                overallScore: 75,
                suggestions: ['Continue practicing regularly'],
                encouragement: 'Great session!'
              }
            })
          }
        }
      ],
      strategy: 'parallel',
      failFast: false
    };

    // Add vision analysis if available
    if (this.serviceRegistry.isServiceHealthy('vision') && sessionData.hasVideoData) {
      batch.requests.push({
        id: 'vision-analysis',
        serviceName: 'vision',
        endpoint: '/api/vision/analyze-session',
        options: {
          method: 'POST',
          body: JSON.stringify({ sessionId: sessionData.sessionId, frameData: sessionData.frames })
        },
        orchestration: {
          priority: 'medium',
          dependencies: [],
          fallback: async () => ({
            success: true,
            data: { metrics: null, fallback: true }
          })
        }
      });
    }

    const results = await this.executeBatch(batch);
    
    // Combine results intelligently
    const aiResult = results['ai-analysis'];
    const visionResult = results['vision-analysis'];
    
    return {
      success: aiResult.success,
      data: {
        ...aiResult.data,
        visionMetrics: visionResult?.data?.metrics || null,
        combinedScore: this.calculateCombinedScore(aiResult.data, visionResult?.data)
      },
      metadata: {
        provider: 'orchestrated',
        timestamp: new Date().toISOString(),
        orchestration: {
          requestId: `session-orchestration-${Date.now()}`,
          dependencies: ['ai-analysis', visionResult ? 'vision-analysis' : ''].filter(Boolean),
          executionTime: Math.max(
            aiResult.metadata?.orchestration?.executionTime || 0,
            visionResult?.metadata?.orchestration?.executionTime || 0
          )
        }
      }
    };
  }

  private calculateCombinedScore(aiData: any, visionData?: any): number {
    const aiScore = aiData?.overallScore || 0;
    const visionScore = visionData?.metrics?.stillnessScore || aiScore;
    
    // Weight AI analysis more heavily if vision is not available
    return visionData ? (aiScore * 0.7 + visionScore * 0.3) : aiScore;
  }

  /**
   * Get service status for monitoring
   */
  getServiceStatus() {
    return {
      healthy: this.serviceRegistry.getAllServicesHealth(),
      registered: this.serviceRegistry.getRegisteredServices(),
      auth: !!this.authToken,
      timestamp: new Date().toISOString(),
      orchestration: {
        cacheSize: this.requestCache.size,
        pendingRequests: this.pendingRequests.size,
        queueLength: this.requestQueue.length
      }
    };
  }
}

// Export singleton instance
export const apiClient = UnifiedAPIClient.getInstance();

// Enhanced convenience methods with orchestration
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
  
  // ORCHESTRATION: New orchestrated methods
  orchestration: {
    executeSessionAnalysis: (data: any) => apiClient.orchestrateSessionAnalysis(data),
    executeBatch: (batch: BatchRequest) => apiClient.executeBatch(batch),
  },
};