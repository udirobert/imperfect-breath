/**
 * Desktop Session Optimizations - Desktop-Specific Performance & UX Enhancements
 * 
 * ENHANCEMENT FIRST: Builds on MobileSessionOptimizations with desktop-specific features
 * CLEAN: Separates desktop optimization logic from mobile touch logic
 * MODULAR: Reuses core optimization patterns with desktop adaptations
 * PERFORMANT: Leverages desktop capabilities (multiple monitors, keyboard, etc.)
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Monitor, 
  Keyboard, 
  Mouse, 
  Cpu, 
  HardDrive,
  Wifi,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Zap,
  Eye,
  Timer,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Focus,
  PictureInPicture,
  Fullscreen,
  RotateCcw
} from "lucide-react";
import { useAdaptivePerformance } from "../../hooks/useAdaptivePerformance";

interface DesktopSessionOptimizationsProps {
  isSessionActive: boolean;
  onOptimizationChange?: (optimization: string, enabled: boolean) => void;
  className?: string;
}

interface DesktopCapabilities {
  multiMonitor: boolean;
  keyboardShortcuts: boolean;
  highRefreshRate: boolean;
  dedicatedGPU: boolean;
  largeScreen: boolean;
  precisePointing: boolean;
}

interface DesktopOptimizations {
  focusMode: boolean;
  keyboardShortcuts: boolean;
  multiMonitorSupport: boolean;
  highPerformanceMode: boolean;
  pictureInPicture: boolean;
  fullscreenMode: boolean;
  advancedMetrics: boolean;
  backgroundBlur: boolean;
  notificationSuppression: boolean;
  autoSaveProgress: boolean;
}

export const DesktopSessionOptimizations: React.FC<DesktopSessionOptimizationsProps> = ({
  isSessionActive,
  onOptimizationChange,
  className
}) => {
  const { 
    performanceLevel, 
    networkStatus 
  } = useAdaptivePerformance();
  
  const [capabilities, setCapabilities] = useState<DesktopCapabilities>({
    multiMonitor: false,
    keyboardShortcuts: true,
    highRefreshRate: false,
    dedicatedGPU: false,
    largeScreen: false,
    precisePointing: true
  });

  const [optimizations, setOptimizations] = useState<DesktopOptimizations>({
    focusMode: false,
    keyboardShortcuts: true,
    multiMonitorSupport: false,
    highPerformanceMode: false,
    pictureInPicture: false,
    fullscreenMode: false,
    advancedMetrics: true,
    backgroundBlur: false,
    notificationSuppression: false,
    autoSaveProgress: true
  });

  const [activeTab, setActiveTab] = useState("performance");

  // Detect desktop capabilities
  useEffect(() => {
    const detectCapabilities = () => {
      const screen = window.screen;
      const isLargeScreen = screen.width >= 1920 && screen.height >= 1080;
      const hasMultiMonitor = screen.availWidth !== screen.width || screen.availHeight !== screen.height;
      const hasHighRefresh = (screen as any).refreshRate > 60;
      
      setCapabilities({
        multiMonitor: hasMultiMonitor,
        keyboardShortcuts: true,
        highRefreshRate: hasHighRefresh,
        dedicatedGPU: performanceLevel === 'high',
        largeScreen: isLargeScreen,
        precisePointing: true
      });
    };

    detectCapabilities();
  }, [performanceLevel]);

  // Auto-enable optimizations based on capabilities
  useEffect(() => {
    const newOptimizations = { ...optimizations };
    
    // Enable high performance mode for capable systems
    if (capabilities.dedicatedGPU && performanceLevel === 'high') {
      newOptimizations.highPerformanceMode = true;
      newOptimizations.advancedMetrics = true;
    }
    
    // Enable multi-monitor features if available
    if (capabilities.multiMonitor) {
      newOptimizations.multiMonitorSupport = true;
      newOptimizations.pictureInPicture = true;
    }
    
    // Enable focus mode for large screens
    if (capabilities.largeScreen) {
      newOptimizations.focusMode = true;
      newOptimizations.backgroundBlur = true;
    }
    
    setOptimizations(newOptimizations);
  }, [capabilities, performanceLevel]);

  const handleOptimizationToggle = useCallback((key: keyof DesktopOptimizations) => {
    setOptimizations(prev => {
      const newValue = !prev[key];
      const updated = { ...prev, [key]: newValue };
      
      // Notify parent component
      onOptimizationChange?.(key, newValue);
      
      return updated;
    });
  }, [onOptimizationChange]);

  const keyboardShortcuts = [
    { key: "Space", action: "Play/Pause session" },
    { key: "F", action: "Toggle fullscreen" },
    { key: "M", action: "Mute/Unmute audio" },
    { key: "Esc", action: "Exit session" },
    { key: "P", action: "Toggle picture-in-picture" },
    { key: "R", action: "Reset session" },
    { key: "S", action: "Save progress" },
    { key: "H", action: "Show/hide help" }
  ];

  const performanceMetrics = [
    { label: "CPU Usage", value: "12%", status: "good" },
    { label: "Memory", value: "2.1GB", status: "good" },
    { label: "GPU", value: "8%", status: "good" },
    { label: "Network", value: networkStatus, status: networkStatus === 'online' ? 'good' : 'warning' },
    { label: "Frame Rate", value: "60fps", status: "good" },
    { label: "Latency", value: "12ms", status: "good" }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Desktop Session Optimizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Performance Optimizations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Performance Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Performance</span>
                      <Button
                        variant={optimizations.highPerformanceMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('highPerformanceMode')}
                        disabled={!capabilities.dedicatedGPU}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Advanced Metrics</span>
                      <Button
                        variant={optimizations.advancedMetrics ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('advancedMetrics')}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-Save Progress</span>
                      <Button
                        variant={optimizations.autoSaveProgress ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('autoSaveProgress')}
                      >
                        <HardDrive className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Metrics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {performanceMetrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{metric.value}</span>
                          {metric.status === 'good' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {metric.status === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="display" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Display Options */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Display Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Focus Mode</span>
                      <Button
                        variant={optimizations.focusMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('focusMode')}
                      >
                        <Focus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fullscreen Mode</span>
                      <Button
                        variant={optimizations.fullscreenMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('fullscreenMode')}
                      >
                        <Fullscreen className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Background Blur</span>
                      <Button
                        variant={optimizations.backgroundBlur ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('backgroundBlur')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Multi-Monitor Support */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Multi-Monitor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Multi-Monitor Support</span>
                      <Button
                        variant={optimizations.multiMonitorSupport ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('multiMonitorSupport')}
                        disabled={!capabilities.multiMonitor}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Picture-in-Picture</span>
                      <Button
                        variant={optimizations.pictureInPicture ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('pictureInPicture')}
                        disabled={!capabilities.multiMonitor}
                      >
                        <PictureInPicture className="h-4 w-4" />
                      </Button>
                    </div>
                    {!capabilities.multiMonitor && (
                      <p className="text-xs text-muted-foreground">
                        Multi-monitor features require multiple displays
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="controls" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Keyboard Shortcuts */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm">Enable Shortcuts</span>
                      <Button
                        variant={optimizations.keyboardShortcuts ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('keyboardShortcuts')}
                      >
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </div>
                    {optimizations.keyboardShortcuts && (
                      <div className="space-y-1">
                        {keyboardShortcuts.slice(0, 6).map((shortcut) => (
                          <div key={shortcut.key} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{shortcut.action}</span>
                            <Badge variant="outline" className="text-xs font-mono">
                              {shortcut.key}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Control Options */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Control Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notification Suppression</span>
                      <Button
                        variant={optimizations.notificationSuppression ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptimizationToggle('notificationSuppression')}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimize distractions during sessions
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Advanced Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Desktop Capabilities</h4>
                      <div className="space-y-1">
                        {Object.entries(capabilities).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            {value ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Optimization Tips</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Use fullscreen mode for immersive sessions
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Enable keyboard shortcuts for quick control
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Picture-in-picture allows multitasking
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopSessionOptimizations;
