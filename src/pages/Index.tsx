
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
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
      <Link to="/session">
        <Button 
          style={{ animationDelay: '600ms', opacity: 0 }} 
          size="lg" 
          className="animate-fade-in px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          Begin Session
        </Button>
      </Link>
    </div>
  );
};

export default Index;
