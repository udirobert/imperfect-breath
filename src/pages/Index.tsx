import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Wind, Shield, Users, Zap, Compass, Star } from "lucide-react";
import { TodayCard } from "@/components/home/TodayCard";
import { useSessionHistory } from "@/hooks/useSessionHistory";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { streak } = useSessionHistory();
  const isGuest = !user;

  return (
    <div className="w-full min-h-screen bg-calm-gradient flex flex-col items-center pt-20 pb-20 px-6">
      {/*
        Core loop first: a returning user lands on the state check-in, not on
        marketing. The pitch leads only for guests, who need to know what Brume
        is before they check in.
      */}
      {!isGuest ? (
        <div className="relative text-center space-y-2 max-w-2xl mt-4 animate-in fade-in">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {streak > 0 ? `Day ${streak}. Keep it breathing.` : "Welcome back."}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {streak > 0
              ? "One check-in, one session — that's the whole practice."
              : "Check in, and we'll pick up where you left off."}
          </p>
        </div>
      ) : (
        <div className="relative text-center space-y-8 max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />

          <div className="inline-flex items-center space-x-2 badge-premium mb-4">
            <Star className="w-3 h-3 fill-primary" />
            <span>Camera-Verified Breathwork</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            Breathe <span className="text-gradient">Better</span>. <br />
            Prove <span className="text-gradient">It</span>.
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Guided breathing your camera can verify — real coaching, real progress you can prove.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="btn-premium px-12 py-8 text-xl rounded-full w-full sm:w-auto"
              onClick={() => navigate("/auth?context=onboarding")}
            >
              Complete Onboarding
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="px-8 py-8 text-lg rounded-full w-full sm:w-auto glass-dark border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => navigate("/patterns")}
            >
              Explore Patterns
            </Button>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/auth?redirect=/"
                className="font-semibold text-primary hover:underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* The state check-in — the first step of the core loop */}
      <div className={`${isGuest ? "mt-16" : "mt-10"} flex justify-center w-full animate-in fade-in duration-1000 delay-300 fill-mode-both`}>
        <TodayCard />
      </div>

      {/*
        Positioning: the pitch for guests deciding whether Brume is credible;
        quiet reinforcement below the fold for returning users.
      */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl ${isGuest ? "mt-32" : "mt-24"} animate-in fade-in duration-1000 delay-500 fill-mode-both`}>
        <FeatureCard
          icon={<Zap className="w-6 h-6" />}
          title="Camera Verification"
          description="On-device vision confirms you actually practiced. Video never leaves your phone."
        />
        <FeatureCard
          icon={<Users className="w-6 h-6" />}
          title="Verified Credentials"
          description="Streaks and records anchored on-chain — progress you can carry anywhere."
        />
        <FeatureCard
          icon={<Shield className="w-6 h-6" />}
          title="Private by Design"
          description="Your data is yours. No raw video, no facial recognition, ever."
        />
      </div>

      {/* Background Element */}
      <div className="fixed bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-white to-transparent pointer-events-none -z-10" />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass p-8 rounded-[2rem] space-y-4 hover:border-primary/40 transition-colors group">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
