import React, { useState } from "react";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { trackCredentialShared } from "@/lib/notifications/oneSignal";
import { useAttestation } from "@/hooks/useAttestation";
import { shareProofCard } from "@/lib/proofCard";
import { AgentTrace } from "@/components/primitives/AgentTrace";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PostSessionCelebrationProps {
  metrics: {
    patternName: string;
    duration: number;
    score: number;
    cycles?: number;
    sessionType?: string;
    isFirstSession?: boolean;
    streak?: number;
  };
  /** Quiet mark only — verification is not the landing job. */
  verified?: boolean;
  insight?: string;
  isGuest?: boolean;
  onContinue?: () => void;
  onSeeProgress?: () => void;
  onSaveProgress?: () => void;
  onConnectWallet?: () => void;
  onClose?: () => void;
}

function sessionLength(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

export const PostSessionCelebration: React.FC<PostSessionCelebrationProps> = ({
  metrics,
  verified = false,
  insight,
  isGuest = false,
  onContinue,
  onSeeProgress,
  onSaveProgress,
  onConnectWallet,
}) => {
  const reduceMotion = useReducedMotion();
  const streak = metrics.streak || 1;
  const [insightReady, setInsightReady] = useState(false);

  // The insight generation as a brief, honest ritual — "Reading your session
  // → Writing your insight" — then settles to reveal the text. Reintegrated
  // from the deleted AgentTrace primitive; runs once, stays expandable.
  const traceSteps = React.useMemo(
    () => [
      { label: "Reading your session" },
      { label: "Noticing your stillness" },
      { label: "Writing your insight" },
    ],
    [],
  );

  const handleShare = async () => {
    try {
      const result = await shareProofCard({
        patternName: metrics.patternName,
        duration: metrics.duration,
        score: metrics.score,
        cycles: metrics.cycles,
        streak: metrics.streak,
        verified,
      });

      if (result === "shared") {
        trackCredentialShared();
      } else if (result === "downloaded") {
        toast.success("Saved — share it anywhere");
        trackCredentialShared();
      } else {
        toast.success("Copied — paste it anywhere");
        trackCredentialShared();
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const fade = (delay: number) =>
    reduceMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const meta = [
    sessionLength(metrics.duration),
    `Day ${streak}`,
    verified ? "Seen" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div className="space-y-3 px-4" {...fade(0)}>
        <h2 className="text-3xl font-bold tracking-tight">
          {metrics.isFirstSession ? "Your first breath." : "Session complete."}
        </h2>
        {insightReady ? (
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {insight || `You practiced ${metrics.patternName}.`}
          </p>
        ) : (
          <div className="flex justify-center py-2">
            <AgentTrace
              steps={traceSteps}
              activeLabel="Reading your session"
              doneLabel="Insight ready"
              onSettled={() => setInsightReady(true)}
            />
          </div>
        )}
      </motion.div>

      <motion.div className="mt-14 space-y-3" {...fade(0.12)}>
        <p className="text-7xl md:text-8xl font-light tabular-nums tracking-tight leading-none">
          {metrics.score}
        </p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          stillness
        </p>
        <p className="text-sm text-muted-foreground pt-1">
          {meta.join(" · ")}
        </p>
      </motion.div>

      {isGuest && (
        <motion.p className="mt-10 text-sm text-muted-foreground px-4" {...fade(0.22)}>
          <button
            type="button"
            onClick={onSaveProgress}
            className="font-medium text-primary hover:underline underline-offset-2"
          >
            Create an account
          </button>{" "}
          to keep this streak across devices.
        </motion.p>
      )}

      <motion.div
        className="mt-12 w-full max-w-xs flex flex-col items-center gap-5"
        {...fade(0.28)}
      >
        <Button
          onClick={onContinue}
          className="w-full rounded-full btn-premium py-6 text-base"
        >
          Done
        </Button>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={onSeeProgress}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Progress
          </button>
          <span className="text-muted-foreground/30">·</span>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Share
          </button>
        </div>
      </motion.div>

      {verified && (
        <motion.div className="mt-10 w-full max-w-xs" {...fade(0.38)}>
          <Collapsible>
            <CollapsibleTrigger className="group mx-auto flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors">
              Record
              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <CredentialPanel
                score={metrics.score}
                onConnectWallet={onConnectWallet}
              />
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}
    </div>
  );
};

function CredentialPanel({
  score,
  onConnectWallet,
}: {
  score: number;
  onConnectWallet?: () => void;
}) {
  const attestation = useAttestation(true, { score });

  return (
    <div className="space-y-2 text-center">
      {attestation.status === "done" && (
        <p className="text-xs text-muted-foreground">
          Issued{attestation.meta ? ` · ${attestation.meta}` : ""}
        </p>
      )}
      {attestation.status === "idle" && (
        <Button
          onClick={() => void attestation.attest()}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          Mint credential
        </Button>
      )}
      {attestation.status === "needs-wallet" && (
        <Button
          onClick={onConnectWallet}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          Connect wallet to mint
        </Button>
      )}
      {attestation.status === "loading" && (
        <p className="text-xs text-muted-foreground">Issuing…</p>
      )}
      {attestation.status === "failed" && (
        <Button
          onClick={() => void attestation.retry()}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          Retry mint
        </Button>
      )}
    </div>
  );
}
