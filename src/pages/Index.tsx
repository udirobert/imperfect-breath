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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/use-mobile";
import { SessionEntryPoints } from "../components/navigation/SessionEntryPoints";
import { SmartAuthGate } from "../components/auth/SmartAuthGate";
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
          <SmartAuthGate required="none" context="wellness">
            <SessionEntryPoints
              variant={isMobile ? "mobile" : "desktop"}
              className="max-w-md mx-auto"
            />
          </SmartAuthGate>
        </div>
      </section>

      {/* Secondary Actions - Context-aware and spaced properly */}
      <section className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* Progress tracking - only show after engagement */}
        <SmartAuthGate required="supabase" context="progress" fallback="hide">
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
        </SmartAuthGate>

        {/* Community features - show only when relevant */}
        <SmartAuthGate required="evm" context="social" fallback="hide">
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
        </SmartAuthGate>
      </section>

      {/* Features Grid - Better spacing and layout */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Why Imperfect Breath?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            In the asymptote towards perfection lies a blend of ancient wisdom
            and modern technology
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
            <SmartAuthGate required="flow" context="nft" fallback="prompt">
              <div className="text-center p-6 bg-white/50 rounded-xl border border-white/20 hover:bg-white/70 transition-all cursor-pointer">
                <Coins className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <h4 className="font-medium mb-1">Own Your Patterns</h4>
                <p className="text-sm text-muted-foreground">Mint as NFTs</p>
              </div>
            </SmartAuthGate>

            {/* Social Features */}
            <SmartAuthGate required="evm" context="social" fallback="prompt">
              <div className="text-center p-6 bg-white/50 rounded-xl border border-white/20 hover:bg-white/70 transition-all cursor-pointer">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-medium mb-1">Share & Connect</h4>
                <p className="text-sm text-muted-foreground">Join community</p>
              </div>
            </SmartAuthGate>

            {/* Instructor Path */}
            <SmartAuthGate
              required="supabase"
              context="instructor"
              fallback="prompt"
            >
              <Link to="/instructor-onboarding">
                <div className="text-center p-6 bg-white/50 rounded-xl border border-white/20 hover:bg-white/70 transition-all cursor-pointer">
                  <Heart className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h4 className="font-medium mb-1">Teach Others</h4>
                  <p className="text-sm text-muted-foreground">
                    Become instructor
                  </p>
                </div>
              </Link>
            </SmartAuthGate>
          </div>
        </section>
      )}
    </div>
  );
}
