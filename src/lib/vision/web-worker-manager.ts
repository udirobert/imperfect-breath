/**
 * Web Worker Manager for Vision Analysis
 * Manages web worker lifecycle and communication for intensive calculations
 */

class VisionWorkerManager {
  private static instance: VisionWorkerManager;
  private worker: Worker | null = null;
  private pendingRequests: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();
  private requestId = 0;
  
  private constructor() {
    this.initializeWorker();
  }
  
  static getInstance(): VisionWorkerManager {
    if (!VisionWorkerManager.instance) {
      VisionWorkerManager.instance = new VisionWorkerManager();
    }
    return VisionWorkerManager.instance;
  }
  
  /**
   * Initialize the web worker
   */
  private initializeWorker(): void {
    try {
      // Create web worker using Blob approach for better compatibility
      const workerScript = `
        // Type definitions for the worker
        interface MediaPipeLandmark {
          x: number;
          y: number;
          z?: number;
          visibility?: number;
          confidence?: number;
        }

        interface BreathAnalysisRequest {
          type: 'analyze-breath-pattern';
          data: {
            landmarks: MediaPipeLandmark[];
            timestamp: number;
            fps?: number;
          };
        }

        interface PostureAnalysisRequest {
          type: 'analyze-posture';
          data: {
            faceLandmarks: MediaPipeLandmark[];
            poseLandmarks?: MediaPipeLandmark[];
          };
        }

        interface RestlessnessAnalysisRequest {
          type: 'analyze-restlessness';
          data: {
            faces: MediaPipeLandmark[][];
            poses: MediaPipeLandmark[][];
          };
        }

        type AnalysisRequest = 
          | BreathAnalysisRequest 
          | PostureAnalysisRequest 
          | RestlessnessAnalysisRequest;

        interface BreathAnalysisResponse {
          type: 'breath-analysis-result';
          result: any;
        }

        interface PostureAnalysisResponse {
          type: 'posture-analysis-result';
          result: any;
        }

        interface RestlessnessAnalysisResponse {
          type: 'restlessness-analysis-result';
          result: any;
        }

        type AnalysisResponse = 
          | BreathAnalysisResponse 
          | PostureAnalysisResponse 
          | RestlessnessAnalysisResponse;

        // Simple placeholder functions for web worker
        // In a real implementation, these would be the actual analysis functions
        function analyzeBreathPattern(landmarks: MediaPipeLandmark[], timestamp: number, fps?: number): any {
          // Simplified breath pattern analysis
          // This would be a copy of the actual BreathPatternDetector logic
          return {
            rate: 15,
            rhythm: 'regular',
            quality: 80,
            trend: 'stable'
          };
        }

        function analyzePosture(faceLandmarks: MediaPipeLandmark[], poseLandmarks?: MediaPipeLandmark[]): any {
          // Simplified posture analysis
          // This would be a copy of the actual PostureAnalyzer logic
          return {
            spineAlignment: 85,
            headPosition: { tilt: 0, rotation: 0, elevation: 0 },
            shoulderLevel: 90,
            overallPosture: 88,
            classification: 'good'
          };
        }

        function analyzeRestlessness(faces: MediaPipeLandmark[][], poses: MediaPipeLandmark[][]): any {
          // Simplified restlessness analysis
          // This would be a copy of the actual EnhancedRestlessnessAnalyzer logic
          return {
            overall: 0.3,
            components: {
              faceMovement: 0.2,
              eyeMovement: 0.1,
              postureShifts: 0.4,
              breathingIrregularity: 0.3
            }
          };
        }

        // Worker message handler
        self.onmessage = function(e: MessageEvent<AnalysisRequest>) {
          const request = e.data;
          
          try {
            let response: AnalysisResponse;
            
            switch (request.type) {
              case 'analyze-breath-pattern':
                const breathResult = analyzeBreathPattern(
                  request.data.landmarks,
                  request.data.timestamp,
                  request.data.fps
                );
                response = {
                  type: 'breath-analysis-result',
                  result: breathResult
                };
                break;
                
              case 'analyze-posture':
                const postureResult = analyzePosture(
                  request.data.faceLandmarks,
                  request.data.poseLandmarks
                );
                response = {
                  type: 'posture-analysis-result',
                  result: postureResult
                };
                break;
                
              case 'analyze-restlessness':
                const restlessnessResult = analyzeRestlessness(
                  request.data.faces,
                  request.data.poses
                );
                response = {
                  type: 'restlessness-analysis-result',
                  result: restlessnessResult
                };
                break;
                
              default:
                throw new Error(\`Unknown analysis request type: \${(request as any).type}\`);
            }
            
            // Send result back to main thread
            self.postMessage(response);
            
          } catch (error) {
            // Send error back to main thread
            self.postMessage({
              type: 'analysis-error',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        };
      `;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      // Listen for messages from the worker
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      
      // Listen for worker errors
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      console.log('Vision analysis worker initialized');
    } catch (error) {
      console.error('Failed to initialize vision analysis worker:', error);
      // Disable web worker usage if initialization fails
      this.worker = null;
    }
  }
  
  /**
   * Handle messages from the web worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const data = event.data as { 
      type: string; 
      result?: any; 
      error?: string;
    };
    
    switch (data.type) {
      case 'breath-analysis-result':
      case 'posture-analysis-result':
      case 'restlessness-analysis-result':
        // Handle successful analysis results
        this.resolvePendingRequest(data.type, data.result);
        break;
        
      case 'analysis-error':
        // Handle analysis errors
        this.rejectPendingRequest(data.error || 'Unknown error');
        break;
        
      default:
        console.warn('Unknown message from vision worker:', data.type);
    }
  }
  
  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Vision worker error:', error);
    
    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests.entries()) {
      reject(new Error(`Vision worker error: ${error.message}`));
    }
    
    this.pendingRequests.clear();
  }
  
  /**
   * Resolve a pending request
   */
  private resolvePendingRequest(type: string, result: any): void {
    // In a real implementation, we'd track requests by ID
    // For simplicity, we'll resolve the first pending request
    const firstEntry = this.pendingRequests.entries().next();
    if (!firstEntry.done) {
      const [id, { resolve }] = firstEntry.value;
      this.pendingRequests.delete(id);
      resolve(result);
    }
  }
  
  /**
   * Reject a pending request
   */
  private rejectPendingRequest(error: string): void {
    // In a real implementation, we'd track requests by ID
    // For simplicity, we'll reject the first pending request
    const firstEntry = this.pendingRequests.entries().next();
    if (!firstEntry.done) {
      const [id, { reject }] = firstEntry.value;
      this.pendingRequests.delete(id);
      reject(new Error(error));
    }
  }
  
  /**
   * Analyze breath pattern in web worker
   */
  async analyzeBreathPattern(landmarks: any[], timestamp: number, fps?: number): Promise<any> {
    if (!this.worker) {
      throw new Error('Vision worker not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker?.postMessage({
        type: 'analyze-breath-pattern',
        data: { landmarks, timestamp, fps }
      });
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Breath analysis timeout'));
        }
      }, 5000); // 5 second timeout
    });
  }
  
  /**
   * Analyze posture in web worker
   */
  async analyzePosture(faceLandmarks: any[], poseLandmarks?: any[]): Promise<any> {
    if (!this.worker) {
      throw new Error('Vision worker not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker?.postMessage({
        type: 'analyze-posture',
        data: { faceLandmarks, poseLandmarks }
      });
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Posture analysis timeout'));
        }
      }, 5000); // 5 second timeout
    });
  }
  
  /**
   * Analyze restlessness in web worker
   */
  async analyzeRestlessness(faces: any[], poses: any[]): Promise<any> {
    if (!this.worker) {
      throw new Error('Vision worker not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker?.postMessage({
        type: 'analyze-restlessness',
        data: { faces, poses }
      });
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Restlessness analysis timeout'));
        }
      }, 5000); // 5 second timeout
    });
  }
  
  /**
   * Terminate the web worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
      console.log('Vision analysis worker terminated');
    }
  }
}

// Export singleton instance
export const visionWorkerManager = VisionWorkerManager.getInstance();