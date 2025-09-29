import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { isTouchDevice } from "@/utils/mobile-detection";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import {
  Brain,
  Settings,
  Store,
  Users,
  Heart,
  Play,
  Plus,
  DollarSign,
  Sparkles,
  BarChart3,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WalletManager } from "./WalletManager";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = isTouchDevice();

  const isInstructorPath =
    location.pathname.includes("/creator-dashboard") ||
    location.pathname.includes("/instructor") ||
    location.pathname.includes("/create-pattern");

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50",
        className
      )}
    >
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 font-bold text-primary hover:opacity-80 transition-opacity",
            isMobile ? "text-lg" : "text-xl"
          )}
        >
          <div
            className={cn("rounded bg-primary/10", isMobile ? "p-1" : "p-1.5")}
          >
            <Sparkles className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          <span className={cn(isMobile && "truncate")}>Imperfect Breath</span>
        </Link>

        {/* Responsive Navigation */}
        {isMobile ? (
          /* Mobile Menu */
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Imperfect Breath</h2>
                    {user && (
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-4 space-y-2">
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={handleMenuItemClick}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/instructor-onboarding"
                        onClick={handleMenuItemClick}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <DollarSign className="h-5 w-5" />
                        <span>Start Teaching</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={handleMenuItemClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span>Sign In</span>
                    </Link>
                  )}
                </nav>

                {/* Sync Status */}
                <div className="border-t pt-4 space-y-3">
                  <div className="px-3">
                    <OfflineIndicator showDetails />
                  </div>
                </div>

                {/* Wallet & Actions */}
                <div className="border-t pt-4 space-y-3">
                  <div className="px-3">
                    <WalletManager />
                  </div>

                  {user && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        logout();
                        handleMenuItemClick();
                      }}
                      className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          /* Desktop Navigation */
          <div className="flex items-center gap-4">
            {/* Core Navigation - Enhanced Desktop Experience */}
            <div className="flex items-center gap-2">
              <Link to="/session">
                <Button
                  variant={
                    location.pathname === "/session" ? "default" : "ghost"
                  }
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Practice
                </Button>
              </Link>

              {/* Desktop Social Creation */}
              <Link to="/create-post">
                <Button
                  variant={
                    location.pathname === "/create-post" ? "default" : "ghost"
                  }
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Share
                </Button>
              </Link>

              {/* Enhanced Marketplace for Desktop */}
              {user && (
                <Link to="/marketplace">
                  <Button
                    variant={
                      location.pathname === "/marketplace" ? "default" : "ghost"
                    }
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Patterns
                  </Button>
                </Link>
              )}

              {/* Desktop Progress/Analytics */}
              {user && (
                <Link to="/progress">
                  <Button
                    variant={
                      location.pathname === "/progress" ? "default" : "ghost"
                    }
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Progress
                  </Button>
                </Link>
              )}
            </div>

            {/* Creator Section - Only for creators */}
            {profile?.role === "creator" && (
              <div className="flex items-center gap-2 pl-4 border-l border-border">
                <Link to="/creator-dashboard">
                  <Button
                    variant={isInstructorPath ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Creator Hub
                  </Button>
                </Link>
              </div>
            )}

            {/* Right Side - Enhanced Auth Visibility */}
            <div className="flex items-center gap-2">
              {/* ENHANCED: Always show auth state - no homepage exception */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* ENHANCED: Always visible auth button */}
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                  {/* Secondary CTA for non-homepage */}
                  {location.pathname !== "/" && (
                    <Link to="/instructor-onboarding">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Heart className="w-4 h-4" />
                        Teach
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
export { Header };
export type { HeaderProps };
