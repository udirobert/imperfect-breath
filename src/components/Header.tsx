import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  Hash,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStatus, useAuthProfile, useRevenueCatStatus } from "@/stores/authStore";
const WalletManager = React.lazy(() => import("./WalletManager").then((m) => ({ default: m.WalletManager })));
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "./wallet/ConnectWalletButton";
import { toast } from "sonner";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const location = useLocation();
  const { logout, blockchainEnabled } = useAuth();
  const { isAuthenticated } = useAuthStatus();
  const profile = useAuthProfile();
  const revenueCatStatus = useRevenueCatStatus();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = isTouchDevice();

  const isInstructorPath =
    location.pathname.includes("/creator-dashboard") ||
    location.pathname.includes("/instructor") ||
    location.pathname.includes("/create-pattern");

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  // ENHANCEMENT: Subtle haptic feedback for premium interactions
  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([15]); // Minimal, refined feedback
    }
  };

  // ENHANCEMENT: Elegant navigation feedback
  const showNavigationFeedback = (message: string) => {
    toast.success(message, {
      duration: 2000,
      position: "top-right",
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

  return (
    <header
      className={cn(
        "w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 sticky top-0 z-50 transition-all duration-300",
        className,
      )}
    >
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 font-bold text-primary hover:opacity-80 transition-opacity",
            isMobile ? "text-lg" : "text-xl",
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
            <SheetContent
              side="right"
              className="w-80 bg-white/95 backdrop-blur-sm border-slate-200"
            >
+             <SheetHeader>
+               <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
+               <SheetDescription className="sr-only">Mobile navigation and profile actions</SheetDescription>
+             </SheetHeader>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Sparkles className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium text-slate-800">
                        Imperfect Breath
                      </h2>
                      {isAuthenticated && revenueCatStatus.subscriptionTier && (
                        <Badge 
                          variant={revenueCatStatus.subscriptionTier === 'pro' ? 'default' : revenueCatStatus.subscriptionTier === 'premium' ? 'secondary' : 'outline'}
                          className={cn(
                            "text-xs capitalize",
                            revenueCatStatus.subscriptionTier === 'pro' && "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                            revenueCatStatus.subscriptionTier === 'premium' && "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                          )}
                        >
                          {revenueCatStatus.subscriptionTier}
                        </Badge>
                      )}
                    </div>
                    {isAuthenticated && profile && (
                      <p className="text-sm text-slate-500 truncate">
                        {profile.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-4 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => {
                          triggerHaptic();
                          showNavigationFeedback("Opening profile");
                          handleMenuItemClick();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-300 text-slate-700 hover:text-slate-900"
                      >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/community"
                        onClick={() => {
                          triggerHaptic();
                          showNavigationFeedback("Joining community");
                          handleMenuItemClick();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-300 text-slate-700 hover:text-slate-900"
                      >
                        <Users className="h-5 w-5" />
                        <span>Community</span>
                      </Link>
                      {/* Lens Hub - Mobile Menu */}
                      <Link
                        to="/lens"
                        onClick={() => {
                          triggerHaptic();
                          showNavigationFeedback("Opening Lens Hub");
                          handleMenuItemClick();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-300 text-slate-700 hover:text-slate-900"
                      >
                        <Hash className="h-5 w-5" />
                        <span>Lens Hub</span>
                      </Link>
                      <Link
                        to="/instructor-onboarding"
                        onClick={() => {
                          triggerHaptic();
                          showNavigationFeedback("Starting instructor journey");
                          handleMenuItemClick();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-300 text-slate-700 hover:text-slate-900"
                      >
                        <Heart className="h-5 w-5" />
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
                    <React.Suspense fallback={<div>Loading wallet...</div>}>
                      <WalletManager />
                    </React.Suspense>
                  </div>

                  {isAuthenticated && (
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
          <>
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

                {/* Lens Hub */}
                <Link to="/lens">
                  <Button
                    variant={
                      location.pathname.startsWith("/lens") ? "default" : "ghost"
                    }
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Hash className="w-4 h-4" />
                    Lens
                  </Button>
                </Link>
              </div>

              {/* Enhanced Marketplace for Desktop */}
              {isAuthenticated && (
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
              {isAuthenticated && (
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
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link to="/community">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        triggerHaptic();
                        showNavigationFeedback("Joining community");
                      }}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-300"
                    >
                      <Users className="w-4 h-4" />
                      Community
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link to="/profile">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          triggerHaptic();
                          showNavigationFeedback("Opening profile");
                        }}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-300"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Button>
                    </Link>
                    {revenueCatStatus.subscriptionTier && (
                      <Badge 
                        variant={revenueCatStatus.subscriptionTier === 'pro' ? 'default' : revenueCatStatus.subscriptionTier === 'premium' ? 'secondary' : 'outline'}
                        className={cn(
                          "text-xs capitalize",
                          revenueCatStatus.subscriptionTier === 'pro' && "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                          revenueCatStatus.subscriptionTier === 'premium' && "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        )}
                      >
                        {revenueCatStatus.subscriptionTier}
                      </Badge>
                    )}
                    {blockchainEnabled && (
                      <ConnectWalletButton variant="outline" size="sm" showChainInfo={true} />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      triggerHaptic();
                      showNavigationFeedback("Signing out");
                      logout();
                    }}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* ENHANCED: Premium auth button */}
                  <Link to="/auth">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        triggerHaptic();
                        showNavigationFeedback("Opening sign in");
                      }}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white transition-all duration-300"
                    >
                      <User className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                  {blockchainEnabled && (
                    <ConnectWalletButton variant="outline" size="sm" showChainInfo={true} />
                  )}
                  {/* Secondary CTA for non-homepage */}
                  {location.pathname !== "/" && (
                    <Link to="/instructor-onboarding">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          triggerHaptic();
                          showNavigationFeedback("Starting instructor journey");
                        }}
                        className="flex items-center gap-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 transition-all duration-300"
                      >
                        <Heart className="w-4 h-4" />
                        Teach
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
export { Header };
export type { HeaderProps };
