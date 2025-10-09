import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { ResponsiveNavigation } from "./navigation/ResponsiveNavigation";
import { SystemHealthMonitor } from "./monitoring/SystemHealthMonitor";
import { development } from "../config/environment";
import DeveloperTools from "./developer/DeveloperTools";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";

const MainLayout = () => {
  const [showDevTools, setShowDevTools] = useState(false);

  return (
    <ResponsiveNavigation>
      {/* Development tools and health monitor */}
      {development.debugMode && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {/* Developer Tools Toggle */}
          <Button
            onClick={() => setShowDevTools(!showDevTools)}
            size="sm"
            variant="outline"
            className="bg-background/80 backdrop-blur-sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          {/* Developer Tools Panel */}
          {showDevTools && (
            <div className="w-80">
              <DeveloperTools />
            </div>
          )}
          
          {/* System Health Monitor */}
          <SystemHealthMonitor compact={true} />
        </div>
      )}
      <Outlet />
    </ResponsiveNavigation>
  );
};

export default MainLayout;
