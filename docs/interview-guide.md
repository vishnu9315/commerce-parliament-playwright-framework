# Interview Guide — This Framework, Specifically

Not generic Playwright trivia. These are the questions a reviewer would actually ask
about _this_ repository, with answers grounded in real decisions made while building it.

## Architecture and design decisions

**Q: Why Playwright over Selenium/Cypress for this project?**
Auto-waiting and web-first assertions matter a lot here because this app renders almost
everything asynchronously after the page shell loads — KPI counts start as a `—`
placeholder, tables populate after a separate fetch. Playwright's `expect(locator)`
retries until the condition holds instead of me hand-rolling waits. `storageState` also
made 4-role testing cheap. Cypress can't drive multiple independent browser contexts/roles
in one run as cleanly; Selenium has none of the auto-waiting or trace-viewer tooling built
in.

**Q: Walk me through your Page Object Model. Why does `QuestionListPage` back four
different screens?**
Provisional, Admitted, Assigned and Completed Questions — on both the Parliament and
Department portals — all render the identical table (same nine columns, same filter
shape). The only real difference is the route and the server-side filter. Writing
`ProvisionalQuestionsPage`, `AdmittedQuestionsPage`, etc. as six separate classes would
have meant six copies of the same `rowByDiaryNo`/`filterByHouse`/`openQuestion` methods.
Instead there's one `QuestionListPage(page, path)` and each test passes the route it
needs. If a future screen genuinely diverges (say, Admitted Questions grows an extra
bulk-action column the others don't have), that's the trigger to split it out — not
before.

**Q: Where didn't you generalize, and why?**
The three dashboards (`ExecutiveDashboardPage`, `SecretaryDashboardPage`,
`DivisionDashboardPage`) stay separate. They're not the same component with different
data — they have different KPI sets, different layouts, and different business meaning
(ministry-wide briefing vs. division-scoped operational view vs. a scope-switchable
Parliament view). Forcing them into one parameterized class would have made that page
object try to describe three different mental models at once.

**Q: Why only one custom fixture?**
Because only one thing was genuinely awkward to repeat by hand: reproducing an
authenticated session correctly (see below). Everything else — page objects, test data —
is just imported directly. Adding fixtures for things that are already one-liners (like
"go to the dashboard") would be fixtures for their own sake.

## Authentication

**Q: How does auth work in this app, and how did you automate it?**
There's no real login — a single email field, click Continue, and the app resolves role
and redirects. No password, no OTP, no SSO (the BRD calls for Parichay SSO; it isn't
implemented in this build). I used a Playwright "setup project"
(`tests/auth.setup.ts`) that authenticates once per role and saves `storageState`, so
individual tests never repeat the login flow.

**Q: You mentioned a sessionStorage bug you had to work around — what happened?**
My first version of the framework saved `storageState()` after login and reused it in
tests. It worked for most pages but the Executive Dashboard specifically kept bouncing
back to the sign-in screen. I inspected the app's actual storage with
`page.evaluate(() => ({...localStorage, ...sessionStorage}))` and found it keeps its
active-role marker (`parliamentAppStore`) in `sessionStorage`, not `localStorage`.
Playwright's `storageState()` only persists cookies and `localStorage` — it doesn't touch
`sessionStorage` at all, by design (it's meant to model "signed in," not "this specific
tab's transient state"). So I had `auth.setup.ts` also snapshot `sessionStorage` into a
sidecar JSON file, and built a `role` fixture that replays it via
`context.addInitScript()` before any page in that context loads. That's in
`fixtures/test.ts` / `fixtures/sessionStorage.ts` if you want to see it.

**Q: Why does one role (`parliament-user@gmail.com`) not have a storageState file?**
It's used exactly once, for a single RBAC negative check (confirming a Settings-less
account doesn't see the Settings nav item). Building a whole storageState file, a role
config entry, and a setup-project test for a role exercised by one assertion would be
fixture machinery for its own sake — a plain fresh sign-in inside that one test is more
honest about how rarely it's needed.

## Test data

**Q: How do you avoid tests stepping on each other's data?**
Almost every regression test is read-only against records that already exist in the
shared demo environment, catalogued by Diary No. in `test-data/questions.ts`. I chose
that catalog by cross-referencing the 12 provided sample PDFs against what was actually
live in the app during exploration — six of them were already uploaded and seeded; those
became reference fixtures. The one PDF confirmed _not_ yet live became the one fixture an
upload test actually submits-to-the-point-of-ready, and even that test stops short of
clicking the final Submit button, specifically so re-running it in CI doesn't create a new
duplicate record every single run.

**Q: Why not just create fresh data for every test?**
Because the only way to create a question here is the real, AI-assisted upload/extraction
pipeline against a shared backend — there's no API shortcut and I was told not to build
one. Doing that per-test would make the suite slow, and worse, it would pollute a
shared demo environment other people (manual testers, the product team) are actively
using. Reading existing, known-state records is faster, safer, and just as valid for
verifying business rules like "a completed question shouldn't also show up as admitted."

**Q: What would you do if the demo environment gets reset and your Diary Nos disappear?**
`test-data/questions.ts` is a single file specifically so that's a one-file update, not a
hunt through 30 test files. I'd re-run the same cross-reference process documented in
`docs/test-data-strategy.md` §2 against whatever's live afterward.

## Smoke vs. regression, and tagging

**Q: How did you decide what's smoke vs. regression?**
Smoke answers "is the app fundamentally usable right now" in under a minute: can each
role shape sign in and land correctly, do the four question lists and the detail page
render, does the AI surface load, does logout work. Regression is where the actual
business-rule assertions live — status consistency, count-matching between screens, RBAC
boundaries, defect-specific checks. I capped smoke around 10-15 tests deliberately; past
that it stops being a fast confidence check and starts being a slow regression run with a
different name.

**Q: Why tag `@critical` separately from `@regression`?**
A handful of P0 findings are load-bearing enough (the Completed/Admitted duplication bug,
the end-to-end lifecycle check, a couple of RBAC boundaries) that I'd want them to gate a
release even if someone only has time to run a subset. `--grep @critical` gives that
without inventing a third suite.

## Real defects found or re-verified while building this

**Q: Did you find anything the manual bug sheet didn't already have?**
Two things. First, I directly reproduced DEF-081 live (a Completed question, D. No.
28641, still sitting in Admitted Questions) and turned it into
`should remove completed question from active admitted questions` — that's the sharpest
single regression test in the suite. Second, I re-tested the bug sheet's "search does
nothing" defect (DEF-063) and found it's actually changed shape: it now _does_ navigate on
Enter, but to a completely unrelated question. That's arguably worse (a silent wrong
answer instead of a visible no-op), and it's why I excluded search from automation instead
of writing a positive test that would just be asserting the wrong thing.

**Q: Anything you found that wasn't in the bug sheet at all?**
The nav item is labelled "E-File Processed" but the same route is linked from the
Executive Dashboard as "Replies Received" — a small labelling inconsistency I hadn't seen
called out anywhere. Also the account-menu role-picker pattern (accounts without a
dashboard flag land on "Select your role to continue") applies more broadly than I first
assumed — I initially only handled it for Division-only accounts and had to generalize
`LoginPage.chooseRole()` after discovering the plain Parliament-access account
(`parliament-user@gmail.com`) hits the same picker with a different button label
("Parliament Section").

## Debugging and maintenance

**Q: A test fails in CI. Walk me through how you'd debug it.**
Start with the uploaded HTML report artifact — it shows the failure message, a
screenshot, and (since `trace: 'on-first-retry'`) a full trace for anything that needed a
retry, which replays the exact DOM state and network activity around the failure.
Locally, `npx playwright test -g "<test name>" --debug` steps through with the inspector,
or `--headed` just watches it run. Given what I now know about this app, my first
suspicion for a _new_ flaky failure would be either the async-KPI-placeholder pattern
(§8.2 in the README) or the shared environment's rate limiting (§8.3) before assuming it's
a real regression.

**Q: How would you extend this suite for a new module the team ships next quarter?**
Read `docs/application-overview.md` and `docs/test-strategy.md` first to see whether the
existing priority model and "what's automated vs. not" reasoning already covers the new
area's _shape_ (a list + detail + status lifecycle, most likely, given this app's
pattern). Reuse `QuestionListPage` if the new module's list looks like the others; add a
narrowly-scoped new page object only if it genuinely doesn't. Add the new module tag to
the small tag list in `docs/test-strategy.md` §7 rather than inventing an unrelated naming
scheme.

## What's intentionally not automated (and the honest reason why)

**Q: What did you deliberately leave out, and why?**
See `docs/test-strategy.md` §4 and §9 for the full list, but the short version: AI answer
_quality_ (that's an LLM-eval problem, not a UI regression), PDF rendering fidelity,
visual/layout bugs, LS/RS bulletin extraction and e-Office integration (not found in the
live app at all — automating a feature I can't locate would be inventing behavior), full
transfer/collaboration round trips (no safe seed data), and — discovered mid-build —
global search and two AI Assistant scenarios, for the reasons above. Every one of these
has a one-line "why" written down in the docs, not just silently skipped.
