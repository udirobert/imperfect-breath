# Consolidation Registry — Brume v1

> Companion to `docs/STRATEGY.md` and `docs/BRUME.md`. Principle: **bury, don't delete.**
> Everything below stays in the repo (git history + on disk) but is unrouted and unlinked.
> Reversal cost is one commit. Registry last updated: Brume v1 sprint, Wk 0.

## Buried (unrouted Aug 27, branch `feat/brume`)

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

1. **One voice.** Brand copy now reads "Brume — progress you can prove" (index.html, Header, Onboarding). Remaining sweep: `src/pages/Index.tsx` hero + `Settings`/`UserProfile` still carry old-brand and Web3-forward copy — next pass.
2. **One palette.** `index.css` root tokens → mist family (h≈204), matching the `brume` Tailwind scale. The old teal primary (180°) and peach accent (25°) are gone from the base theme; page-level gradients (e.g. Subscription's purple/blue) are being normalized as files are touched.
3. **One promise per screen.** Camera permission = "let Brume see your breath" (not "enable biometrics"). NFT → "verified record of practice" everywhere user-facing.
4. **Nav discipline rule going forward:** adding a nav item requires removing one — the Header's desktop row is capped at Practice / Progress / Community / Profile.
5. **Known inconsistency (accepted for v1):** `MobileBottomNav` Session tab links `/session/classic` while desktop uses `/session` — unify on `/session` entry in the polish pass.

## Next consolidation passes (post-release)

- Dead-code deletion sweep of buried files (after attestation metrics validate the bet)
- `src/components/{debug,developer,monitoring,integration}` — audit for prod-only necessity
- `src/pages/api/` — verify nothing routes there
