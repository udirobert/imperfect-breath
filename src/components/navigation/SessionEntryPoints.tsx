/**
 * Session Entry Points - Clean UI for choosing between Classic and Enhanced sessions
 *
 * SINGLE RESPONSIBILITY: Present clear choice between session types
 * DRY: Eliminates duplication between mobile/desktop
 * CLEAN: No mixed concerns, pure presentation logic
 */

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useIsMobile } from "../../hooks/use-mobile";
import { Sparkles, Focus, Camera, Zap } from "lucide-react";

interface SessionEntryPointsProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

export const SessionEntryPoints: React.FC<SessionEntryPointsProps> = ({
  variant,
  className = "",
}) => {
  const isMobile = useIsMobile();
  const effectiveVariant = variant || (isMobile ? "mobile" : "desktop");

  const sessionTypes = [
    {
      key: "classic",
      title: "Classic Session",
      description: "Pure breathing practice with no distractions",
      badge: "Focus Mode",
      icon: Focus,
      to: "/session/classic",
      buttonClass: isMobile
        ? "w-full text-sm bg-blue-50 border-2 border-blue-200 text-blue-800 hover:bg-blue-100"
        : "px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-50 border-2 border-blue-200 text-blue-800 hover:bg-blue-100",
      badgeClass:
        "absolute -top-2 -right-2 bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-1",
      features: ["No camera", "Minimal interface", "Pure mindfulness"],
    },
    {
      key: "enhanced",
      title: "Enhanced Session",
      description: "AI-powered breathing with real-time feedback",
      badge: "AI + Camera",
      icon: Camera,
      to: "/session/enhanced",
      buttonClass: isMobile
        ? "w-full text-sm bg-purple-50 border-2 border-purple-300 text-purple-800 hover:bg-purple-100"
        : "px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-purple-50 border-2 border-purple-300 text-purple-800 hover:bg-purple-100",
      badgeClass:
        "absolute -top-2 -right-2 bg-purple-100 text-purple-700 border-purple-300 text-xs px-2 py-1",
      features: ["Camera tracking", "AI feedback", "Advanced metrics"],
    },
  ];

  if (effectiveVariant === "mobile") {
    return (
      <div className={`space-y-6 p-4 ${className}`}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Choose Your Experience</h2>
          <p className="text-muted-foreground">
            Select the session type that fits your needs
          </p>
        </div>

        {sessionTypes.map((session) => {
          const Icon = session.icon;
          return (
            <Link key={session.key} to={session.to} className="block">
              <div className="relative">
                <Button variant="outline" className={session.buttonClass}>
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-semibold">{session.title}</div>
                      <div className="text-xs opacity-80">
                        {session.description}
                      </div>
                    </div>
                  </div>
                </Button>
                <Badge className={session.badgeClass}>{session.badge}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={`max-w-6xl mx-auto py-12 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
        {sessionTypes.map((session) => {
          const Icon = session.icon;
          return (
            <div key={session.key} className="w-full max-w-md">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 mb-4">
                    <Icon className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{session.title}</h3>
                  <p className="text-muted-foreground">{session.description}</p>
                </div>

                <ul className="space-y-2 mb-8">
                  {session.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={session.to} className="block">
                  <div className="relative">
                    <Button className={session.buttonClass}>
                      <Zap className="w-5 h-5 mr-2" />
                      Start
                    </Button>
                    <Badge className={session.badgeClass}>
                      {session.badge}
                    </Badge>
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground">
          Not sure which to choose? Start with Classic for a distraction-free
          experience.
        </p>
      </div>
    </div>
  );
};

export default SessionEntryPoints;
