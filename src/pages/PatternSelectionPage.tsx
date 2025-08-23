/**
 * Pattern Selection Page - Post-session pattern exploration
 *
 * OPTIMAL UX FLOW: Users discover patterns after experiencing a session
 * PROGRESSIVE ENHANCEMENT: Builds on successful completion experience
 * DRY: Reuses existing PatternSelection component
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { PatternSelection } from "../components/session/PatternSelection";
import { Button } from "../components/ui/button";
import { ArrowLeft, Star, Heart } from "lucide-react";
import { Badge } from "../components/ui/badge";
import type { CustomPattern } from "../lib/ai/providers";

export const PatternSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePatternSelect = (pattern: CustomPattern | null) => {
    if (!pattern) return;

    // Convert CustomPattern to the format expected by sessions
    const sessionPattern = {
      id: pattern.id,
      name: pattern.name,
      inhale: (pattern.phases[0]?.duration || 4000) / 1000,
      hold: (pattern.phases[1]?.duration || 4000) / 1000,
      exhale: (pattern.phases[2]?.duration || 4000) / 1000,
      hold_after_exhale: (pattern.phases[3]?.duration || 4000) / 1000,
      benefits: pattern.category ? [pattern.category] : [],
    };

    // Store the selected pattern
    localStorage.setItem("selectedPattern", JSON.stringify(sessionPattern));

    // Navigate to enhanced session by default (since they're exploring)
    navigate("/session/enhanced");
  };

  const handleCreateNew = () => {
    // Navigate to pattern creation page
    navigate("/create");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Badge variant="outline" className="bg-white/90">
              <Star className="w-3 h-3 mr-1" />
              Explore Patterns
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Discover Your Perfect Breathing Pattern
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Now that you've experienced the power of breathwork, explore our
            collection of scientifically-backed patterns designed for different
            wellness goals.
          </p>
        </div>

        {/* Pattern Selection Component */}
        <PatternSelection
          userLibrary={[]}
          onPatternSelect={handlePatternSelect}
          onCreateNew={handleCreateNew}
        />
      </div>
    </div>
  );
};

export default PatternSelectionPage;
