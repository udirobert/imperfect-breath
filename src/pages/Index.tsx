import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
          Breathe Better. Together.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Guided breathing with social accountability
        </p>
        <Button
          size="lg"
          className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          onClick={() => navigate("/session/classic")}
        >
          Start
        </Button>

        {isGuest && (
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              <Link 
                to="/auth?redirect=/progress" 
                className="text-primary hover:underline underline-offset-2"
              >
                Sign up
              </Link> to save your progress across devices
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
