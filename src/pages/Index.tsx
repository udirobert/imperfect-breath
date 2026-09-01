import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { TodayCard } from "@/components/home/TodayCard";
import { useSessionHistory } from "@/hooks/useSessionHistory";

export default function Index() {
  const { user } = useAuth();
  const { streak } = useSessionHistory();
  const isGuest = !user;

  return (
    <div className="w-full min-h-screen bg-calm-gradient flex flex-col items-center pt-20 pb-20 px-6">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/15 rounded-full blur-[120px] -z-10 animate-pulse" />

      {/*
        Core loop first: a returning user lands on the state check-in, not on
        marketing. Guests get a compact headline + the same one-tap entry —
        no feature cards, no dual CTAs. The state check-in IS the pitch.
      */}
      <div className="relative text-center space-y-2 max-w-2xl mt-4 animate-in fade-in">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
          {!isGuest && streak > 0
            ? `Day ${streak}. Keep it breathing.`
            : isGuest
              ? <>Breathe <span className="text-gradient">better</span>. Prove <span className="text-gradient">it</span>.</>
              : "Welcome back."}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {streak > 0
            ? "One check-in, one session — that's the whole practice."
            : "Tap how you feel. Brume picks the breath."}
        </p>
      </div>

      {/* The state check-in — one tap to session */}
      <div className="mt-10 flex justify-center w-full animate-in fade-in duration-1000 delay-300 fill-mode-both">
        <TodayCard />
      </div>

      {/* Guest: compact sign-in prompt + one-line pitch. No feature wall. */}
      {isGuest && (
        <div className="mt-10 text-center space-y-2 animate-in fade-in duration-1000 delay-500 fill-mode-both">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/auth?redirect=/"
              className="font-semibold text-primary hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/60">
            Camera-verified · Video never leaves your phone
          </p>
        </div>
      )}

      {/* Background Element */}
      <div className="fixed bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-white to-transparent pointer-events-none -z-10" />
    </div>
  );
}
