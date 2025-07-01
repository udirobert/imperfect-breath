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

        <div className="flex items-center gap-6">
          {/* User Section */}
          <div className="flex items-center gap-2">
            <Link to="/marketplace">
              <Button
                variant={
                  location.pathname === "/marketplace" ? "default" : "ghost"
                }
                size="sm"
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Explore Patterns
              </Button>
            </Link>
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
          </div>

          {profile?.role === "creator" && (
            <>
              {/* Divider */}
              <div className="h-6 w-px bg-border" />

              {/* Instructor Section */}
              <div className="flex items-center gap-2">
                <Link to="/creator-dashboard">
                  <Button
                    variant={isInstructorPath ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Creator Hub
                    {isInstructorPath && (
                      <Badge variant="secondary" className="ml-1 px-1 text-xs">
                        Active
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link to="/create-pattern">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="w-4 h-4" />
                    Create Pattern
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Utility Links */}
          <div className="flex items-center gap-2">
            <Link to="/ai-settings">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                AI
              </Button>
            </Link>

            {/* New Instructor CTA */}
            <Link to="/instructor-onboarding">
              <Button
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <DollarSign className="w-4 h-4" />
                Start Teaching
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <WalletManager />
            {user && (
              <>
                <Link to="/feed">
                  <Button variant="ghost" size="sm">
                    Feed
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    Profile
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
