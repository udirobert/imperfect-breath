import React from "react";
import { ResponsiveNavigation } from "./navigation/ResponsiveNavigation";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Basic layout component with responsive navigation
 * @deprecated Use ResponsiveNavigation directly for new components
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return <ResponsiveNavigation>{children}</ResponsiveNavigation>;
};

export default Layout;
export { Layout };
export type { LayoutProps };
