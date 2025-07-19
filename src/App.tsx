import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import IPAssetRegistration from "@/components/IPAssetRegistration";
import AISettings from "@/pages/AISettings";
import Index from "@/pages/Index";
import EnhancedIndex from "@/pages/EnhancedIndex";
import Auth from "@/pages/Auth";
import BreathingSession from "@/pages/BreathingSession";
import Progress from "@/pages/Progress";
import Results from "@/pages/Results";
import EnhancedMarketplace from "@/pages/EnhancedMarketplace";
import NotFound from "@/pages/NotFound";
import DiagnosticPage from "@/pages/DiagnosticPage";
import CreatePattern from "@/pages/CreatePattern";
import CommunityFeed from "@/pages/CommunityFeed";
import UserProfile from "@/pages/UserProfile";
import LensV3TestPage from "@/pages/LensV3TestPage";
import InstructorOnboarding from "@/pages/InstructorOnboarding";
import MainLayout from "@/components/MainLayout";
import FlowBatchDemo from "@/pages/FlowBatchDemo";
import FlowIntegrationExample from "@/components/examples/FlowIntegrationExample";
import MobileOnboarding from "@/pages/MobileOnboarding";
import WalletTestPage from "@/pages/WalletTestPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Application Routes with Header */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<EnhancedIndex />} />
          <Route path="/classic" element={<Index />} />
          <Route path="/session" element={<BreathingSession />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/results" element={<Results />} />
          <Route path="/marketplace" element={<EnhancedMarketplace />} />
          <Route path="/create" element={<CreatePattern />} />
          <Route path="/community" element={<CommunityFeed />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route
            path="/instructor-onboarding"
            element={<InstructorOnboarding />}
          />
          <Route path="/ai-settings" element={<AISettings />} />
        </Route>

        {/* Routes without Header */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<MobileOnboarding />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/lens-demo" element={<LensV3TestPage />} />
        <Route path="/flow-batch-demo" element={<FlowBatchDemo />} />
        <Route path="/flow-integration" element={<FlowIntegrationExample />} />
        <Route path="/wallet-test" element={<WalletTestPage />} />

        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
