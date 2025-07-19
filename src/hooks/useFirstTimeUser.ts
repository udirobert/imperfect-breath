import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useIsMobile } from "./use-mobile";

interface FirstTimeUserState {
  isFirstTime: boolean;
  hasCompletedSession: boolean;
  hasSeenOnboarding: boolean;
  shouldShowOnboarding: boolean;
}

/**
 * Hook to manage first-time user experience and progressive onboarding
 */
export const useFirstTimeUser = () => {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  const [state, setState] = useState<FirstTimeUserState>({
    isFirstTime: false,
    hasCompletedSession: false,
    hasSeenOnboarding: false,
    shouldShowOnboarding: false,
  });

  useEffect(() => {
    const hasCompletedSession = localStorage.getItem("hasCompletedSession") === "true";
    const hasSeenOnboarding = localStorage.getItem("onboardingCompleted") === "true";
    const isFirstTime = !hasCompletedSession && !isAuthenticated;
    
    // Show onboarding for mobile first-time users
    const shouldShowOnboarding = isMobile && isFirstTime && !hasSeenOnboarding;

    setState({
      isFirstTime,
      hasCompletedSession,
      hasSeenOnboarding,
      shouldShowOnboarding,
    });
  }, [isAuthenticated, isMobile]);

  const markSessionCompleted = () => {
    localStorage.setItem("hasCompletedSession", "true");
    setState(prev => ({ ...prev, hasCompletedSession: true, isFirstTime: false }));
  };

  const markOnboardingCompleted = () => {
    localStorage.setItem("onboardingCompleted", "true");
    setState(prev => ({ ...prev, hasSeenOnboarding: true, shouldShowOnboarding: false }));
  };

  const resetFirstTimeExperience = () => {
    localStorage.removeItem("hasCompletedSession");
    localStorage.removeItem("onboardingCompleted");
    setState({
      isFirstTime: true,
      hasCompletedSession: false,
      hasSeenOnboarding: false,
      shouldShowOnboarding: isMobile,
    });
  };

  return {
    ...state,
    markSessionCompleted,
    markOnboardingCompleted,
    resetFirstTimeExperience,
  };
};