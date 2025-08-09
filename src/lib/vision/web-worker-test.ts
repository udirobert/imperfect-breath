/**
 * Web Worker Test
 * Simple test to verify web worker functionality
 */

// Simple test function
function runWebWorkerTest(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Create a simple web worker using Blob approach for better compatibility
      const workerScript = `
        self.onmessage = function(e) {
          if (e.data === 'test') {
            self.postMessage({ success: true, result: 'Web worker is working!' });
          } else {
            self.postMessage({ success: false, error: 'Invalid test message' });
          }
        };
      `;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      // Set up message handler
      worker.onmessage = function(e) {
        worker.terminate();
        resolve(e.data.success);
      };
      
      // Set up error handler
      worker.onerror = function(error) {
        worker.terminate();
        reject(new Error(`Web worker error: ${error.message}`));
      };
      
      // Send test message
      worker.postMessage('test');
      
      // Set timeout
      setTimeout(() => {
        worker.terminate();
        reject(new Error('Web worker test timeout'));
      }, 1000);
      
    } catch (error) {
      reject(new Error(`Failed to create web worker: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

// Export test function
export async function testWebWorkerSupport(): Promise<boolean> {
  try {
    const result = await runWebWorkerTest();
    console.log('Web worker test result:', result);
    return result;
  } catch (error) {
    console.warn('Web worker test failed:', error);
    return false;
  }
}