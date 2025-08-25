import React from "react";
import { isTouchDevice } from "@/utils/mobile-detection";
import { BottomTabBar } from "./BottomTabBar";
import Header from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

interface ResponsiveNavigationProps {
  children: React.ReactNode;
}

/**
 * Responsive navigation wrapper that provides unified layout for desktop and mobile
 * - Unified Header: Automatically adapts to mobile/desktop
 * - Mobile: Bottom tab bar for navigation
 * - Desktop: Traditional layout
 */
export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  children,
}) => {
  const isMobile = isTouchDevice();

  return (
    <div className="min-h-screen w-full bg-calm-gradient flex flex-col">
      {/* Unified Header - Responsive */}
      <Header />

      {/* Main Content */}
      <main
        className={`flex-grow flex flex-col items-center justify-center p-4 ${
          isMobile ? "pb-4" : "" // Reduced padding since footer provides spacing
        }`}
      >
        {children}
      </main>

      {/* Footer - Always visible */}
      <Footer />

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomTabBar />}
    </div>
  );
};

export default ResponsiveNavigation;
