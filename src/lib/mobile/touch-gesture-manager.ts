/**
 * Touch Gesture Manager
 * Handles mobile-specific touch interactions for breathing sessions
 * Optimized for iOS and Android devices
 */

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureConfig {
  swipeThreshold: number;
  tapThreshold: number;
  doubleTapDelay: number;
  longPressDelay: number;
  pinchThreshold: number;
}

interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: (point: TouchPoint) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onLongPress?: (point: TouchPoint) => void;
  onPinchZoom?: (scale: number) => void;
  onRotate?: (angle: number) => void;
}

export class TouchGestureManager {
  private element: HTMLElement;
  private callbacks: GestureCallbacks;
  private config: GestureConfig;
  
  // Touch tracking
  private touches: Map<number, TouchPoint> = new Map();
  private startTouch: TouchPoint | null = null;
  private lastTap: TouchPoint | null = null;
  private longPressTimer: NodeJS.Timeout | null = null;
  
  // Gesture state
  private isGestureActive = false;
  private initialDistance = 0;
  private initialAngle = 0;
  
  constructor(
    element: HTMLElement,
    callbacks: GestureCallbacks,
    config: Partial<GestureConfig> = {}
  ) {
    this.element = element;
    this.callbacks = callbacks;
    this.config = {
      swipeThreshold: 50,
      tapThreshold: 10,
      doubleTapDelay: 300,
      longPressDelay: 500,
      pinchThreshold: 10,
      ...config,
    };
    
    this.setupEventListeners();
  }
  
  /**
   * Setup touch event listeners with passive optimization
   */
  private setupEventListeners(): void {
    // Use passive listeners for better performance
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
    
    // Prevent default behaviors that interfere with breathing sessions
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
    this.element.addEventListener('selectstart', (e) => e.preventDefault());
  }
  
  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault(); // Prevent scrolling during breathing sessions
    
    const touch = event.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
    
    // Store touch points
    for (let i = 0; i < event.touches.length; i++) {
      const t = event.touches[i];
      this.touches.set(t.identifier, {
        x: t.clientX,
        y: t.clientY,
        timestamp: Date.now(),
      });
    }
    
    // Single touch gestures
    if (event.touches.length === 1) {
      this.startTouch = touchPoint;
      this.startLongPressTimer(touchPoint);
    }
    
    // Multi-touch gestures
    if (event.touches.length === 2) {
      this.handleMultiTouchStart(event);
    }
  }
  
  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    // Update touch positions
    for (let i = 0; i < event.touches.length; i++) {
      const t = event.touches[i];
      this.touches.set(t.identifier, {
        x: t.clientX,
        y: t.clientY,
        timestamp: Date.now(),
      });
    }
    
    // Cancel long press if moving
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Handle multi-touch gestures
    if (event.touches.length === 2) {
      this.handleMultiTouchMove(event);
    }
  }
  
  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Handle single touch end
    if (event.touches.length === 0 && this.startTouch) {
      const endTouch = event.changedTouches[0];
      const endPoint: TouchPoint = {
        x: endTouch.clientX,
        y: endTouch.clientY,
        timestamp: Date.now(),
      };
      
      this.handleSingleTouchEnd(this.startTouch, endPoint);
      this.startTouch = null;
    }
    
    // Clean up touch tracking
    for (let i = 0; i < event.changedTouches.length; i++) {
      const t = event.changedTouches[i];
      this.touches.delete(t.identifier);
    }
    
    // Reset multi-touch state
    if (event.touches.length < 2) {
      this.isGestureActive = false;
      this.initialDistance = 0;
      this.initialAngle = 0;
    }
  }
  
  /**
   * Handle touch cancel
   */
  private handleTouchCancel(event: TouchEvent): void {
    this.touches.clear();
    this.startTouch = null;
    this.isGestureActive = false;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
  
  /**
   * Handle single touch end - detect taps and swipes
   */
  private handleSingleTouchEnd(start: TouchPoint, end: TouchPoint): void {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = end.timestamp - start.timestamp;
    
    // Detect tap vs swipe
    if (distance < this.config.tapThreshold && duration < 300) {
      this.handleTap(end);
    } else if (distance > this.config.swipeThreshold) {
      this.handleSwipe(deltaX, deltaY);
    }
  }
  
  /**
   * Handle tap gesture
   */
  private handleTap(point: TouchPoint): void {
    // Check for double tap
    if (this.lastTap && 
        (point.timestamp - this.lastTap.timestamp) < this.config.doubleTapDelay) {
      
      const distance = Math.sqrt(
        Math.pow(point.x - this.lastTap.x, 2) + 
        Math.pow(point.y - this.lastTap.y, 2)
      );
      
      if (distance < this.config.tapThreshold * 2) {
        this.callbacks.onDoubleTap?.(point);
        this.lastTap = null;
        return;
      }
    }
    
    // Single tap
    this.callbacks.onTap?.(point);
    this.lastTap = point;
    
    // Clear last tap after delay
    setTimeout(() => {
      if (this.lastTap === point) {
        this.lastTap = null;
      }
    }, this.config.doubleTapDelay);
  }
  
  /**
   * Handle swipe gesture
   */
  private handleSwipe(deltaX: number, deltaY: number): void {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Determine primary direction
    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.callbacks.onSwipeRight?.();
      } else {
        this.callbacks.onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.callbacks.onSwipeDown?.();
      } else {
        this.callbacks.onSwipeUp?.();
      }
    }
  }
  
  /**
   * Start long press timer
   */
  private startLongPressTimer(point: TouchPoint): void {
    this.longPressTimer = setTimeout(() => {
      this.callbacks.onLongPress?.(point);
      this.longPressTimer = null;
    }, this.config.longPressDelay);
  }
  
  /**
   * Handle multi-touch start
   */
  private handleMultiTouchStart(event: TouchEvent): void {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    this.initialDistance = this.getDistance(touch1, touch2);
    this.initialAngle = this.getAngle(touch1, touch2);
    this.isGestureActive = true;
  }
  
  /**
   * Handle multi-touch move
   */
  private handleMultiTouchMove(event: TouchEvent): void {
    if (!this.isGestureActive) return;
    
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const currentDistance = this.getDistance(touch1, touch2);
    const currentAngle = this.getAngle(touch1, touch2);
    
    // Pinch zoom detection
    const distanceDelta = currentDistance - this.initialDistance;
    if (Math.abs(distanceDelta) > this.config.pinchThreshold) {
      const scale = currentDistance / this.initialDistance;
      this.callbacks.onPinchZoom?.(scale);
    }
    
    // Rotation detection
    const angleDelta = currentAngle - this.initialAngle;
    if (Math.abs(angleDelta) > 0.1) { // ~5.7 degrees
      this.callbacks.onRotate?.(angleDelta);
    }
  }
  
  /**
   * Calculate distance between two touches
   */
  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate angle between two touches
   */
  private getAngle(touch1: Touch, touch2: Touch): number {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    );
  }
  
  /**
   * Update callbacks
   */
  public updateCallbacks(newCallbacks: Partial<GestureCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }
  
  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Destroy gesture manager
   */
  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    this.touches.clear();
  }
}