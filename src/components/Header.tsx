import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Settings } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          Imperfect Breath
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/ai-settings">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              AI Analysis
            </Button>
          </Link>
          <Link to="/diagnostic">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Diagnostics
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
