# PR #9 pre-review notes (`feat/brume`)

> Partial review captured from an interrupted session (2 of 5 review groups
> completed before it was stopped). Findings were verified against the actual
> code at PR head `f669d9b`, not guessed — but coverage below is incomplete,
> so re-check these against a newer head before acting on them.

**Coverage:** agent wedge (MCP server, vision service, Cadence contract,
attestation flow, e2e spec) and UI primitives/session components.

**Not covered:** monetization/RevenueCat + authStore, app shell/routing/
rebrand, docs-vs-code runbook consistency. Those three groups never ran.

## High-confidence findings

### 1. MCP `breath_verify_session` can never succeed — payload ignores the vision API

`backend/mcp-server/src/index.ts` (~line 61–67)

The tool POSTs `{ samples, expectedPattern }` to `/api/vision/process`, but
`VisionProcessingRequest` (`backend/vision-service/main.py`, ~line 218)
requires `image_data: str`, `session_id: str`, `timestamp: int` — all mandatory.
FastAPI returns 422, so every call throws `vision_service_422`. The expected
response shape (`verified/breathRate/depthScore/sessionScore`) also mismatches
the real `VisionProcessingResponse`. The README advertises this tool as
"backed by `/api/vision/process ✅ live`" — no such samples-based endpoint
exists.

### 2. MCP `coach_respond` — same problem against `/api/ai-analysis`

`backend/mcp-server/src/index.ts` (~line 133–135)

Sends `{ message, visionMetrics }`; `AIAnalysisRequest` (~line 250) requires
`provider` and `session_data` → guaranteed 422. Also reads `result.reply`,
which doesn't exist on `AIAnalysisResponse` (actual text lives at
`result.analysis`), so even with a fixed request the tool returns
`text: undefined`.

### 3. `/api/attest` trust invariant is client-controlled

`backend/vision-service/main.py` (~line 1033–1083)

The endpoint claims "Never attest unverified practice", but `verified` is a
request-body field defaulting to `True` and nothing server-side checks that
camera verification actually happened for `session_id`. No auth on the
endpoint. `curl -X POST /api/attest -d '{"session_id":"x","wallet_address":"0xy"}'`
yields an attestation. For a trust-layer PR this is the core invariant being
forgeable.

### 4. Cadence `PracticeCredential.attest()` has no access control

`cadence/contracts/PracticeCredential.cdc` (~line 65)

`attest` is `access(all)` with `score` and `verifier` as free parameters — any
Flow account can self-issue a credential with score 100.0 claiming Brume's own
address as verifier, producing records indistinguishable from verified ones.
Non-transferability does hold (no withdraw exposed); issuance does not. Needs
either an authorized-verifier list, a backend co-signature check, or honest
copy downgrading the claim to "self-attested".

### 5. On-chain attestation auto-fires instead of being user-initiated

`src/hooks/useAttestation.ts` (~line 63–72)

Effect calls `void run()` when `enabled && address`, so the wallet transaction
pops automatically when the celebration modal mounts — contradicting the PR's
"user-initiated write" invariant and the privacy-policy quote inside
`attest-practice.ts`. No idempotency guard + app wrapped in
`React.StrictMode`: in dev `run()` fires twice (two POSTs to /api/attest, two
wallet prompts, two credentials minted per session). Also re-fires if
`address`/`run` identity changes after status reaches `done`.

### 6. e2e selector fails under Playwright strict mode

`e2e/tests/credential-loop.spec.ts` (~line 18)

`page.getByText("Prove")` matches both the hero h1 ("Prove It.") and the
tagline "...progress you can prove." (case-insensitive substring match) →
locator resolves twice → `toBeVisible()` throws a strict mode violation.
Scope it to the heading.

## Minor / cleanup

### 7. Mojibake separator in generated explanations

`src/components/session/MoodBasedRecommendations.tsx` (~line 250): parts are
joined with a literal U+FFFD replacement character (hexdump-confirmed EF BF BD;
this diff touched the line). Renders as "reason \uFFFD Designed for high stress
\uFFFD ..." via PatternSelection and the new ContextCards. Should be `" · "`.

### 8. Dead `hasWallet` after the mint_nft removal

`src/components/session/PostSessionActions.tsx` (~line 71): this PR deletes the
only consumer; it remains destructured and in the memo deps but is never read,
and no action pushes category `"monetize"` anymore, so that filter/icon/title
plumbing is permanently inert.

### 9. PixelLoader ticks its timer even when elapsed display is off

`src/components/primitives/PixelLoader.tsx` (~line 75): `useElapsed()`
starts a 100ms interval unconditionally and re-renders 10x/s while mounted;
both new integration sites pass `showElapsed={false}` (camera warmup in
VisionManager, MoodBasedRecommendations loading). Gate the interval on the
prop.

## When picking this back up

Re-run full review coverage (monetization/authStore ordering around RevenueCat
login/logout was the highest-risk gap not yet reviewed), then re-validate all
of the above if `feat/brume` has moved past `f669d9b`.
