import type { IModelLoader, VisionTier } from './types';
// Import TensorFlow - require it to be available
import * as tf from '@tensorflow/tfjs';

// No fallbacks - TensorFlow is required for this module to function
if (!tf) {
  throw new Error('TensorFlow.js is required but not available');
}

interface ModelConfig {
  url: string;
  size: string;
  priority: 'high' | 'medium' | 'low';
  tier: VisionTier[];
  variant: 'mobile' | 'desktop' | 'both';
}

export class ModelLoader implements IModelLoader {
  private static instance: ModelLoader;
  private modelCache = new Map<string, any>();
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

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  async loadModel(modelName: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<any> {
    // Check cache first
    if (this.modelCache.has(modelName)) {
      return this.modelCache.get(modelName);
    }

    // Check if already loading
    if (this.loadingPromises.has(modelName)) {
      return await this.loadingPromises.get(modelName);
    }

    const config = this.modelConfigs[modelName];
    if (!config) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    // Create loading promise
    const loadPromise = this.loadModelWithConfig(modelName, config, priority);
    this.loadingPromises.set(modelName, loadPromise);

    try {
      const model = await loadPromise;
      this.modelCache.set(modelName, model);
      return model;
    } finally {
      this.loadingPromises.delete(modelName);
    }
  }

  isModelLoaded(modelName: string): boolean {
    return this.modelCache.has(modelName);
  }

  async unloadModel(modelName: string): Promise<void> {
    const model = this.modelCache.get(modelName);
    if (model) {
      // Dispose of model resources if the model has a dispose method
      if (typeof model.dispose === 'function') {
        await model.dispose();
      }
      this.modelCache.delete(modelName);
    }
  }

  // Load models for a specific tier and device variant
  async loadModelsForTier(tier: VisionTier, variant: 'mobile' | 'desktop'): Promise<void> {
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
  }

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

  private async loadImmediately(modelName: string, config: ModelConfig): Promise<any> {
    try {
      console.log(`Loading model ${modelName} immediately (${config.size})`);
      
      // Determine the appropriate loader based on file extension
      if (config.url.endsWith('.tflite')) {
        return await this.loadTensorFlowLiteModel(config.url);
      } else if (config.url.endsWith('.wasm')) {
        return await this.loadWasmModel(config.url);
      } else {
        throw new Error(`Unsupported model format: ${config.url}`);
      }
    } catch (error) {
      console.error(`Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

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
        if (this.modelCache.has(modelName)) {
          resolve(this.modelCache.get(modelName));
        } else {
          setTimeout(checkForModel, 100);
        }
      };
      checkForModel();
    });
  }

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
          this.modelCache.set(name, model);
        } catch (error) {
          console.error(`Failed to background load model ${name}:`, error);
        }
      }

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  private loadModelsInBackground(models: Array<{ name: string; config: ModelConfig }>): void {
    models.forEach(({ name, config }) => {
      this.loadInBackground(name, config, config.priority as 'medium' | 'low');
    });
  }

  private async loadTensorFlowLiteModel(url: string): Promise<any> {
    console.log(`Loading TensorFlow model from ${url}`);
    
    try {
      // First, try to load as a SavedModel/GraphModel format
      if (url.includes('.json')) {
        // For models in JSON format (SavedModel)
        return await tf.loadGraphModel(url);
      } else {
        // For TFLite models, we need to use the proper loader
        // TensorFlow.js can load models directly from URLs
        const handler = tf.io.http(url);
        
        // Check if the model is already in the IndexedDB cache
        const cachedModels = await tf.io.listModels();
        const modelKey = `indexeddb://${url.split('/').pop()}`;
        
        if (cachedModels[modelKey]) {
          console.log(`Loading model from cache: ${modelKey}`);
          return await tf.loadLayersModel(modelKey);
        }
        
        // If not in cache, load from URL and cache it
        const model = await tf.loadLayersModel(handler);
        
        // Save to IndexedDB for future fast loading
        await model.save(modelKey);
        
        return model;
      }
    } catch (error: any) {
      console.error(`Error loading TensorFlow model: ${error?.message || 'Unknown error'}`);
      // Attempt to load as a layersModel if graphModel fails
      try {
        return await tf.loadLayersModel(url);
      } catch (fallbackError: any) {
        console.error(`Fallback loading also failed: ${fallbackError?.message || 'Unknown error'}`);
        throw new Error(`Failed to load model from ${url}: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  private async loadWasmModel(url: string): Promise<any> {
    console.log(`Loading WebAssembly model from ${url}`);
    
    try {
      // Fetch the WASM binary
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM model: ${response.statusText}`);
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
      
      // Instantiate the WASM module
      const { instance, module } = await WebAssembly.instantiate(wasmBytes, imports);
      
      // Create a wrapper with the appropriate interface
      return {
        module: module,
        instance: instance,
        
        // Provide a consistent prediction API
        process: async (input: any) => {
          // Convert input to the format expected by the WASM module
          if (input instanceof ImageData || input instanceof HTMLImageElement) {
            // For image input, we need to convert to a format WASM can use
            // This typically means getting the raw pixel data
            const imageData = input instanceof ImageData
              ? input
              : this.imageToImageData(input);
            
            const { data, width, height } = imageData;
            
            // Assuming the WASM module exports a 'process_image' function
            // that takes pointer to data, width, and height
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
              
              // Extract the result (format depends on the specific WASM implementation)
              // For example, if it returns JSON as a string
              const resultView = new Uint8Array(memory.buffer, resultPtr);
              const resultLength = resultView.findIndex(b => b === 0);
              const resultString = new TextDecoder().decode(resultView.slice(0, resultLength));
              
              // Free allocated memory
              (instance.exports.free as CallableFunction)(ptr);
              (instance.exports.free as CallableFunction)(resultPtr);
              
              return JSON.parse(resultString);
            } else {
              throw new Error('WASM module does not export a process_image function');
            }
          } else {
            // For other types of input, we'll need to adapt based on the WASM module's API
            console.warn('Unsupported input format for WASM processing');
            return null;
          }
        },
        
        dispose: () => {
          // Some WASM modules might have cleanup functions
          if (instance.exports.cleanup && typeof instance.exports.cleanup === 'function') {
            (instance.exports.cleanup as CallableFunction)();
          }
          console.log(`Disposed WASM model from ${url}`);
        }
      };
    } catch (error: any) {
      console.error(`Error loading WebAssembly model: ${error?.message || 'Unknown error'}`);
      throw new Error(`Failed to load WASM model: ${error?.message || 'Unknown error'}`);
    }
  }
  
  // Helper function to convert an HTML image element to ImageData
  private imageToImageData(img: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
  }

  // Utility methods
  getLoadedModels(): string[] {
    return Array.from(this.modelCache.keys());
  }

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

  async clearCache(): Promise<void> {
    const models = Array.from(this.modelCache.keys());
    await Promise.all(models.map(model => this.unloadModel(model)));
    console.log('Model cache cleared');
  }

  // Preload models based on connection speed
  async preloadBasedOnConnection(): Promise<void> {
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
  }
}
