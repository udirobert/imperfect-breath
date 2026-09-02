import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ResponsiveNavigation } from "./navigation/ResponsiveNavigation";
import { SystemHealthMonitor } from "./monitoring/SystemHealthMonitor";
import { development } from "../config/environment";
import DeveloperTools from "./developer/DeveloperTools";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";

const MainLayout = () => {
  const [showDevTools, setShowDevTools] = useState(false);
  const { pathname } = useLocation();
  const immersive =
    pathname.startsWith("/session") || pathname.startsWith("/post-session");

  return (
    <ResponsiveNavigation>
      {development.debugMode && !immersive && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          <Button
            onClick={() => setShowDevTools(!showDevTools)}
            size="sm"
            variant="outline"
            className="bg-background/80 backdrop-blur-sm"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {showDevTools && (
            <div className="w-80">
              <DeveloperTools />
            </div>
          )}

          <SystemHealthMonitor compact={true} />
        </div>
      )}
      <Outlet />
    </ResponsiveNavigation>
  );
};

export default MainLayout;
