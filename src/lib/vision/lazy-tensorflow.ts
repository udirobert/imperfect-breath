/**
 * Lazy TensorFlow Model Loader
 * 
 * Implements dynamic imports for TensorFlow models to reduce initial bundle size.
 * Models are loaded only when vision processing is actually needed.
 */

import type { FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection';
import type { PoseDetector } from '@tensorflow-models/pose-detection';

interface TensorFlowModules {
  tf?: typeof import('@tensorflow/tfjs');
  faceLandmarks?: typeof import('@tensorflow-models/face-landmarks-detection');
  poseDetection?: typeof import('@tensorflow-models/pose-detection');
}

interface LoadedModels {
  faceDetector?: FaceLandmarksDetector;
  poseDetector?: PoseDetector;
}

class LazyTensorFlowLoader {
  private modules: TensorFlowModules = {};
  private models: LoadedModels = {};
  private loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * Load TensorFlow core with backend initialization
   */
  async loadTensorFlowCore(): Promise<typeof import('@tensorflow/tfjs')> {
    if (this.modules.tf) return this.modules.tf;

    const cacheKey = 'tensorflow-core';
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    const loadPromise = (async () => {
      try {
        console.log('Loading TensorFlow.js core...');
        
        // Dynamic import of TensorFlow core
        const tf = await import('@tensorflow/tfjs');
        
        // Load backends in order of preference
        try {
          await import('@tensorflow/tfjs-backend-webgl');
          console.log('WebGL backend loaded');
        } catch (error) {
          console.warn('WebGL backend unavailable:', error);
        }
        
        try {
          await import('@tensorflow/tfjs-backend-cpu');
          console.log('CPU backend loaded');
        } catch (error) {
          console.warn('CPU backend unavailable:', error);
        }
        
        // Optional WebGPU backend (don't fail if unavailable)
        try {
          await import('@tensorflow/tfjs-backend-webgpu');
          console.log('WebGPU backend loaded');
        } catch {
          // WebGPU is optional
        }
        
        // Wait for TensorFlow to be ready
        await tf.ready();
        console.log(`TensorFlow.js initialized with ${tf.getBackend()} backend`);
        
        this.modules.tf = tf;
        return tf;
      } catch (error) {
        console.error('Failed to load TensorFlow.js:', error);
        throw error;
      }
    })();

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Load face landmarks detection model
   */
  async loadFaceLandmarksModel(): Promise<FaceLandmarksDetector> {
    if (this.models.faceDetector) return this.models.faceDetector;

    const cacheKey = 'face-landmarks';
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    const loadPromise = (async () => {
      try {
        console.log('Loading face landmarks model...');
        
        // Ensure TensorFlow core is loaded first
        await this.loadTensorFlowCore();
        
        // Dynamic import of face landmarks detection
        const faceLandmarksModule = await import('@tensorflow-models/face-landmarks-detection');
        this.modules.faceLandmarks = faceLandmarksModule;
        
        // Create detector with MediaPipe FaceMesh
        const detector = await faceLandmarksModule.createDetector(
          faceLandmarksModule.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            maxFaces: 1,
            refineLandmarks: false,
          }
        );
        
        this.models.faceDetector = detector;
        console.log('Face landmarks model loaded successfully');
        return detector;
      } catch (error) {
        console.error('Failed to load face landmarks model:', error);
        throw error;
      }
    })();

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Load pose detection model
   */
  async loadPoseDetectionModel(): Promise<PoseDetector> {
    if (this.models.poseDetector) return this.models.poseDetector;

    const cacheKey = 'pose-detection';
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    const loadPromise = (async () => {
      try {
        console.log('Loading pose detection model...');
        
        // Ensure TensorFlow core is loaded first
        await this.loadTensorFlowCore();
        
        // Dynamic import of pose detection
        const poseModule = await import('@tensorflow-models/pose-detection');
        this.modules.poseDetection = poseModule;
        
        // Create detector with MoveNet
        const detector = await poseModule.createDetector(
          poseModule.SupportedModels.MoveNet,
          {
            modelType: poseModule.movenet.modelType.SINGLEPOSE_LIGHTNING,
          }
        );
        
        this.models.poseDetector = detector;
        console.log('Pose detection model loaded successfully');
        return detector;
      } catch (error) {
        console.error('Failed to load pose detection model:', error);
        throw error;
      }
    })();

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Preload models for better UX (call when user starts camera setup)
   */
  async preloadModels(options: { includePose?: boolean } = {}): Promise<void> {
    const { includePose = false } = options;
    
    try {
      console.log('Preloading vision models...');
      
      // Load core first
      await this.loadTensorFlowCore();
      
      // Load face landmarks (always needed)
      const facePromise = this.loadFaceLandmarksModel();
      
      // Load pose detection if requested
      const posePromise = includePose ? this.loadPoseDetectionModel() : Promise.resolve();
      
      await Promise.all([facePromise, posePromise]);
      console.log('Vision models preloaded successfully');
    } catch (error) {
      console.warn('Model preloading failed (graceful degradation):', error);
    }
  }

  /**
   * Get loaded models (returns null if not loaded)
   */
  getLoadedModels(): LoadedModels {
    return { ...this.models };
  }

  /**
   * Check if TensorFlow is available
   */
  isTensorFlowAvailable(): boolean {
    return !!this.modules.tf;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Dispose TensorFlow resources
    if (this.modules.tf) {
      try {
        this.modules.tf.disposeVariables();
      } catch (error) {
        console.warn('Error disposing TensorFlow variables:', error);
      }
    }
    
    // Clear caches
    this.loadingPromises.clear();
  }
}

// Export singleton instance
export const tensorFlowLoader = new LazyTensorFlowLoader();

// Convenience functions
export const preloadVisionModels = (options?: { includePose?: boolean }) => 
  tensorFlowLoader.preloadModels(options);

export const loadFaceLandmarks = () => 
  tensorFlowLoader.loadFaceLandmarksModel();

export const loadPoseDetection = () => 
  tensorFlowLoader.loadPoseDetectionModel();

export const getTensorFlowCore = () => 
  tensorFlowLoader.loadTensorFlowCore();

// Hook for React components
import { useEffect, useState } from 'react';

export const useLazyTensorFlow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async (options?: { includePose?: boolean }) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await tensorFlowLoader.preloadModels(options);
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      tensorFlowLoader.cleanup();
    };
  }, []);

  return {
    isLoading,
    isReady,
    error,
    loadModels,
    getModels: () => tensorFlowLoader.getLoadedModels(),
  };
};