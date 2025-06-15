
import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { DemoModeProvider } from './context/DemoModeContext';

const queryClient = new QueryClient();

// Lazy load pages for better performance
const Index = React.lazy(() => import('./pages/Index'));
const BreathingSession = React.lazy(() => import('./pages/BreathingSession'));
const Results = React.lazy(() => import('./pages/Results'));
const Progress = React.lazy(() => import('./pages/Progress'));
const Auth = React.lazy(() => import('./pages/Auth'));

const PageLoader = () => (
  <div className="flex-grow flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DemoModeProvider>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/session" element={<BreathingSession />} />
                <Route path="/results" element={<Results />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </DemoModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
