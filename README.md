# Commerce Parliament — Playwright Regression Framework

A UI regression automation framework for the **Commerce Parliament AI Question Handler**
portal (`https://commerce-parliament.myscheme.in/`), built with Playwright + TypeScript.

This is a production-style, GitHub-ready framework — not a demonstration of every
Playwright feature. It automates the highest-value business workflows identified by
exploring the _live_ application (not the BRD, which describes an earlier/aspirational
design — see `docs/application-overview.md` §0 for why the two disagree in places) and by
cross-referencing a real manual-testing bug sheet.

## 1. Why Playwright

- **Auto-waiting and web-first assertions** remove the need for manual sleeps/polling
  against a React SPA that renders most of its content asynchronously (see "Known
  timing behaviors" below — this app has several).
- **`storageState`** makes multi-role testing (8 distinct account shapes in this portal)
  cheap: authenticate once per role, replay everywhere.
- **Built-in trace viewer, HTML reporter, and codegen** cover debugging and reporting
  without adding extra tooling.
- Single test runner for **both** browser automation and assertions — no separate
  assertion library needed.

## 2. Technology stack

| Concern                          | Choice                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Test runner / browser automation | `@playwright/test`                                                           |
| Language                         | TypeScript (`strict: true`)                                                  |
| Browser                          | Chromium only (see §12 — no cross-browser signal was needed to justify more) |
| Pattern                          | Page Object Model + a small fixture layer                                    |
| Linting / formatting             | ESLint (flat config) + Prettier                                              |
| CI                               | GitHub Actions                                                               |
| Reporting                        | Playwright HTML reporter (always) + JUnit (CI only)                          |

Deliberately **not** used: Cucumber/BDD, a custom test runner, an API-automation layer,
database seeding, or any UI framework beyond what Playwright itself provides.

## 3. Framework architecture

```
project-root/
├── tests/
│   ├── auth.setup.ts          # logs in as each role once, saves storageState
│   ├── smoke/                 # ~11 tests, @smoke, runs on every push
│   └── regression/            # ~29 tests, @regression, one file per module
├── pages/                     # Page Object Model
├── fixtures/                  # role config + the storageState/sessionStorage fixture
├── test-data/                 # seeded-question catalog + upload fixture PDFs
├── docs/                      # exploration, strategy, locator & interview notes
├── .github/workflows/         # CI
├── playwright.config.ts
├── package.json
└── .env.example
```

### Page Object Model

One page object per **meaningful, distinct screen** — not one per component. Notably:

- **`QuestionListPage`** is a single, parameterized page object shared by Provisional,
  Admitted, Assigned, and Completed Questions on _both_ the Parliament and Department
  portals (`new QuestionListPage(page, '/v2/parliament/admitted-questions')`). All six-plus
  of these screens render the exact same table shape — one class with a route parameter
  was the right call instead of six near-duplicate classes. This is a deliberate
  simplification worth being able to explain (see `docs/interview-guide.md`).
- Dashboards (`ExecutiveDashboardPage`, `SecretaryDashboardPage`, `DivisionDashboardPage`)
  are kept separate because they render genuinely different layouts and KPI sets.
- No `BasePage` abstraction — there was nothing genuinely shared across every page beyond
  what Playwright's own `Page` already provides.
- Page objects hold **locators and actions only**. Business assertions live in the tests.

### Fixtures

One custom fixture (`fixtures/test.ts`), extending Playwright's base `test` with a `role`
option. Setting `role` does two things in one step: selects that role's `storageState`
file, and reseeds a `sessionStorage` value the app depends on that `storageState()` alone
does not capture (see §8 — this was a real bug the framework had to work around, not a
stylistic choice). No fixture was added purely "because fixtures are a feature."

## 4. Installation

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Fill in `.env` with the dev sign-in emails for each role (see `.env.example` — the portal
currently authenticates via a single "email + Continue" screen, no password; see §8).

## 5. Running tests

```bash
npx playwright test                      # everything
npx playwright test --grep @smoke        # smoke suite only
npx playwright test --grep @regression   # regression suite only
npx playwright test --grep @critical     # just the P0/critical subset
npx playwright test --headed             # watch it run in a real browser window
npx playwright test --debug              # step through with the Playwright inspector
npx playwright test tests/regression/questions-lifecycle.spec.ts   # one file
npx playwright test -g "should remove completed question"          # one test by name
```

Or via the npm scripts in `package.json` (`npm run test:smoke`, `npm run test:regression`,
`npm run test:critical`, `npm run test:headed`, `npm run test:debug`).

### Viewing the HTML report

```bash
npx playwright show-report
```

Shows pass/fail/duration per test, the failure message, a screenshot on failure, and a
link into the trace viewer for any test that retried (CI) or failed.

## 6. Test tagging

Tags are plain substrings in the test title, matched via Playwright's `--grep`. Kept
small and orthogonal — see `docs/test-strategy.md` §7 for the full list:

- **Suite**: `@smoke`, `@regression`
- **Criticality**: `@critical` (a handful of P0 tests, additive to the above)
- **Module**: `@auth`, `@dashboard`, `@questions`, `@upload`, `@settings`, `@profile`,
  `@ai-assistant`, `@transfer`, `@collaboration`, `@rbac`, `@filters`, `@workflow`

## 7. Authentication strategy

The portal's current sign-in is a single "dev sign-in" email field — no password, no OTP,
no real SSO (the BRD specifies Parichay SSO; it is not present in this build — see
`docs/application-overview.md` §2). Division-only and Parliament-access-only accounts
additionally land on a **role picker** ("Select your role to continue") before reaching a
dashboard.

Four role shapes are genuinely exercised by the suite (`fixtures/roles.ts`) — Super Admin,
Secretary, a multi-division Joint Secretary, and a Division User — each with its own
`storageState` file produced once by `tests/auth.setup.ts` (a Playwright "setup project"
that all other tests depend on). A fifth, plain "Parliament User" account is used for one
RBAC check only and deliberately has **no** `storageState` file, since nothing else needs
it.

Credentials (here, just email addresses — see above) always come from environment
variables, never hardcoded, per `.env.example`.

## 8. Known timing/behavior quirks this framework works around

Worth reading before adding new tests against this app:

1. **`storageState()` alone is not enough to restore a session.** The app keeps its
   active-role marker in `sessionStorage` (`parliamentAppStore`), which Playwright's
   `storageState()` does not capture (only cookies + `localStorage`). Without reseeding
   it, a restored session lands back on the sign-in screen when visiting role-resolution
   routes like the Executive Dashboard. `tests/auth.setup.ts` captures a sessionStorage
   sidecar file per role; `fixtures/test.ts` replays it via `context.addInitScript()`.
   Always sign in / use the `role` fixture through the existing helpers rather than
   hand-rolling a new storageState path.
2. **KPI counts and list tables render asynchronously**, arriving after the page shell
   (a `—` placeholder shows first on KPI cards). Always assert on the first row / a
   non-placeholder value before reading a count, rather than reading immediately after
   `goto()`.
3. **The shared demo environment rate-limits aggressively.** Running the suite with more
   than 2 parallel Playwright workers reliably produces HTTP 429s partway through a full
   run (confirmed independently with `curl`, not a test-code issue). `playwright.config.ts`
   pins `workers: 2` for exactly this reason — don't raise it against this shared
   environment without a good reason.

## 9. Test data strategy (short version — full detail in `docs/test-data-strategy.md`)

- Read-only regression assertions reuse **already-seeded questions** identified by stable
  Diary No. (`test-data/questions.ts`), rather than each test uploading its own PDF.
- Exactly **one** upload is exercised as a live, executed flow
  (`test-data/documents/provisional/district-export-hubs-16356.pdf`), chosen because it
  was confirmed not already live in the shared environment. The test stops short of
  clicking the final Submit, since this suite runs on every CI push and actually
  submitting would create a new duplicate record on every run.
- No database manipulation, no API-based seeding — every piece of state a test depends on
  is either read through the UI or created through the UI by that test itself.

## 10. Best practices this repo follows

- Arrange/Act/Assert structure in every test.
- Test names describe **business behavior**, not implementation
  (`should remove completed question from active admitted questions`, not
  `test completed question`).
- No arbitrary `waitForTimeout()` anywhere — every wait is a locator assertion or an
  explicit, named signal (see §8.2).
- Assertions check **business outcomes** (a status, a count matching between two screens,
  a list membership) — never just "the page loaded" or "an element exists."
- Tests are independent and order-agnostic; the one true end-to-end test
  (`tests/regression/workflow.spec.ts`) is a single, clearly-named test using
  `test.step()` to keep a real business journey readable as one unit rather than being
  artificially split across files that would depend on execution order.

## 11. CI/CD

`.github/workflows/playwright.yml` runs on every push/PR to `main` (and via manual
dispatch, optionally scoped with a `--grep` pattern). It installs dependencies, installs
just the Chromium browser, runs the suite, and uploads the HTML report + JUnit results +
traces as artifacts (always for the report, only on failure for traces). Credentials are
read from GitHub Secrets — see the `env:` block in the workflow file for the exact secret
names to configure in the repository settings.

## 12. Known limitations

- **Chromium only.** No cross-browser requirement was identified during exploration
  (internal government tool, no evidence of Safari/Firefox-specific issues in the bug
  sheet) — see `docs/test-strategy.md` for the full rationale on scope decisions.
- **Global search is not automated.** It was re-verified live during this build and found
  to navigate to an unrelated question rather than the one searched — not a stable target
  for a positive assertion. See `docs/test-strategy.md` §10.
- **Two AI Assistant scenarios were descoped** (source-count accuracy, cross-account chat
  history isolation) to avoid generating repeated real AI traffic against a shared,
  rate-limited backend on every CI run. See `docs/test-strategy.md` §10.
- **Transfer/Collaboration round-trip tests are scoped to the empty state.** No seed data
  exists under the provided accounts for an in-flight transfer or collaboration request.
  See `docs/test-data-strategy.md` §6.
- **LS/RS master-bulletin extraction (BRD UC-03) and e-Office integration** were not found
  in the live application during exploration and are therefore not automated — see
  `docs/application-overview.md` §5.13.

## 13. Further reading

- `docs/application-overview.md` — modules, roles, navigation, live-verified behavior
- `docs/test-strategy.md` — prioritized scenarios, smoke/regression split, scoping decisions
- `docs/test-data-strategy.md` — the PDF fixture catalog and why each one is (or isn't) used
- `docs/locator-recommendations.md` — where a `data-testid` would help, and why
- `docs/interview-guide.md` — how to talk through this framework in an interview
