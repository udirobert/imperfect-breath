/**
 * Orientation Manager
 * Handles device orientation changes and mobile layout optimizations
 */

interface OrientationConfig {
  enableAutoRotation: boolean;
  preferredOrientation: 'portrait' | 'landscape' | 'auto';
  lockDuringSession: boolean;
  adaptiveLayout: boolean;
}

interface OrientationState {
  current: 'portrait' | 'landscape';
  angle: number;
  isLocked: boolean;
  screenDimensions: {
    width: number;
    height: number;
    ratio: number;
  };
}

type OrientationCallback = (state: OrientationState) => void;

export class OrientationManager {
  private static instance: OrientationManager;
  private config: OrientationConfig;
  private callbacks: Set<OrientationCallback> = new Set();
  private currentState: OrientationState;
  private isSessionActive = false;

  static getInstance(): OrientationManager {
    if (!OrientationManager.instance) {
      OrientationManager.instance = new OrientationManager();
    }
    return OrientationManager.instance;
  }

  constructor() {
    this.config = {
      enableAutoRotation: true,
      preferredOrientation: 'auto',
      lockDuringSession: false,
      adaptiveLayout: true,
    };

    this.currentState = this.getCurrentState();
    this.setupEventListeners();
  }

  /**
   * Get current orientation state
   */
  private getCurrentState(): OrientationState {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // Get device orientation angle if available
    let angle = 0;
    if (screen.orientation) {
      angle = screen.orientation.angle;
    } else if (window.orientation !== undefined) {
      angle = window.orientation;
    }

    return {
      current: orientation,
      angle,
      isLocked: false,
      screenDimensions: {
        width,
        height,
        ratio: width / height,
      },
    };
  }

  /**
   * Setup orientation event listeners
   */
  private setupEventListeners(): void {
    // Modern orientation API
    if (screen.orientation) {
      screen.orientation.addEventListener('change', this.handleOrientationChange.bind(this));
    }

    // Legacy orientation API
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Resize events for layout adaptation
    window.addEventListener('resize', this.handleResize.bind(this));

    // Fullscreen API events
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    // Delay to ensure dimensions are updated
    setTimeout(() => {
      const newState = this.getCurrentState();
      const hasChanged = 
        newState.current !== this.currentState.current ||
        newState.angle !== this.currentState.angle;

      if (hasChanged) {
        this.currentState = newState;
        this.notifyCallbacks();
        
        // Apply adaptive optimizations
        if (this.config.adaptiveLayout) {
          this.applyOrientationOptimizations();
        }
      }
    }, 100);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const newState = this.getCurrentState();
    this.currentState = newState;
    this.notifyCallbacks();
  }

  /**
   * Handle fullscreen changes
   */
  private handleFullscreenChange(): void {
    const isFullscreen = !!document.fullscreenElement;
    
    if (isFullscreen && this.config.lockDuringSession && this.isSessionActive) {
      this.lockOrientation(this.config.preferredOrientation);
    } else if (!isFullscreen) {
      this.unlockOrientation();
    }
  }

  /**
   * Apply orientation-specific optimizations
   */
  private applyOrientationOptimizations(): void {
    const { current, screenDimensions } = this.currentState;
    
    // Add orientation class to body for CSS targeting
    document.body.classList.remove('orientation-portrait', 'orientation-landscape');
    document.body.classList.add(`orientation-${current}`);

    // Set CSS custom properties for responsive design
    document.documentElement.style.setProperty('--screen-width', `${screenDimensions.width}px`);
    document.documentElement.style.setProperty('--screen-height', `${screenDimensions.height}px`);
    document.documentElement.style.setProperty('--screen-ratio', screenDimensions.ratio.toString());

    // Mobile-specific optimizations
    if (this.isMobileDevice()) {
      this.applyMobileOptimizations();
    }
  }

  /**
   * Apply mobile-specific optimizations
   */
  private applyMobileOptimizations(): void {
    const { current } = this.currentState;
    
    // Viewport meta tag optimization
    this.updateViewportMeta();
    
    // Address bar handling for mobile browsers
    if (current === 'landscape') {
      this.hideAddressBar();
    }
    
    // Touch action optimization
    this.optimizeTouchActions();
  }

  /**
   * Update viewport meta tag for optimal mobile experience
   */
  private updateViewportMeta(): void {
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    const { current } = this.currentState;
    
    if (current === 'landscape') {
      // Landscape optimizations
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    } else {
      // Portrait optimizations
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
  }

  /**
   * Hide address bar on mobile browsers
   */
  private hideAddressBar(): void {
    // Scroll to hide address bar
    setTimeout(() => {
      window.scrollTo(0, 1);
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }, 500);
  }

  /**
   * Optimize touch actions for current orientation
   */
  private optimizeTouchActions(): void {
    const { current } = this.currentState;
    
    // Prevent pull-to-refresh and overscroll
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'manipulation';
    
    if (current === 'landscape') {
      // Landscape-specific touch optimizations
      document.body.style.overflow = 'hidden';
    } else {
      // Portrait-specific touch optimizations
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Lock orientation to specific mode
   */
  public async lockOrientation(orientation: 'portrait' | 'landscape' | 'auto'): Promise<boolean> {
    if (!screen.orientation || !screen.orientation.lock) {
      console.warn('Orientation lock not supported');
      return false;
    }

    try {
      let lockOrientation: OrientationLockType;
      
      switch (orientation) {
        case 'portrait':
          lockOrientation = 'portrait-primary';
          break;
        case 'landscape':
          lockOrientation = 'landscape-primary';
          break;
        default:
          return this.unlockOrientation();
      }

      await screen.orientation.lock(lockOrientation);
      this.currentState.isLocked = true;
      console.log(`Orientation locked to ${orientation}`);
      return true;
      
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
      return false;
    }
  }

  /**
   * Unlock orientation
   */
  public unlockOrientation(): boolean {
    if (!screen.orientation || !screen.orientation.unlock) {
      return false;
    }

    try {
      screen.orientation.unlock();
      this.currentState.isLocked = false;
      console.log('Orientation unlocked');
      return true;
    } catch (error) {
      console.warn('Failed to unlock orientation:', error);
      return false;
    }
  }

  /**
   * Set session state
   */
  public setSessionActive(active: boolean): void {
    this.isSessionActive = active;
    
    if (active && this.config.lockDuringSession) {
      this.lockOrientation(this.config.preferredOrientation);
    } else if (!active) {
      this.unlockOrientation();
    }
  }

  /**
   * Get optimal layout configuration for current orientation
   */
  public getLayoutConfig(): {
    orientation: 'portrait' | 'landscape';
    containerClass: string;
    videoAspectRatio: string;
    controlsPosition: 'bottom' | 'side';
    showFullControls: boolean;
  } {
    const { current, screenDimensions } = this.currentState;
    
    if (current === 'landscape') {
      return {
        orientation: 'landscape',
        containerClass: 'flex-row h-screen',
        videoAspectRatio: '16/9',
        controlsPosition: 'side',
        showFullControls: true,
      };
    } else {
      return {
        orientation: 'portrait',
        containerClass: 'flex-col min-h-screen',
        videoAspectRatio: '4/3',
        controlsPosition: 'bottom',
        showFullControls: screenDimensions.height > 600,
      };
    }
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  /**
   * Get device type and capabilities
   */
  public getDeviceInfo(): {
    type: 'mobile' | 'tablet' | 'desktop';
    hasTouch: boolean;
    supportsOrientationLock: boolean;
    supportsFullscreen: boolean;
    screenSize: 'small' | 'medium' | 'large';
  } {
    const { width, height } = this.currentState.screenDimensions;
    const maxDimension = Math.max(width, height);
    
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    let screenSize: 'small' | 'medium' | 'large' = 'large';
    
    if (this.isMobileDevice()) {
      if (maxDimension < 768) {
        type = 'mobile';
        screenSize = 'small';
      } else {
        type = 'tablet';
        screenSize = 'medium';
      }
    }

    return {
      type,
      hasTouch: 'ontouchstart' in window,
      supportsOrientationLock: !!(screen.orientation && screen.orientation.lock),
      supportsFullscreen: !!document.documentElement.requestFullscreen,
      screenSize,
    };
  }

  /**
   * Subscribe to orientation changes
   */
  public subscribe(callback: OrientationCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current state
    callback(this.currentState);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.error('Orientation callback error:', error);
      }
    });
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<OrientationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply new configuration
    if (this.isSessionActive && this.config.lockDuringSession) {
      this.lockOrientation(this.config.preferredOrientation);
    }
  }

  /**
   * Get current state
   */
  public getState(): OrientationState {
    return { ...this.currentState };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.callbacks.clear();
    this.unlockOrientation();
    
    // Remove event listeners
    if (screen.orientation) {
      screen.orientation.removeEventListener('change', this.handleOrientationChange.bind(this));
    }
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
  }
}