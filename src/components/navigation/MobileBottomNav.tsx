/**
 * ENHANCED Mobile Bottom Navigation - Context-Aware Auth Integration
 *
 * ENHANCEMENT FIRST: Enhanced existing component with auth context
 * CLEAN: Clear separation of primary vs secondary actions
 * MOBILE-FIRST: Touch-optimized with proper spacing and feedback
 * MODULAR: Uses new auth context system for smart navigation
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Heart,
  Share2,
  BarChart3,
  Users,
  User,
  Plus,
  Sparkles,
} from "lucide-react";
import { isTouchDevice } from "../../utils/mobile-detection";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface MobileAuthContext {
  type: string;
  source: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  isActive: boolean;
  color: string;
  activeColor: string;
  description: string;
  requiresAuth?: boolean;
  badge?: string;
}

interface MobileBottomNavProps {
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { history } = useSessionHistory();
  const isMobile = isTouchDevice();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  // Don't show on certain pages
  const hiddenPaths = ["/session/", "/auth", "/onboarding"];
  if (hiddenPaths.some((path) => location.pathname.startsWith(path))) {
    return null;
  }

  // ENHANCEMENT: Subtle haptic feedback for premium interactions
  const triggerHapticFeedback = (type: "subtle" | "gentle" = "subtle") => {
    if ("vibrate" in navigator) {
      switch (type) {
        case "gentle":
          navigator.vibrate([25]);
          break;
        default:
          navigator.vibrate([15]); // Minimal, refined feedback
      }
    }
  };

  // ENHANCEMENT: Elegant contextual messages
  const showNavigationFeedback = (message: string) => {
    toast.success(message, {
      duration: 2000,
      position: "bottom-center",
      style: {
        background: "rgba(248, 250, 252, 0.95)",
        color: "#334155",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        backdropFilter: "blur(8px)",
      },
    });
  };

  const navItems = [
    {
      id: "breathe",
      label: "Breathe",
      icon: Heart,
      path: "/",
      isActive: location.pathname === "/",
      color: "text-green-600",
      activeColor: "text-green-700 bg-green-50",
      description: "Start breathing session",
    },
    {
      id: "share",
      label: "Share",
      icon: Share2,
      path: "/create-post",
      isActive: location.pathname === "/create-post",
      color: "text-blue-600",
      activeColor: "text-blue-700 bg-blue-50",
      description: "Share your progress",
      badge: history.length > 0 && !user ? "New" : undefined,
    },
    {
      id: "progress",
      label: "Progress",
      icon: BarChart3,
      path: "/progress",
      isActive: location.pathname === "/progress",
      color: "text-purple-600",
      activeColor: "text-purple-700 bg-purple-50",
      description: "View your stats",
      requiresAuth: true,
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      path: "/community",
      isActive: location.pathname === "/community",
      color: "text-orange-600",
      activeColor: "text-orange-700 bg-orange-50",
      description: "Connect with others",
    },
    {
      id: "profile",
      label: user ? "Profile" : "Sign In",
      icon: User,
      path: user ? "/profile" : "/auth",
      isActive: location.pathname === "/profile",
      color: user ? "text-gray-600" : "text-primary",
      activeColor: user
        ? "text-gray-700 bg-gray-50"
        : "text-primary bg-primary/10",
      description: user
        ? "Your profile and settings"
        : "Sign in to save progress",
      // ENHANCED: Visual indicator for unauthenticated state
      badge: !user ? "•" : undefined,
    },
  ] as NavItem[];

  // ENHANCED: Context-aware navigation with smart auth handling
  const handleNavigation = (item: NavItem) => {
    // MODULAR: Build auth context based on navigation intent
    const getAuthContext = (itemId: string): MobileAuthContext => {
      switch (itemId) {
        case "progress":
          return { type: "progress-tracking", source: "mobile-nav" };
        case "share":
          return { type: "social-share", source: "mobile-nav" };
        case "profile":
          return { type: "profile", source: "mobile-nav" };
        default:
          return { type: "profile", source: "mobile-nav" };
      }
    };

    // CLEAN: Handle auth-required features with context
    if (item.requiresAuth && !user) {
      triggerHapticFeedback("gentle");
      showNavigationFeedback("Sign in required to continue");
      const context = getAuthContext(item.id);
      const searchParams = new URLSearchParams();
      searchParams.set("context", context.type);
      searchParams.set("source", context.source);
      searchParams.set("redirect", item.path);
      navigate(`/auth?${searchParams.toString()}`);
      return;
    }

    // ENHANCED: Smart share handling with context
    if (item.id === "share") {
      if (history.length === 0) {
        triggerHapticFeedback("subtle");
        showNavigationFeedback("Complete a session first to share");
        navigate("/session");
        return;
      }
      // If user has sessions but no auth, show social-share context
      if (!user) {
        triggerHapticFeedback("gentle");
        showNavigationFeedback("Sign in to share your progress");
        const searchParams = new URLSearchParams();
        searchParams.set("context", "social-share");
        searchParams.set("source", "mobile-nav");
        searchParams.set("redirect", item.path);
        navigate(`/auth?${searchParams.toString()}`);
        return;
      }
    }

    // ENHANCED: Profile navigation with auth context
    if (item.id === "profile" && !user) {
      triggerHapticFeedback("subtle");
      showNavigationFeedback("Sign in to access your profile");
      const searchParams = new URLSearchParams();
      searchParams.set("context", "profile");
      searchParams.set("source", "mobile-nav");
      navigate(`/auth?${searchParams.toString()}`);
      return;
    }

    // Default navigation with subtle haptic feedback
    triggerHapticFeedback("subtle");

    navigate(item.path);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 backdrop-blur-sm border-t border-slate-200",
        "safe-area-pb", // Respect iOS safe area
        className,
      )}
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => {
                triggerHapticFeedback("subtle");
                handleNavigation(item);
              }}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-1",
                "hover:bg-slate-50 active:scale-95 transition-all duration-300",
                isActive
                  ? "text-slate-800 bg-slate-50"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 transition-colors duration-200" />
                {item.badge && (
                  <Badge className="absolute -top-2 -right-2 h-3 w-3 p-0 text-xs bg-slate-600 text-white border-0 rounded-full">
                    {item.badge === "•" ? "" : item.badge}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-xs leading-none transition-colors duration-200",
                  isActive && "font-medium",
                )}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-slate-600 rounded-full" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Floating Action Button - Refined Premium Design */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <Button
          onClick={() => {
            triggerHapticFeedback("gentle");
            navigate("/session/classic");
          }}
          size="lg"
          className="h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-500 active:scale-95"
        >
          <Plus className="h-6 w-6 text-white transition-transform duration-200" />
        </Button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
