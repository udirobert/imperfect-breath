import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProgressiveOnboarding } from "@/components/onboarding/ProgressiveOnboarding";

/**
 * Mobile-specific onboarding page that guides users through progressive feature unlock
 */
const MobileOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  // Redirect desktop users to main page
  useEffect(() => {
    if (!isMobile) {
      navigate("/");
    }
  }, [isMobile, navigate]);

  const handleOnboardingComplete = () => {
    // Mark onboarding as completed
    localStorage.setItem("onboardingCompleted", "true");
    
    // Navigate to appropriate page based on auth status
    if (isAuthenticated) {
      navigate("/session");
    } else {
      navigate("/");
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div className="mobile-full-height flex items-center justify-center p-4 bg-calm-gradient">
      <ProgressiveOnboarding onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default MobileOnboarding;