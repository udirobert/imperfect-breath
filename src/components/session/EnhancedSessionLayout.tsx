/**
 * Enhanced Session Layout - Side-by-Side Design
 * 
 * CORE PRINCIPLES APPLIED:
 * - ENHANCEMENT FIRST: Enhanced existing session with better viewport usage
 * - CLEAN: Clear separation of video, animation, and metrics
 * - MODULAR: Responsive layout that adapts to screen size
 * - PERFORMANT: Optimized for both desktop and mobile
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Eye, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PremiumTooltip, MetricTooltips } from '../ui/premium-tooltip';
import { CelebrationSparkles } from '../ui/CelebrationSparkles';

interface EnhancedSessionLayoutProps {
  // Video feed section
  videoFeed: React.ReactNode;
  showVideo: boolean;
  
  // Breathing animation section  
  breathingAnimation: React.ReactNode;
  
  // Metrics display
  metrics: {
    stillnessScore: number;
    presenceScore: number;
    confidenceScore: number;
    showMetrics: boolean;
  };
  
  // Session info
  sessionInfo: {
    duration: string;
    cycle: number;
    phase: string;
    progressPercentage: number;
  };
  
  // Controls
  controls: React.ReactNode;
  
  // Layout mode
  isMobile?: boolean;
}

export const EnhancedSessionLayout: React.FC<EnhancedSessionLayoutProps> = ({
  videoFeed,
  showVideo,
  breathingAnimation,
  metrics,
  sessionInfo,
  controls,
  isMobile = false,
}) => {
  
  if (isMobile) {
    // MOBILE: Premium stacked layout with luxury aesthetics
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-indigo-50/30 relative overflow-hidden">
        {/* Ambient mobile background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.08),transparent_70%)]" />
        
        {/* Premium Mobile Header */}
        <div className="relative flex-shrink-0 p-6 bg-white/70 backdrop-blur-xl border-b border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-0 shadow-sm px-3 py-1.5">
                <Eye className="w-3 h-3 mr-1.5 text-blue-600" />
                <span className="font-medium tracking-wide">Enhanced</span>
              </Badge>
              <div className="h-4 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
              <span className="text-gray-700 font-light tracking-wide capitalize">{sessionInfo.phase}</span>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-xl font-extralight tracking-wider text-gray-800">{sessionInfo.duration}</div>
              <div className="text-xs font-medium text-gray-500 tracking-wide">Cycle {sessionInfo.cycle}</div>
            </div>
          </div>
        </div>

        {/* Premium Mobile Video Feed */}
        {showVideo && (
          <div className="relative flex-shrink-0 p-6">
            <div className="relative w-full max-w-sm mx-auto">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/30 relative">
                {videoFeed}
                {/* Premium overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 pointer-events-none" />
              </div>
              
              {/* Luxury overlay metrics for mobile */}
              {metrics.showMetrics && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs p-3 rounded-xl border border-white/20">
                  <div className="space-y-1">
                    <div className="flex justify-between gap-3">
                      <span className="text-white/80">Still:</span>
                      <span className="font-medium text-emerald-400">{metrics.stillnessScore}%</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/80">Present:</span>
                      <span className="font-medium text-blue-400">{metrics.presenceScore}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premium Mobile Breathing Animation */}
        <div className="relative flex-1 flex items-center justify-center p-6">
          {/* Subtle breathing zone for mobile */}
          <div className="absolute inset-6 bg-gradient-to-br from-white/30 via-transparent to-blue-50/20 rounded-3xl" />
          <div className="relative z-10">
            {breathingAnimation}
          </div>
        </div>

        {/* Premium Mobile Controls */}
        <div className="relative flex-shrink-0 p-6 bg-white/70 backdrop-blur-xl border-t border-white/20">
          {controls}
        </div>
      </div>
    );
  }

  // DESKTOP: Premium side-by-side layout with luxury aesthetics
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.03),transparent_50%)]" />
      
      <div className="relative h-full flex flex-col p-8">
        
        {/* Premium Desktop Header */}
        <div className="flex-shrink-0 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm border-0 shadow-sm px-4 py-2">
                <Eye className="w-4 h-4 mr-2 text-blue-600" />
                Enhanced Session
              </Badge>
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
              <PremiumTooltip content={MetricTooltips.breathingPhase} variant="info" side="bottom">
                <span className="text-xl font-light tracking-wide text-gray-700 capitalize">
                  {sessionInfo.phase}
                </span>
              </PremiumTooltip>
            </div>
            <div className="text-right space-y-1">
              <div className="text-3xl font-extralight tracking-wider text-gray-800">
                {sessionInfo.duration}
              </div>
              <div className="text-sm font-medium text-gray-500 tracking-wide flex items-center justify-end gap-2">
                <PremiumTooltip content={MetricTooltips.cycle} variant="info" side="bottom">
                  <span>Cycle {sessionInfo.cycle}</span>
                </PremiumTooltip>
                <span>•</span>
                <PremiumTooltip content={MetricTooltips.progress} variant="info" side="bottom">
                  <span>{sessionInfo.progressPercentage}% complete</span>
                </PremiumTooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Main Content Area - Luxury Side by Side */}
        <div className="flex-1 flex gap-8 min-h-0">
          
          {/* Left Side: Premium Video Feed + Metrics */}
          {showVideo && (
            <div className="w-1/3 flex flex-col">
              <Card className="flex-1 border-0 bg-white/60 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
                <CardContent className="p-6 h-full flex flex-col">
                  
                  {/* Premium Video Feed */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 relative">
                      {videoFeed}
                      {/* Subtle overlay gradient for premium feel */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/5 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Premium Real-time Metrics */}
{metrics.showMetrics && (
  <>
    <div className="mt-6 space-y-4">
      <div className="text-center">
        <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-0 shadow-sm px-3 py-1.5">
          <Activity className="w-3 h-3 mr-2 text-emerald-600" />
          <span className="font-medium tracking-wide">Live Biometrics</span>
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
          <PremiumTooltip content={MetricTooltips.stillness} variant="metric" side="left">
            <span className="text-sm font-medium text-gray-700 tracking-wide">Stillness</span>
          </PremiumTooltip>
          <span className="text-xl font-light text-emerald-600 tracking-wider">
            {metrics.stillnessScore}%
          </span>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
          <PremiumTooltip content={MetricTooltips.presence} variant="metric" side="left">
            <span className="text-sm font-medium text-gray-700 tracking-wide">Presence</span>
          </PremiumTooltip>
          <span className="text-xl font-light text-blue-600 tracking-wider">
            {metrics.presenceScore}%
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm rounded-xl border border-white/10 hover:shadow-sm transition-all duration-300">
          <PremiumTooltip content={MetricTooltips.confidence} variant="metric" side="left">
            <span className="text-xs font-medium text-gray-600 tracking-wide">Confidence</span>
          </PremiumTooltip>
          <span className="text-sm font-light text-gray-500 tracking-wide">
            {metrics.confidenceScore}%
          </span>
        </div>
      </div>
      
      <div className="text-xs text-center text-gray-500 mt-4 font-light tracking-wide">
        Move your head to see stillness change
      </div>
    </div>
    <CelebrationSparkles visible={metrics.stillnessScore >= 80} className="absolute inset-0 pointer-events-none" />
  </>
)}
</CardContent>
              </Card>
            </div>
          )}
          
          {/* Right Side: Premium Breathing Animation */}
          <div className={cn(
            "flex-1 flex items-center justify-center relative",
            showVideo ? "w-2/3" : "w-full"
          )}>
            {/* Subtle breathing zone background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-blue-50/30 rounded-3xl" />
            <div className="relative z-10">
              {breathingAnimation}
            </div>
          </div>
        </div>

        {/* Premium Desktop Controls */}
        <div className="flex-shrink-0 mt-8">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-blue-500/5 p-6">
            {controls}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSessionLayout;
