/**
 * Session Orchestrator
 * 
 * Manages the complete breathing session lifecycle with camera integration,
 * progressive enhancement, and graceful error handling.
 */

import { cameraManager, CameraState, CameraEvent } from './camera-manager';

export interface SessionConfig {
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
    difficulty: string;
    benefits: string[];
  };
  features: {
    enableCamera: boolean;
    enableAI: boolean;
    enableAudio: boolean;
  };
  cameraSettings?: {
    displayMode: 'focus' | 'awareness' | 'analysis';
    quality: 'low' | 'medium' | 'high';
  };
}

export interface SessionState {
  phase: 'setup' | 'initializing' | 'ready' | 'active' | 'paused' | 'complete' | 'error';
  features: {
    camera: 'unavailable' | 'requesting' | 'available' | 'active' | 'error';
    ai: 'unavailable' | 'loading' | 'available' | 'active' | 'error';
    audio: 'available' | 'active' | 'muted';
  };
  error: string | null;
  warnings: string[];
  sessionData: {
    startTime?: number;
    duration: number;
    cycleCount: number;
    currentPhase: string;
  };
}

export type SessionEventType = 
  | 'state-change' 
  | 'feature-change' 
  | 'error' 
  | 'warning' 
  | 'ready'
  | 'complete';

export interface SessionEvent {
  type: SessionEventType;
  state?: SessionState;
  feature?: keyof SessionState['features'];
  error?: string;
  warning?: string;
}

/**
 * Session Orchestrator Class
 */
class SessionOrchestrator {
  private config: SessionConfig | null = null;
  private state: SessionState = this.getInitialState();
  private listeners: Set<(event: SessionEvent) => void> = new Set();
  private cameraCleanup: (() => void) | null = null;
  private sessionTimer: number | null = null;

  /**
   * Get initial session state
   */
  private getInitialState(): SessionState {
    return {
      phase: 'setup',
      features: {
        camera: 'unavailable',
        ai: 'unavailable',
        audio: 'available',
      },
      error: null,
      warnings: [],
      sessionData: {
        duration: 0,
        cycleCount: 0,
        currentPhase: 'prepare',
      },
    };
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<SessionState>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Emit state change event
    this.emit({ type: 'state-change', state: this.state });

    // Emit specific events for feature changes
    Object.keys(updates.features || {}).forEach(feature => {
      if (prevState.features[feature as keyof SessionState['features']] !== 
          this.state.features[feature as keyof SessionState['features']]) {
        this.emit({ 
          type: 'feature-change', 
          feature: feature as keyof SessionState['features'],
          state: this.state 
        });
      }
    });
  }

  /**
   * Add warning to state
   */
  private addWarning(warning: string): void {
    const warnings = [...this.state.warnings];
    if (!warnings.includes(warning)) {
      warnings.push(warning);
      this.setState({ warnings });
      this.emit({ type: 'warning', warning });
    }
  }

  /**
   * Set error state
   */
  private setError(error: string): void {
    this.setState({ 
      phase: 'error', 
      error,
    });
    this.emit({ type: 'error', error });
  }

  /**
   * Emit event to listeners
   */
  private emit(event: SessionEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Session event listener error:', error);
      }
    });
  }

  /**
   * Handle camera events
   */
  private handleCameraEvent = (event: CameraEvent): void => {
    switch (event.type) {
      case 'permission-change':
        this.updateCameraFeatureState();
        break;

      case 'stream-change':
        if (event.stream) {
          this.setState({
            features: { ...this.state.features, camera: 'active' }
          });
        } else {
          this.setState({
            features: { ...this.state.features, camera: 'available' }
          });
        }
        break;

      case 'error':
        this.setState({
          features: { ...this.state.features, camera: 'error' }
        });
        this.addWarning(`Camera error: ${event.error?.message || 'Unknown error'}`);
        break;
    }
  };

  /**
   * Update camera feature state based on manager state
   */
  private updateCameraFeatureState(): void {
    const cameraState = cameraManager.getState();
    let status: SessionState['features']['camera'] = 'unavailable';

    if (cameraState.isAvailable) {
      if (cameraState.isStreaming) {
        status = 'active';
      } else if (cameraState.isRequesting) {
        status = 'requesting';
      } else if (cameraState.hasPermission) {
        status = 'available';
      } else {
        status = 'unavailable';
      }
    }

    if (cameraState.error) {
      status = 'error';
    }

    this.setState({
      features: { ...this.state.features, camera: status }
    });
  }

  /**
   * Initialize camera feature
   */
  private async initializeCamera(): Promise<void> {
    if (!this.config?.features.enableCamera) return;

    this.setState({
      features: { ...this.state.features, camera: 'requesting' }
    });

    try {
      // Setup camera event listener
      this.cameraCleanup = cameraManager.addEventListener(this.handleCameraEvent);

      // Check initial camera state
      this.updateCameraFeatureState();

      // Pre-validate camera access without starting stream
      const cameraState = cameraManager.getState();
      if (!cameraState.isAvailable) {
        this.addWarning('Camera not supported in this browser');
        return;
      }

      if (!cameraState.hasPermission) {
        this.addWarning('Camera permission required for enhanced features');
        return;
      }

      this.setState({
        features: { ...this.state.features, camera: 'available' }
      });

    } catch (error) {
      this.setState({
        features: { ...this.state.features, camera: 'error' }
      });
      this.addWarning(`Camera initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Initialize AI feature
   */
  private async initializeAI(): Promise<void> {
    if (!this.config?.features.enableAI) return;

    this.setState({
      features: { ...this.state.features, ai: 'loading' }
    });

    try {
      // Simulate AI initialization (replace with actual AI loading)
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.setState({
        features: { ...this.state.features, ai: 'available' }
      });

    } catch (error) {
      this.setState({
        features: { ...this.state.features, ai: 'error' }
      });
      this.addWarning(`AI features unavailable: ${(error as Error).message}`);
    }
  }

  /**
   * Start session timer
   */
  private startTimer(): void {
    if (this.sessionTimer) return;

    const startTime = Date.now();
    this.setState({
      sessionData: {
        ...this.state.sessionData,
        startTime,
      }
    });

    this.sessionTimer = window.setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      this.setState({
        sessionData: {
          ...this.state.sessionData,
          duration,
        }
      });
    }, 1000);
  }

  /**
   * Stop session timer
   */
  private stopTimer(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Public API
   */

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Initialize session with configuration
   */
  async initialize(config: SessionConfig): Promise<void> {
    if (this.state.phase !== 'setup') {
      // If already initialized with same config, just return
      if (this.config && JSON.stringify(this.config) === JSON.stringify(config)) {
        return;
      }
      throw new Error('Session already initialized');
    }

    this.config = config;
    this.setState({ 
      phase: 'initializing',
      warnings: [],
      error: null,
    });

    try {
      // Initialize features in parallel
      const initPromises: Promise<void>[] = [];

      if (config.features.enableCamera) {
        initPromises.push(this.initializeCamera());
      }

      if (config.features.enableAI) {
        initPromises.push(this.initializeAI());
      }

      // Wait for all features to initialize (non-blocking)
      await Promise.allSettled(initPromises);

      this.setState({ phase: 'ready' });
      this.emit({ type: 'ready', state: this.state });

    } catch (error) {
      this.setError(`Session initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Start the breathing session
   */
  async start(): Promise<void> {
    if (this.state.phase !== 'ready') {
      throw new Error('Session not ready to start');
    }

    try {
      // Start camera stream if available and enabled
      if (this.config?.features.enableCamera && 
          this.state.features.camera === 'available') {
        try {
          await cameraManager.requestStream();
        } catch (error) {
          this.addWarning('Camera stream failed, continuing without video');
        }
      }

      // Activate AI if available
      if (this.state.features.ai === 'available') {
        this.setState({
          features: { ...this.state.features, ai: 'active' }
        });
      }

      // Start session
      this.setState({ phase: 'active' });
      this.startTimer();

    } catch (error) {
      this.setError(`Failed to start session: ${(error as Error).message}`);
    }
  }

  /**
   * Pause the session
   */
  pause(): void {
    if (this.state.phase === 'active') {
      this.setState({ phase: 'paused' });
      this.stopTimer();
    }
  }

  /**
   * Resume the session
   */
  resume(): void {
    if (this.state.phase === 'paused') {
      this.setState({ phase: 'active' });
      this.startTimer();
    }
  }

  /**
   * Complete the session
   */
  complete(): void {
    this.setState({ phase: 'complete' });
    this.stopTimer();
    this.emit({ type: 'complete', state: this.state });
  }

  /**
   * Stop the session
   */
  stop(): void {
    // Stop camera
    if (this.state.features.camera === 'active') {
      cameraManager.stopStream();
    }

    // Stop timer
    this.stopTimer();

    // Reset features
    this.setState({
      phase: 'setup',
      features: {
        camera: 'unavailable',
        ai: 'unavailable',
        audio: 'available',
      },
      sessionData: {
        duration: 0,
        cycleCount: 0,
        currentPhase: 'prepare',
      },
    });
  }

  /**
   * Update session phase (e.g., inhale, exhale)
   */
  updatePhase(phase: string): void {
    this.setState({
      sessionData: {
        ...this.state.sessionData,
        currentPhase: phase,
      }
    });
  }

  /**
   * Increment cycle count
   */
  incrementCycle(): void {
    this.setState({
      sessionData: {
        ...this.state.sessionData,
        cycleCount: this.state.sessionData.cycleCount + 1,
      }
    });
  }

  /**
   * Toggle audio
   */
  toggleAudio(): void {
    const audio = this.state.features.audio === 'active' ? 'available' : 'active';
    this.setState({
      features: { ...this.state.features, audio }
    });
  }

  /**
   * Get camera stream if available
   */
  getCameraStream(): MediaStream | null {
    return cameraManager.getState().stream;
  }

  /**
   * Check if feature is available
   */
  isFeatureAvailable(feature: keyof SessionState['features']): boolean {
    const status = this.state.features[feature];
    return status === 'available' || status === 'active';
  }

  /**
   * Check if session can start
   */
  canStart(): boolean {
    return this.state.phase === 'ready' && this.state.error === null;
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: SessionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
    
    if (this.cameraCleanup) {
      this.cameraCleanup();
      this.cameraCleanup = null;
    }
    
    this.config = null;
  }
}

// Create and export singleton
export const sessionOrchestrator = new SessionOrchestrator();