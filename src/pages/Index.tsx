import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useSessionHistory } from "../hooks/useSessionHistory";
import {
  Waves,
  Target,
  BarChart3,
  Bot,
  Heart,
  Users,
  Coins,
  Crown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/useAdaptivePerformance";
import { AdaptiveSessionFlow } from "../components/navigation/AdaptiveSessionFlow";
import { DesktopAdaptiveSessionFlow } from "../components/desktop/DesktopAdaptiveSessionFlow";
import { ConsolidatedAuthGate } from "../auth/components/ConsolidatedAuthGate";
import { MESSAGING } from "../config/messaging";

const Feature = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <Icon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
    <div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  </div>
);

interface HomePageProps {
  enhanced?: boolean;
  userType?: "anonymous" | "authenticated" | "instructor";
}

export default function Index({
  enhanced = false,
  userType = "anonymous",
}: HomePageProps) {
  const { history } = useSessionHistory();
  const { session, user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section - Clean and focused */}
      <section className="text-center space-y-6">
        <h1
          style={{ animationDelay: "200ms", opacity: 0 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground animate-fade-in"
        >
          Transform your breathing
        </h1>
        <p
          style={{ animationDelay: "400ms", opacity: 0 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in"
        >
          Peace through patterns. Breathe like never before.
        </p>

        {/* Primary CTA - Always accessible */}
        <div
          style={{ animationDelay: "600ms", opacity: 0 }}
          className="animate-fade-in"
        >
          <ConsolidatedAuthGate required="none">
            {isMobile ? (
              <AdaptiveSessionFlow
                variant="mobile"
                className="max-w-4xl mx-auto"
              />
            ) : (
              <DesktopAdaptiveSessionFlow
                className="max-w-7xl mx-auto"
                onPatternSelect={(patternId) =>
                  console.log("Selected pattern:", patternId)
                }
                onSessionStart={() => console.log("Starting session")}
              />
            )}
          </ConsolidatedAuthGate>
        </div>
      </section>

      {/* Secondary Actions - Context-aware and spaced properly */}
      <section className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* Progress tracking - only show after engagement */}
        <ConsolidatedAuthGate required="email" fallback="hide">
          <Link to="/progress">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {MESSAGING.cta.secondary}
            </Button>
          </Link>
        </ConsolidatedAuthGate>

        {/* Community features - show only when relevant */}
        <ConsolidatedAuthGate required="wallet" fallback="hide">
          <Link to="/community">
            <Button
              size="lg"
              variant="ghost"
              className="px-8 py-3 rounded-full transition-all"
            >
              <Users className="h-4 w-4 mr-2" />
              {MESSAGING.cta.tertiary}
            </Button>
          </Link>
        </ConsolidatedAuthGate>
      </section>

      {/* Features Grid - Better spacing and layout */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Why does this work so well?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ancient breathing wisdom meets modern AI coaching. Proven techniques
            that activate your body's natural relaxation response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Feature icon={Waves} title="Guided Breathing">
            Follow structured patterns like Box, Resonant, and Wim Hof to
            regulate your nervous system.
          </Feature>
          <Feature icon={Target} title="Performance Metrics">
            Measure breath-hold times and stillness to see tangible improvements
            in your focus.
          </Feature>
          <Feature icon={BarChart3} title="Progress History">
            Track your sessions over time and watch your mental and physical
            resilience grow with detailed analytics.
          </Feature>
          <Feature icon={Bot} title="AI Vision Coaching">
            Real-time facial analysis provides personalized feedback on
            stillness, posture, and breathing rhythm.
          </Feature>
        </div>
      </section>

      {/* Progressive Discovery - Only show when enhanced */}
      {enhanced && (
        <section className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl border border-primary/10 p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Ready for More?</h3>
            <p className="text-muted-foreground">
              Unlock advanced features as you progress
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* NFT Features */}
            <ConsolidatedAuthGate required="flow" fallback="prompt">
              <div className="text-center p-6 bg-white/50 rounded-xl border border-white/20 hover:bg-white/70 transition-all cursor-pointer">
                <Coins className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <h4 className="font-medium mb-1">Own Your Patterns</h4>
                <p className="text-sm text-muted-foreground">Mint as NFTs</p>
              </div>
            </ConsolidatedAuthGate>

            {/* Social Features */}
            <ConsolidatedAuthGate required="wallet" fallback="prompt">
              <div className="text-center p-6 bg-white/50 rounded-xl border border-white/20 hover:bg-white/70 transition-all cursor-pointer">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-medium mb-1">Share & Connect</h4>
                <p className="text-sm text-muted-foreground">Join community</p>
              </div>
            </ConsolidatedAuthGate>

            {/* Instructor Path */}
            <ConsolidatedAuthGate required="email" fallback="prompt">
              <Link to="/instructor-onboarding">
                <div className="text-center p-6 bg-white/50 rounded-xl border border-white/20 hover:bg-white/70 transition-all cursor-pointer">
                  <Heart className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h4 className="font-medium mb-1">Teach Others</h4>
                  <p className="text-sm text-muted-foreground">
                    Become instructor
                  </p>
                </div>
              </Link>
            </ConsolidatedAuthGate>
          </div>
        </section>
      )}

      {/* Subscription Promotion */}
      <section className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-200/20 p-8 space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-semibold">Unlock Premium Features</h3>
          </div>
          <p className="text-muted-foreground mb-6">
            Take your breathing practice to the next level with AI coaching,
            advanced patterns, and Web3 features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Premium Tier */}
          <div className="bg-white/50 rounded-xl border border-blue-200/50 p-6 text-center hover:bg-white/70 transition-all">
            <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Premium</h4>
            <p className="text-2xl font-bold text-blue-600 mb-2">$4.99/mo</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ AI coaching with Zen agent</li>
              <li>✓ Advanced breathing patterns</li>
              <li>✓ Cloud synchronization</li>
              <li>✓ Detailed analytics</li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6 text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
              Popular
            </div>
            <Crown className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Pro</h4>
            <p className="text-2xl font-bold text-purple-600 mb-2">$9.99/mo</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Everything in Premium</li>
              <li>✓ NFT creation & minting</li>
              <li>✓ Web3 social features</li>
              <li>✓ Instructor tools</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link to="/subscription">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              View All Plans
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
