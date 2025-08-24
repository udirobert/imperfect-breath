/**
 * Mobile Session Optimizations - Enhanced Mobile Breathing Experience
 * 
 * ENHANCEMENT FIRST: Builds on existing MeditationSession with mobile optimizations
 * CLEAN: Separates mobile-specific logic from core session logic
 * PERFORMANT: Adaptive performance for mobile devices
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Smartphone, 
  Battery, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Pause,
  Play,
  Settings
} from "lucide-react";
import { useAdaptivePerformance } from "../../hooks/useAdaptivePerformance";
import { isTouchDevice } from "../../utils/mobile-detection";

interface MobileSessionOptimizationsProps {
  isSessionActive: boolean;
  onOptimizationChange?: (optimization: string, enabled: boolean) => void;
  className?: string;
}

export const MobileSessionOptimizations: React.FC<MobileSessionOptimizationsProps> = ({
  isSessionActive,
  onOptimizationChange,
  className
}) => {
  const { 
    performanceLevel, 
    batteryLevel, 
    isLowPowerMode,
    networkStatus 
  } = useAdaptivePerformance();
  
  const [optimizations, setOptimizations] = useState({
    lowPowerMode: false,
    reducedAnimations: false,
    offlineMode: false,
    hapticFeedback: true,
    autoRotationLock: false,
    keepScreenOn: true,
    audioOptimization: false
  });

  const isMobile = isTouchDevice();

  // Auto-enable optimizations based on device state
  useEffect(() => {
    const newOptimizations = { ...optimizations };
    
    // Enable low power optimizations if battery is low
    if (batteryLevel < 20 || isLowPowerMode) {
      newOptimizations.lowPowerMode = true;
      newOptimizations.reducedAnimations = true;
      newOptimizations.audioOptimization = true;
    }
    
    // Enable offline mode if network is poor
    if (networkStatus === 'offline' || networkStatus === 'slow') {
      newOptimizations.offlineMode = true;
    }
    
    // Disable haptics on older devices
    if (performanceLevel === 'low') {
      newOptimizations.hapticFeedback = false;
      newOptimizations.reducedAnimations = true;
    }
    
    setOptimizations(newOptimizations);
  }, [batteryLevel, isLowPowerMode, networkStatus, performanceLevel]);

  const handleOptimizationToggle = useCallback((key: string, enabled: boolean) => {
    setOptimizations(prev => ({
      ...prev,
      [key]: enabled
    }));
    
    onOptimizationChange?.(key, enabled);
  }, [onOptimizationChange]);

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  const optimizationItems = [
    {
      key: "lowPowerMode",
      title: "Battery Saver",
      description: "Reduce CPU usage and extend battery life",
      icon: Battery,
      enabled: optimizations.lowPowerMode,
      recommended: batteryLevel < 30,
      impact: "Reduces visual effects, saves 20-30% battery"
    },
    {
      key: "reducedAnimations",
      title: "Minimal Animations",
      description: "Simpler visuals for better performance",
      icon: Minimize2,
      enabled: optimizations.reducedAnimations,
      recommended: performanceLevel === 'low',
      impact: "Smoother experience on older devices"
    },
    {
      key: "offlineMode",
      title: "Offline Mode",
      description: "Work without internet connection",
      icon: networkStatus === 'offline' ? WifiOff : Wifi,
      enabled: optimizations.offlineMode,
      recommended: networkStatus === 'offline',
      impact: "Sessions work without internet"
    },
    {
      key: "hapticFeedback",
      title: "Haptic Feedback",
      description: "Gentle vibrations for breathing cues",
      icon: Smartphone,
      enabled: optimizations.hapticFeedback,
      recommended: performanceLevel !== 'low',
      impact: "Physical breathing rhythm guidance"
    },
    {
      key: "keepScreenOn",
      title: "Keep Screen On",
      description: "Prevent screen from dimming during sessions",
      icon: Maximize2,
      enabled: optimizations.keepScreenOn,
      recommended: true,
      impact: "Uninterrupted session experience"
    },
    {
      key: "audioOptimization",
      title: "Audio Optimization",
      description: "Optimize audio for battery and performance",
      icon: optimizations.audioOptimization ? VolumeX : Volume2,
      enabled: optimizations.audioOptimization,
      recommended: isLowPowerMode,
      impact: "Reduces audio processing load"
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Performance Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800">Mobile Optimizations</h3>
            <Badge variant="outline" className="bg-white/80">
              {performanceLevel} performance
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <Battery className={`h-4 w-4 mx-auto mb-1 ${
                batteryLevel > 50 ? 'text-green-600' : 
                batteryLevel > 20 ? 'text-yellow-600' : 'text-red-600'
              }`} />
              <div className="text-xs text-muted-foreground">{batteryLevel}% battery</div>
            </div>
            
            <div className="text-center">
              {networkStatus === 'offline' ? (
                <WifiOff className="h-4 w-4 mx-auto mb-1 text-red-600" />
              ) : (
                <Wifi className={`h-4 w-4 mx-auto mb-1 ${
                  networkStatus === 'fast' ? 'text-green-600' : 'text-yellow-600'
                }`} />
              )}
              <div className="text-xs text-muted-foreground">{networkStatus}</div>
            </div>
            
            <div className="text-center">
              <Smartphone className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-xs text-muted-foreground">
                {optimizations.hapticFeedback ? 'haptics on' : 'haptics off'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Controls */}
      <div className="space-y-3">
        {optimizationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card 
              key={item.key}
              className={`cursor-pointer transition-all ${
                item.enabled ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              } ${item.recommended ? 'ring-2 ring-blue-200' : ''}`}
              onClick={() => handleOptimizationToggle(item.key, !item.enabled)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${
                      item.enabled ? 'text-green-600' : 'text-gray-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.title}</h4>
                        {item.recommended && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-green-600 mt-1">{item.impact}</p>
                    </div>
                  </div>
                  
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    item.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                      item.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      {isSessionActive && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 text-purple-800">Session Controls</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="border-purple-300 text-purple-700"
                onClick={() => handleOptimizationToggle('autoRotationLock', !optimizations.autoRotationLock)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {optimizations.autoRotationLock ? 'Unlock Rotation' : 'Lock Rotation'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="border-purple-300 text-purple-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                More Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      {(batteryLevel < 30 || performanceLevel === 'low') && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-orange-800">Performance Tips</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              {batteryLevel < 30 && (
                <li>• Enable Battery Saver mode for longer sessions</li>
              )}
              {performanceLevel === 'low' && (
                <li>• Use Minimal Animations for smoother experience</li>
              )}
              {networkStatus === 'offline' && (
                <li>• Offline mode keeps all features working</li>
              )}
              <li>• Close other apps for best performance</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileSessionOptimizations;