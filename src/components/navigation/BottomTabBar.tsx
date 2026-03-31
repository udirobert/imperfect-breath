import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isTouchDevice } from "@/utils/mobile-detection";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Heart, Sparkles, User } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  isActive: boolean;
  color: string;
  activeColor: string;
  description: string;
  badge?: string;
}

const getNavItems = (user: any, locationPathname: string): NavItem[] => [
  {
    id: "home",
    label: "Home",
    icon: Heart,
    path: "/",
    isActive: locationPathname === "/",
    color: "text-green-600",
    activeColor: "text-green-700 bg-green-50",
    description: "Start breathing session",
  },
  {
    id: "session",
    label: "Session",
    icon: Sparkles,
    path: "/session/classic",
    isActive: locationPathname.startsWith("/session"),
    color: "text-blue-600",
    activeColor: "text-blue-700 bg-blue-50",
    description: "Start a breathing session",
  },
  {
    id: "profile",
    label: user ? "Profile" : "Sign In",
    icon: User,
    path: user ? "/profile" : "/auth",
    isActive: locationPathname === "/profile",
    color: user ? "text-gray-600" : "text-primary",
    activeColor: user
      ? "text-gray-700 bg-gray-50"
      : "text-primary bg-primary/10",
    description: user
      ? "Your profile and settings"
      : "Sign in to save progress",
    badge: !user ? "•" : undefined,
  },
];

interface BottomTabBarProps {
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = isTouchDevice();

  if (!isMobile) {
    return null;
  }

  const hiddenPaths = ["/session/", "/auth", "/onboarding"];
  if (hiddenPaths.some((path) => location.pathname.startsWith(path))) {
    return null;
  }

  const triggerHapticFeedback = (type: "subtle" | "gentle" = "subtle") => {
    if ("vibrate" in navigator) {
      switch (type) {
        case "gentle":
          navigator.vibrate([25]);
          break;
        default:
          navigator.vibrate([15]);
      }
    }
  };

  const navItems = getNavItems(user, location.pathname);

  const handleNavigation = (item: NavItem) => {
    if (item.id === "profile" && !user) {
      triggerHapticFeedback("subtle");
      const searchParams = new URLSearchParams();
      searchParams.set("context", "profile");
      searchParams.set("source", "mobile-nav");
      navigate(`/auth?${searchParams.toString()}`);
      return;
    }

    triggerHapticFeedback("subtle");
    navigate(item.path);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 backdrop-blur-sm border-t border-slate-200",
        "safe-area-pb",
        className,
      )}
    >
      <div className="grid grid-cols-3 gap-1 px-2 py-2">
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

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-slate-600 rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;