import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { Waves, Target, BarChart3, Bot, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

const Feature = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <Icon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
    <div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  </div>
);

const Index = () => {
  const { history } = useSessionHistory();
  const { session, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out.");
    } else {
      toast.success("Logged out successfully.");
      navigate("/");
    }
  };

  return (
    <div className="text-center flex flex-col items-center animate-fade-in max-w-4xl mx-auto">
      {session && user && (
        <div className="absolute top-4 right-4 flex items-center gap-4 animate-fade-in">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Welcome, {user.email}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      )}
      <h1
        style={{ animationDelay: "200ms", opacity: 0 }}
        className="text-5xl md:text-6xl font-bold text-foreground mb-4 animate-fade-in"
      >
        Find your center.
      </h1>
      <p
        style={{ animationDelay: "400ms", opacity: 0 }}
        className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl animate-fade-in"
      >
        A space to reconnect with your breath and find calm in the chaos through
        guided exercises and performance tracking.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link to="/session">
          <Button
            style={{ animationDelay: "600ms", opacity: 0 }}
            size="lg"
            className="animate-fade-in px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
          >
            Begin Session
          </Button>
        </Link>
        {session && history && history.length > 0 && (
          <Link to="/progress">
            <Button
              style={{ animationDelay: "700ms", opacity: 0 }}
              size="lg"
              variant="outline"
              className="animate-fade-in px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
            >
              My Progress
            </Button>
          </Link>
        )}
        {!session && (
          <Link to="/auth">
            <Button
              style={{ animationDelay: "700ms", opacity: 0 }}
              size="lg"
              variant="outline"
              className="animate-fade-in px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
            >
              Login to Save Progress
            </Button>
          </Link>
        )}
      </div>

      {/* Diagnostic Link for Testing */}
      <div className="mt-8">
        <Link to="/diagnostic">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            🔧 Face Detection Diagnostics
          </Button>
        </Link>
      </div>

      <div
        className="mt-16 w-full animate-fade-in"
        style={{ animationDelay: "800ms", opacity: 0 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-left">
          <Feature icon={Waves} title="Guided Breathing">
            Follow structured patterns like Box, Resonant, and Wim Hof to
            regulate your nervous system.
          </Feature>
          <Feature icon={Target} title="Performance Metrics">
            Measure breath-hold times and stillness to see tangible improvements
            in your focus.
          </Feature>
          <Feature icon={BarChart3} title="Progress History">
            Track your sessions over time and watch your mental and physical
            resilience grow.
          </Feature>
          <Feature icon={Bot} title="AI-Powered Feedback">
            Get real-time insights on your posture and focus during breath
            holds.
          </Feature>
        </div>
      </div>
    </div>
  );
};

export default Index;
