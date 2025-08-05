/**
 * Session Orchestrator
 * 
 * Manages the complete breathing session lifecycle with camera integration,
 * progressive enhancement, and graceful error handling.
 */

import { cameraManager, CameraState, CameraEvent } from './camera-manager';
import { getPhaseSequence } from './pattern-mapper';

export interface SessionConfig {
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      hold_after_exhale?: number;
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
    phaseProgress?: number;
    phaseDuration?: number;
    // Real-time performance tracking
    phaseAccuracy?: number; // 0-100% how close to target timing
    rhythmConsistency?: number; // 0-100% consistency across cycles
    currentRestlessness?: number; // 0-100% current movement level
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
  private breathingTimer: number | null = null;
  
  // Performance tracking
  private phaseTimings: number[] = [];
  private lastPhaseStart: number = 0;

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
   * Start breathing cycle timer
   */
  private startBreathingCycle(): void {
    if (!this.config || this.breathingTimer) return;

    // Use centralized phase sequence logic
    const phases = [
      { name: 'inhale', duration: this.config.pattern.phases.inhale },
      ...(this.config.pattern.phases.hold ? [{ name: 'hold', duration: this.config.pattern.phases.hold }] : []),
      { name: 'exhale', duration: this.config.pattern.phases.exhale },
      ...(this.config.pattern.phases.hold_after_exhale ? [{ name: 'hold_after_exhale', duration: this.config.pattern.phases.hold_after_exhale }] : []),
    ];

    let currentPhaseIndex = 0;
    let phaseStartTime = Date.now();
    let cycleCount = 0;

    const updateBreathingPhase = () => {
      const currentPhase = phases[currentPhaseIndex];
      const elapsed = (Date.now() - phaseStartTime) / 1000;

      // Calculate phase progress (0-100%)
      const phaseProgress = Math.min((elapsed / currentPhase.duration) * 100, 100);
      
      // Calculate phase accuracy (how close to target timing)
      const targetDuration = currentPhase.duration;
      const phaseAccuracy = targetDuration > 0 
        ? Math.max(0, 100 - (Math.abs(elapsed - targetDuration) / targetDuration * 100))
        : 100;
      
      // Calculate rhythm consistency from recent phase timings
      const rhythmConsistency = this.calculateRhythmConsistency();

      // Update current phase
      this.setState({
        sessionData: {
          ...this.state.sessionData,
          currentPhase: currentPhase.name,
          cycleCount,
          phaseProgress,
          phaseDuration: currentPhase.duration,
          phaseAccuracy: Math.round(phaseAccuracy),
          rhythmConsistency: Math.round(rhythmConsistency),
        }
      });


      // Move to next phase when current phase is complete
      if (elapsed >= currentPhase.duration) {
        // Record phase timing for consistency analysis
        this.recordPhaseTiming(elapsed);
        
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        phaseStartTime = Date.now();
        
        // Increment cycle count when we complete a full cycle
        if (currentPhaseIndex === 0) {
          cycleCount++;
        }
      }
    };

    // Start immediately
    updateBreathingPhase();
    
    this.breathingTimer = window.setInterval(updateBreathingPhase, 100);
  }

  /**
   * Stop breathing cycle timer
   */
  private stopBreathingCycle(): void {
    if (this.breathingTimer) {
      clearInterval(this.breathingTimer);
      this.breathingTimer = null;
    }
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
   * Stop all timers
   */
  private stopAllTimers(): void {
    this.stopTimer();
    this.stopBreathingCycle();
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
    // Allow re-initialization if in setup, complete, or error state
    const allowedPhases = ['setup', 'complete', 'error'];
    
    if (!allowedPhases.includes(this.state.phase)) {
      // If already initialized with same config, just return
      if (this.config && JSON.stringify(this.config) === JSON.stringify(config)) {
        return;
      }
      throw new Error(`Session already initialized in ${this.state.phase} phase`);
    }
    
    // Reset state for new initialization
    if (this.state.phase === 'complete' || this.state.phase === 'error') {
      this.reset();
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

      // Start session even if some features failed
      this.setState({
        phase: 'active',
        sessionData: {
          ...this.state.sessionData,
          currentPhase: 'inhale', // Start with inhale
        }
      });
      this.startTimer();
      this.startBreathingCycle();

    } catch (error) {
      // Don't fail the entire session if individual features fail
      this.addWarning(`Some features failed to start: ${(error as Error).message}`);
      
      // Start session anyway with available features
      this.setState({
        phase: 'active',
        sessionData: {
          ...this.state.sessionData,
          currentPhase: 'inhale',
        }
      });
      this.startTimer();
      this.startBreathingCycle();
    }
  }

  /**
   * Pause the session
   */
  pause(): void {
    if (this.state.phase === 'active') {
      this.setState({ phase: 'paused' });
      this.stopAllTimers();
    }
  }

  /**
   * Resume the session
   */
  resume(): void {
    if (this.state.phase === 'paused') {
      this.setState({ phase: 'active' });
      this.startTimer();
      this.startBreathingCycle();
    }
  }



  /**
   * Stop the session
   */
  stop(): void {
    // Stop camera
    if (this.state.features.camera === 'active') {
      cameraManager.stopStream();
    }

    // Stop all timers
    this.stopAllTimers();

    // Mark as complete instead of setup to avoid confusion
    this.setState({
      phase: 'complete',
      features: {
        ...this.state.features,
        camera: this.state.features.camera === 'active' ? 'available' : this.state.features.camera,
        ai: this.state.features.ai === 'active' ? 'available' : this.state.features.ai,
      },
    });
  }
  
  /**
   * Reset session to initial state
   */
  reset(): void {
    // Stop any active resources
    if (this.state.features.camera === 'active') {
      cameraManager.stopStream();
    }
    
    // Stop all timers
    this.stopAllTimers();
    
    // Clear configuration
    this.config = null;
    this.phaseTimings = [];
    
    // Reset to initial state
    this.state = this.getInitialState();
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
   * Complete session
   */
  complete(): void {
    this.stopBreathingCycle();
    this.stopTimer();
    
    this.setState({ 
      phase: 'complete',
      sessionData: {
        ...this.state.sessionData,
        currentPhase: 'complete'
      }
    });
    
    this.emit({ type: 'complete' });
  }


  /**
   * Record phase timing for consistency analysis
   */
  private recordPhaseTiming(duration: number): void {
    this.phaseTimings.push(duration);
    // Keep only last 20 phase timings for performance
    if (this.phaseTimings.length > 20) {
      this.phaseTimings.shift();
    }
  }

  /**
   * Calculate rhythm consistency based on phase timing variance
   */
  private calculateRhythmConsistency(): number {
    if (this.phaseTimings.length < 3) return 100; // Not enough data yet
    
    const mean = this.phaseTimings.reduce((sum, time) => sum + time, 0) / this.phaseTimings.length;
    const variance = this.phaseTimings.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / this.phaseTimings.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (lower variance = higher consistency)
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 20));
    return consistencyScore;
  }

  /**
   * Update restlessness score from vision system
   */
  updateRestlessness(score: number): void {
    this.setState({
      sessionData: {
        ...this.state.sessionData,
        currentRestlessness: Math.round(Math.max(0, Math.min(100, score))),
      }
    });
  }

  /**
   * Get current session performance metrics
   */
  getPerformanceMetrics() {
    return {
      phaseAccuracy: this.state.sessionData.phaseAccuracy || 0,
      rhythmConsistency: this.state.sessionData.rhythmConsistency || 0,
      restlessness: this.state.sessionData.currentRestlessness || 0,
      cycleCount: this.state.sessionData.cycleCount,
      duration: this.state.sessionData.duration,
    };
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
    this.phaseTimings = [];
  }
}

// Create and export singleton
export const sessionOrchestrator = new SessionOrchestrator();