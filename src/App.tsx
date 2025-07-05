import React, { Suspense } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { WalletProvider } from "./providers/WalletProvider";
import { UnifiedWeb3Provider } from "./providers/UnifiedWeb3Provider";
import { EnhancedLensProvider } from "./providers/EnhancedLensProvider";
import { wagmiConfig } from "./lib/wagmi/config";
import { useSecureStorage } from "./hooks/useSecureStorage";

// Create query client for React Query
const queryClient = new QueryClient();

// Lazy load pages for better performance
const Index = React.lazy(() => import("./pages/EnhancedIndex"));
const BreathingSession = React.lazy(() => import("./pages/BreathingSession"));
const Results = React.lazy(() => import("./pages/Results"));
const Progress = React.lazy(() => import("./pages/Progress"));
const Auth = React.lazy(() => import("./pages/Auth"));
const DiagnosticPage = React.lazy(() => import("./pages/DiagnosticPage"));
const AISettings = React.lazy(() => import("./pages/AISettings"));
const EnhancedMarketplace = React.lazy(
  () => import("./pages/EnhancedMarketplace")
);
const EnhancedCreatorDashboard = React.lazy(
  () => import("./pages/EnhancedCreatorDashboard")
);
const CreatePattern = React.lazy(() => import("./pages/CreatePattern"));
const InstructorOnboarding = React.lazy(
  () => import("./pages/InstructorOnboarding")
);
const FlowBatchDemo = React.lazy(() => import("./pages/FlowBatchDemo"));
const LensSocialDemo = React.lazy(() => import("./pages/LensSocialDemo"));
const StoryIPDemo = React.lazy(() => import("./pages/StoryIPDemo"));
const EnhancedLensTestPage = React.lazy(
  () => import("./pages/EnhancedLensTestPage")
);

// Storage initialization component
const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isInitialized, error } = useSecureStorage();

  // Use an effect to log errors
  React.useEffect(() => {
    if (error) {
      console.warn("Storage initialization warning:", error);
    }
  }, [error]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Initializing app storage...</p>
        </div>
      </div>
    );
  }

  // Even with errors, we continue with the app since we have fallbacks

  return <>{children}</>;
};
const ProtectedRoute = React.lazy(() => import("./components/ProtectedRoute"));
const UserProfile = React.lazy(() => import("./pages/UserProfile"));
const CommunityFeed = React.lazy(() => import("./pages/CommunityFeed"));
const LensV3TestPage = React.lazy(() => import("./pages/LensV3TestPage"));

const PageLoader = () => (
  <div className="flex-grow flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// PageLoader component for Suspense fallback

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <WalletProvider>
          <UnifiedWeb3Provider>
            <EnhancedLensProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/session" element={<BreathingSession />} />
                        <Route path="/results" element={<Results />} />
                        <Route path="/progress" element={<Progress />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route
                          path="/diagnostic"
                          element={<DiagnosticPage />}
                        />
                        <Route path="/ai-settings" element={<AISettings />} />
                        <Route
                          path="/marketplace"
                          element={<EnhancedMarketplace />}
                        />
                        <Route
                          element={<ProtectedRoute requiredRole="creator" />}
                        >
                          <Route
                            path="/creator-dashboard"
                            element={<EnhancedCreatorDashboard />}
                          />
                          <Route
                            path="/create-pattern"
                            element={<CreatePattern />}
                          />
                        </Route>
                        <Route
                          path="/instructor-onboarding"
                          element={<InstructorOnboarding />}
                        />
                        <Route path="/profile" element={<UserProfile />} />
                        <Route path="/community" element={<CommunityFeed />} />
                        <Route path="/feed" element={<CommunityFeed />} />
                        <Route path="/lens-test" element={<LensV3TestPage />} />
                        <Route path="/flow-batch" element={<FlowBatchDemo />} />
                        <Route
                          path="/lens-social"
                          element={<LensSocialDemo />}
                        />
                        <Route path="/story-ip" element={<StoryIPDemo />} />
                        <Route
                          path="/enhanced-lens"
                          element={<EnhancedLensTestPage />}
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </BrowserRouter>
              </TooltipProvider>
            </EnhancedLensProvider>
          </UnifiedWeb3Provider>
        </WalletProvider>
      </SecurityProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
