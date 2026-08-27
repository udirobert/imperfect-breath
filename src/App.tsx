import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Core components that should load immediately
import MainLayout from "@/components/MainLayout";
import SessionEntryPoints from "@/components/navigation/SessionEntryPoints";
import SessionModeWrapper from "@/components/session/SessionModeWrapper";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import { Toaster } from "@/components/ui/sonner";

// Camera Context Provider
import { CameraProvider } from "@/contexts/CameraContext";

// Web3 Provider - loaded eagerly to prevent provider not found errors
import { EagerWeb3Provider } from "@/providers/EagerWeb3Provider";

// Small pages that can load immediately
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import NotFound from "@/pages/NotFound";
import PatternSelectionPage from "@/pages/PatternSelectionPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Settings from "@/pages/Settings";

// Responsive components
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

// Notifications (OneSignal) — guarded no-op until VITE_ONESIGNAL_APP_ID is set
import { initNotifications } from "@/lib/notifications/oneSignal";
import RouteErrorBoundary from "@/components/auth/RouteErrorBoundary";

// Large pages - lazy load these to reduce initial bundle size
// CONSOLIDATION (Brume v1): marketplace, creator tools, instructor onboarding and
// Lens hub pages are buried — files kept in repo, routes removed. See docs/CONSOLIDATION.md
const Progress = React.lazy(() => import("@/pages/Progress"));
const Results = React.lazy(() => import("@/pages/Results"));
const CommunityFeed = React.lazy(() => import("@/pages/CommunityFeed"));
const UserProfile = React.lazy(() => import("@/pages/UserProfile"));
const Subscription = React.lazy(() => import("@/pages/Subscription"));
const LeaderboardPage = React.lazy(() => import("@/pages/LeaderboardPage"));

// Loading component for lazy routes — pixel-grid loader with elapsed timer
import { PixelLoader } from "@/components/primitives/PixelLoader";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <PixelLoader variant="drive" label="Brume" />
  </div>
);

function App() {
  React.useEffect(() => {
    void initNotifications();
  }, []);

  return (
    <EagerWeb3Provider>
      <CameraProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main Application Routes with Header */}
            <Route element={<MainLayout />}> 
              <Route path="/" element={<Index />} />
              <Route path="/session" element={<SessionEntryPoints />} />
              <Route path="/patterns" element={<PatternSelectionPage />} />
              <Route path="/session/:mode" element={<SessionModeWrapper />} />
              <Route path="/progress" element={<RouteErrorBoundary><Progress /></RouteErrorBoundary>} />
              <Route path="/results" element={<RouteErrorBoundary><Results /></RouteErrorBoundary>} />
              <Route path="/community" element={<RouteErrorBoundary><CommunityFeed /></RouteErrorBoundary>} />
              <Route path="/profile" element={<ProtectedRoute><RouteErrorBoundary><UserProfile /></RouteErrorBoundary></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><RouteErrorBoundary><Subscription /></RouteErrorBoundary></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<RouteErrorBoundary><LeaderboardPage /></RouteErrorBoundary>} />
            </Route>

            {/* Routes without Header */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
          <Toaster />
        </Suspense>
      </BrowserRouter>
    </CameraProvider>
    </EagerWeb3Provider>
  );
}

export default App;
