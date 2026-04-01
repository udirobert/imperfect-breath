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

// Small pages that can load immediately
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import PatternSelectionPage from "@/pages/PatternSelectionPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Settings from "@/pages/Settings";

// Responsive components
import { ResponsiveSocialCreate } from "@/components/social/ResponsiveSocialCreate";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import RouteErrorBoundary from "@/components/auth/RouteErrorBoundary";

// Lazy-loaded Web3 provider for routes that need blockchain features
const LazyWeb3Provider = lazy(() => import("@/providers/LazyWeb3Provider").then(m => ({ default: m.LazyWeb3Provider })));

// Large pages - lazy load these to reduce initial bundle size
const Progress = React.lazy(() => import("@/pages/Progress"));
const Results = React.lazy(() => import("@/pages/Results"));
const EnhancedMarketplace = React.lazy(
  () => import("@/pages/EnhancedMarketplace"),
);
const CreatePattern = React.lazy(() => import("@/pages/CreatePattern"));
const CommunityFeed = React.lazy(() => import("@/pages/CommunityFeed"));
const UserProfile = React.lazy(() => import("@/pages/UserProfile"));
const InstructorOnboarding = React.lazy(
  () => import("@/pages/InstructorOnboarding"),
);
const Subscription = React.lazy(() => import("@/pages/Subscription"));
// Add lazy imports for new Lens pages
const LensSocialHubPage = React.lazy(() => import("@/pages/LensSocialHubPage"));
const LensSocialFlowPage = React.lazy(() => import("@/pages/LensSocialFlowPage"));

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

// Wrapper component for routes that need Web3 (blockchain) features
const Web3RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LazyWeb3Provider>
    {children}
  </LazyWeb3Provider>
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
              <Route path="/progress" element={<RouteErrorBoundary><Progress /></RouteErrorBoundary>} />
              <Route path="/results" element={<RouteErrorBoundary><Results /></RouteErrorBoundary>} />
              <Route path="/marketplace" element={<Web3RouteWrapper><RouteErrorBoundary><EnhancedMarketplace /></RouteErrorBoundary></Web3RouteWrapper>} />
              <Route path="/create" element={<ProtectedRoute><RouteErrorBoundary><CreatePattern /></RouteErrorBoundary></ProtectedRoute>} />
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <RouteErrorBoundary>
                      <div className="min-h-screen">
                        <ResponsiveSocialCreate />
                      </div>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route path="/community" element={<Web3RouteWrapper><RouteErrorBoundary><CommunityFeed /></RouteErrorBoundary></Web3RouteWrapper>} />
              <Route path="/profile" element={<ProtectedRoute><RouteErrorBoundary><UserProfile /></RouteErrorBoundary></ProtectedRoute>} />
              <Route
                path="/instructor-onboarding"
                element={<ProtectedRoute><RouteErrorBoundary><InstructorOnboarding /></RouteErrorBoundary></ProtectedRoute>}
              />
              <Route path="/subscription" element={<ProtectedRoute><RouteErrorBoundary><Subscription /></RouteErrorBoundary></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {/* New Lens routes */}
              <Route path="/lens" element={<Web3RouteWrapper><RouteErrorBoundary><LensSocialHubPage /></RouteErrorBoundary></Web3RouteWrapper>} />
              <Route path="/lens/flow" element={<Web3RouteWrapper><RouteErrorBoundary><LensSocialFlowPage /></RouteErrorBoundary></Web3RouteWrapper>} />
            </Route>

            {/* Routes without Header */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Auth />} />
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
  );
}

export default App;
