import type { IModelLoader, VisionTier } from './types';
import { SimpleCache, getCache } from '../utils/cache-utils';
import { startTimer, timed } from '../utils/performance-utils';
import { handleError, createError, AppError } from '../utils/error-utils';
// Import TensorFlow directly - no fallbacks
import * as tf from '@tensorflow/tfjs';

interface ModelConfig {
  url: string;
  size: string;
  priority: 'high' | 'medium' | 'low';
  tier: VisionTier[];
  variant: 'mobile' | 'desktop' | 'both';
}

export class EnhancedModelLoader implements IModelLoader {
  private static instance: EnhancedModelLoader;
  private modelCache: SimpleCache;
  private loadingPromises = new Map<string, Promise<any>>();
  private loadQueue: Array<{ name: string; priority: number; config: ModelConfig }> = [];
  private isProcessingQueue = false;

  // Model configurations
  private readonly modelConfigs: Record<string, ModelConfig> = {
    // Basic tier models
    'face-detection-lite': {
      url: '/models/face-detection-lite.tflite',
      size: '2.1MB',
      priority: 'high',
      tier: ['basic', 'standard', 'premium'],
      variant: 'both'
    },
    'motion-detection': {
      url: '/models/motion-detection.wasm',
      size: '0.8MB',
      priority: 'high',
      tier: ['basic', 'standard', 'premium'],
      variant: 'both'
    },

    // Standard tier models
    'face-landmarks-basic': {
      url: '/models/face-landmarks-basic.tflite',
      size: '5.2MB',
      priority: 'medium',
      tier: ['standard', 'premium'],
      variant: 'both'
    },
    'pose-detection-upper': {
      url: '/models/pose-detection-upper.tflite',
      size: '8.1MB',
      priority: 'medium',
      tier: ['standard', 'premium'],
      variant: 'both'
    },

    // Premium tier models
    'face-mesh-full': {
      url: '/models/face-mesh-full.tflite',
      size: '12.8MB',
      priority: 'low',
      tier: ['premium'],
      variant: 'desktop'
    },
    'face-mesh-mobile': {
      url: '/models/face-mesh-mobile.tflite',
      size: '6.4MB',
      priority: 'low',
      tier: ['premium'],
      variant: 'mobile'
    },
    'pose-detection-full': {
      url: '/models/pose-detection-full.tflite',
      size: '15.2MB',
      priority: 'low',
      tier: ['premium'],
      variant: 'desktop'
    },
    'pose-detection-mobile': {
      url: '/models/pose-detection-mobile.tflite',
      size: '9.8MB',
      priority: 'low',
      tier: ['premium'],
      variant: 'mobile'
    }
  };

  private constructor() {
    // Use our cache utility instead of a custom Map
    this.modelCache = getCache();
  }

  static getInstance(): EnhancedModelLoader {
    if (!EnhancedModelLoader.instance) {
      EnhancedModelLoader.instance = new EnhancedModelLoader();
    }
    return EnhancedModelLoader.instance;
  }

  /**
   * Load a model by name with performance monitoring and caching
   */
  async loadModel(modelName: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<any> {
    const endTimer = startTimer('ModelLoader.loadModel');
    try {
      // Check cache first using our cache utility
      const cachedModel = this.modelCache.get<any>(modelName);
      if (cachedModel) {
        return cachedModel;
      }

      // Check if already loading
      if (this.loadingPromises.has(modelName)) {
        return await this.loadingPromises.get(modelName);
      }

      const config = this.modelConfigs[modelName];
      if (!config) {
        throw createError(
          'MODEL_NOT_FOUND',
          `Unknown model: ${modelName}`,
          { availableModels: Object.keys(this.modelConfigs) }
        );
      }

      // Create loading promise
      const loadPromise = this.loadModelWithConfig(modelName, config, priority);
      this.loadingPromises.set(modelName, loadPromise);

      try {
        const model = await loadPromise;
        
        // Store in our cache utility with a long TTL
        // Models don't change often, so we can use a long cache time
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        this.modelCache.set(modelName, model, ONE_DAY_MS);
        
        return model;
      } finally {
        this.loadingPromises.delete(modelName);
      }
    } catch (error) {
      throw handleError(`load model ${modelName}`, error);
    } finally {
      endTimer();
    }
  }

  /**
   * Check if a model is loaded (cached)
   */
  isModelLoaded(modelName: string): boolean {
    return this.modelCache.has(modelName);
  }

  /**
   * Unload a model from cache
   */
  async unloadModel(modelName: string): Promise<void> {
    const endTimer = startTimer('ModelLoader.unloadModel');
    try {
      const model = this.modelCache.get<any>(modelName);
      if (model) {
        // Dispose of model resources if the model has a dispose method
        if (typeof model.dispose === 'function') {
          await model.dispose();
        }
        this.modelCache.delete(modelName);
      }
    } catch (error) {
      throw handleError(`unload model ${modelName}`, error);
    } finally {
      endTimer();
    }
  }

  /**
   * Load models for a specific tier and device variant
   */
  async loadModelsForTier(tier: VisionTier, variant: 'mobile' | 'desktop'): Promise<void> {
    const endTimer = startTimer('ModelLoader.loadModelsForTier');
    try {
      const modelsToLoad = Object.entries(this.modelConfigs)
        .filter(([_, config]) => 
          config.tier.includes(tier) && 
          (config.variant === 'both' || config.variant === variant)
        )
        .map(([name, config]) => ({ name, config }));

      // Sort by priority
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      modelsToLoad.sort((a, b) => 
        priorityOrder[b.config.priority] - priorityOrder[a.config.priority]
      );

      // Load high priority models immediately
      const highPriorityModels = modelsToLoad.filter(m => m.config.priority === 'high');
      await Promise.all(
        highPriorityModels.map(m => this.loadModel(m.name, 'high'))
      );

      // Load medium and low priority models in background
      const backgroundModels = modelsToLoad.filter(m => m.config.priority !== 'high');
      this.loadModelsInBackground(backgroundModels);
    } catch (error) {
      throw handleError(`load models for tier ${tier}`, error);
    } finally {
      endTimer();
    }
  }

  /**
   * Load a model with configuration
   */
  private async loadModelWithConfig(
    modelName: string, 
    config: ModelConfig, 
    priority: 'high' | 'medium' | 'low'
  ): Promise<any> {
    if (priority === 'high') {
      return await this.loadImmediately(modelName, config);
    } else {
      return await this.loadInBackground(modelName, config, priority);
    }
  }

  /**
   * Load a model immediately
   */
  private async loadImmediately(modelName: string, config: ModelConfig): Promise<any> {
    const loadTimer = startTimer(`ModelLoad.${modelName}`);
    const endTimer = startTimer('ModelLoader.loadImmediately');
    try {
      console.log(`Loading model ${modelName} immediately (${config.size})`);
      
      // Determine the appropriate loader based on file extension
      if (config.url.endsWith('.tflite')) {
        return await this.loadTensorFlowLiteModel(config.url);
      } else if (config.url.endsWith('.wasm')) {
        return await this.loadWasmModel(config.url);
      } else {
        throw createError(
          'UNSUPPORTED_MODEL_FORMAT',
          `Unsupported model format: ${config.url}`,
          { modelName, url: config.url }
        );
      }
    } catch (error) {
      throw handleError(`load model ${modelName}`, error);
    } finally {
      const duration = loadTimer();
      console.log(`Model ${modelName} loaded in ${duration.toFixed(2)}ms`);
      endTimer();
    }
  }

  /**
   * Load a model in the background
   */
  private async loadInBackground(
    modelName: string, 
    config: ModelConfig, 
    priority: 'medium' | 'low'
  ): Promise<any> {
    const priorityNum = priority === 'medium' ? 2 : 1;
    
    return new Promise((resolve, reject) => {
      this.loadQueue.push({
        name: modelName,
        priority: priorityNum,
        config
      });

      // Sort queue by priority
      this.loadQueue.sort((a, b) => b.priority - a.priority);

      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processLoadQueue();
      }

      // Set up a way to resolve this specific model
      const checkForModel = () => {
        const model = this.modelCache.get<any>(modelName);
        if (model) {
          resolve(model);
        } else {
          setTimeout(checkForModel, 100);
        }
      };
      checkForModel();
    });
  }

  /**
   * Process the load queue
   */
  private async processLoadQueue(): Promise<void> {
    if (this.isProcessingQueue || this.loadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.loadQueue.length > 0) {
      const { name, config } = this.loadQueue.shift()!;
      
      if (!this.modelCache.has(name)) {
        try {
          console.log(`Background loading model ${name} (${config.size})`);
          const model = await this.loadImmediately(name, config);
          
          const ONE_DAY_MS = 24 * 60 * 60 * 1000;
          this.modelCache.set(name, model, ONE_DAY_MS);
        } catch (error) {
          console.error(`Failed to background load model ${name}:`, error);
        }
      }

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Load models in the background
   */
  private loadModelsInBackground(models: Array<{ name: string; config: ModelConfig }>): void {
    models.forEach(({ name, config }) => {
      this.loadInBackground(name, config, config.priority as 'medium' | 'low');
    });
  }

  /**
   * Load a TensorFlow Lite model
   */
  private async loadTensorFlowLiteModel(url: string): Promise<any> {
    const endTimer = startTimer('ModelLoader.loadTensorFlowLiteModel');
    try {
      // This would integrate with TensorFlow.js Lite
      const response = await fetch(url);
      if (!response.ok) {
        throw createError(
          'MODEL_FETCH_FAILED',
          `Failed to fetch model: ${response.statusText}`,
          { url, status: response.status }
        );
      }

      const modelData = await response.arrayBuffer();
   
      if (!tf) {
        throw new Error('TensorFlow.js is required for model loading');
      }
      
      try {
        // Use the actual TensorFlow.js loader - with proper import handling
        // The tfjsConverter is not available directly on the tf object
        // Instead, we should use the proper TFLite loader
        return await tf.loadGraphModel(url);
      } catch (tfLiteError) {
        console.error('Error loading with TFLite converter:', tfLiteError);
        // Try loading as a layers model as fallback method
        return await tf.loadLayersModel(tf.io.fromMemory(modelData));
      }
    } catch (error) {
      throw handleError(`load TensorFlow Lite model from ${url}`, error);
    } finally {
      endTimer();
    }
  }

  /**
   * Load a WebAssembly model
   */
  private async loadWasmModel(url: string): Promise<any> {
    const endTimer = startTimer('ModelLoader.loadWasmModel');
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw createError(
          'WASM_FETCH_FAILED',
          `Failed to fetch WASM model: ${response.statusText}`,
          { url, status: response.status }
        );
      }

      const wasmBytes = await response.arrayBuffer();
      
      // Determine if we need to fetch any imports
      const importURL = `${url.substring(0, url.lastIndexOf('.'))}.imports.json`;
      let imports = {};
      
      try {
        const importsResponse = await fetch(importURL);
        if (importsResponse.ok) {
          imports = await importsResponse.json();
        }
      } catch (e) {
        console.log('No imports file found, using default WebAssembly environment');
        // Use standard memory and table setup if no imports file
        imports = {
          env: {
            memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
            table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' })
          }
        };
      }
      
      // Instantiate the WASM module with proper imports
      const { instance, module } = await WebAssembly.instantiate(wasmBytes, imports);
      
      // Create a wrapper with a proper interface
      return {
        module: module,
        instance: instance,
        
        // Real processing implementation
        process: async (input: any) => {
          // Convert input to the format expected by the WASM module
          if (input instanceof ImageData || input instanceof HTMLImageElement) {
            // Get image data if input is an HTML element
            const imageData = input instanceof ImageData
              ? input
              : this.imageToImageData(input);
            
            const { data, width, height } = imageData;
            
            // Check if the appropriate processing function exists
            if (instance.exports.process_image) {
              // Allocate memory for the image in WASM memory
              const bytesPerPixel = 4; // RGBA
              const size = width * height * bytesPerPixel;
              const ptr = (instance.exports.malloc as CallableFunction)(size);
              
              // Get a view of the WASM memory
              const memory = (instance.exports.memory as WebAssembly.Memory);
              const heap = new Uint8Array(memory.buffer);
              
              // Copy image data to WASM memory
              heap.set(new Uint8Array(data.buffer), ptr);
              
              // Process the image
              const resultPtr = (instance.exports.process_image as CallableFunction)(
                ptr, width, height
              );
              
              // Extract the result
              const resultView = new Uint8Array(memory.buffer, resultPtr);
              const resultLength = resultView.findIndex(b => b === 0);
              const resultString = new TextDecoder().decode(resultView.slice(0, resultLength));
              
              // Free allocated memory
              (instance.exports.free as CallableFunction)(ptr);
              (instance.exports.free as CallableFunction)(resultPtr);
              
              // Parse and return the result
              try {
                return JSON.parse(resultString);
              } catch (e) {
                return { result: resultString };
              }
            } else {
              throw new Error('WASM module does not export a process_image function');
            }
          } else {
            throw new Error('Unsupported input format for WASM processing');
          }
        },
        
        // Proper dispose function that cleans up resources
        dispose: () => {
          // Call cleanup function if available
          if (instance.exports.cleanup && typeof instance.exports.cleanup === 'function') {
            (instance.exports.cleanup as CallableFunction)();
          }
          console.log(`Disposed WASM model from ${url}`);
        }
      };
    } catch (error) {
      throw handleError(`load WebAssembly model from ${url}`, error);
    } finally {
      endTimer();
    }
  }

  /**
   * Get list of loaded models
   */
  getLoadedModels(): string[] {
    // Since we're using SimpleCache, we need to check which models are actually loaded
    return Object.keys(this.modelConfigs).filter(name => this.modelCache.has(name));
  }

  /**
   * Get total cache size
   */
  getTotalCacheSize(): string {
    const loadedModels = this.getLoadedModels();
    const totalSize = loadedModels.reduce((total, modelName) => {
      const config = this.modelConfigs[modelName];
      if (config) {
        const sizeNum = parseFloat(config.size.replace('MB', ''));
        return total + sizeNum;
      }
      return total;
    }, 0);

    return `${totalSize.toFixed(1)}MB`;
  }

  /**
   * Clear model cache
   */
  async clearCache(): Promise<void> {
    const endTimer = startTimer('ModelLoader.clearCache');
    try {
      const models = this.getLoadedModels();
      await Promise.all(models.map(model => this.unloadModel(model)));
      console.log('Model cache cleared');
    } catch (error) {
      throw handleError('clear model cache', error);
    } finally {
      endTimer();
    }
  }

  /**
   * Helper method to convert an HTML image element to ImageData
   * Used by the WASM model loader
   */
  private imageToImageData(img: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
  }

  /**
   * Preload models based on connection speed
   */
  async preloadBasedOnConnection(): Promise<void> {
    const endTimer = startTimer('ModelLoader.preloadBasedOnConnection');
    try {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection.effectiveType;

        // Only preload on fast connections
        if (effectiveType === '4g' || effectiveType === 'wifi') {
          console.log('Fast connection detected, preloading models');
          // Preload basic models
          await this.loadModel('face-detection-lite', 'high');
          await this.loadModel('motion-detection', 'high');
        }
      }
    } catch (error) {
      throw handleError('preload models', error);
    } finally {
      endTimer();
    }
  }
}