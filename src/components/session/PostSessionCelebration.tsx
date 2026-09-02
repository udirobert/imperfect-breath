import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Trophy, ArrowRight, Sparkles, Star, Flame, ShieldCheck, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trackCredentialShared } from "@/lib/notifications/oneSignal";
import { TaskPipeline, type PipelineRow } from "@/components/primitives/TaskPipeline";
import { useAttestation } from "@/hooks/useAttestation";
import { shareProofCard } from "@/lib/proofCard";

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
  /** True when camera verification was active — unlocks the credential card */
  verified?: boolean;
  /** One honest sentence from this session. */
  insight?: string;
  isGuest?: boolean;
  onContinue?: () => void;
  onSeeProgress?: () => void;
  onSaveProgress?: () => void;
  onConnectWallet?: () => void;
  onClose?: () => void;
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
  onClose,
}) => {
  const durationMinutes = Math.round(metrics.duration / 60);

  // Live attestation lifecycle — replaces the old static "pending" row
  const attestation = useAttestation(verified, { score: metrics.score });
  const attestRow: PipelineRow =
    attestation.status === "loading"
      ? { key: "attest", label: "Issuing credential", status: "active" }
      : attestation.status === "done"
        ? { key: "attest", label: "Credential issued", status: "done", meta: attestation.meta }
        : attestation.status === "failed"
          ? { key: "attest", label: "Credential issuance failed", status: "failed" }
          : attestation.status === "needs-wallet"
            ? { key: "attest", label: "On-chain credential", status: "pending", meta: "connect wallet" }
            : { key: "attest", label: "On-chain credential", status: "pending" };

  // The virality loop: shareable proof of practice as a designed image card
  // (Grand Prize growth surface). Uses canvas-rendered image via Web Share API.
  const handleShareCredential = async () => {
    try {
      const result = await shareProofCard({
        patternName: metrics.patternName,
        duration: metrics.duration,
        score: metrics.score,
        cycles: metrics.cycles,
        streak: metrics.streak,
        verified: verified,
      });

      if (result === "shared") {
        trackCredentialShared();
      } else if (result === "downloaded") {
        toast.success("Proof card saved — share it anywhere");
        trackCredentialShared();
      } else {
        toast.success("Proof card copied — paste it anywhere");
        trackCredentialShared();
      }
    } catch {
      /* user dismissed the share sheet — fine */
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center relative z-10"
          >
            <Trophy className="h-10 w-10 text-primary" />
          </motion.div>
        </div>
        
        <div className="space-y-2 px-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {metrics.isFirstSession ? "Your first breath." : "Session complete."}
          </h2>
          <p className="text-lg text-muted-foreground">
            {insight ||
              `You practiced ${metrics.patternName} for ${durationMinutes} minute${durationMinutes === 1 ? "" : "s"}.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <StatItem 
          label="Focus Score" 
          value={metrics.score.toString()} 
          icon={<Star className="w-4 h-4 text-primary" />} 
          delay={0.1}
        />
        <StatItem 
          label="Streak" 
          value={`${metrics.streak || 1} Days`} 
          icon={<Flame className="w-4 h-4 text-orange-500" />} 
          delay={0.2}
          highlight
        />
        <StatItem 
          label="Total Cycles" 
          value={metrics.cycles?.toString() || "—"} 
          icon={<Sparkles className="w-4 h-4 text-teal-500" />} 
          delay={0.3}
        />
      </div>

      {verified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-2"
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <ShieldCheck className="w-5 h-5" />
                Verified Record of Practice
              </div>
              <p className="text-sm text-muted-foreground">
                Camera-verified on {new Date().toLocaleDateString()} · Score {metrics.score}
                {metrics.streak ? ` · ${metrics.streak}-day streak` : ""}
              </p>
              {/* Proof-of-practice pipeline — honest states, nothing faked */}
              <TaskPipeline
                rows={[
                  { key: "verify", label: "Session verified by camera", status: "done" },
                  { key: "score", label: "Score recorded", status: "done", meta: String(metrics.score) },
                  attestRow,
                ]}
                onRetry={attestation.retry}
                className="border-t border-primary/10 pt-3"
              />
              {/* User-initiated: the user must click to mint the on-chain credential.
                  The wallet only prompts on this action, not on modal mount. */}
              {attestation.status === "idle" && (
                <Button
                  onClick={() => void attestation.attest()}
                  className="w-full rounded-full btn-premium py-6"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Mint your verified credential
                </Button>
              )}
              {attestation.status === "needs-wallet" && (
                <Button
                  onClick={onConnectWallet}
                  className="w-full rounded-full btn-premium py-6"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Connect wallet to mint
                </Button>
              )}
              {attestation.status === "failed" && (
                <Button
                  onClick={() => void attestation.retry()}
                  variant="outline"
                  className="w-full rounded-full border-primary/30 text-primary hover:bg-primary/10"
                >
                  Retry credential issuance
                </Button>
              )}
              <Button
                onClick={handleShareCredential}
                variant="outline"
                className="rounded-full border-primary/30 text-primary hover:bg-primary/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share proof card
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isGuest && (
        <p className="text-sm text-muted-foreground px-4">
          <button
            type="button"
            onClick={onSaveProgress}
            className="font-medium text-primary hover:underline underline-offset-2"
          >
            Create an account
          </button>{" "}
          to keep this streak across devices.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-4 px-2">
        <Button
          onClick={onContinue}
          className="flex-1 btn-premium py-7 text-lg rounded-full"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Keep the Momentum
        </Button>
        {!verified && (
          <Button
            onClick={handleShareCredential}
            variant="outline"
            className="flex-1 glass-dark py-7 text-lg rounded-full border-primary/20 text-primary"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Proof
          </Button>
        )}
        <Button
          onClick={onSeeProgress}
          variant="outline"
          className="flex-1 glass-dark py-7 text-lg rounded-full border-primary/20 text-primary"
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          See my progress
        </Button>
      </div>

      <p className="text-sm text-muted-foreground animate-pulse pb-4">
        Every breath is a new beginning.
      </p>
    </motion.div>
  );
};

function StatItem({ label, value, icon, delay, highlight }: { 
  label: string, 
  value: string, 
  icon: React.ReactNode, 
  delay: number,
  highlight?: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={highlight ? "border-primary/20 bg-primary/5" : "glass border-none"}>
        <CardContent className="pt-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            {icon}
            {label}
          </div>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
