import type { IModelLoader, VisionTier } from './types';

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
    // This would integrate with TensorFlow.js Lite
    // For now, we'll simulate the loading
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }

    const modelData = await response.arrayBuffer();
    
    // In a real implementation, this would be:
    // return await tf.loadLayersModel(tf.io.fromMemory(modelData));
    
    // For now, return a mock model
    return {
      predict: (input: any) => {
        // Mock prediction
        return new Promise(resolve => {
          setTimeout(() => resolve({}), 10);
        });
      },
      dispose: () => {
        // Mock disposal
        console.log(`Disposed model from ${url}`);
      }
    };
  }

  private async loadWasmModel(url: string): Promise<any> {
    // This would load a WebAssembly module
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM model: ${response.statusText}`);
    }

    const wasmBytes = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmBytes);
    
    return {
      module: wasmModule,
      process: (input: any) => {
        // Mock processing
        return new Promise(resolve => {
          setTimeout(() => resolve({}), 5);
        });
      },
      dispose: () => {
        console.log(`Disposed WASM model from ${url}`);
      }
    };
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
