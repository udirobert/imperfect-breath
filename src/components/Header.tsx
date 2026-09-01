/**
 * Header — minimal. Logo + 3 links + auth state.
 *
 * Mobile: bottom tab bar handles nav, header is just logo + sign in.
 * Desktop: logo + Practice/Progress/Profile links + sign in/out.
 *
 * No mobile sheet menu (BottomTabBar covers it). No community link (dead).
 * No WalletManager (wallet lives on /profile). No OfflineIndicator (niche).
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, BarChart3, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStatus } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { isAuthenticated } = useAuthStatus();

  const navLink = (path: string, label: string, icon: React.ElementType) => {
    const isActive = location.pathname === path;
    return (
      <Link to={path}>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className="flex items-center gap-2"
        >
          {React.createElement(icon, { className: "w-4 h-4" })}
          {label}
        </Button>
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50",
        className,
      )}
    >
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-primary hover:opacity-80 transition-opacity text-lg"
        >
          <div className="rounded bg-primary/10 p-1">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Brume</span>
        </Link>

        <div className="flex items-center gap-2">
          {navLink("/session", "Practice", Play)}
          {isAuthenticated && navLink("/progress", "Progress", BarChart3)}
          {isAuthenticated ? (
            <>
              {navLink("/profile", "Profile", User)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-slate-500 hover:text-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
export { Header };
export type { HeaderProps };
