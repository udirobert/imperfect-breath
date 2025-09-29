/**
 * Adaptive Session Flow - Differentiated UX by Session Type
 * 
 * ENHANCEMENT FIRST: Builds on EnhancedSessionEntryPoints with adaptive flows
 * CLEAN: Separates beginner vs advanced user journeys
 * WELLNESS UX: Optimizes for user readiness and success
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { isTouchDevice } from "../../utils/mobile-detection";
import { 
  Heart, 
  Camera, 
  Zap, 
  Clock, 
  Users, 
  CheckCircle,
  ArrowRight,
  Info,
  Sparkles,
  Timer,
  Brain,
  Target,
  Award
} from "lucide-react";
import { ContextualGuidance } from "../onboarding/ContextualGuidance";
import { PatternSelection } from "../session/PatternSelection";
import { SmartPatternRecommendations, type RecommendationContext } from "../../lib/recommendations/SmartPatternRecommendations";
import { cn } from "../../lib/utils";

interface AdaptiveSessionFlowProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

type FlowState = 
  | "selection" 
  | "guidance-classic" 
  | "guidance-enhanced" 
  | "pattern-selection"
  | "ready-classic"
  | "ready-enhanced";

export const AdaptiveSessionFlow: React.FC<AdaptiveSessionFlowProps> = ({
  variant,
  className = "",
}) => {
  const [flowState, setFlowState] = useState<FlowState>("selection");
  const [selectedSessionType, setSelectedSessionType] = useState<"classic" | "enhanced" | null>(null);
  const navigate = useNavigate();
  const isMobile = isTouchDevice();
  const effectiveVariant = variant || (isMobile ? "mobile" : "desktop");

  const sessionTypes = [
    {
      key: "classic",
      title: "Start Breathing",
      subtitle: "Instant Success",
      description: "Begin with proven box breathing - guaranteed to work in 30 seconds",
      quickBenefits: ["Immediate stress relief", "No choices needed", "Proven technique"],
      badge: "Perfect first step",
      icon: Heart,
      timeToValue: "30 seconds",
      userCount: "10k+ daily users",
      successRate: "98%",
      flow: "Fixed pattern → Session → Unlock more patterns",
      buttonText: "Start Immediately",
      colorScheme: "green",
    },
    {
      key: "enhanced",
      title: "AI-Guided Session",
      subtitle: "Personalized Experience",
      description: "Choose your pattern, get AI coaching, and track detailed progress",
      quickBenefits: ["Pattern selection", "AI feedback", "Advanced metrics"],
      badge: "Most customizable",
      icon: Camera,
      timeToValue: "1 minute",
      userCount: "5k+ daily users", 
      successRate: "94%",
      flow: "Choose pattern → AI guidance → Enhanced session",
      buttonText: "Customize & Start",
      colorScheme: "blue",
    },
  ];

  const getColorClasses = (scheme: string, variant: "bg" | "border" | "text" | "button") => {
    const colors = {
      green: {
        bg: "bg-green-50",
        border: "border-green-300",
        text: "text-green-800",
        button: "bg-green-600 hover:bg-green-700"
      },
      blue: {
        bg: "bg-blue-50", 
        border: "border-blue-300",
        text: "text-blue-800",
        button: "bg-blue-600 hover:bg-blue-700"
      }
    };
    return colors[scheme as keyof typeof colors]?.[variant] || colors.green[variant];
  };

  // Classic Session Flow: Immediate start with box breathing
  const handleClassicSessionSelect = () => {
    setSelectedSessionType("classic");
    setFlowState("guidance-classic");
  };

  const handleClassicProceed = () => {
    // Go directly to session with box breathing (no pattern selection)
    navigate("/session/classic?pattern=box&flow=adaptive");
  };

  // Enhanced Session Flow: Pattern selection first
  const handleEnhancedSessionSelect = () => {
    setSelectedSessionType("enhanced");
    setFlowState("pattern-selection");
  };

  const handlePatternSelected = (pattern: any) => {
    if (pattern) {
      // Store selected pattern and proceed to guidance
      localStorage.setItem("selectedPattern", JSON.stringify(pattern));
      setFlowState("guidance-enhanced");
    }
  };

  const handleEnhancedProceed = () => {
    // Go to enhanced session with selected pattern
    navigate("/session/enhanced?flow=adaptive");
  };

  const handleBackToSelection = () => {
    setFlowState("selection");
    setSelectedSessionType(null);
  };

  // Show contextual guidance for classic (after session type selection)
  if (flowState === "guidance-classic") {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <div className="mb-6 text-center">
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Classic Session - Box Breathing
          </Badge>
        </div>
        <ContextualGuidance
          sessionType="classic"
          onProceed={handleClassicProceed}
          onBack={handleBackToSelection}
        />
      </div>
    );
  }

  // Show pattern selection for enhanced (before guidance)
  if (flowState === "pattern-selection") {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="mb-8 text-center">
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 mb-4">
            Enhanced Session - Choose Your Pattern
          </Badge>
          <h2 className="text-2xl font-bold mb-2">What do you want to achieve?</h2>
          <p className="text-muted-foreground">
            Select a breathing pattern that matches your current goal
          </p>
        </div>
        
        <PatternSelection
          userLibrary={[]}
          onPatternSelect={handlePatternSelected}
          onCreateNew={() => navigate("/instructor-onboarding?focus=patterns")}
        />
        
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleBackToSelection}>
            ← Back to Session Types
          </Button>
        </div>
      </div>
    );
  }

  // Show contextual guidance for enhanced (after pattern selection)
  if (flowState === "guidance-enhanced") {
    const selectedPattern = JSON.parse(localStorage.getItem("selectedPattern") || "{}");
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <div className="mb-6 text-center">
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            Enhanced Session - {selectedPattern.name || "Custom Pattern"}
          </Badge>
        </div>
        <ContextualGuidance
          sessionType="enhanced"
          onProceed={handleEnhancedProceed}
          onBack={() => setFlowState("pattern-selection")}
        />
      </div>
    );
  }

  // Main session type selection
  if (effectiveVariant === "mobile") {
    return (
      <div className={`space-y-6 p-4 ${className}`}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Choose Your Path</h2>
          <p className="text-muted-foreground">
            Both deliver immediate results - pick what feels right for you
          </p>
        </div>

        {sessionTypes.map((session) => {
          const Icon = session.icon;
          const colorClasses = {
            bg: getColorClasses(session.colorScheme, "bg"),
            border: getColorClasses(session.colorScheme, "border"), 
            text: getColorClasses(session.colorScheme, "text"),
            button: getColorClasses(session.colorScheme, "button")
          };

          return (
            <Card key={session.key} className={`border-2 hover:shadow-lg transition-all duration-300 ${colorClasses.border}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${colorClasses.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{session.subtitle}</p>
                    </div>
                  </div>
                  <Badge className={`${colorClasses.bg} ${colorClasses.text} border-0`}>
                    {session.badge}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{session.description}</p>
                
                {/* Flow preview */}
                <div className={`p-3 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
                  <p className={`text-xs font-medium ${colorClasses.text}`}>
                    Your journey: {session.flow}
                  </p>
                </div>

                {/* Quick benefits */}
                <div className="space-y-2">
                  {session.quickBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Social proof */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{session.userCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>{session.timeToValue} to benefits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>{session.successRate} success</span>
                  </div>
                </div>

                <Button
                  onClick={session.key === "classic" ? handleClassicSessionSelect : handleEnhancedSessionSelect}
                  className={`w-full ${colorClasses.button} text-white`}
                >
                  <div className="flex items-center gap-2 w-full justify-center">
                    <Info className="w-4 w-4" />
                    <span>{session.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Success story hint */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">After Your First Success</span>
              </div>
              <p className="text-sm text-purple-700">
                Complete any session to unlock our full pattern library and advanced features
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Desktop layout (similar structure, different styling)
  return (
    <div className={`max-w-6xl mx-auto py-12 ${className}`}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Breathing Journey</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Two paths to immediate stress relief. Pick the experience that matches your readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
        {sessionTypes.map((session) => {
          const Icon = session.icon;
          const colorClasses = {
            bg: getColorClasses(session.colorScheme, "bg"),
            border: getColorClasses(session.colorScheme, "border"),
            text: getColorClasses(session.colorScheme, "text"), 
            button: getColorClasses(session.colorScheme, "button")
          };

          return (
            <Card key={session.key} className={`w-full max-w-md border-2 hover:shadow-xl transition-all duration-300 ${colorClasses.border}`}>
              <CardHeader className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colorClasses.bg} mb-4 mx-auto`}>
                  <Icon className={`w-8 h-8 ${colorClasses.text}`} />
                </div>
                <div className="relative">
                  <CardTitle className="text-2xl mb-2">{session.title}</CardTitle>
                  <p className="text-muted-foreground font-medium">{session.subtitle}</p>
                  <Badge className={`absolute -top-2 -right-8 ${colorClasses.bg} ${colorClasses.text} border-0`}>
                    {session.badge}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-center">{session.description}</p>

                {/* Flow visualization */}
                <div className={`p-4 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
                  <h4 className={`font-medium ${colorClasses.text} mb-2`}>Your Journey:</h4>
                  <p className={`text-sm ${colorClasses.text}`}>{session.flow}</p>
                </div>

                {/* Benefits list */}
                <div className="space-y-3">
                  {session.quickBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Social proof */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{session.userCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{session.successRate} success rate</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Timer className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">Benefits start in {session.timeToValue}</span>
                  </div>
                </div>

                <Button
                  onClick={session.key === "classic" ? handleClassicSessionSelect : handleEnhancedSessionSelect}
                  className={`w-full ${colorClasses.button} text-white`}
                  size="lg"
                >
                  <Info className="w-5 h-5 mr-2" />
                  {session.buttonText}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Post-session unlock preview */}
      <div className="mt-16 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-purple-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-semibold text-purple-800">Unlock Your Full Potential</h3>
            </div>
            <p className="text-purple-700 mb-4">
              Complete your first session to access our complete breathing library and advanced features:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-purple-600">
              <span>• 6+ Breathing Patterns</span>
              <span>• Progress Tracking</span>
              <span>• AI Recommendations</span>
              <span>• Social Sharing</span>
              <span>• NFT Minting</span>
              <span>• Custom Patterns</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdaptiveSessionFlow;