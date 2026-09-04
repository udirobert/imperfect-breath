# Agent-Native UI Primitives — Adaptation Registry

> What we took from the agentic primitive set, how it was adapted to Brume's
> stack (Tailwind + shadcn tokens + framer-motion grammar), and what we
> deliberately skipped. Last updated: Wk-0 primitives pass, `feat/brume`.

## Adapted (in `src/components/primitives/`)

| Primitive | File | Wired into | Why it earns its place |
|---|---|---|---|
| LoadingState → **PixelLoader** | `PixelLoader.tsx` | Global `PageLoader` (every lazy route) | Pixel-grid + live elapsed timer turns dead loads into a branded moment; reduced-motion freezes decoration, keeps the timer |
| ThinkingState → **AgentTrace** | `AgentTrace.tsx` | `PostSessionCelebration` insight reveal | Zen's latency becomes a visible ritual ("Reading your session → Noticing your stillness → Writing your insight"); settles, stays expandable = re-inspectable reasoning. *Data-driven*: callers pass real steps. Reintegrated post-consolidation (was deleted in round 5 with Results.tsx; restored as a brief post-session ritual only, not a dashboard).
| TaskRows → **TaskPipeline** | `TaskPipeline.tsx` | `PostSessionCelebration` credential card | The proof-of-practice pipeline as UI: Verify ✓ → Score ✓ → Attest (pending). Honest states only — nothing marked done that isn't |
| ContextCards → **ContextCards** | `ContextCard.tsx` | available; first use: Zen recommendation rationale | Coaching that cites evidence ("chose Physiological Sigh because resting rate was elevated" + source chip) is the trust layer made visible |

**Key changes from the originals:** bespoke tokens (`--ink`, `bg-surface`…) →
Brume HSL tokens (`foreground`, `muted-foreground`, `card`, `border`); keyframes
(`pixel-on`, `shimmer-text`, `fade-up`, `pop-in`, `trace-spin`) live in
`index.css` with a `prefers-reduced-motion` gate; meme/"Surfer" variant dropped
(off-brand for a calm app); demos made data-driven instead of scripted.

## Skipped (with rationale)

| Primitive | Why not |
|---|---|
| **RecordsTable** | Power-user B2B spreadsheet surface — wrong register for a calm consumer wellness app; revisit if the instructor/agent-dashboard expansion ships |
| **ToolChips** | Developer-centric (file diffs, tool calls); our users breathe, they don't review diffs |
| **InsightCards** (as-is) | Depends on `liveline` charting + `GlideMenu` — two deps for one carousel. The *pattern* (Insight carousel with sparkline + prose + follow-up pill) is right for the Progress page; rebuild with a lightweight inline SVG sparkline in the Progress pass |
| LoadingState **"Surfer"** variant | Meme video under a loader breaks the calm register |

## Performance notes

- All animations are `transform`/`opacity` only (GPU-composited), staggered ≤100ms apart
- PixelLoader replaces a 3-dot pulse that forced no layout — same cost class, better feel
- AgentTrace/TaskPipeline add zero runtime deps; total primitives payload ~6KB min+gzip
- `prefers-reduced-motion` disables all decorative loops globally (index.css)

## Next wiring candidates

1. ~~**Camera warmup**~~ ✅ — `VisionManager` not-ready state now uses PixelLoader `orbit` ("Warming up your camera"), replacing the blue info box
2. ~~**Evidence-cited recommendations**~~ ✅ — `MoodBasedRecommendations` loading is now PixelLoader `dots` ("Reading your check-in"), and the top pick gets a ContextCard explaining *why* ("Your check-in · breath science")
3. ~~**Progress page insights**~~ ✅ — `InsightCarousel` (`src/components/progress/`) rebuilt on the dependency-free `Sparkline` primitive: three honest, computed insight types (weekly momentum, calm trend, streak), earned-not-padded — no data, no card

## Still open

- ~~AgentTrace real stages~~ ✅ — `currentStep` prop added; restored and wired into `PostSessionCelebration` as a brief post-session insight ritual (presentation-timed, settles to reveal the insight text). The deleted `Results.tsx` dashboard wiring is not restored — the trace is a moment, not a tab.
- ContextCards on the **Home/Index** "what do you need today" surface (camera-detected state variant, not just self-report) — partially done: `SessionPreview` already renders a `ContextCard` from router-state `reasonDetail`; the Home surface itself is still state-chip-only.
- ~~TaskPipeline live attestation~~ ✅ — `useAttestation` hook runs POST /api/attest on verified sessions (wallet present), honest lifecycle: loading → done ("Flow · queued") | failed + retry | needs-wallet

## Reintegrated session interactivity (post-consolidation pass)

The round-5 collapse silenced the session itself. These were brought back selectively — in-loop, no chrome:

| What | File | Why |
|---|---|---|
| **Voice guidance** (phase cues) | `src/hooks/useVoiceGuidance.ts` | Competitors are "a timer with audio"; the session had zero audio guidance. Speaks only phase transitions, opt-in via preferences. |
| **Adaptive encouragement** | `src/hooks/useAdaptiveEncouragement.ts` | Contextual, performance-timed coaching (45s for high performers, 20s for struggling). Surfaces as a single fade on the orb overlay, not toasts. Haptics on celebration only. |
| **Retryable async** | `src/hooks/useRetryableAsync.ts` | Lightweight extraction of the deleted `useErrorHandler` (408→80 lines). Backoff+jitter retry for transient AI/attestation failures. |
| **Preferences store** (partial) | `src/stores/preferencesStore.ts` | Session + Audio domains only (120 of 523 lines). Gives voice guidance and default pattern a typed, persisted home. |
