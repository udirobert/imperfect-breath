
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { useDemoMode } from '@/context/DemoModeContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Index = () => {
  const { history } = useSessionHistory();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="text-center flex flex-col items-center animate-fade-in">
      <h1 
        style={{ animationDelay: '200ms', opacity: 0 }} 
        className="text-5xl md:text-6xl font-bold text-foreground mb-4 animate-fade-in"
      >
        Find your center.
      </h1>
      <p 
        style={{ animationDelay: '400ms', opacity: 0 }} 
        className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md animate-fade-in"
      >
        Welcome to Imperfect Breath. A space to reconnect with your breath and find calm in the chaos.
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
        style={{ animationDelay: '800ms', opacity: 0 }} 
        className="flex items-center space-x-2 mt-8 animate-fade-in"
      >
        <Switch id="demo-mode" checked={isDemoMode} onCheckedChange={toggleDemoMode} />
        <Label htmlFor="demo-mode">Demo Mode</Label>
      </div>
    </div>
  );
};

export default Index;
