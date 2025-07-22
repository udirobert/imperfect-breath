/**
 * Session Entry Points - DRY component for all session buttons
 * Eliminates duplication between mobile/desktop
 */

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { QuickStartButton } from "../session/QuickStartButton";
import { SmartAuthGate } from "../auth/SmartAuthGate";

interface SessionEntryPointsProps {
  variant: "mobile" | "desktop";
  className?: string;
}

interface SessionButtonConfig {
  to: string;
  label: string;
  variant: "default" | "outline";
  size: "sm" | "lg";
  className?: string;
  delay: string;
}

export const SessionEntryPoints: React.FC<SessionEntryPointsProps> = ({
  variant,
  className = "",
}) => {
  const isMobile = variant === "mobile";

  // Centralized button configurations - Classic first (free), AI Enhanced second (auth required)
  const buttonConfigs: SessionButtonConfig[] = [
    {
      to: "/session",
      label: isMobile ? "Classic" : "Classic Session",
      variant: "default",
      size: isMobile ? "sm" : "lg",
      className: isMobile
        ? "w-full text-sm"
        : "px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700",
      delay: isMobile ? "650ms" : "600ms",
    },
    {
      to: "/session?enhanced=true",
      label: isMobile ? "AI Enhanced" : "AI Enhanced Session",
      variant: "outline",
      size: isMobile ? "sm" : "lg",
      className: isMobile
        ? "w-full text-sm"
        : "px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow",
      delay: isMobile ? "700ms" : "650ms",
    },
  ];

  if (isMobile) {
    return (
      <div className={`flex flex-col gap-4 items-center w-full ${className}`}>
        {/* Primary CTA: Quick Start */}
        <QuickStartButton
          className="animate-fade-in w-full"
          style={{ animationDelay: "600ms", opacity: 0 }}
        />

        {/* Secondary options with auth indicators */}
        <div className="flex gap-2 w-full">
          {buttonConfigs.map((config, index) => (
            <div key={config.to} className="flex-1 relative">
              {config.to === "/session?enhanced=true" ? (
                <SmartAuthGate
                  required="supabase"
                  context="wellness"
                  fallback="prompt"
                >
                  <Link to={config.to}>
                    <Button
                      style={{ animationDelay: config.delay, opacity: 0 }}
                      size={config.size}
                      variant={config.variant}
                      className={`animate-fade-in ${config.className}`}
                    >
                      {config.label}
                    </Button>
                  </Link>
                </SmartAuthGate>
              ) : (
                <Link to={config.to}>
                  <Button
                    style={{ animationDelay: config.delay, opacity: 0 }}
                    size={config.size}
                    variant={config.variant}
                    className={`animate-fade-in ${config.className}`}
                  >
                    {config.label}
                  </Button>
                </Link>
              )}
              {/* Auth requirement badges */}
              {config.to === "/session" && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 bg-green-100 text-green-800 border-green-200 text-xs px-1 py-0.5 scale-75"
                >
                  Free
                </Badge>
              )}
              {config.to === "/session?enhanced=true" && (
                <Badge
                  variant="outline"
                  className="absolute -top-1 -right-1 bg-blue-50 text-blue-700 border-blue-200 text-xs px-1 py-0.5 scale-75"
                >
                  Auth
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop layout - Classic first (free), AI Enhanced second (auth required)
  return (
    <div className={`flex flex-col gap-4 items-center ${className}`}>
      {/* Primary CTA - Classic Session (Free) */}
      <div className="relative">
        <Link to="/session">
          <Button
            style={{ animationDelay: "600ms", opacity: 0 }}
            size="lg"
            className="animate-fade-in px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
          >
            Start Classic Session
          </Button>
        </Link>
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1"
        >
          Free
        </Badge>
      </div>

      {/* Secondary option - AI Enhanced (Auth Required) */}
      <div className="relative">
        <SmartAuthGate required="supabase" context="wellness" fallback="prompt">
          <Link to="/session?enhanced=true">
            <Button
              style={{ animationDelay: "700ms", opacity: 0 }}
              size="default"
              variant="outline"
              className="animate-fade-in px-8 py-3 text-base rounded-full shadow-md hover:shadow-lg transition-all"
            >
              AI Enhanced Session
            </Button>
          </Link>
        </SmartAuthGate>
        <Badge
          variant="outline"
          className="absolute -top-2 -right-2 bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1"
        >
          Sign up
        </Badge>
      </div>
    </div>
  );
};
