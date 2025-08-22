/**
 * Unified Meditation Session Example
 *
 * Demonstrates how to use the new consolidated components:
 * - MeditationSession (unified session component)
 * - SessionRouter (migration helper)
 * - useMeditationVision (consolidated vision hook)
 * - useAdaptivePerformance (mobile optimization)
 */

import React, { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  MeditationSession,
  MeditationSessionConfig,
} from "../components/session/MeditationSession";
import { SessionRouter } from "../components/session/SessionRouter";
import { useAdaptivePerformance } from "../hooks/useAdaptivePerformance";
import { BREATHING_PATTERNS } from "../lib/breathingPatterns";

// ============================================================================
// EXAMPLE 1: Basic Meditation Session
// ============================================================================

export const BasicSessionExample: React.FC = () => {
  const [sessionActive, setSessionActive] = useState(false);

  const basicConfig: MeditationSessionConfig = {
    mode: "basic",
    pattern: {
      name: "Box Breathing",
      phases: {
        inhale: 4,
        hold: 4,
        exhale: 4,
        pause: 4,
      },
      difficulty: "beginner",
      benefits: ["Stress reduction", "Improved focus"],
    },
    enableCamera: false,
    enableAudio: true,
    autoStart: false,
  };

  const handleSessionComplete = (metrics: any) => {
    console.log("Session completed:", metrics);
    setSessionActive(false);
  };

  if (sessionActive) {
    return (
      <MeditationSession
        config={basicConfig}
        onSessionComplete={handleSessionComplete}
        onSessionExit={() => setSessionActive(false)}
      />
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Basic Meditation Session</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          A simple breathing session without camera tracking.
        </p>
        <Button onClick={() => setSessionActive(true)} className="w-full">
          Start Basic Session
        </Button>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 2: Enhanced Session with Vision
// ============================================================================

export const EnhancedSessionExample: React.FC = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const { isLowEndDevice, shouldUseBatterySaver } = useAdaptivePerformance();

  const enhancedConfig: MeditationSessionConfig = {
    mode: "enhanced",
    pattern: {
      name: "Relaxation Breath",
      phases: {
        inhale: 4,
        hold: 7,
        exhale: 8,
        pause: 0,
      },
      difficulty: "intermediate",
      benefits: ["Deep relaxation", "Anxiety relief"],
    },
    enableCamera: !isLowEndDevice, // Adaptive based on device
    enableAudio: true,
    autoStart: false,
  };

  if (sessionActive) {
    return (
      <MeditationSession
        config={enhancedConfig}
        onSessionComplete={(metrics) => {
          console.log("Enhanced session completed:", metrics);
          setSessionActive(false);
        }}
        onSessionExit={() => setSessionActive(false)}
      />
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Enhanced Session
          {shouldUseBatterySaver && (
            <Badge variant="outline" className="text-xs">
              🔋 Battery Saver
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Advanced session with face tracking and posture analysis.
        </p>
        {isLowEndDevice && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            📱 Camera disabled for optimal performance on your device
          </div>
        )}
        <Button onClick={() => setSessionActive(true)} className="w-full">
          Start Enhanced Session
        </Button>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 3: SessionRouter for Migration
// ============================================================================

export const MigrationExample: React.FC = () => {
  const [mode, setMode] = useState<"basic" | "enhanced" | "legacy">("enhanced");

  return (
    <div className="space-y-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Session Router Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm">
            The SessionRouter allows gradual migration from old components:
          </p>

          <div className="space-y-2">
            <Button
              variant={mode === "basic" ? "default" : "outline"}
              onClick={() => setMode("basic")}
              className="w-full"
            >
              Basic Mode (New)
            </Button>
            <Button
              variant={mode === "enhanced" ? "default" : "outline"}
              onClick={() => setMode("enhanced")}
              className="w-full"
            >
              Enhanced Mode (New)
            </Button>
            <Button
              variant={mode === "legacy" ? "default" : "outline"}
              onClick={() => setMode("legacy")}
              className="w-full"
            >
              Legacy Mode (Old Components)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* This would render the session based on selected mode */}
      <SessionRouter
        mode={mode}
        patternName="box"
        onSessionComplete={(metrics) =>
          console.log("Session completed:", metrics)
        }
        onSessionExit={() => console.log("Session exited")}
      />
    </div>
  );
};

// ============================================================================
// MAIN EXAMPLE COMPONENT
// ============================================================================

export const UnifiedSessionExample: React.FC = () => {
  const [currentExample, setCurrentExample] = useState<
    "basic" | "enhanced" | "migration"
  >("basic");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Unified Meditation Session Examples
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            These examples demonstrate the new consolidated, DRY architecture
            for meditation sessions with adaptive performance optimization.
          </p>
        </div>

        {/* Example selector */}
        <div className="flex justify-center space-x-4">
          <Button
            variant={currentExample === "basic" ? "default" : "outline"}
            onClick={() => setCurrentExample("basic")}
          >
            Basic Session
          </Button>
          <Button
            variant={currentExample === "enhanced" ? "default" : "outline"}
            onClick={() => setCurrentExample("enhanced")}
          >
            Enhanced Session
          </Button>
          <Button
            variant={currentExample === "migration" ? "default" : "outline"}
            onClick={() => setCurrentExample("migration")}
          >
            Migration Example
          </Button>
        </div>

        {/* Render selected example */}
        <div className="flex justify-center">
          {currentExample === "basic" && <BasicSessionExample />}
          {currentExample === "enhanced" && <EnhancedSessionExample />}
          {currentExample === "migration" && <MigrationExample />}
        </div>

        {/* Technical benefits */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>🎯 Architecture Benefits Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">
                  ✅ DRY Compliance
                </h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Single vision hook (useMeditationVision)</li>
                  <li>• Unified session management (useSession)</li>
                  <li>• Consolidated session components</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-700">⚡ Performance</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Adaptive FPS based on device</li>
                  <li>• Battery-aware optimizations</li>
                  <li>• Mobile-first responsive design</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-700">
                  🧘 Meditation UX
                </h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Silent error handling</li>
                  <li>• Breathing-inspired loading</li>
                  <li>• Calming visual feedback</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-indigo-700">
                  🔧 Maintainability
                </h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Modular component architecture</li>
                  <li>• Clean state management</li>
                  <li>• TypeScript type safety</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedSessionExample;
