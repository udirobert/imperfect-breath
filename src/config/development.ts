/**
 * Development Configuration
 * Overrides for development environment to handle known issues
 */

export const developmentConfig = {
  // Vision system configuration
  vision: {
    // Disable problematic features in development
    enablePoseDetection: false,
    enableWebWorkers: false,
    enableGPUAcceleration: true,
    fallbackToCPU: true,
    
    // Use more conservative settings
    maxRetries: 3,
    errorThreshold: 5,
    processingInterval: 500, // Slower processing to reduce errors
    
    // Model loading configuration
    models: {
      preferBlazeFace: true,
      skipMediaPipe: true,
      useLocalModels: false,
    },
  },
  
  // Wallet configuration
  wallet: {
    // Use test/development project IDs
    walletConnectProjectId: '2f05a4b1c24c5c1c8b5c8b5c8b5c8b5c',
    enableWalletConnect: false, // Disable for development
    enableMetaMask: true,
    enableCoinbase: false,
  },
  
  // AI configuration
  ai: {
    // Use fallback responses when APIs fail
    enableFallback: true,
    timeout: 10000,
    maxRetries: 2,
  },
  
  // Performance monitoring
  performance: {
    enableLogging: true,
    enableMetrics: false,
    enableErrorReporting: false,
  },
  
  // Feature flags for development
  features: {
    enableCamera: true,
    enableAIAnalysis: true,
    enableSocialFeatures: false,
    enableTrialSystem: true,
  },
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = () => {
  return import.meta.env.DEV || 
         import.meta.env.VITE_APP_ENV === 'development' ||
         process.env.NODE_ENV === 'development';
};

/**
 * Get configuration based on environment
 */
export const getConfig = () => {
  if (isDevelopment()) {
    return developmentConfig;
  }
  
  // Return production config (to be defined later)
  return {
    vision: {
      enablePoseDetection: true,
      enableWebWorkers: true,
      enableGPUAcceleration: true,
      fallbackToCPU: true,
      maxRetries: 5,
      errorThreshold: 10,
      processingInterval: 100,
      models: {
        preferBlazeFace: false,
        skipMediaPipe: false,
        useLocalModels: true,
      },
    },
    wallet: {
      enableWalletConnect: true,
      enableMetaMask: true,
      enableCoinbase: true,
    },
    ai: {
      enableFallback: false,
      timeout: 30000,
      maxRetries: 3,
    },
    performance: {
      enableLogging: false,
      enableMetrics: true,
      enableErrorReporting: true,
    },
    features: {
      enableCamera: true,
      enableAIAnalysis: true,
      enableSocialFeatures: true,
      enableTrialSystem: true,
    },
  };
};
