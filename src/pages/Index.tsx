
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { useDemoMode } from '@/context/DemoModeContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Waves, Target, BarChart3, Bot } from 'lucide-react';

const Feature = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
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
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="text-center flex flex-col items-center animate-fade-in max-w-4xl mx-auto">
      <h1 
        style={{ animationDelay: '200ms', opacity: 0 }} 
        className="text-5xl md:text-6xl font-bold text-foreground mb-4 animate-fade-in"
      >
        Find your center.
      </h1>
      <p 
        style={{ animationDelay: '400ms', opacity: 0 }} 
        className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl animate-fade-in"
      >
        A space to reconnect with your breath and find calm in the chaos through guided exercises and performance tracking.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link to="/session">
          <Button 
            style={{ animationDelay: '600ms', opacity: 0 }} 
            size="lg" 
            className="animate-fade-in px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
          >
            Begin Session
          </Button>
        </Link>
        {history && history.length > 0 && (
          <Link to="/progress">
            <Button
              style={{ animationDelay: '700ms', opacity: 0 }}
              size="lg"
              variant="outline"
              className="animate-fade-in px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
            >
              My Progress
            </Button>
          </Link>
        )}
      </div>

      <div 
        className="mt-16 w-full animate-fade-in" 
        style={{ animationDelay: '800ms', opacity: 0 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-left">
          <Feature icon={Waves} title="Guided Breathing">
            Follow structured patterns like Box, Resonant, and Wim Hof to regulate your nervous system.
          </Feature>
          <Feature icon={Target} title="Performance Metrics">
            Measure breath-hold times and stillness to see tangible improvements in your focus.
          </Feature>
          <Feature icon={BarChart3} title="Progress History">
            Track your sessions over time and watch your mental and physical resilience grow.
          </Feature>
          <Feature icon={Bot} title="AI-Powered Feedback">
            Get real-time (demo) insights on your posture and focus during breath holds.
          </Feature>
        </div>
      </div>

      <div 
        style={{ animationDelay: '1000ms', opacity: 0 }} 
        className="flex items-center space-x-2 mt-12 animate-fade-in"
      >
        <Switch id="demo-mode" checked={isDemoMode} onCheckedChange={toggleDemoMode} />
        <Label htmlFor="demo-mode">Demo Mode</Label>
      </div>
    </div>
  );
};

export default Index;
