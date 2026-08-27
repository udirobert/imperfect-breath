# Shipaton Console Runbook

> The dashboard-side tasks only a human with the accounts can do, in dependency order.
> Code side is ready (branch `feat/brume`). Today: Aug 27. Public release target: **Sep 3**. Submission deadline: **Sep 30**.

## 1. Apple Developer account — TODAY (longest lead)

1. Enroll at developer.apple.com ($99/yr). Individual enrollment is fastest (org needs D-U-N-S).
2. When active: App Store Connect → create app **Brume**, bundle id `fun.imperfectform.brume`.
3. Add the iOS platform to Capacitor: `npx cap add ios` (code side, do when account exists).
4. Store review prep: camera permission string = *"Brume uses your camera to verify your breathing practice. Video never leaves your device."* — this exact framing matters; reviewers reject vague health-adjacent copy.

## 2. RevenueCat (unblocks paywall testing + judge promo codes)

1. Create project **Brume** → add iOS + Android apps.
2. **Entitlement**: `brume_premium` (must match `ENTITLEMENT_ID` in `src/lib/monetization/revenueCatConfig.ts`).
3. **Products** (create in App Store Connect / Play Console, link in RC):
   - `brume_premium_monthly` — monthly
   - `brume_premium_annual` — annual **with 7-day free trial** (trial = judge access path + Shipaton requirement)
4. Attach both products to the entitlement; create an Offering "default" with both packages.
5. Keys: public SDK keys into `VITE_` env or backend `revenuecat_config.py` endpoint (existing plumbing).
6. Create **promo codes** for judges (App Store: promo codes; Play: promo codes) — needed at submission.

## 3. OneSignal (Keep Them Coming Back award)

1. New app **Brume**. Platforms: Android + iOS.
2. Android: Firebase project → FCM → drop `google-services.json` into `android/app/` (gradle already guards for it).
3. iOS: APNs auth key.
4. Set `VITE_ONESIGNAL_APP_ID` in env. Client code is wired (`src/lib/notifications/oneSignal.ts`).
5. **Create 3 Journeys against the tag contract** (docs/BRUME.md §OneSignal):
   - *First Breath*: user created 24h ago AND `first_breath_done` absent → "Your first verified breath is waiting"
   - *Streak Rescue*: `streak` ≥ 1 AND `last_session_at` stale ≥ 1 day → "Your mist is waiting"
   - *Weekly Proof*: Sunday weekly, segment `verified_total` ≥ 1 → digest message

## 4. Google Play Console (release vehicle — Sep 3)

1. Create app `fun.imperfectform.brume`, name **Brume**.
2. Internal testing track → upload AAB (`cd android && ./gradlew bundleRelease`).
3. Data safety form: camera = "used on-device, not collected" (matches Privacy Policy — keep them consistent or review fails).
4. Content rating: Everyone. Health claims: wellness only, no medical claims (Terms already say this).
5. Internal → closed → **production release Sep 3** (review can take 3–7 days; submit closed track ~Sep 1).

## 5. Store listing copy (paste-ready)

- **Short**: Camera-verified breathwork. Progress you can prove.
- **Full**: Brume watches you breathe — on-device, nothing uploaded — coaches you through your actual state, and turns practice into verified records. Every other breathwork app is a timer with audio; Brume knows you practiced. Build streaks that can't be faked, share verified credentials, and let Zen, your AI coach, show its reasoning.

## 6. Submission week (Sep 21–30)

- [ ] ≤2-min video: state check-in → verified session → credential card → share (record on device)
- [ ] 1024×1024 icon (mist mark on brume-900 `#22303c`)
- [ ] 1179×2556 screenshot, no device frame
- [ ] Judge promo codes from step 2.6
- [ ] Devpost text: lead with the monopoly line + two-sided monetization (consumer IAP + agent API)
- [ ] Submit by Sep 28 (buffer before Sep 30 hard deadline)

## 7. Domain

- `brume.imperfectform.fun` → Netlify deploy of the PWA build; agent API docs at `/agents` later.
