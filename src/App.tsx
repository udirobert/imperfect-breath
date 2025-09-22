import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Core components that should load immediately
import MainLayout from "@/components/MainLayout";
import SessionEntryPoints from "@/components/navigation/SessionEntryPoints";
import SessionModeWrapper from "@/components/session/SessionModeWrapper";

// Camera Context Provider
import { CameraProvider } from "@/contexts/CameraContext";

// Small pages that can load immediately
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import PatternSelectionPage from "@/pages/PatternSelectionPage";

// Responsive components
import { ResponsiveSocialCreate } from "@/components/social/ResponsiveSocialCreate";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

// Large pages - lazy load these to reduce initial bundle size
const Progress = React.lazy(() => import("@/pages/Progress"));
const Results = React.lazy(() => import("@/pages/Results"));
const EnhancedMarketplace = React.lazy(
  () => import("@/pages/EnhancedMarketplace")
);
const CreatePattern = React.lazy(() => import("@/pages/CreatePattern"));
const CommunityFeed = React.lazy(() => import("@/pages/CommunityFeed"));
const UserProfile = React.lazy(() => import("@/pages/UserProfile"));
const InstructorOnboarding = React.lazy(
  () => import("@/pages/InstructorOnboarding")
);

// Loading component for lazy routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-blue-400 h-6 w-6"></div>
      <div className="rounded-full bg-blue-400 h-6 w-6"></div>
      <div className="rounded-full bg-blue-400 h-6 w-6"></div>
    </div>
  </div>
);

function App() {
  return (
    <CameraProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main Application Routes with Header */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index enhanced={false} />} />
              <Route path="/enhanced" element={<Index enhanced={true} />} />
              <Route path="/session" element={<SessionEntryPoints />} />
              <Route path="/patterns" element={<PatternSelectionPage />} />
              <Route path="/session/:mode" element={<SessionModeWrapper />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/results" element={<Results />} />
              <Route path="/marketplace" element={<EnhancedMarketplace />} />
              <Route path="/create" element={<CreatePattern />} />
              <Route
                path="/create-post"
                element={
                  <div className="min-h-screen">
                    <ResponsiveSocialCreate />
                  </div>
                }
              />
              <Route path="/community" element={<CommunityFeed />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route
                path="/instructor-onboarding"
                element={<InstructorOnboarding />}
              />
            </Route>

            {/* Routes without Header */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Auth />} />

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </Suspense>
      </BrowserRouter>
    </CameraProvider>
  );
}

export default App;
