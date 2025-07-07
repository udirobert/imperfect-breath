import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getEnhancedVisionManager,
  getEnhancedModelLoader,
  VisionTier,
  VisionMetrics,
  PerformanceMode
} from '../lib/vision/enhanced';
import { handleError } from '../lib/utils/error-utils';

/**
 * Hook for using the enhanced vision system in React components
 */
export function useEnhancedVision(options: {
  autoInitialize?: boolean;
  initialMode?: PerformanceMode;
  onError?: (error: Error) => void;
} = {}) {
  const {
    autoInitialize = true,
    initialMode = 'auto',
    onError = console.error
  } = options;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTier, setCurrentTier] = useState<VisionTier>('loading');
  const [currentMode, setCurrentMode] = useState<PerformanceMode>(initialMode);
  const [metrics, setMetrics] = useState<VisionMetrics | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [operationMetrics, setOperationMetrics] = useState<Record<string, number>>({});
  const [loadedModels, setLoadedModels] = useState<string[]>([]);
  
  // Refs
  const videoStreamRef = useRef<MediaStream | null>(null);
  
  // Get manager instances
  const visionManager = getEnhancedVisionManager();
  const modelLoader = getEnhancedModelLoader();
  
  /**
   * Initialize the vision system
   */
  const initialize = useCallback(async (mode: PerformanceMode = initialMode) => {
    try {
      setError(null);
      
      const tier = await visionManager.initialize(mode);
      setIsInitialized(true);
      setCurrentTier(tier);
      setCurrentMode(mode);
      setOperationMetrics(visionManager.getOperationMetrics());
      setLoadedModels(modelLoader.getLoadedModels());
      
      return tier;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError(error);
      setIsInitialized(false);
      return 'none' as unknown as VisionTier;
    }
  }, [initialMode, visionManager, modelLoader, onError]);
  
  /**
   * Start vision processing with a video stream
   */
  const startVision = useCallback(async (videoStream: MediaStream) => {
    try {
      setError(null);
      
      if (!isInitialized) {
        await initialize();
      }
      
      await visionManager.startVision(videoStream);
      videoStreamRef.current = videoStream;
      setIsProcessing(true);
      
      // Set up metrics polling
      const metricsInterval = setInterval(async () => {
        try {
          const newMetrics = await visionManager.getMetrics();
          if (newMetrics) {
            setMetrics(newMetrics);
          }
          
          setOperationMetrics(visionManager.getOperationMetrics());
          setLoadedModels(modelLoader.getLoadedModels());
        } catch (err) {
          console.error('Error polling metrics:', err);
        }
      }, 2000);
      
      return () => {
        clearInterval(metricsInterval);
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError(error);
      return () => {};
    }
  }, [isInitialized, initialize, visionManager, modelLoader, onError]);
  
  /**
   * Stop vision processing
   */
  const stopVision = useCallback(async () => {
    try {
      await visionManager.stopVision();
      videoStreamRef.current = null;
      setIsProcessing(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError(error);
    }
  }, [visionManager, onError]);
  
  /**
   * Switch vision tier
   */
  const switchTier = useCallback(async (tier: VisionTier) => {
    try {
      setError(null);
      
      await visionManager.switchTier(tier);
      setCurrentTier(tier);
      setOperationMetrics(visionManager.getOperationMetrics());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError(error);
    }
  }, [visionManager, onError]);
  
  /**
   * Switch performance mode
   */
  const switchMode = useCallback(async (mode: PerformanceMode) => {
    try {
      setError(null);
      
      const tier = await visionManager.switchMode(mode);
      setCurrentMode(mode);
      setCurrentTier(tier);
      setOperationMetrics(visionManager.getOperationMetrics());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError(error);
    }
  }, [visionManager, onError]);
  
  /**
   * Get camera stream with error handling
   */
  const getCameraStream = useCallback(async (constraints: MediaStreamConstraints = { 
    video: { width: 1280, height: 720 } 
  }): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (err) {
      const error = handleError('get camera stream', err);
      setError(new Error(error.message));
      onError(new Error(error.message));
      throw error;
    }
  }, [onError]);
  
  /**
   * Cleanup function
   */
  const cleanup = useCallback(async () => {
    try {
      if (isProcessing) {
        await stopVision();
      }
      
      await visionManager.dispose();
      setIsInitialized(false);
      setCurrentTier('none' as unknown as VisionTier);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error during cleanup:', error);
    }
  }, [isProcessing, stopVision, visionManager]);
  
  // Auto-initialize if configured
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize();
    }
    
    return () => {
      cleanup();
    };
  }, [autoInitialize, isInitialized, initialize, cleanup]);
  
  // Subscribe to tier changes
  useEffect(() => {
    const handleTierChange = (tier: VisionTier) => {
      setCurrentTier(tier);
    };
    
    visionManager.onTierChange(handleTierChange);
    
    return () => {
      // No way to unsubscribe in the current API
    };
  }, [visionManager]);
  
  // Subscribe to errors
  useEffect(() => {
    const handleVisionError = (error: Error) => {
      setError(error);
      onError(error);
    };
    
    visionManager.onError(handleVisionError);
    
    return () => {
      // No way to unsubscribe in the current API
    };
  }, [visionManager, onError]);
  
  // Return the hook API
  return {
    // State
    isInitialized,
    isProcessing,
    currentTier,
    currentMode,
    metrics,
    error,
    operationMetrics,
    loadedModels,
    
    // Methods
    initialize,
    startVision,
    stopVision,
    switchTier,
    switchMode,
    getCameraStream,
    cleanup,
    
    // Advanced access
    visionManager,
    modelLoader
  };
}