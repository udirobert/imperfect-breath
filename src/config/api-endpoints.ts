/**
 * Centralized API Endpoints Configuration
 * 
 * Single source of truth for all API endpoint definitions.
 * Eliminates duplication between frontend and backend endpoint definitions.
 * 
 * DRY: All endpoint paths defined once
 * CLEAN: Organized by service domain
 * MODULAR: Easy to extend and maintain
 */

export const API_ENDPOINTS = {
  // AI Analysis Service
  ai: {
    analysis: '/api/ai-analysis',
    health: '/health',
  },

  // Vision Processing Service
  vision: {
    process: '/api/vision/process',
    analyzeSession: '/api/vision/analyze-session',
    sessions: '/api/vision/sessions',
    sessionSummary: (sessionId: string) => `/api/vision/sessions/${sessionId}/summary`,
    session: (sessionId: string) => `/api/vision/session/${sessionId}`,
    stopSession: (sessionId: string) => `/vision/stop/${sessionId}`,
    listSessions: '/vision/sessions',
    health: '/api/health/vision',
  },

  // Social/Sharing Service
  social: {
    share: '/api/social/share',
    timeline: '/api/social/timeline',
    react: '/api/social/react',
    follow: '/api/social/follow',
    trending: '/api/patterns/trending',
    health: '/health',
  },

  // Flow Blockchain Service
  flow: {
    mintPattern: '/api/flow/mint-pattern',
    blocks: '/v1/blocks',
    health: '/v1/blocks?height=sealed',
  },

  // Lens Protocol Service
  lens: {
    // Lens API doesn't provide standard REST endpoints
    // GraphQL endpoint is handled separately
  },

  // System Health
  health: {
    general: '/health',
    ping: '/ping',
  },
} as const;

/**
 * Helper functions for dynamic endpoint generation
 */
export const createEndpoint = {
  visionSessionSummary: (sessionId: string) => API_ENDPOINTS.vision.sessionSummary(sessionId),
  visionSession: (sessionId: string) => API_ENDPOINTS.vision.session(sessionId),
  visionStopSession: (sessionId: string) => API_ENDPOINTS.vision.stopSession(sessionId),
};

/**
 * Endpoint validation helpers
 */
export const validateEndpoint = (endpoint: string): boolean => {
  const allEndpoints = Object.values(API_ENDPOINTS).flatMap(service => 
    Object.values(service).filter(ep => typeof ep === 'string')
  );
  return allEndpoints.includes(endpoint);
};

/**
 * Get all endpoints for a specific service
 */
export const getServiceEndpoints = (serviceName: keyof typeof API_ENDPOINTS) => {
  return API_ENDPOINTS[serviceName];
};

/**
 * Export for easy access
 */
export default API_ENDPOINTS;