import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "./MobileHeader";
import { BottomTabBar } from "./BottomTabBar";
import Header from "@/components/Header";

interface ResponsiveNavigationProps {
  children: React.ReactNode;
}

/**
 * Responsive navigation wrapper that switches between desktop and mobile layouts
 * - Desktop: Traditional header navigation
 * - Mobile: Simplified header + bottom tab bar
 */
export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  children,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full bg-calm-gradient flex flex-col">
      {/* Header - Mobile or Desktop */}
      {isMobile ? <MobileHeader /> : <Header />}

      {/* Main Content */}
      <main
        className={`flex-grow flex flex-col items-center justify-center p-4 ${
          isMobile ? "pb-20" : "" // Add bottom padding for mobile tab bar
        }`}
      >
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomTabBar />}
    </div>
  );
};

export default ResponsiveNavigation;