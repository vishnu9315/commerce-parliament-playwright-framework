# Test Strategy — Commerce Parliament AI Question Handler

Companion to `docs/application-overview.md`. Read that first for module/role context.

## 1. Guiding principle

Automate **workflows that move a question between states or between people**, and the
**dashboard/list surfaces that report on those states** — because that is exactly where
the bug sheet shows the application currently breaks (stale counts, duplicated rows,
inconsistent statuses, actions that don't disable when they should). Do **not** automate
every CRUD screen or every static page just because it exists.

We deliberately favor **fewer, high-signal tests over broad shallow coverage**: ~10–15
smoke tests, ~25–40 regression tests, each asserting a real business outcome (a count, a
status, a list membership, a button's enabled/disabled state) rather than "page loaded."

## 2. Priority model

- **P0 — Critical.** If this breaks, the core PQ lifecycle is unusable or data integrity
  is wrong (a question shown as complete when it isn't, a security/data-isolation leak).
  Must run on every PR.
- **P1 — Important.** Functional workflows that are heavily used but have a workaround or
  narrower blast radius if broken.
- **P2 — Secondary.** Edge cases, cosmetic-adjacent consistency, low-traffic screens.

## 3. What is automated

| #   | Scenario                                                                                                                                                                                             | Priority | Tag(s)                             | Rationale / bug-sheet link                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Dev sign-in succeeds for each of the 8 known roles and lands on the correct dashboard route                                                                                                          | P0       | `@smoke @auth`                     | Everything downstream depends on this; role-routing itself is business logic (Parliament vs Secretary vs Division vs role-picker)                            |
| 2   | Invalid/unknown email is rejected or does not grant access                                                                                                                                           | P1       | `@auth @regression`                | Boundary/negative auth case                                                                                                                                  |
| 3   | Logout clears the session (protected route redirects to sign-in)                                                                                                                                     | P1       | `@auth @regression`                | Session integrity                                                                                                                                            |
| 4   | Division user with no Parliament access cannot reach Parliament-only routes (e.g. Settings, Executive Dashboard)                                                                                     | P0       | `@auth @rbac @regression`          | RBAC — NFR-03 in BRD; DEF-072-style cross-division leakage class                                                                                             |
| 5   | Executive Dashboard KPI cards navigate to the correctly-filtered list (sitting date carried through the URL)                                                                                         | P0       | `@smoke @dashboard`                | DEF-082 (cards redirect to unrelated pages)                                                                                                                  |
| 6   | Secretary Dashboard division-wise breakup table renders with consistent row counts vs. the divisions the questions belong to                                                                         | P1       | `@dashboard @regression`           | Core "division-wise visibility" ask in `additional_require.md`                                                                                               |
| 7   | Joint-Secretary multi-division scope switcher changes the dashboard data set when switched                                                                                                           | P1       | `@dashboard @regression`           | Scope selector is the concrete implementation of "division-wise visibility"                                                                                  |
| 8   | My Division Dashboard KPI counts match the underlying list counts (Provisional/Admitted/Completed)                                                                                                   | P0       | `@dashboard @regression`           | DEF-046, DEF-068, DEF-072, DEF-083 — dashboard/list count drift is the most repeated defect class in the sheet                                               |
| 9   | A question with overall status Completed does **not** also appear in the Admitted Questions list                                                                                                     | P0       | `@regression @questions @critical` | DEF-081, directly reproduced live during exploration (D. No. 28641)                                                                                          |
| 10  | A question with overall status Completed appears in the Completed Questions list with correct metadata                                                                                               | P0       | `@regression @questions`           | Positive counterpart of #9                                                                                                                                   |
| 11  | Assigned Questions list only shows questions genuinely assigned/in-progress, not completed ones                                                                                                      | P1       | `@regression @questions`           | DEF-070, DEF-071                                                                                                                                             |
| 12  | Provisional Questions list only shows Provisional-type questions, not Admitted ones                                                                                                                  | P1       | `@regression @questions`           | DEF-056                                                                                                                                                      |
| 13  | House filter (All/Lok Sabha/Rajya Sabha) actually changes the rendered list on Provisional/Admitted/Assigned/Completed pages                                                                         | P1       | `@regression @questions @filters`  | Filtering correctness is a named regression risk area in the brief; DEF-025 (filter tabs not working) is adjacent                                            |
| 14  | Sitting-date filter narrows the list to that date only, and Reset restores the unfiltered list                                                                                                       | P1       | `@regression @questions @filters`  | DEF-040 (unwanted default sitting filter) — verifying the opposite (correct, deliberate filtering) still matters                                             |
| 15  | Question Detail page renders all sub-questions (Parts) with correct per-part status text                                                                                                             | P0       | `@smoke @questions`                | DEF-024 (missing sub-question), DEF-016 (corrupted extraction) — detail page is the most information-dense screen in the app                                 |
| 16  | Movement Timeline shows the expected sequence of stage events for a fully completed question (Uploaded → Admitted → Assigned → Submitted → Final Answer → Parliament Completed)                      | P1       | `@regression @questions @workflow` | Core auditability requirement, BRD FR-21                                                                                                                     |
| 17  | "Actions" menu options are gated correctly by state — e.g. Pull Back Question disabled once drafting has started                                                                                     | P1       | `@regression @questions @workflow` | DEF-051, DEF-013, DEF-036, DEF-078 — action availability tracks state everywhere in the sheet                                                                |
| 18  | Final Consolidated Answer panel shows a **Download** control and a document preview once generated                                                                                                   | P1       | `@regression @questions`           | DEF-049 (repeats while scrolling), DEF-058 (table formatting lost), DEF-050 (prompt leakage) — verifying the happy path first is the prerequisite for these  |
| 19  | Completed Questions list count in the header matches the number of table rows rendered                                                                                                               | P1       | `@regression @questions`           | Recurrent "badge count ≠ list" defect pattern (DEF-039, DEF-055, DEF-083)                                                                                    |
| 20  | ~~Global search returns/navigates to a result for a known Diary No.~~ **Excluded — see Implementation Notes (§10).**                                                                                 | —        | —                                  | Re-verified live during Phase C: search now navigates, but to an _unrelated_ question, not the one searched. Not automatable as a stable positive assertion. |
| 21  | Upload Provisional Questions: happy-path PDF under the size limit reaches the routing-plan confirmation state                                                                                        | P1       | `@regression @upload`              | Core intake workflow, BRD UC-01 step 1                                                                                                                       |
| 22  | Upload Provisional Questions: Submit stays disabled until a file is chosen                                                                                                                           | P2       | `@regression @upload`              | Basic form-state validation                                                                                                                                  |
| 23  | Settings → Add Users: user list access filter (All/Parliament/Division/Parliament+Division) filters correctly                                                                                        | P2       | `@regression @settings`            | Admin data-integrity surface                                                                                                                                 |
| 24  | Settings → Add Users: Super Admin/protected accounts have no Delete action available                                                                                                                 | P1       | `@regression @settings @rbac`      | Protects seed accounts from accidental deletion; also an RBAC boundary                                                                                       |
| 25  | Profile page: name/email/mobile fields are read-only; description is editable and Save persists                                                                                                      | P2       | `@regression @profile`             | DEF-080 adjacent — confirms the surface is at least internally consistent                                                                                    |
| 26  | Department dashboard nav does not expose Parliament-only items (Settings, Assigned Questions, E-File Processed)                                                                                      | P0       | `@rbac @regression`                | RBAC boundary, NFR-03                                                                                                                                        |
| 27  | ~~AI Assistant: submitting a question returns a response with a non-zero, plausible source count~~ **Descoped — see §10.**                                                                           | —        | —                                  | Needs multiple real AI round trips against a shared, rate-limited backend; not safe to run on every CI push                                                  |
| 28  | AI Assistant Recents shows an **empty state** for a session with no prior chat history (descoped from the original cross-account leak check — see §10)                                               | P2       | `@regression @ai-assistant`        | Verifies the surface renders correctly; does not prove/disprove DEF-062 without a second account's real chat history as a fixture                            |
| 29  | AI Assistant: Knowledge-base toggle changes response behavior (off = answer only from attachments)                                                                                                   | P2       | `@regression @ai-assistant`        | Documents a real functional switch                                                                                                                           |
| 30  | Transfer Requests page: Incoming/Sent tabs render independently and show zero-state copy when empty                                                                                                  | P2       | `@regression @transfer`            | Baseline for the transfer workflow given no seeded in-flight transfer is available under current test accounts                                               |
| 31  | Collaboration Requests count on My Division Dashboard reflects the same number shown on the Collaboration Requests page                                                                              | P1       | `@regression @collaboration`       | DEF-065, DEF-074, DEF-075 pattern                                                                                                                            |
| 32  | Question Journey narrative sentence on the detail page is grammatically consistent with the machine-readable status badge (no "Completed" badge next to a journey sentence describing pending parts) | P1       | `@regression @questions`           | DEF-012                                                                                                                                                      |

Tests 1–15 form the backbone of the **P0 smoke suite** (trimmed to the fastest,
highest-confidence subset — see §5). All 32 rows form the **regression suite**; expect
this to land at ~28–34 executable `test()` cases once a few rows above are naturally
covered by a single spec (e.g. #9/#10 are one test file with two assertions).

## 4. What is intentionally NOT automated (and why)

- **LS/RS master bulletin upload & extraction (BRD UC-03).** Not verified to exist in the
  current build (no upload entry point found). Do not automate a feature we could not
  locate; revisit if/when it appears.
- **e-Office file-movement / computer-number display.** BRD marks this Medium priority
  and phased; not exercised live. Out of scope until it ships.
- **Full Parichay SSO login flow.** Does not exist in this build (dev email sign-in
  instead). Automating against a mock of a not-yet-built SSO flow would test nothing real.
- **TIA Portal API correctness / live trade-data accuracy inside AI answers.** This is a
  data/LLM quality question, not a UI regression the Playwright layer should own. The
  bug-sheet items in this space (DEF-014, DEF-052, DEF-066, DEF-073) are AI-quality bugs,
  better tracked via manual/LLM-eval processes than brittle string-matching Playwright
  assertions on generated prose.
- **Byte-for-byte PDF content verification** (e.g. "the uploaded PDF is not blank",
  DEF-006/DEF-007). Playwright can verify a download starts and a filename appears, but
  verifying rendered PDF _content_ needs a PDF-parsing library outside this UI framework's
  charter. We assert the download link/URL exists and is well-formed instead.
- **Every settings CRUD permutation** (create/edit every field on every user/division).
  We cover the RBAC-relevant boundaries (protected accounts, access filters) and leave
  exhaustive form-field validation as a manual/exploratory concern — low regression value
  relative to lifecycle/dashboard correctness.
- **Visual/pixel regression** (e.g. DEF-067 menu overlap, DEF-042 header disappearing).
  These are layout bugs best caught by visual-regression tooling (not in this framework's
  stack per the brief) or manual review, not brittle DOM-position assertions.
- **Transfer accept/reject end-to-end and full collaboration create→respond→resubmit
  round trip.** No seed data exists under the provided accounts to safely drive these
  without polluting shared demo data other testers are using concurrently. Documented in
  `application-overview.md` §5.13 as a **known gap requiring dedicated seed data** — flagged
  for the team rather than automated against production-shared demo state.
- **Hundreds of exhaustive filter-combination tests.** We test that each filter _type_
  works once per representative page, not the full cartesian product of
  House × Sitting Date × Assignment × Question Type across every list page.

## 5. Smoke suite (target: 10–15 tests, `@smoke`, runs on every push)

1. Sign-in succeeds for: Parliament Super Admin, Secretary, Joint Secretary
   (multi-division), Division User → 4 tests, one per representative role shape
   (`@smoke @auth`).
2. Executive Dashboard loads with KPI cards visible and clickable (`@smoke @dashboard`).
3. My Division Dashboard loads with KPI cards visible (`@smoke @dashboard`).
4. Provisional Questions list loads and renders the table header + at least the empty
   state correctly (`@smoke @questions`).
5. Admitted Questions list loads (`@smoke @questions`).
6. Assigned Questions list loads (`@smoke @questions`).
7. Completed Questions list loads and its header count matches row count
   (`@smoke @questions`).
8. Question Detail page opens from a list row and renders all sub-question parts
   (`@smoke @questions`).
9. AI Assistant page loads and the message input is interactable (`@smoke @ai-assistant`).
10. Logout returns to the sign-in screen and blocks a protected route
    (`@smoke @auth`).

This is 10 tests covering: auth for all major role shapes, both dashboard types, all four
question-lifecycle lists, the detail page, the AI surface, and session teardown — the
minimum needed to say "the app fundamentally works" in under a couple of minutes.

## 6. Regression suite

All 32 scenarios in §3, tagged `@regression`, further tagged by module
(`@dashboard`, `@questions`, `@upload`, `@settings`, `@profile`, `@ai-assistant`,
`@transfer`, `@collaboration`, `@rbac`) and by criticality (`@critical` for the P0 rows
that also aren't already smoke tests — principally #9/#10, the Completed/Admitted
duplication bug, and #28, the chat-history leak).

Run with:

```
npx playwright test --grep @regression
```

or a single module:

```
npx playwright test --grep @questions
```

## 7. Test tagging strategy

Tags are plain strings in the test title, matched via Playwright's built-in
`--grep`/`--grep-invert`. Kept intentionally small and orthogonal:

- **Suite tags** (pick exactly one): `@smoke`, `@regression`
- **Criticality** (optional, additive): `@critical` — reserved for the handful of P0
  tests whose failure should block a release even outside a full regression run
- **Module tags** (one or more): `@auth`, `@dashboard`, `@questions`, `@upload`,
  `@settings`, `@profile`, `@ai-assistant`, `@transfer`, `@collaboration`, `@rbac`,
  `@filters`, `@navigation`, `@workflow`, `@security`

Example titles:

```
test('should hide the Completed question from Admitted Questions list @regression @questions @critical', ...)
test('should redirect an unauthenticated user away from the Executive Dashboard @smoke @auth', ...)
```

## 8. Test data strategy

- Tests read from **existing, already-seeded** questions identified by stable **Diary
  No.** values captured during exploration (e.g. `28641`, `14516`, `16258`, `79`) rather
  than creating throwaway data per test, because the provided accounts have no
  self-service way to create a full, isolated question through to a given lifecycle state
  in one step.
- Diary numbers used by tests are centralized in `test-data/questions.ts` so that if the
  demo environment is reset/reseeded, only one file needs updating.
- Where a test **does** create data (e.g. the Upload Provisional Questions happy path), it
  uses a small fixture PDF checked into `test-data/fixtures/` and does not assert on a
  specific resulting Diary No. (assigned by the server), only on reaching the expected
  post-upload UI state.
- Tests are written to be **independently runnable** and **order-independent**: no test
  depends on another test having run first. Where a scenario truly requires a multi-step
  precondition (e.g. "a division has already submitted an answer"), the test navigates
  directly to a pre-identified question already in that state rather than performing the
  transition itself.
- **Documented dependency**: several P1/P2 scenarios around Transfer Requests and
  Collaboration Requests need a question in an _in-flight_ transfer/collaboration state.
  No such state exists reliably under the current shared demo data. These tests are
  written against the **empty-state UI** (tabs render, zero-state copy shows) until the
  team provides either a dedicated seed question or a way to safely create one without
  disrupting other testers.

## 9. Explicitly excluded from any automation (manual/process concerns)

AI answer _quality_, PDF rendering fidelity, visual/layout regressions, and load/
performance testing are out of scope for this Playwright functional-regression framework
by design (see §4) and should remain owned by manual QA, an LLM-eval process, or a
dedicated visual-regression/performance tool respectively.

## 10. Implementation notes (what changed while building this, and why)

This plan was written before the framework was built. Two things were discovered only
during implementation and changed the final scope — recorded here rather than silently
edited away, since both are genuinely useful for whoever maintains this next.

**Global search (#20) was re-verified and found to have changed shape.** The Bug Sheet
describes it as inert (no action on Enter). Re-testing live during Phase C found it now
_does_ navigate on Enter — but to an unrelated question, not the one searched (e.g.
searching `28641` landed on D. No. `16513`). A regression test can't assert a stable
"correct" outcome for a feature whose current failure mode is "goes to the wrong place,"
so this was dropped rather than automated against a moving target. Worth a fresh manual
look before ever re-adding it.

**The AI Assistant scenarios (#27, #28) were descoped for cost/safety, not because they
turned out to be unnecessary.** Both would require multiple real round trips against a
shared, rate-limited AI backend (see below) — acceptable for a one-off manual check, not
for something that runs on every push. #28 was narrowed from "prove no cross-account chat
leak" (Bug Sheet DEF-062) to "a fresh session shows a clean empty state," which is the
part that's honestly verifiable without a second account's real chat history as a fixture.
DEF-062 itself remains open and worth a manual re-check periodically.

**The shared demo environment enforces IP-based rate limiting.** Running the full suite
back-to-back at higher concurrency (3+ Playwright workers) reliably produced a burst of
HTTP 429s partway through the run — confirmed independently with plain `curl`, so this is
the environment, not flaky test code. `playwright.config.ts` fixes `workers: 2` (locally
_and_ in CI) specifically because of this, and the suite reliably passes end-to-end at
that concurrency. If this framework is ever pointed at a dedicated (non-shared) test
environment, that cap can likely be relaxed — but raise it deliberately, not by default.
