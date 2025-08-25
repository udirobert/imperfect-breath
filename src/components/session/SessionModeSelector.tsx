/**
 * Session Mode Selector
 * Clean interface for selecting breathing session modes
 * Integrates with routing system
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Play,
  Eye,
  Smartphone,
  Zap,
  Activity,
  Camera,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAdaptivePerformance } from "../../hooks/useAdaptivePerformance";

interface SessionMode {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  requirements: string[];
  recommended: boolean;
}

const SESSION_MODES: SessionMode[] = [
  {
    id: "basic",
    name: "Basic Session",
    description: "Simple breathing guidance with audio cues",
    icon: Play,
    features: ["Audio guidance", "Pattern visualization", "Progress tracking"],
    requirements: ["None"],
    recommended: false,
  },
  {
    id: "enhanced",
    name: "Enhanced Session",
    description: "Camera-based breathing analysis with real-time feedback",
    icon: Eye,
    features: [
      "Camera analysis",
      "Face mesh visualization",
      "Stillness tracking",
      "AI feedback",
    ],
    requirements: ["Camera access"],
    recommended: true,
  },
  {
    id: "advanced",
    name: "Advanced Session",
    description:
      "Complete analysis with breath patterns and posture monitoring",
    icon: TrendingUp,
    features: [
      "Breath pattern detection",
      "Posture analysis",
      "Performance monitoring",
      "Detailed metrics",
    ],
    requirements: ["Camera access", "Modern browser"],
    recommended: false,
  },
  {
    id: "mobile",
    name: "Mobile Optimized",
    description: "Touch-optimized experience with gesture controls",
    icon: Smartphone,
    features: [
      "Touch gestures",
      "Orientation handling",
      "Haptic feedback",
      "Battery optimization",
    ],
    requirements: ["Mobile device"],
    recommended: false,
  },
];

interface SessionModeSelectorProps {
  onModeSelect?: (mode: string) => void;
  className?: string;
}

export const SessionModeSelector: React.FC<SessionModeSelectorProps> = ({
  onModeSelect,
  className = "",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities } = useAdaptivePerformance();
  const isMobile = capabilities.isMobile;

  /**
   * Handle mode selection
   */
  const handleModeSelect = (mode: string) => {
    if (onModeSelect) {
      onModeSelect(mode);
    } else {
      // Navigate to session with mode
      navigate(`/session/${mode}`);
    }
  };

  /**
   * Get recommended mode based on device and capabilities
   */
  const getRecommendedMode = (): string => {
    if (isMobile) {
      return "mobile";
    }

    // Check camera availability
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      return "enhanced";
    }

    return "basic";
  };

  const recommendedMode = getRecommendedMode();

  /**
   * Check if mode is available
   */
  const isModeAvailable = (mode: SessionMode): boolean => {
    switch (mode.id) {
      case "basic":
        return true;
      case "enhanced":
      case "advanced":
        return !!(
          navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'
        );
      case "mobile":
        return isMobile;
      default:
        return true;
    }
  };

  /**
   * Render mode card
   */
  const renderModeCard = (mode: SessionMode) => {
    const isAvailable = isModeAvailable(mode);
    const isRecommended = mode.id === recommendedMode;
    const Icon = mode.icon;

    return (
      <Card
        key={mode.id}
        className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
          !isAvailable ? "opacity-50" : ""
        } ${
          isRecommended ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-white/90"
        }`}
        onClick={() => isAvailable && handleModeSelect(mode.id)}
      >
        {isRecommended && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-blue-500 text-white">
              <Zap className="w-3 h-3 mr-1" />
              Recommended
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isRecommended ? "bg-blue-500" : "bg-gray-500"
              }`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            {mode.name}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">{mode.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Features */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Features:
            </h4>
            <div className="space-y-1">
              {mode.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Requirements:
            </h4>
            <div className="space-y-1">
              {mode.requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <div
                    className={`w-1 h-1 rounded-full ${
                      req === "None"
                        ? "bg-green-500"
                        : isAvailable
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  {req}
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <Button
            className="w-full mt-4"
            variant={isRecommended ? "default" : "outline"}
            disabled={!isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              handleModeSelect(mode.id);
            }}
          >
            {isAvailable ? "Start Session" : "Not Available"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Choose Your Session Mode
        </h2>
        <p className="text-gray-600">
          Select the breathing session experience that works best for you
        </p>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SESSION_MODES.map(renderModeCard)}
      </div>

      {/* Device info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Gauge className="h-4 w-4" />
            <span>
              Device:{" "}
              {isMobile
                ? "Mobile"
                : "Desktop"}{" "}
              • Camera: {navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' ? "Available" : "Not Available"}{" "}
              • Recommended:{" "}
              {SESSION_MODES.find((m) => m.id === recommendedMode)?.name}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};