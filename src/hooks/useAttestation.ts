/**
 * useAttestation — live proof-of-practice issuance against POST /api/attest.
 *
 * Replaces the static "pending" row on the credential card with the real
 * request lifecycle: idle → needs-wallet → loading → done (queued on Flow)
 * | failed (with retry). Honest by construction: 'done' means the backend
 * accepted the attestation; chain confirmation is reported as "queued".
 *
 * Security: this hook does NOT auto-fire. The on-chain write is user-initiated
 * (per Privacy Policy) — the caller must explicitly call `attest()`, e.g.
 * from a "Mint credential" button. An idempotency guard prevents double-firing
 * (important under React.StrictMode, which double-invokes effects in dev).
 */
import { useCallback, useRef, useState } from "react";
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

  // Idempotency: prevent double-firing under StrictMode or repeated calls.
  const hasRunRef = useRef(false);

  const attest = useCallback(async () => {
    // Guard: never run twice for the same lifecycle.
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    if (!sessionId || !address || !BACKEND_URL) {
      setStatus(address ? "idle" : "needs-wallet");
      return;
    }
    setStatus("loading");
    setMeta(undefined);
    try {
      // NOTE: no `verified` field — the backend verifies server-side from the
      // vision processor's session store. See backend/vision-service/main.py.
      const res = await fetch(`${BACKEND_URL}/api/attest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          wallet_address: address,
          session_score: opts?.score ?? 0,
        }),
      });
      if (!res.ok) throw new Error(`attest_${res.status}`);
      const data = await res.json();
      // Backend accepted = recorded. Chain confirmation happens client-side below.
      setMeta(data?.attestation?.status === "pending_chain" ? "Flow · queued" : "Flow");
      setStatus("done");

      // The score is SERVER-authoritative: the backend computes it from the
      // session's camera data and signs exactly this value into the
      // co-signature payload. We must pass the signed value to the
      // transaction — the contract rejects any other score (payload binding
      // in PracticeCredential.attest). Fall back to the local score only if
      // an older backend doesn't return metrics yet.
      const serverScore = data?.credential?.metrics?.session_score;
      const chainScore = typeof serverScore === "number" ? serverScore : (opts?.score ?? 0);

      // User-initiated on-chain write (client holds keys). Only attempted when
      // the PracticeCredential contract is configured; failure keeps "queued" —
      // the backend record stands and the user can retry later.
      try {
        await attestPracticeOnChain({
          sessionId,
          score: chainScore,
          verifierSignature: data?.verifier_signature,
        });
        setMeta("Flow testnet ✓");
      } catch {
        /* stays queued — honest, backend has the record */
      }
    } catch {
      setStatus("failed");
      hasRunRef.current = false; // allow retry on failure
    }
  }, [sessionId, address, opts?.score]);

  // Reset state when the hook is disabled (modal unmounted), but do NOT
  // auto-fire. The caller must invoke attest() explicitly (user-initiated).
  const reset = useCallback(() => {
    hasRunRef.current = false;
    setStatus(enabled ? (address ? "idle" : "needs-wallet") : "idle");
  }, [enabled, address]);

  return { status, meta, attest, reset, retry: attest };
}
