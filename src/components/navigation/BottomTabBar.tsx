import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isTouchDevice } from "@/utils/mobile-detection";
import {
  Play,
  Heart,
  Plus,
  Users,
  User,
} from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const TAB_ITEMS: TabItem[] = [
  {
    id: "practice",
    label: "Practice",
    icon: Play,
    path: "/session",
  },
  {
    id: "explore",
    label: "Explore",
    icon: Heart,
    path: "/marketplace",
  },
  {
    id: "create",
    label: "Create",
    icon: Plus,
    path: "/create",
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    path: "/community",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
  },
];

interface BottomTabBarProps {
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ className }) => {
  const location = useLocation();
  const isMobile = isTouchDevice();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-t border-border",
        "safe-area-pb", // Handle iPhone safe area
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-w-0 flex-1 px-1 py-2",
                "rounded-lg transition-all duration-200",
                "touch-manipulation", // Optimize for touch
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium mt-1 leading-none",
                  "truncate max-w-full"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;