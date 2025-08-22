import React from "react";
import { Outlet } from "react-router-dom";
import { ResponsiveNavigation } from "./navigation/ResponsiveNavigation";
import { SystemHealthMonitor } from "./monitoring/SystemHealthMonitor";
import { development } from "../config/environment";

const MainLayout = () => {
  return (
    <ResponsiveNavigation>
      {/* Development health monitor */}
      {development.debugMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <SystemHealthMonitor compact={true} />
        </div>
      )}
      <Outlet />
    </ResponsiveNavigation>
  );
};

export default MainLayout;
