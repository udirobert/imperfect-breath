/**
 * Enhanced Vision System
 * 
 * This module provides optimized, performance-monitored versions of the vision system
 * components with integrated caching, error handling, and metrics collection.
 */

// Re-export enhanced components
export { EnhancedModelLoader } from '../enhanced-model-loader';
export { EnhancedVisionManager } from '../enhanced-vision-manager';

// Export convenience singleton getters
import { EnhancedModelLoader } from '../enhanced-model-loader';
import { EnhancedVisionManager } from '../enhanced-vision-manager';

/**
 * Get the singleton instance of the enhanced model loader
 * @returns Singleton instance of EnhancedModelLoader
 */
export function getEnhancedModelLoader(): EnhancedModelLoader {
  return EnhancedModelLoader.getInstance();
}

/**
 * Get the singleton instance of the enhanced vision manager
 * @returns Singleton instance of EnhancedVisionManager
 */
export function getEnhancedVisionManager(): EnhancedVisionManager {
  return EnhancedVisionManager.getInstance();
}

/**
 * Initialize the enhanced vision system with the specified performance mode
 * @param mode Performance mode (auto, performance, or quality)
 * @returns Promise resolving to the initialized vision tier
 */
export async function initializeEnhancedVision(mode: 'auto' | 'performance' | 'quality' = 'auto'): Promise<string> {
  const visionManager = getEnhancedVisionManager();
  return visionManager.initialize(mode);
}

/**
 * Get performance metrics for the vision system
 * @returns Record of operation metrics in milliseconds
 */
export function getVisionPerformanceMetrics(): Record<string, number> {
  const visionManager = getEnhancedVisionManager();
  return visionManager.getOperationMetrics();
}

// Export types for ease of use
export type { 
  VisionTier, 
  VisionConfig, 
  VisionMetrics, 
  PerformanceMode,
  DeviceCapabilities,
  PerformanceMetrics
} from '../types';