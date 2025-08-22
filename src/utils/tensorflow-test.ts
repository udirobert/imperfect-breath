/**
 * TensorFlow.js Backend Test Utility
 * Tests if TensorFlow.js backends are working properly
 */

import * as tf from '@tensorflow/tfjs';

export interface BackendTestResult {
  backend: string;
  working: boolean;
  error?: string;
  performanceScore?: number;
}

/**
 * Test a specific TensorFlow.js backend
 */
export async function testBackend(backendName: string): Promise<BackendTestResult> {
  try {
    // Set the backend
    await tf.setBackend(backendName);
    await tf.ready();
    
    // Verify the backend is actually set
    const currentBackend = tf.getBackend();
    if (currentBackend !== backendName) {
      return {
        backend: backendName,
        working: false,
        error: `Backend not set correctly. Expected: ${backendName}, Got: ${currentBackend}`
      };
    }
    
    // Test basic tensor operations
    const startTime = performance.now();
    
    // Create test tensors
    const a = tf.tensor2d([[1, 2], [3, 4]]);
    const b = tf.tensor2d([[5, 6], [7, 8]]);
    
    // Perform operations
    const sum = tf.add(a, b);
    const product = tf.matMul(a, b);
    const result = tf.add(sum, product);
    
    // Get the data (this will fail if backend is broken)
    const data = await result.data();
    
    // Clean up
    a.dispose();
    b.dispose();
    sum.dispose();
    product.dispose();
    result.dispose();
    
    const endTime = performance.now();
    const performanceScore = endTime - startTime;
    
    // Verify we got expected results
    if (data.length !== 4) {
      return {
        backend: backendName,
        working: false,
        error: 'Unexpected result length'
      };
    }
    
    return {
      backend: backendName,
      working: true,
      performanceScore
    };
    
  } catch (error) {
    return {
      backend: backendName,
      working: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test all available backends and return results
 */
export async function testAllBackends(): Promise<BackendTestResult[]> {
  const backends = ['cpu', 'webgl'];
  const results: BackendTestResult[] = [];
  
  // Test WebGPU if available
  try {
    await import('@tensorflow/tfjs-backend-webgpu');
    backends.push('webgpu');
  } catch {
    console.log('WebGPU backend not available');
  }
  
  for (const backend of backends) {
    console.log(`Testing ${backend} backend...`);
    const result = await testBackend(backend);
    results.push(result);
    
    // Clean up between tests
    try {
      tf.disposeVariables();
      tf.engine().dispose();
    } catch {
      // Ignore cleanup errors
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Get the best working backend
 */
export async function getBestBackend(): Promise<string> {
  const results = await testAllBackends();
  
  // Filter working backends
  const workingBackends = results.filter(r => r.working);
  
  if (workingBackends.length === 0) {
    throw new Error('No working TensorFlow.js backends found');
  }
  
  // Prefer GPU backends, then by performance
  const gpuBackends = workingBackends.filter(r => r.backend !== 'cpu');
  if (gpuBackends.length > 0) {
    // Sort by performance (lower is better)
    gpuBackends.sort((a, b) => (a.performanceScore || Infinity) - (b.performanceScore || Infinity));
    return gpuBackends[0].backend;
  }
  
  // Fall back to CPU
  return 'cpu';
}

/**
 * Initialize TensorFlow.js with the best available backend
 */
export async function initializeBestBackend(): Promise<string> {
  try {
    const bestBackend = await getBestBackend();
    await tf.setBackend(bestBackend);
    await tf.ready();
    
    console.log(`TensorFlow.js initialized with ${bestBackend} backend`);
    return bestBackend;
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
    throw error;
  }
}
