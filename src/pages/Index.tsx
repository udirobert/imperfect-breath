import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
          Imperfect Breath
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Peace through patterns. One breath at a time.
        </p>
        <Button
          size="lg"
          className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          onClick={() => navigate("/session/classic")}
        >
          Start
        </Button>
      </div>
    </div>
  );
}
