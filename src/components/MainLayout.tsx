import React from "react";
import { Outlet } from "react-router-dom";
import { ResponsiveNavigation } from "./navigation/ResponsiveNavigation";

const MainLayout = () => {
  return (
    <ResponsiveNavigation>
      <Outlet />
    </ResponsiveNavigation>
  );
};

export default MainLayout;
