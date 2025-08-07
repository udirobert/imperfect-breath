/**
 * Unified Breathing Phase Manager
 * 
 * Single source of truth for breathing phase management.
 * Eliminates duplication between BreathingVisualizer and SessionOrchestrator.
 * Follows DRY, CLEAN, MODULAR principles.
 */

import { BehaviorSubject, Observable, Subscription } from 'rxjs';

export type BreathPhase = 'prepare' | 'inhale' | 'hold' | 'exhale' | 'pause' | 'complete';

export interface BreathingPattern {
  name: string;
  phases: {
    inhale: number;
    hold?: number;
    exhale: number;
    pause?: number;
  };
}

export interface PhaseState {
  currentPhase: BreathPhase;
  phaseProgress: number; // 0-100
  phaseDuration: number; // in seconds
  cycleCount: number;
  isActive: boolean;
  isPaused: boolean;
}

export interface PhaseTransition {
  from: BreathPhase;
  to: BreathPhase;
  timestamp: number;
}

/**
 * Unified phase manager singleton
 */
export class UnifiedBreathingPhaseManager {
  private static instance: UnifiedBreathingPhaseManager;
  
  private phaseState$ = new BehaviorSubject<PhaseState>({
    currentPhase: 'prepare',
    phaseProgress: 0,
    phaseDuration: 0,
    cycleCount: 0,
    isActive: false,
    isPaused: false,
  });
  
  private pattern: BreathingPattern | null = null;
  private animationFrameId: number | null = null;
  private phaseStartTime: number = 0;
  private pausedAt: number = 0;
  private accumulatedPauseTime: number = 0;
  
  // Performance tracking
  private phaseTimings: number[] = [];
  private transitionCallbacks = new Set<(transition: PhaseTransition) => void>();
  
  private constructor() {}
  
  static getInstance(): UnifiedBreathingPhaseManager {
    if (!UnifiedBreathingPhaseManager.instance) {
      UnifiedBreathingPhaseManager.instance = new UnifiedBreathingPhaseManager();
    }
    return UnifiedBreathingPhaseManager.instance;
  }
  
  /**
   * Get observable phase state
   */
  getPhaseState$(): Observable<PhaseState> {
    return this.phaseState$.asObservable();
  }
  
  /**
   * Get current phase state
   */
  getCurrentState(): PhaseState {
    return this.phaseState$.value;
  }
  
  /**
   * Start breathing cycle with pattern
   */
  startCycle(pattern: BreathingPattern): void {
    this.pattern = pattern;
    this.phaseTimings = [];
    this.accumulatedPauseTime = 0;
    
    this.updateState({
      currentPhase: 'inhale',
      phaseProgress: 0,
      phaseDuration: pattern.phases.inhale,
      cycleCount: 0,
      isActive: true,
      isPaused: false,
    });
    
    this.phaseStartTime = performance.now();
    this.animate();
  }
  
  /**
   * Pause the breathing cycle
   */
  pause(): void {
    if (!this.phaseState$.value.isActive || this.phaseState$.value.isPaused) return;
    
    this.pausedAt = performance.now();
    this.updateState({ isPaused: true });
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Resume the breathing cycle
   */
  resume(): void {
    if (!this.phaseState$.value.isActive || !this.phaseState$.value.isPaused) return;
    
    // Calculate pause duration and add to accumulated time
    const pauseDuration = performance.now() - this.pausedAt;
    this.accumulatedPauseTime += pauseDuration;
    
    this.updateState({ isPaused: false });
    this.animate();
  }
  
  /**
   * Stop the breathing cycle
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.pattern = null;
    this.phaseTimings = [];
    this.accumulatedPauseTime = 0;
    
    this.updateState({
      currentPhase: 'complete',
      phaseProgress: 0,
      phaseDuration: 0,
      cycleCount: this.phaseState$.value.cycleCount,
      isActive: false,
      isPaused: false,
    });
  }
  
  /**
   * Reset to initial state
   */
  reset(): void {
    this.stop();
    this.updateState({
      currentPhase: 'prepare',
      phaseProgress: 0,
      phaseDuration: 0,
      cycleCount: 0,
      isActive: false,
      isPaused: false,
    });
  }
  
  /**
   * Subscribe to phase transitions
   */
  onPhaseTransition(callback: (transition: PhaseTransition) => void): () => void {
    this.transitionCallbacks.add(callback);
    return () => this.transitionCallbacks.delete(callback);
  }
  
  /**
   * Get rhythm consistency score
   */
  getRhythmConsistency(): number {
    if (this.phaseTimings.length < 3) return 100;
    
    const mean = this.phaseTimings.reduce((sum, time) => sum + time, 0) / this.phaseTimings.length;
    const variance = this.phaseTimings.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / this.phaseTimings.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0, 100 - (standardDeviation * 20));
  }
  
  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.pattern || !this.phaseState$.value.isActive || this.phaseState$.value.isPaused) return;
    
    const now = performance.now();
    const adjustedElapsed = now - this.phaseStartTime - this.accumulatedPauseTime;
    const currentState = this.phaseState$.value;
    const phaseDurationMs = currentState.phaseDuration * 1000;
    
    // Calculate progress
    const progress = Math.min((adjustedElapsed / phaseDurationMs) * 100, 100);
    
    // Update progress
    this.updateState({ phaseProgress: progress });
    
    // Check for phase transition
    if (progress >= 100) {
      this.recordPhaseTiming(adjustedElapsed / 1000);
      this.transitionToNextPhase();
    }
    
    // Continue animation
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
  
  /**
   * Transition to next phase
   */
  private transitionToNextPhase(): void {
    const currentPhase = this.phaseState$.value.currentPhase;
    const nextPhase = this.getNextPhase(currentPhase);
    
    // Emit transition event
    const transition: PhaseTransition = {
      from: currentPhase,
      to: nextPhase,
      timestamp: Date.now(),
    };
    this.transitionCallbacks.forEach(cb => cb(transition));
    
    // Update cycle count if completing a cycle
    let newCycleCount = this.phaseState$.value.cycleCount;
    if (this.isEndOfCycle(currentPhase, nextPhase)) {
      newCycleCount++;
    }
    
    // Reset timing for new phase
    this.phaseStartTime = performance.now();
    this.accumulatedPauseTime = 0;
    
    // Update state
    this.updateState({
      currentPhase: nextPhase,
      phaseProgress: 0,
      phaseDuration: this.getPhaseDuration(nextPhase),
      cycleCount: newCycleCount,
    });
  }
  
  /**
   * Get next phase in sequence
   */
  private getNextPhase(currentPhase: BreathPhase): BreathPhase {
    if (!this.pattern) return 'prepare';
    
    switch (currentPhase) {
      case 'inhale':
        return this.pattern.phases.hold ? 'hold' : 'exhale';
      case 'hold':
        return 'exhale';
      case 'exhale':
        return this.pattern.phases.pause ? 'pause' : 'inhale';
      case 'pause':
        return 'inhale';
      default:
        return 'inhale';
    }
  }
  
  /**
   * Get phase duration in seconds
   */
  private getPhaseDuration(phase: BreathPhase): number {
    if (!this.pattern) return 0;
    
    switch (phase) {
      case 'inhale':
        return this.pattern.phases.inhale;
      case 'hold':
        return this.pattern.phases.hold || 0;
      case 'exhale':
        return this.pattern.phases.exhale;
      case 'pause':
        return this.pattern.phases.pause || 0;
      default:
        return 0;
    }
  }
  
  /**
   * Check if transitioning to a new cycle
   */
  private isEndOfCycle(from: BreathPhase, to: BreathPhase): boolean {
    return (from === 'pause' && to === 'inhale') || 
           (from === 'exhale' && to === 'inhale' && !this.pattern?.phases.pause);
  }
  
  /**
   * Record phase timing for consistency analysis
   */
  private recordPhaseTiming(duration: number): void {
    this.phaseTimings.push(duration);
    if (this.phaseTimings.length > 20) {
      this.phaseTimings.shift();
    }
  }
  
  /**
   * Update state and notify subscribers
   */
  private updateState(updates: Partial<PhaseState>): void {
    this.phaseState$.next({
      ...this.phaseState$.value,
      ...updates,
    });
  }
}

// Export singleton instance
export const breathingPhaseManager = UnifiedBreathingPhaseManager.getInstance();