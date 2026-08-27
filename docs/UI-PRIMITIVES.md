# Agent-Native UI Primitives — Adaptation Registry

> What we took from the agentic primitive set, how it was adapted to Brume's
> stack (Tailwind + shadcn tokens + framer-motion grammar), and what we
> deliberately skipped. Last updated: Wk-0 primitives pass, `feat/brume`.

## Adapted (in `src/components/primitives/`)

| Primitive | File | Wired into | Why it earns its place |
|---|---|---|---|
| LoadingState → **PixelLoader** | `PixelLoader.tsx` | Global `PageLoader` (every lazy route) | Pixel-grid + live elapsed timer turns dead loads into a branded moment; reduced-motion freezes decoration, keeps the timer |
| ThinkingState → **AgentTrace** | `AgentTrace.tsx` | `Results.tsx` AI insight loading | Zen's latency becomes a visible ritual ("Reading your breath rate curve → … → Writing your insight"); settles, stays expandable = re-inspectable reasoning. *Data-driven*: callers pass real steps |
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

1. **Camera warmup** (vision model load) → PixelLoader `orbit` variant with "Warming up your camera" label
2. **Zen recommendation card** (Home "what do you need today") → ContextCards with the detected-state rationale
3. **Progress page** → InsightCarousel rebuilt on inline SVG sparklines (no liveline)
