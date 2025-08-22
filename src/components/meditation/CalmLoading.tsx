/**
 * Calm Loading Component
 *
 * Provides gentle, breathing-inspired loading animations that maintain
 * the peaceful meditation experience during waiting periods.
 */

import React from "react";
import { cn } from "../../lib/utils";

interface CalmLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "breathing" | "pulse" | "ripple";
  className?: string;
}

export const CalmLoading: React.FC<CalmLoadingProps> = ({
  message = "Preparing your space...",
  size = "md",
  variant = "breathing",
  className,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const renderBreathingAnimation = () => {
    const breatheKeyframes = {
      "0%, 100%": { transform: "scale(1)", opacity: "0.3" },
      "50%": { transform: "scale(1.1)", opacity: "0.7" },
    };

    return (
      <div
        className={cn(
          "relative flex items-center justify-center",
          sizeClasses[size],
          className
        )}
      >
        {/* Outer breathing circle */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30"
          style={{
            animation: "breathe 4s ease-in-out infinite",
            animationDelay: "0s",
          }}
        />

        {/* Middle breathing circle */}
        <div
          className="absolute inset-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-50"
          style={{
            animation: "breathe 4s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />

        {/* Inner breathing circle */}
        <div
          className="absolute inset-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-70"
          style={{
            animation: "breathe 4s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />

        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  };

  const renderPulseAnimation = () => (
    <div
      className={cn(
        "bg-gradient-to-r from-blue-500 to-purple-500 rounded-full",
        sizeClasses[size],
        "animate-pulse",
        className
      )}
    />
  );

  const renderRippleAnimation = () => (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping"
          style={{
            animationDelay: `${i * 0.5}s`,
            animationDuration: "2s",
          }}
        />
      ))}
      <div className="w-4 h-4 bg-blue-500 rounded-full" />
    </div>
  );

  const getAnimation = () => {
    switch (variant) {
      case "breathing":
        return renderBreathingAnimation();
      case "pulse":
        return renderPulseAnimation();
      case "ripple":
        return renderRippleAnimation();
      default:
        return renderBreathingAnimation();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6">
      {getAnimation()}

      {message && (
        <p className="text-sm text-gray-600 font-light text-center max-w-xs">
          {message}
        </p>
      )}

      {/* Subtle breathing instruction */}
      <div className="text-xs text-gray-400 text-center animate-pulse">
        <span>Take a gentle breath while we prepare</span>
      </div>
    </div>
  );
};

interface FullPageCalmLoadingProps {
  message?: string;
  subMessage?: string;
}

export const FullPageCalmLoading: React.FC<FullPageCalmLoadingProps> = ({
  message = "Preparing your meditation space",
  subMessage = "Finding inner stillness...",
}) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center space-y-6">
      <CalmLoading size="lg" variant="breathing" />

      <div className="space-y-2">
        <h2 className="text-2xl font-light text-gray-800">{message}</h2>
        <p className="text-gray-600">{subMessage}</p>
      </div>

      {/* Meditation quote */}
      <div className="max-w-md mx-auto">
        <blockquote className="text-sm text-gray-500 italic border-l-2 border-blue-200 pl-4">
          "The present moment is the only moment available to us, and it is the
          door to all moments."
          <cite className="block text-xs mt-1 not-italic">
            — Thich Nhat Hanh
          </cite>
        </blockquote>
      </div>
    </div>
  </div>
);

export default CalmLoading;
