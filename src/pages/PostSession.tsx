/**
 * PostSession — the single post-session surface.
 *
 * Replaces the 1162-line Results.tsx dashboard. The post-session moment
 * is: proof → share → done. AI analysis is an optional tap, not the
 * default view. No tabs, no agent traces, no streaming indicators.
 *
 * Session data arrives via router state from SessionModeWrapper.
 */
import React, { useEffect, useRef, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PostSessionCelebration } from "@/components/session/PostSessionCelebration";
import { SignInForm } from "@/components/auth/SignInForm";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

function buildInsight(score: number, verified: boolean, patternName: string): string {
  if (!verified) {
    return `You completed ${patternName}. Next time, let Brume see your breath for a verified record.`;
  }
  if (score >= 80) return "Your stillness held. Sessions like this are settling you.";
  if (score >= 60) return "Good practice. Shorter and stiller usually beats heroic.";
  return "Take a moment to notice how you feel. Be gentle — the streak is the credential.";
}

export default function PostSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { streak, saveSession } = useSessionHistory();
  const { user } = useAuth();
  const lastSessionVerified = useSessionStore((s) => s.lastSessionVerified);
  const hasSavedRef = useRef(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const sessionData = useMemo(() => location.state || {}, [location.state]);
  const verified = lastSessionVerified || !!sessionData.cameraUsed;

  // Save session once on mount
  useEffect(() => {
    if (sessionData.patternName && !hasSavedRef.current) {
      try {
        saveSession({
          breathHoldTime: sessionData.breathHoldTime || 0,
          restlessnessScore: sessionData.restlessnessScore || 0,
          sessionDuration: sessionData.sessionDuration || 0,
          patternName: sessionData.patternName,
        });
        hasSavedRef.current = true;
      } catch (error) {
        console.error("Failed to save session", error);
      }
    }
  }, [sessionData, saveSession]);

  // Compute score — same logic as the old Results.tsx
  const score = useMemo(() => {
    const sessionType = sessionData.sessionType || "enhanced";
    if (sessionType === "classic") {
      return Math.min(100, Math.max(50, (sessionData.cycleCount || 1) * 10));
    }
    // Enhanced: use stillness score if available, else derive from restlessness
    if (sessionData.stillnessScore != null) {
      return sessionData.stillnessScore;
    }
    if (sessionData.restlessnessScore != null) {
      return Math.max(0, 100 - sessionData.restlessnessScore);
    }
    return 75;
  }, [sessionData]);

  if (!sessionData.patternName) {
    // No session data — redirect home
    return <NavigateFallback />;
  }

  return (
    <div className="min-h-screen bg-calm-gradient flex flex-col items-center justify-center px-6 py-12">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/15 rounded-full blur-[120px] -z-10 animate-pulse" />

      <div className="w-full max-w-2xl">
        <PostSessionCelebration
          metrics={{
            patternName: sessionData.patternName,
            duration: sessionData.sessionDuration || 0,
            score,
            cycles: sessionData.cycleCount,
            streak,
          }}
          verified={verified}
          insight={buildInsight(score, verified, sessionData.patternName)}
          isGuest={!user}
          onContinue={() => navigate("/")}
          onSeeProgress={() => navigate("/progress")}
          onSaveProgress={() => setSaveOpen(true)}
          onConnectWallet={() => navigate("/profile")}
          onClose={() => navigate("/")}
        />
      </div>

      <Sheet open={saveOpen} onOpenChange={setSaveOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[2rem] border-t px-6 pb-10 pt-8 max-h-[90vh] overflow-y-auto sm:max-w-md sm:mx-auto"
        >
          <SheetHeader className="text-center space-y-2 mb-6">
            <SheetTitle className="text-2xl font-bold tracking-tight">
              Keep this streak
            </SheetTitle>
            <SheetDescription className="text-[15px]">
              An email is enough. This session stays on screen.
            </SheetDescription>
          </SheetHeader>
          <SignInForm
            compact
            intent="save-session"
            defaultSignUp
            onComplete={() => {
              toast.success("Saved. This streak is yours.");
              setSaveOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavigateFallback() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);
  return null;
}
