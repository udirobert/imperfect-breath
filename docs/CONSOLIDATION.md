# Consolidation Registry — Brume v1

> Companion to `docs/STRATEGY.md` and `docs/BRUME.md`. Principle (updated in the
> dead-code sweep): **delete, don't bury** — git history preserves everything, and
> unreferenced code rots into type/lint noise. The v1 "bury, don't delete" stance
> was superseded once the surfaces were confirmed unreachable.
> Registry last updated: consolidation round 4 (final pass — copy sweep + debug audit).

## Consolidation Round 4 — final pass (branch `feat/consolidation-final`)

Closes the two remaining items from the "next passes" list plus the stale
known-inconsistency note.

- **Copy sweep completed.** `UserProfile` no longer displays Lens identity or
  social-graph stats ("Lens Protocol Stats" / "No Lens Profile Found" cards,
  @handle + follow button). Lens survives as quiet infrastructure: wallets are
  still disconnected on sign-out, nothing chain-forward is shown. The Lens card
  is replaced by a "Verified Practice" card pointing at `/progress`. Dead
  "Creator Verified" stat row removed (creator economy is buried). `Index` hero
  rebrand shipped in PR #12. `Settings` was already clean.
- **Debug audit resolved.**
  - `AIAnalysisDebugButton` + `src/debug/ai-analysis-debug.ts` **deleted** —
    explicitly marked "TEMPORARY … Remove after debugging" and rendered
    unconditionally on `/results`.
  - `DeveloperTools` + `SystemHealthMonitor` **kept** — already env-gated
    behind `development.debugMode` (`VITE_DEBUG_MODE === "true"`, off in prod)
    in `MainLayout`, which is the intended prod posture.
  - `src/components/integration/` and `src/pages/api/` confirmed already gone
    (removed in round 3).
- **Known-inconsistency #5 closed.** `MobileBottomNav` was deleted in round 2;
  the single `BottomTabBar` uses `/session`. `SessionEntryPoints` offering
  `/session/classic` vs `/session/enhanced` mode cards is the intended entry.

With round 4 the consolidation registry has **no open passes**. Future cleanup
happens file-by-file under the nav-discipline and delete-don't-bury rules.

## Consolidation Round 3 — dead-code deletion (branch `feat/consolidation-ux`)

The buried surfaces from v1 (and every module they orphaned) were **deleted** after
reachability analysis confirmed zero importers from `main.tsx`. Verified by
`tsc` (0 errors), `eslint` (0 errors), `vitest` (39/39) and `pnpm build` (✓).

- **110 files / ~21.6k lines removed** — buried pages (marketplace, creator tools,
  instructor onboarding, Lens hub), their dedicated components/types, plus orphaned
  hooks, libs, stores, providers and API routes.
- **Kept:** `components/ui/` (shadcn kit = design-system baseline), `*.d.ts`
  ambient declarations, and all `__tests__/` + `*.test.ts` suites (vitest
  discovers tests by glob, so "no importer" is expected, not a dead signal).
- The old v1 "buried" table below is retained for history; the files it lists are
  now **gone** from the working tree (recoverable from git history).

| Surface | Was buried at | Now |
|---|---|---|
| Marketplace | `src/pages/EnhancedMarketplace.tsx`, `src/components/marketplace/`, `src/types/marketplace.ts` | **deleted** |
| Creator tools | `src/pages/CreatePattern.tsx`, `src/components/creator/`, `src/pages/EnhancedCreatorDashboard.tsx`, `src/types/creator.ts` | **deleted** |
| Instructor onboarding | `src/pages/InstructorOnboarding.tsx` | **deleted** |
| Lens social hub | `src/pages/LensSocialHubPage.tsx`, `src/pages/LensSocialFlowPage.tsx`, `src/components/lens/LensSocialHub.tsx` | **deleted** |
| Social composer | `src/components/social/ResponsiveSocialCreate.tsx` | deleted in CI pass |

**What was deliberately NOT deleted** (verified live): `sessionStore`, `visionStore`,
`useSession`, `Results`-subtree (`PostSessionActions`, `InlineUpgrade`,
`useSecureAIAnalysis`, `SessionCompleteModal`), `TodayCard`, `VideoFeed`,
`BreathingAnimation`, `FaceMeshOverlay`, supabase client, `lib/lens`,
`lib/sharing`, `cameraStore`, `authStore`.

## Buried (unrouted Aug 27, branch `feat/brume`) — historical record

| Surface | Files still on disk | Why buried |
|---|---|---|
| Marketplace (`/marketplace`) | `src/pages/EnhancedMarketplace.tsx`, `src/components/marketplace/`, `src/types/marketplace.ts` | Sunk cost; cold-start liquidity, no 10x (STRATEGY §6) |
| Creator tools (`/create`) | `src/pages/CreatePattern.tsx`, `src/components/creator/`, `src/pages/EnhancedCreatorDashboard.tsx` | Creator economy depends on marketplace |
| Instructor onboarding (`/instructor-onboarding`) | `src/pages/InstructorOnboarding.tsx` | Wedge A deferred — agents pay first (STRATEGY §4) |
| Lens social hub (`/lens`, `/lens/flow`) | `src/pages/LensSocialHubPage.tsx`, `src/pages/LensSocialFlowPage.tsx`, `src/components/lens/` | Lens survives as quiet attestation infra, not a destination |
| Social posting (`/create-post`) | `src/components/social/ResponsiveSocialCreate.tsx` | Sharing happens via post-session credential cards, not a composer |
| Duplicate route (`/enhanced`) | — (was aliasing `Index`) | Dead weight |

**Note for judges/reviewers:** buried files may still reference each other; they're excluded
from the route tree and nav. Full deletion is a post-Shipaton decision once attestations prove
out (marketplace resurrection requires density we don't have).

## Kept (the v1 spine)

- **Core loop:** `Index` (home) → `SessionEntryPoints` / `SessionModeWrapper` → `Results` (post-session insight + credential share) → `Progress` (streaks, credentials)
- **Accountability:** `CommunityFeed`, `LeaderboardPage` (verified-only — the thesis made visible)
- **Money:** `Subscription` (Brume Premium paywall, `brume_premium` entitlement)
- **Trust/legal:** `Auth`, `Onboarding`, `PrivacyPolicy`, `TermsOfService`, `Settings`, `UserProfile`
- **Mobile nav:** Home / Session / Profile — was already minimal, unchanged

## UI/UX consolidation notes

1. **One voice.** Brand copy reads "Brume — progress you can prove" everywhere
   user-facing (index.html, Header, Onboarding, Index hero as of PR #12,
   UserProfile as of round 4). Sweep complete.
2. **One palette.** `index.css` root tokens → mist family (h≈204), matching the `brume` Tailwind scale. The old teal primary (180°) and peach accent (25°) are gone from the base theme; page-level gradients (e.g. Subscription's purple/blue) are being normalized as files are touched.
3. **One promise per screen.** Camera permission = "let Brume see your breath" (not "enable biometrics"). NFT → "verified record of practice" everywhere user-facing.
4. **Nav discipline rule going forward:** adding a nav item requires removing one — the Header's desktop row is capped at Practice / Progress / Community / Profile.
5. **Known inconsistency (resolved in round 4):** `MobileBottomNav` was
   deleted in round 2; the single `BottomTabBar` links `/session`.

## Next consolidation passes (post-release)

**None open.** All listed passes completed:

- ~~Dead-code deletion sweep~~ → round 3 (110 files / ~21.6k lines)
- ~~`src/components/{debug,developer,monitoring,integration}` audit~~ → round 4
  (debug button deleted; developer/monitoring kept, env-gated; integration gone)
- ~~`src/pages/api/`~~ → confirmed gone in round 4 (deleted in round 3)

---

## Consolidation Round 2 — UI/UX & page consolidation (branch `feat/consolidation-ux`)

**Principle applied: fold destinations toward the 6-screen core loop; keep the files, stop separate routes.**

| Move | Before | After |
|---|---|---|
| **Mobile nav dedup** | `MobileBottomNav` (global in `App.tsx`) **and** `BottomTabBar` (inside `ResponsiveNavigation`) both rendered on touch → **two stacked bars** | Removed global `MobileBottomNav.tsx`; the single context-aware `BottomTabBar` (from `ResponsiveNavigation`) is the only mobile bottom nav. |
| **Community + Leaderboard** | Separate `/community` and `/leaderboard` pages | `Leaderboard` folded into `/community` sidebar; `/leaderboard` redirects → `/community`. One accountability door. |
| **Profile + Settings** | Separate `/profile` and `/settings` pages | Settings (theme, privacy/terms, sign out) hosted inline inside `/profile`; `/settings` redirects → `/profile`. `Settings.tsx` kept on disk (buried), removed dead Marketplace/Share buttons. |
| **Session entry unify** | Nav + "Start Again"/"Start Now" pointed directly at `/session/classic` | All practice/repeat CTAs and nav unify on `/session` entry (which still offers classic/enhanced mode cards). Resolves the v1 known-inconsistency note. |
| **Results → Progress** | Post-session screen ended at share/repeat actions | Added "See My Progress" CTA that closes the core loop: session → results → proof gallery. |

**Route set after round 2 (MainLayout):** `/`, `/session`, `/patterns`, `/session/:mode`, `/progress`, `/results`, `/community`, `/profile`, `/subscription` (+ `/settings` and `/leaderboard` kept as redirects so nothing breaks).

**Still buried (unchanged from v1):** marketplace, creator tools, instructor onboarding, Lens hub, social composer — files on disk, unrouted.
