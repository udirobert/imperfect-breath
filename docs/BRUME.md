# Brume — Product Brief

> **Brume** (French: *mist*) — camera-verified breathwork. *Progress you can prove.*
> Shipaton 2026 entry · bundle `fun.imperfectform.brume` · flagship client of the
> Proof-of-Practice primitive (see `docs/STRATEGY.md`).

## One-liner

Brume watches you breathe (on-device camera ML — raw video never leaves the phone),
coaches you through your actual state, and issues portable **proof of practice**.
Every other breathwork app is a timer with audio. Brume *knows* you practiced.

## Core loop (retention engine)

1. Open → 10-second state check (camera or tap) → **"here's your breath for today"**
2. Guided session with live verification overlay (breath rate, depth, pacing)
3. Post-session: emotional-shift insight + **verified credential** → share card
4. Streak + accountability buddy loop → tomorrow's nudge

## Screens (v1 scope — 6, nothing more)

| Screen | Notes |
|---|---|
| Onboarding | Emotional check-in + camera permission framed as "let Brume see your breath" |
| Home | "What do you need today?" — pattern recommended from detected state |
| Session | Breathing animation + verification overlay; works without camera (unverified) |
| Post-session | Insight card + credential + share (Lens optional, off by default) |
| Progress | Streaks, credential gallery, verified-vs-total sessions |
| Paywall | RevenueCat; see below |

## Monetization (HAMM evidence)

- **Free:** verified sessions, 5 core patterns, streaks. (Peace Prize angle: no
  wearable, no paywall on the core health benefit.)
- **Brume Premium** (`brume_premium` entitlement): 20+ patterns, deep session
  insights, adaptive sessions, credential gallery, accountability buddies.
  Monthly + annual, **7-day trial**. Judges get a promo code (submission requirement).
- **Agent API** (`backend/mcp-server`): metered verification/coaching calls —
  the two-sided monetization story: consumers pay via RevenueCat, agents pay per call.
- Port existing plumbing: `revenuecat_config.py`, `revenueCatAuthIntegration.ts`.

## OneSignal Journeys (Keep Them Coming Back evidence)

**Wired client-side** (`src/lib/notifications/oneSignal.ts`, hooks in `App.tsx` init +
`sessionStore.completeSession`). Permission is asked **in context** — after the first
completed session, never on first open. SDK: `onesignal-cordova-plugin` (Capacitor).

**Tag contract v1** (client → OneSignal; configure Journeys against these):

| Tag | Values | Journey |
|---|---|---|
| `first_breath_done` | `"true"` | **1. First Breath** — trigger: user 24h old AND tag absent → "Your first verified breath is waiting" |
| `last_session_at` | ISO date | **2. Streak Rescue** — trigger: `streak` ≥ 1 AND `last_session_at` ≥ 1 day stale → "Your mist is waiting" |
| `streak` | number | Journey 2 segmentation; milestone congrats at 7/30 |
| `verified_total` | number | **4. Weekly Proof** — Sunday digest: sessions, streak, one insight |
| `sessions_total` | number | analytics segmentation |

**3. Buddy Accountability** needs a server leg (client can't securely notify another
user): `backend/vision-service` calls OneSignal REST with the buddy's player id when a
session completes. Post-release task — Journeys 1, 2, 4 carry the award story alone.

**Dashboard setup (no code):** create OneSignal app → add iOS/Android platforms →
set `VITE_ONESIGNAL_APP_ID` → build the 3 Journeys above. `identifyUser()` /
`resetNotificationUser()` helpers exist but are unwired until auth settles (works
anonymously via tags meanwhile).

## Cut list for v1 (Thiel-small)

- ❌ Marketplace UI (buried — attestations stay as quiet credentials)
- ❌ Multi-wallet onboarding prominence (wallet = optional, in Settings)
- ❌ Instructor dashboard, wearables, extra chains
- ✅ Keep: vision engine, emotional arc, Zen coach, offline PWA behavior

## Submission checklist (due Sep 30)

- [ ] App live on Google Play (target Sep 3) + iOS submitted
- [ ] ≤2-min demo video (YouTube) — show: state check → verified session → credential
- [ ] 1024×1024 icon (mist mark on `brume-900`)
- [ ] 1179×2556 screenshot, no device frame
- [ ] Judge promo code / free trial
- [ ] Devpost text: lead with the monopoly line + two-sided monetization

## Open build questions

1. Apple developer account active? (longest-lead item — confirm today)
2. google-services.json for OneSignal push on Android (gradle already guards for it)
3. Domain: `brume.imperfectform.fun` for landing + agent API docs
