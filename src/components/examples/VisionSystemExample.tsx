import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Activity, 
  Settings, 
  Play, 
  Square,
  Eye,
  Zap,
  BarChart3
} from 'lucide-react';

import { 
  useVisionSystem,
  formatMetricsForDisplay,
  ZenVisionCoach,
  isVisionSupported
} from '@/lib/vision';

const EXAMPLE_PATTERN = {
  name: '4-7-8 Relaxation',
  phases: {
    inhale: 4,
    hold: 7,
    exhale: 8
  },
  targetRate: 8,
  difficulty: 'beginner',
  benefits: ['Reduces anxiety', 'Improves sleep', 'Calms nervous system']
};

export const VisionSystemExample: React.FC = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [zenCoaching, setZenCoaching] = useState<string>('');
  const [zenCoach] = useState(() => ZenVisionCoach.getInstance());

  const {
    isInitialized,
    isActive,
    tier,
    mode,
    metrics,
    performanceMetrics,
    error,
    cameraPermission,
    initialize,
    start,
    stop,
    switchMode,
    getLoadedModels,
    getCacheSize
  } = useVision({
    autoInitialize: false,
    defaultMode: 'auto',
    metricsInterval: 1000
  });

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive]);

  // Zen coaching integration
  useEffect(() => {
    if (metrics && sessionActive) {
      zenCoach.analyzeAndCoach(metrics, EXAMPLE_PATTERN, sessionDuration)
        .then(coaching => {
          setZenCoaching(coaching.message);
        })
        .catch(console.error);
    }
  }, [metrics, sessionActive, sessionDuration, zenCoach]);

  const handleStartSession = async () => {
    try {
      if (!isInitialized) {
        await initialize();
      }
      
      if (!isActive) {
        await start();
      }
      
      zenCoach.startSession();
      setSessionActive(true);
      setSessionDuration(0);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleStopSession = async () => {
    try {
      setSessionActive(false);
      
      if (metrics) {
        const assessment = zenCoach.getSessionAssessment(metrics, sessionDuration);
        console.log('Session Assessment:', assessment);
      }
      
      zenCoach.reset();
    } catch (err) {
      console.error('Failed to stop session:', err);
    }
  };

  const formattedMetrics = formatMetricsForDisplay(metrics);

  if (!isVisionSupported()) {
    return (
      <Alert>
        <AlertDescription>
          Vision features are not supported in this browser. Please use a modern browser with camera support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Vision System Example
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={tier === 'premium' ? 'default' : tier === 'standard' ? 'secondary' : 'outline'}>
                {tier}
              </Badge>
              <Badge variant="outline">
                {mode}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">System Status</h3>
              <div className="space-y-1 text-sm">
                <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
                <div>Camera Active: {isActive ? '✅' : '❌'}</div>
                <div>Permission: {cameraPermission}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Performance</h3>
              <div className="space-y-1 text-sm">
                <div>Models: {getLoadedModels().length}</div>
                <div>Cache: {getCacheSize()}</div>
                <div>FPS: {performanceMetrics?.frameRate.toFixed(1) || 'N/A'}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Session</h3>
              <div className="space-y-1 text-sm">
                <div>Duration: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</div>
                <div>Pattern: {EXAMPLE_PATTERN.name}</div>
                <div>Active: {sessionActive ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => initialize()}
              disabled={isInitialized}
              variant="outline"
            >
              <Camera className="w-4 h-4 mr-2" />
              Initialize Vision
            </Button>
            
            <Button
              onClick={sessionActive ? handleStopSession : handleStartSession}
              variant={sessionActive ? 'destructive' : 'default'}
            >
              {sessionActive ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Session
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              {(['performance', 'auto', 'quality'] as const).map((newMode) => (
                <Button
                  key={newMode}
                  onClick={() => switchMode(newMode)}
                  variant={mode === newMode ? 'default' : 'outline'}
                  size="sm"
                >
                  {newMode === 'performance' && <Zap className="w-4 h-4 mr-1" />}
                  {newMode === 'auto' && <Activity className="w-4 h-4 mr-1" />}
                  {newMode === 'quality' && <BarChart3 className="w-4 h-4 mr-1" />}
                  {newMode}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Display */}
      {formattedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-Time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formattedMetrics.confidence}%
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              
              {formattedMetrics.stillness !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formattedMetrics.stillness}%
                  </div>
                  <div className="text-sm text-gray-600">Stillness</div>
                </div>
              )}
              
              {formattedMetrics.breathingRate !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formattedMetrics.breathingRate}
                  </div>
                  <div className="text-sm text-gray-600">Breaths/min</div>
                </div>
              )}
              
              {formattedMetrics.posture !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formattedMetrics.posture}%
                  </div>
                  <div className="text-sm text-gray-600">Posture</div>
                </div>
              )}
              
              {formattedMetrics.calmness !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formattedMetrics.calmness}%
                  </div>
                  <div className="text-sm text-gray-600">Calmness</div>
                </div>
              )}
              
              {formattedMetrics.breathingAccuracy !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formattedMetrics.breathingAccuracy}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zen Coaching */}
      {zenCoaching && sessionActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧘‍♀️ Zen's Coaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-blue-800">{zenCoaching}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{Math.round(performanceMetrics.cpuUsage)}%</div>
                <div className="text-sm text-gray-600">CPU Usage</div>
              </div>
              <div>
                <div className="text-lg font-bold">{Math.round(performanceMetrics.memoryUsage)}%</div>
                <div className="text-sm text-gray-600">Memory</div>
              </div>
              <div>
                <div className="text-lg font-bold">{Math.round(performanceMetrics.frameRate)}</div>
                <div className="text-sm text-gray-600">FPS</div>
              </div>
              <div>
                <div className="text-lg font-bold">{performanceMetrics.frameDrops}</div>
                <div className="text-sm text-gray-600">Drops</div>
              </div>
              <div>
                <div className="text-lg font-bold">{Math.round(performanceMetrics.batteryImpact)}%</div>
                <div className="text-sm text-gray-600">Battery</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
