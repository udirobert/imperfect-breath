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
  Sparkles
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { isTouchDevice } from "../../utils/mobile-detection";
import { cn } from "../../lib/utils";
import type { AuthContext } from "@/auth";

interface MobileBottomNavProps {
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ className }) => {
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
  const hiddenPaths = ['/session/', '/auth', '/onboarding'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const navItems = [
    {
      id: "breathe",
      label: "Breathe",
      icon: Heart,
      path: "/",
      isActive: location.pathname === "/",
      color: "text-green-600",
      activeColor: "text-green-700 bg-green-50",
      description: "Start breathing session"
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
      badge: history.length > 0 && !user ? "New" : undefined
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
      requiresAuth: true
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      path: "/community",
      isActive: location.pathname === "/community",
      color: "text-orange-600",
      activeColor: "text-orange-700 bg-orange-50",
      description: "Connect with others"
    },
    {
      id: "profile",
      label: user ? "Profile" : "Sign In",
      icon: User,
      path: user ? "/profile" : "/auth",
      isActive: location.pathname === "/profile",
      color: user ? "text-gray-600" : "text-primary",
      activeColor: user ? "text-gray-700 bg-gray-50" : "text-primary bg-primary/10",
      description: user ? "Your profile and settings" : "Sign in to save progress",
      // ENHANCED: Visual indicator for unauthenticated state
      badge: !user ? "•" : undefined
    }
  ];

  // ENHANCED: Context-aware navigation with smart auth handling
  const handleNavigation = (item: typeof navItems[0]) => {
    // MODULAR: Build auth context based on navigation intent
    const getAuthContext = (itemId: string): AuthContext => {
      switch (itemId) {
        case "progress":
          return { type: 'progress-tracking', source: 'mobile-nav' };
        case "share":
          return { type: 'social-share', source: 'mobile-nav' };
        case "profile":
          return { type: 'profile', source: 'mobile-nav' };
        default:
          return { type: 'profile', source: 'mobile-nav' };
      }
    };
    
    // CLEAN: Handle auth-required features with context
    if (item.requiresAuth && !user) {
      const context = getAuthContext(item.id);
      const searchParams = new URLSearchParams();
      searchParams.set('context', context.type);
      searchParams.set('source', context.source || 'mobile-nav');
      searchParams.set('redirect', item.path);
      navigate(`/auth?${searchParams.toString()}`);
      return;
    }
    
    // ENHANCED: Smart share handling with context
    if (item.id === "share") {
      if (history.length === 0) {
        // Redirect to start a session first, with share intent
        navigate("/?prompt=share");
        return;
      }
      // If user has sessions but no auth, show social-share context
      if (!user) {
        const searchParams = new URLSearchParams();
        searchParams.set('context', 'social-share');
        searchParams.set('source', 'mobile-nav');
        searchParams.set('redirect', item.path);
        navigate(`/auth?${searchParams.toString()}`);
        return;
      }
    }
    
    // ENHANCED: Profile navigation with auth context
    if (item.id === "profile" && !user) {
      const searchParams = new URLSearchParams();
      searchParams.set('context', 'profile');
      searchParams.set('source', 'mobile-nav');
      navigate(`/auth?${searchParams.toString()}`);
      return;
    }
    
    // Default navigation
    navigate(item.path);
  };

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 backdrop-blur-sm border-t border-gray-200",
        "safe-area-pb", // Respect iOS safe area
        className
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
              onClick={() => handleNavigation(item)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-1",
                "hover:bg-transparent active:scale-95 transition-all duration-150",
                isActive ? item.activeColor : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-red-500 text-white border-0"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium leading-none">
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
      
      {/* Floating Action Button for Quick Session */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <Button
          onClick={() => navigate("/session/classic")}
          size="lg"
          className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;