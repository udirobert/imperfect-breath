/**
 * useAttestation — live proof-of-practice issuance against POST /api/attest.
 *
 * Replaces the static "pending" row on the credential card with the real
 * request lifecycle: idle → needs-wallet → loading → done (queued on Flow)
 * | failed (with retry). Honest by construction: 'done' means the backend
 * accepted the attestation; chain confirmation is reported as "queued".
 */
import { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuth } from "@/hooks/useAuth";

export type AttestationStatus = "idle" | "needs-wallet" | "loading" | "done" | "failed";

const BACKEND_URL = (import.meta.env.VITE_HETZNER_SERVICE_URL as string | undefined) ?? "";

export function useAttestation(enabled: boolean) {
  const sessionId = useSessionStore((s) => s.sessionId);
  const { wallet } = useAuth();
  const address = wallet?.address ?? null;

  const [status, setStatus] = useState<AttestationStatus>("idle");
  const [meta, setMeta] = useState<string | undefined>(undefined);

  const run = useCallback(async () => {
    if (!sessionId || !address || !BACKEND_URL) {
      setStatus(address ? "idle" : "needs-wallet");
      return;
    }
    setStatus("loading");
    setMeta(undefined);
    try {
      const res = await fetch(`${BACKEND_URL}/api/attest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          wallet_address: address,
          verified: true,
        }),
      });
      if (!res.ok) throw new Error(`attest_${res.status}`);
      const data = await res.json();
      // Backend mints async: accepted = "queued on Flow", never claim confirmed
      setMeta(data?.attestation?.status === "pending_chain" ? "Flow · queued" : "Flow");
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }, [sessionId, address]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    if (!address) {
      setStatus("needs-wallet");
      return;
    }
    void run();
  }, [enabled, address, run]);

  return { status, meta, retry: run };
}
