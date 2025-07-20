/**
 * Enhanced Vision Demo Page
 * Showcases the integrated vision feedback system
 */

import React from 'react';
import { IntegratedVisionBreathingSession } from '../components/vision/IntegratedVisionBreathingSession';
import { EnhancedDualViewBreathingSession } from '../components/vision/EnhancedDualViewBreathingSession';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Eye, Brain, Share2, Coins } from 'lucide-react';

const DEMO_PATTERN = {
  name: '4-7-8 Relaxation',
  phases: {
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 2,
  },
  difficulty: 'intermediate',
  benefits: [
    'Reduces anxiety',
    'Improves sleep quality',
    'Enhances focus',
    'Promotes relaxation',
  ],
};

export default function EnhancedVisionDemo() {
  const handleSessionComplete = (metrics: any) => {
    console.log('Session completed with metrics:', metrics);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Eye className="h-6 w-6 text-primary" />
              Enhanced Vision Breathing Demo
            </CardTitle>
            <p className="text-muted-foreground">
              Experience AI-powered breathing sessions with real-time vision analysis, 
              intelligent feedback, and seamless social sharing.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Real-time Vision Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm">AI Feedback & Coaching</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Lens Social Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Flow NFT Minting</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Vision Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline">Face Movement Tracking</Badge>
              <Badge variant="outline">Eye Movement Analysis</Badge>
              <Badge variant="outline">Posture Assessment</Badge>
              <Badge variant="outline">Breathing Pattern Detection</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Real facial landmark analysis provides accurate restlessness scoring 
                and personalized feedback.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI Coaching
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline">Real-time Feedback</Badge>
              <Badge variant="outline">Contextual Guidance</Badge>
              <Badge variant="outline">Trend Analysis</Badge>
              <Badge variant="outline">Personalized Tips</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Intelligent coaching adapts to your current state and provides 
                specific recommendations for improvement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5 text-green-500" />
                Social & NFT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline">Lens Social Sharing</Badge>
              <Badge variant="outline">Flow NFT Minting</Badge>
              <Badge variant="outline">Community Insights</Badge>
              <Badge variant="outline">Achievement Tracking</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Share your sessions with vision data and mint unique NFTs 
                with verified quality metrics.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Dual View Demo */}
        <EnhancedDualViewBreathingSession
          pattern={DEMO_PATTERN}
          onSessionComplete={handleSessionComplete}
        />

        {/* Alternative: Tabbed View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alternative: Tabbed Interface</CardTitle>
            <p className="text-sm text-muted-foreground">
              For users who prefer separate views for animation and metrics
            </p>
          </CardHeader>
          <CardContent>
            <IntegratedVisionBreathingSession
              pattern={DEMO_PATTERN}
              onSessionComplete={handleSessionComplete}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Getting Started:</h4>
                <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Allow camera access when prompted</li>
                  <li>Position yourself comfortably in view</li>
                  <li>Click "Start Vision Session"</li>
                  <li>Follow the breathing visualizer</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium mb-2">During Session:</h4>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Listen for AI coaching feedback</li>
                  <li>Monitor your vision metrics in real-time</li>
                  <li>Adjust posture based on recommendations</li>
                  <li>Focus on maintaining stillness</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}