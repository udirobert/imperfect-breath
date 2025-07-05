/**
 * Unified Vision Hook
 * Single source of truth for all vision functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import VisionEngine from '@/lib/vision/core/vision-engine';
import CameraManager from '@/lib/vision/camera/camera-manager';
import type { 
  VisionTier, 
  VisionMetrics, 
  PerformanceMetrics,
  VisionConfig 
} from '@/lib/vision/types';
import type { CameraState, CameraConfig } from '@/lib/vision/camera/camera-manager';

interface UseVisionConfig {
  tier: VisionTier;
  autoStart?: boolean;
  cameraConfig?: Partial<CameraConfig>;
  processingInterval?: number;
  enablePerformanceMonitoring?: boolean;
}

interface UseVisionReturn {
  // Vision state
  isInitialized: boolean;
  isProcessing: boolean;
  currentTier: VisionTier;
  metrics: VisionMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  
  // Camera state
  cameraState: CameraState;
  stream: MediaStream | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: (config?: Partial<UseVisionConfig>) => Promise<void>;
  startProcessing: () => Promise<void>;
  stopProcessing: () => void;
  updateTier: (tier: VisionTier) => Promise<void>;
  
  // Camera actions
  startCamera: (config?: Partial<CameraConfig>) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  attachToVideo: (videoElement: HTMLVideoElement) => void;
  
  // Utilities
  dispose: () => Promise<void>;
  clearError: () => void;
  getAvailableCameras: () => Promise<MediaDeviceInfo[]>;
  
  // Performance
  getPerformanceReport: () => PerformanceMetrics | null;
}

export const useVision = (initialConfig: UseVisionConfig = { tier: 'none' }): UseVisionReturn => {
  // Vision engine and camera manager instances
  const visionEngine = useRef<VisionEngine>(VisionEngine.getInstance());
  const cameraManager = useRef<CameraManager>(CameraManager.getInstance());
  
  // Vision state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTier, setCurrentTier] = useState<VisionTier>(initialConfig.tier);
  const [metrics, setMetrics] = useState<VisionMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  
  // Camera state
  const [cameraState, setCameraState] = useState<CameraState>({
    isInitialized: false,
    isStreaming: false,
    currentDevice: null,
    currentStream: null,
    error: null,
    capabilities: null,
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Processing interval
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  
  /**
   * Initialize vision system
   */
  const initialize = useCallback(async (config: Partial<UseVisionConfig> = {}) => {
    const finalConfig = { ...initialConfig, ...config };
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize camera manager
      await cameraManager.current.initialize();
      
      // Initialize vision engine
      await visionEngine.current.initialize({
        tier: finalConfig.tier,
        modelVariant: 'mobile', // Could be made configurable
        enableGPU: true,
        maxConcurrentProcessing: 1,
        frameSkipRatio: 0,
      });
      
      setCurrentTier(finalConfig.tier);
      setIsInitialized(true);
      
      // Auto-start if requested
      if (finalConfig.autoStart) {
        await startCamera(finalConfig.cameraConfig);
        await startProcessing();
      }
      
      console.log('Vision system initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Vision initialization failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [initialConfig]);
  
  /**
   * Start camera
   */
  const startCamera = useCallback(async (config: Partial<CameraConfig> = {}) => {
    try {
      setIsLoading(true);
      const newStream = await cameraManager.current.startStream(config);
      setStream(newStream);
      
      // Attach to video element if available
      if (videoElementRef.current) {
        cameraManager.current.attachToVideo(videoElementRef.current);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera start failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Stop camera
   */
  const stopCamera = useCallback(() => {
    cameraManager.current.stopStream();
    setStream(null);
  }, []);
  
  /**
   * Switch camera
   */
  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      setIsLoading(true);
      const newStream = await cameraManager.current.switchCamera(deviceId);
      setStream(newStream);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera switch failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Attach to video element
   */
  const attachToVideo = useCallback((videoElement: HTMLVideoElement) => {
    videoElementRef.current = videoElement;
    cameraManager.current.attachToVideo(videoElement);
  }, []);
  
  /**
   * Start processing
   */
  const startProcessing = useCallback(async () => {
    if (!isInitialized || !stream || !videoElementRef.current) {
      throw new Error('Vision system not ready for processing');
    }
    
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    
    const processFrame = async () => {
      if (!videoElementRef.current || !isProcessing) {
        return;
      }
      
      try {
        const frameMetrics = await visionEngine.current.processFrame(
          videoElementRef.current,
          currentTier
        );
        
        if (frameMetrics) {
          setMetrics(frameMetrics);
        }
        
        // Update performance metrics
        if (initialConfig.enablePerformanceMonitoring) {
          const perfMetrics = visionEngine.current.getPerformanceMetrics();
          setPerformanceMetrics(perfMetrics);
        }
      } catch (error) {
        console.error('Frame processing error:', error);
      }
    };
    
    // Start processing loop
    const interval = initialConfig.processingInterval || 100; // 10 FPS default
    processingIntervalRef.current = setInterval(processFrame, interval);
    
    console.log('Vision processing started');
  }, [isInitialized, stream, isProcessing, currentTier, initialConfig]);
  
  /**
   * Stop processing
   */
  const stopProcessing = useCallback(() => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    setIsProcessing(false);
    setMetrics(null);
    
    console.log('Vision processing stopped');
  }, []);
  
  /**
   * Update tier
   */
  const updateTier = useCallback(async (tier: VisionTier) => {
    try {
      setIsLoading(true);
      await visionEngine.current.updateTier(tier);
      setCurrentTier(tier);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tier update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Get available cameras
   */
  const getAvailableCameras = useCallback(async () => {
    return cameraManager.current.getAvailableCameras();
  }, []);
  
  /**
   * Get performance report
   */
  const getPerformanceReport = useCallback(() => {
    return visionEngine.current.getPerformanceMetrics();
  }, []);
  
  /**
   * Dispose of resources
   */
  const dispose = useCallback(async () => {
    stopProcessing();
    stopCamera();
    
    await visionEngine.current.dispose();
    cameraManager.current.dispose();
    
    setIsInitialized(false);
    setMetrics(null);
    setPerformanceMetrics(null);
    
    console.log('Vision system disposed');
  }, [stopProcessing, stopCamera]);
  
  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Set up camera state listener
  useEffect(() => {
    const unsubscribe = cameraManager.current.onStateChange(setCameraState);
    return unsubscribe;
  }, []);
  
  // Set up stream listener
  useEffect(() => {
    const unsubscribe = cameraManager.current.onStreamChange(setStream);
    return unsubscribe;
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, [stopProcessing]);
  
  return {
    // Vision state
    isInitialized,
    isProcessing,
    currentTier,
    metrics,
    performanceMetrics,
    
    // Camera state
    cameraState,
    stream,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    initialize,
    startProcessing,
    stopProcessing,
    updateTier,
    
    // Camera actions
    startCamera,
    stopCamera,
    switchCamera,
    attachToVideo,
    
    // Utilities
    dispose,
    clearError,
    getAvailableCameras,
    
    // Performance
    getPerformanceReport,
  };
};