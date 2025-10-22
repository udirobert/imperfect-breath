import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { LensIntegratedSocialFlow } from "@/components/social/LensIntegratedSocialFlow";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import type { SessionData } from "@/lib/ai/config";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function LensSocialFlowPage() {
  const location = useLocation();
  const { history } = useSessionHistory();
  const latest = history && history.length > 0 ? history[0] : undefined;
  const passed = (location.state as any)?.session as Partial<SessionData> | undefined;

  const sessionData: SessionData = {
    patternName: passed?.patternName ?? latest?.pattern_name ?? "Breathing",
    sessionDuration: passed?.sessionDuration ?? latest?.session_duration ?? 300,
    breathHoldTime: passed?.breathHoldTime ?? latest?.breath_hold_time ?? 0,
    restlessnessScore: passed?.restlessnessScore ?? latest?.restlessness_score ?? 0,
    timestamp: passed?.timestamp ?? latest?.created_at ?? new Date().toISOString(),
  };

  const initialTab = (location.state as any)?.focusTab ?? "share";
  const [shared, setShared] = useState(false);

  const handleSocialAction = (action: string, data: any) => {
    if (action === "session_shared") {
      setShared(true);
      toast.success("Shared to Lens", { description: "Your session is live." });
    } else {
      toast.info("Social action", { description: `${action} triggered` });
    }
    // eslint-disable-next-line no-console
    console.log("[LensSocialFlowPage] Action:", action, data);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      {shared && (
        <Badge variant="secondary">Shared to Lens</Badge>
      )}
      <LensIntegratedSocialFlow
        phase="sharing"
        sessionData={sessionData}
        onSocialAction={handleSocialAction}
        initialTab={initialTab}
      />
    </div>
  );
}