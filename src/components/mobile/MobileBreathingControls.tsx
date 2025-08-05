/**
 * Mobile Breathing Controls
 * Touch-optimized controls for mobile breathing sessions
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  Camera,
  CameraOff,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { TouchGestureManager } from '../../lib/mobile/touch-gesture-manager';

interface MobileBreathingControlsProps {
  isSessionActive: boolean;
  isPaused: boolean;
  isAudioEnabled: boolean;
  isCameraEnabled: boolean;
  isFullscreen: boolean;
  currentPhase: string;
  cycleCount: number;
  onPlayPause: () => void;
  onStop: () => void;
  onToggleAudio: () => void;
  onToggleCamera: () => void;
  onToggleFullscreen: () => void;
  onReset: () => void;
  onSettings: () => void;
}

export const MobileBreathingControls: React.FC<MobileBreathingControlsProps> = ({
  isSessionActive,
  isPaused,
  isAudioEnabled,
  isCameraEnabled,
  isFullscreen,
  currentPhase,
  cycleCount,
  onPlayPause,
  onStop,
  onToggleAudio,
  onToggleCamera,
  onToggleFullscreen,
  onReset,
  onSettings,
}) => {
  const controlsRef = useRef<HTMLDivElement>(null);
  const gestureManager = useRef<TouchGestureManager | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Auto-hide controls after inactivity
  useEffect(() => {
    const timer = setInterval(() => {
      if (isSessionActive && Date.now() - lastInteraction > 5000) {
        setShowControls(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionActive, lastInteraction]);

  // Setup gesture controls
  useEffect(() => {
    if (!controlsRef.current) return;

    gestureManager.current = new TouchGestureManager(
      controlsRef.current,
      {
        onTap: () => {
          setShowControls(true);
          setLastInteraction(Date.now());
        },
        onDoubleTap: () => {
          onPlayPause();
          setLastInteraction(Date.now());
        },
        onSwipeLeft: () => {
          if (isSessionActive) {
            onStop();
          }
          setLastInteraction(Date.now());
        },
        onSwipeRight: () => {
          onToggleCamera();
          setLastInteraction(Date.now());
        },
        onSwipeUp: () => {
          onToggleFullscreen();
          setLastInteraction(Date.now());
        },
        onSwipeDown: () => {
          if (isFullscreen) {
            onToggleFullscreen();
          } else {
            setShowControls(!showControls);
          }
          setLastInteraction(Date.now());
        },
        onLongPress: () => {
          onReset();
          setLastInteraction(Date.now());
        },
        onPinchZoom: (scale) => {
          if (scale > 1.2) {
            onToggleFullscreen();
          }
          setLastInteraction(Date.now());
        },
      },
      {
        swipeThreshold: 60,
        tapThreshold: 15,
        doubleTapDelay: 400,
        longPressDelay: 800,
      }
    );

    return () => {
      gestureManager.current?.destroy();
    };
  }, [
    onPlayPause,
    onStop,
    onToggleCamera,
    onToggleFullscreen,
    onReset,
    isSessionActive,
    isFullscreen,
    showControls,
  ]);

  const handleInteraction = () => {
    setShowControls(true);
    setLastInteraction(Date.now());
  };

  return (
    <div 
      ref={controlsRef}
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Gesture instruction overlay */}
      {!isSessionActive && (
        <div className="absolute top-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <div className="text-center">
            <p className="font-medium mb-2">Touch Gestures</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>• Double tap: Play/Pause</div>
              <div>• Swipe left: Stop</div>
              <div>• Swipe right: Camera</div>
              <div>• Swipe up: Fullscreen</div>
              <div>• Long press: Reset</div>
              <div>• Pinch: Zoom</div>
            </div>
          </div>
        </div>
      )}

      {/* Session status */}
      {isSessionActive && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Badge 
            variant="secondary" 
            className="bg-black/70 text-white border-0"
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              currentPhase === 'inhale' ? 'bg-blue-400 animate-pulse' :
              currentPhase === 'hold' ? 'bg-yellow-400 animate-pulse' :
              currentPhase === 'exhale' ? 'bg-green-400 animate-pulse' :
              'bg-purple-400 animate-pulse'
            }`} />
            {currentPhase} • Cycle {cycleCount}
          </Badge>
          
          <div className="flex gap-2">
            {isCameraEnabled && (
              <Badge variant="secondary" className="bg-green-500/80 text-white border-0">
                <Camera className="w-3 h-3 mr-1" />
                Vision
              </Badge>
            )}
            {isAudioEnabled && (
              <Badge variant="secondary" className="bg-purple-500/80 text-white border-0">
                <Volume2 className="w-3 h-3 mr-1" />
                Audio
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Main controls */}
      <div className="absolute bottom-8 left-4 right-4">
        <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-4">
          {/* Primary controls */}
          <div className="flex justify-center items-center gap-6 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onToggleAudio();
                handleInteraction();
              }}
              className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onPlayPause();
                handleInteraction();
              }}
              className="w-16 h-16 rounded-full bg-white/30 text-white hover:bg-white/40"
            >
              {isSessionActive && !isPaused ? <Pause size={32} /> : <Play size={32} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onStop();
                handleInteraction();
              }}
              className="w-12 h-12 rounded-full bg-red-500/80 text-white hover:bg-red-500/90"
            >
              <Square size={24} />
            </Button>
          </div>

          {/* Secondary controls */}
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onToggleCamera();
                handleInteraction();
              }}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isCameraEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onReset();
                handleInteraction();
              }}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <RotateCcw size={20} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onToggleFullscreen();
                handleInteraction();
              }}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onSettings();
                handleInteraction();
              }}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <Settings size={20} />
            </Button>
          </div>

          {/* Gesture hints */}
          <div className="text-center mt-3 text-xs text-white/60">
            Double tap to play/pause • Swipe for quick actions
          </div>
        </div>
      </div>

      {/* Touch target for showing controls */}
      {!showControls && (
        <div 
          className="absolute inset-0 bg-transparent"
          onClick={handleInteraction}
          onTouchStart={handleInteraction}
        />
      )}
    </div>
  );
};