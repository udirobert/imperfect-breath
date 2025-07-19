import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { WalletManager } from "@/components/WalletManager";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import {
  Menu,
  Sparkles,
  Settings,
  DollarSign,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b border-border",
        className
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-primary"
        >
          <div className="p-1 rounded bg-primary/10">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="truncate">Imperfect Breath</span>
        </Link>

        {/* Mobile Menu */}
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
                      to="/ai-settings"
                      onClick={handleMenuItemClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      <span>AI Settings</span>
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
      </div>
    </header>
  );
};

export default MobileHeader;