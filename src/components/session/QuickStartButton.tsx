/**
 * Quick Start Button - Instant breathing session with no setup friction
 * Perfect for first-time mobile users
 */

import React from "react";
import { Button } from "../ui/button";
import { Play, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickStartButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const QuickStartButton: React.FC<QuickStartButtonProps> = ({
  className,
  style,
}) => {
  const navigate = useNavigate();

  const handleQuickStart = () => {
    // Set quick start mode in localStorage
    localStorage.setItem("quickStartMode", "true");
    // Navigate to session with minimal setup
    navigate("/session?quick=true");
  };

  return (
    <Button
      onClick={handleQuickStart}
      size="lg"
      style={style}
      className={`
        relative overflow-hidden
        bg-gradient-to-r from-green-500 to-blue-500
        hover:from-green-600 hover:to-blue-600
        text-white font-semibold
        px-8 py-4 text-lg rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-300
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Play className="h-5 w-5" />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 animate-pulse" />
        </div>
        <span>Try Breathing Now</span>
      </div>

      {/* Animated background effect */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                      transform -skew-x-12 -translate-x-full animate-shimmer"
      />
    </Button>
  );
};
