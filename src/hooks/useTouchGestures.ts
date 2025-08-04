/**
 * Touch Gestures Hook - Enhanced mobile interaction
 * Provides swipe and tap gesture recognition for breathing sessions
 */

import { useCallback, useRef, useEffect } from 'react';

interface TouchGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number; // Minimum distance for swipe
  tapThreshold?: number; // Maximum time for tap
  longPressThreshold?: number; // Minimum time for long press
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export const useTouchGestures = (config: TouchGestureConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    swipeThreshold = 50,
    tapThreshold = 300,
    longPressThreshold = 500,
  } = config;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const lastTap = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        longPressTimer.current = null;
      }, longPressThreshold);
    }
  }, [onLongPress, longPressThreshold]);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if finger moves
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const now = Date.now();
    
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
    };

    // Cancel long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for swipe gestures
    if (distance > swipeThreshold) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontal) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
      return;
    }

    // Check for tap gestures
    if (deltaTime < tapThreshold && distance < 20) {
      const timeSinceLastTap = now - lastTap.current;
      
      if (timeSinceLastTap < 300 && onDoubleTap) {
        // Double tap
        onDoubleTap();
        lastTap.current = 0; // Reset to prevent triple tap
      } else {
        // Single tap
        if (onTap) {
          onTap();
        }
        lastTap.current = now;
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, swipeThreshold, tapThreshold]);

  const attachGestures = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { attachGestures };
};