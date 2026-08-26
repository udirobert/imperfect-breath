#!/usr/bin/env node
/**
 * Brume Proof-of-Practice MCP Server
 *
 * Exposes verified-breathwork primitives to any MCP-compatible agent.
 * This is the agent-native wedge (see docs/STRATEGY.md §4): agents that coach
 * humans cannot verify physical practice — Brume can.
 *
 * Monetization: metered per API key today (`BRUME_API_KEYS`); x402-style
 * per-call payment hooks marked TODO(x402) at the metering layer.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const VISION_URL = process.env.BRUME_VISION_URL ?? "https://api.imperfectform.fun";

// --- Metering stub -----------------------------------------------------------
// TODO(x402): replace key-based metering with per-call payment verification.
const VALID_KEYS = new Set((process.env.BRUME_API_KEYS ?? "dev-key").split(","));
function meter(apiKey: string, tool: string): void {
  if (!VALID_KEYS.has(apiKey)) throw new Error("invalid_api_key");
  // TODO: usage counter per key — billing + HAMM evidence trail
  void tool;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${VISION_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`vision_service_${res.status}`);
  return res.json() as Promise<T>;
}

const server = new McpServer({
  name: "brume-proof-of-practice",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// Tool 1: verify a session — did the human actually breathe?
// Backed by the existing vision service: POST /api/vision/process
// ---------------------------------------------------------------------------
server.tool(
  "breath_verify_session",
  "Verify a breathwork session from camera-derived signal samples. Returns whether the practice is verified, plus measured breath rate, depth consistency, and a session score. Raw video never leaves the client device — only derived metrics are sent.",
  {
    apiKey: z.string().describe("Metered API key"),
    samples: z
      .array(z.object({ t: z.number(), signal: z.number() }))
      .min(10)
      .describe("Time-series of breath signal samples (face-mesh derived, client-side)"),
    expectedPattern: z
      .object({ inhale: z.number(), hold: z.number().optional(), exhale: z.number() })
      .optional()
      .describe("Target cadence in seconds, if practicing against a pattern"),
  },
  async ({ apiKey, samples, expectedPattern }) => {
    meter(apiKey, "breath_verify_session");
    const result = await post<{
      verified: boolean;
      breathRate: number;
      depthScore: number;
      sessionScore: number;
    }>("/api/vision/process", { samples, expectedPattern });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool 2: recommend a pattern — state → pattern
// Local heuristic table (the app's 20+ patterns stay client-side; keep this cheap)
// ---------------------------------------------------------------------------
const PATTERN_TABLE: Record<string, { name: string; cadence: string; why: string }> = {
  anxious: { name: "Physiological Sigh", cadence: "2x inhale 2s / exhale 6s", why: "Fastest down-regulation of acute arousal" },
  stressed: { name: "Box Breathing", cadence: "4-4-4-4", why: "Balances autonomic tone under load" },
  tired: { name: "Bhastrika (gentle)", cadence: "1s in / 1s out x20", why: "Sympathetic activation without strain" },
  unfocused: { name: "Coherence 5.5", cadence: "5.5s in / 5.5s out", why: "HRV resonance for sustained attention" },
  sleep: { name: "4-7-8", cadence: "4-7-8", why: "Parasympathetic shift for sleep onset" },
};
server.tool(
  "breath_recommend_pattern",
  "Recommend a breathing pattern for a user's detected or self-reported state.",
  { apiKey: z.string(), state: z.enum(["anxious", "stressed", "tired", "unfocused", "sleep"]) },
  async ({ apiKey, state }) => {
    meter(apiKey, "breath_recommend_pattern");
    return { content: [{ type: "text", text: JSON.stringify(PATTERN_TABLE[state]) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool 3: attest practice — portable credential (Flow, via backend)
// TODO(backend): add POST /api/attest to vision-service to mint the on-chain
// attestation. Until then returns a structured payload marked pending.
// ---------------------------------------------------------------------------
server.tool(
  "breath_attest_practice",
  "Issue a portable, on-chain proof-of-practice credential for a verified session. Credentials are attestations, not collectibles.",
  {
    apiKey: z.string(),
    sessionId: z.string(),
    walletAddress: z.string().describe("Flow address of the practitioner"),
  },
  async ({ apiKey, sessionId, walletAddress }) => {
    meter(apiKey, "breath_attest_practice");
    const credential = {
      type: "ProofOfPractice",
      sessionId,
      subject: walletAddress,
      issuedAt: new Date().toISOString(),
      status: "pending_backend_route", // TODO(backend): wire POST /api/attest
    };
    return { content: [{ type: "text", text: JSON.stringify(credential) }] };
  },
);

// ---------------------------------------------------------------------------
// Tool 4: coach.respond — Zen coaching grounded in real signals
// Backed by the existing service: POST /api/ai-analysis
// ---------------------------------------------------------------------------
server.tool(
  "coach_respond",
  "Get coaching guidance from Zen, grounded in the user's actual measured breath data — not self-report.",
  {
    apiKey: z.string(),
    message: z.string(),
    visionMetrics: z
      .object({ breathRate: z.number(), sessionScore: z.number(), emotionalState: z.string().optional() })
      .optional(),
  },
  async ({ apiKey, message, visionMetrics }) => {
    meter(apiKey, "coach_respond");
    const result = await post<{ reply: string }>("/api/ai-analysis", { message, visionMetrics });
    return { content: [{ type: "text", text: result.reply }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("brume-mcp running on stdio — 4 tools registered");
