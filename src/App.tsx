import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { WalletProvider } from "./providers/WalletProvider";
import { UnifiedWeb3Provider } from "./providers/UnifiedWeb3Provider";
import { wagmiConfig } from "./lib/wagmi/config";
import { useSecureStorage } from "./hooks/useSecureStorage";

// Lazy load pages for better performance
const Index = React.lazy(() => import("./pages/EnhancedIndex"));
const BreathingSession = React.lazy(() => import("./pages/BreathingSession"));
const Results = React.lazy(() => import("./pages/Results"));
const Progress = React.lazy(() => import("./pages/Progress"));
const Auth = React.lazy(() => import("./pages/Auth"));
const DiagnosticPage = React.lazy(() => import("./pages/DiagnosticPage"));
const AISettings = React.lazy(() => import("./pages/AISettings"));
const EnhancedMarketplace = React.lazy(
  () => import("./pages/EnhancedMarketplace"),
);
const CreatorDashboard = React.lazy(() => import("./pages/CreatorDashboard"));
const CreatePattern = React.lazy(() => import("./pages/CreatePattern"));
const InstructorOnboarding = React.lazy(
  () => import("./pages/InstructorOnboarding"),
);
const FlowBatchDemo = React.lazy(() => import("./pages/FlowBatchDemo"));
const LensSocialDemo = React.lazy(() => import("./pages/LensSocialDemo"));
const StoryIPDemo = React.lazy(() => import("./pages/StoryIPDemo"));

// Security initialization component
const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInitialized, isSupported, error } = useSecureStorage();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Initializing secure storage...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-yellow-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Browser Compatibility Notice</h2>
          <p className="text-muted-foreground mb-4">
            Your browser doesn't support secure storage features. Some functionality may be limited.
          </p>
          <p className="text-sm text-muted-foreground">
            For the best experience, please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn('Secure storage initialization error:', error);
    // Continue with app but log the error
  }

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

// Create query client for React Query
const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <WalletProvider>
          <UnifiedWeb3Provider>
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
                      <Route path="/diagnostic" element={<DiagnosticPage />} />
                      <Route path="/ai-settings" element={<AISettings />} />
                      <Route
                        path="/marketplace"
                        element={<EnhancedMarketplace />}
                      />
                      <Route element={<ProtectedRoute requiredRole="creator" />}>
                        <Route
                          path="/creator-dashboard"
                          element={<CreatorDashboard />}
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
                      <Route path="/lens-social" element={<LensSocialDemo />} />
                      <Route path="/story-ip" element={<StoryIPDemo />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </BrowserRouter>
            </TooltipProvider>
          </UnifiedWeb3Provider>
        </WalletProvider>
      </SecurityProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
