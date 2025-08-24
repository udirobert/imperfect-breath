import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WalletManager } from "./WalletManager";

const Header = () => {
  const location = useLocation();
  const { user, profile } = useAuth();

  const isInstructorPath =
    location.pathname.includes("/creator-dashboard") ||
    location.pathname.includes("/instructor") ||
    location.pathname.includes("/create-pattern");

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          <div className="p-1.5 rounded bg-primary/10">
            <Sparkles className="w-5 h-5" />
          </div>
          Imperfect Breath
        </Link>

        <div className="flex items-center gap-4">
          {/* Core Navigation - Enhanced Desktop Experience */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/session">
              <Button
                variant={location.pathname === "/session" ? "default" : "ghost"}
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
                variant={location.pathname === "/create-post" ? "default" : "ghost"}
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
                  variant={location.pathname === "/progress" ? "default" : "ghost"}
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
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border">
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

          {/* Right Side - Minimal */}
          <div className="flex items-center gap-2">
            {/* Only show wallet manager when needed - not prominently displayed */}
            <div className="hidden">
              <WalletManager />
            </div>

            {/* Simple user menu */}
            {user ? (
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
            ) : (
              /* Only show instructor CTA if not on homepage */
              location.pathname !== "/" && (
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
              )
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
