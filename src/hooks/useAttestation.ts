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
import { attestPracticeOnChain } from "@/lib/flow/attest-practice";

export type AttestationStatus = "idle" | "needs-wallet" | "loading" | "done" | "failed";

const BACKEND_URL = (import.meta.env.VITE_HETZNER_SERVICE_URL as string | undefined) ?? "";

export function useAttestation(enabled: boolean, opts?: { score?: number }) {
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
      // Backend accepted = recorded. Chain confirmation happens client-side below.
      setMeta(data?.attestation?.status === "pending_chain" ? "Flow · queued" : "Flow");
      setStatus("done");

      // User-initiated on-chain write (client holds keys). Only attempted when
      // the PracticeCredential contract is configured; failure keeps "queued" —
      // the backend record stands and the user can retry later.
      try {
        await attestPracticeOnChain({ sessionId, score: opts?.score ?? 0 });
        setMeta("Flow testnet ✓");
      } catch {
        /* stays queued — honest, backend has the record */
      }
    } catch {
      setStatus("failed");
    }
  }, [sessionId, address, opts?.score]);

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
