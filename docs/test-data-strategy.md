# Test Data Strategy

## 1. What was provided

The project folder contains 13 real parliamentary-question PDFs:

- 12 files named `provisional questions (N).pdf` — each a **single-page, single
  question** in the exact format the **Upload Provisional Questions** flow expects
  (Ministry / Sitting date / Question Type / D.No / subject / sub-parts (a)...(g),
  plus a handwritten routing annotation from the Parliament Section officer).
- 1 file, `Admitted questions.pdf` — a **10-page, multi-ministry Lok Sabha bulletin**
  ("List of Questions for ORAL ANSWERS"), the format the **Upload Admitted
  Questions** flow expects. It covers ~20 questions across many ministries; only
  two (`*456 Exports Testing Facilities`, `*460 Empowerment of APEDA`) belong to
  Commerce and Industry.

Every PDF was opened and read before deciding how (or whether) to use it — none
were assumed suitable "just because they exist," per the project brief.

## 2. Cross-checking against the live application

Diary numbers extracted from the PDFs were cross-checked against what the live
Provisional/Admitted/Assigned/Completed Questions lists actually showed during
exploration. This revealed which PDFs had **already been uploaded** to the shared
demo environment (and must not be re-uploaded) versus which are still fresh.

| #   | File                             | D. No.                            | Subject                                                        | Type              | Live in the app?                                                |
| --- | -------------------------------- | --------------------------------- | -------------------------------------------------------------- | ----------------- | --------------------------------------------------------------- |
| 1   | `provisional questions (1).pdf`  | 16356                             | District Export Hubs                                           | Unstarred         | **No** — safe upload fixture                                    |
| 2   | `provisional questions (2).pdf`  | 16365                             | Spice production in Maharashtra                                | Unstarred         | Yes — sole current Provisional Question, `Assigned`             |
| 3   | `provisional questions (3).pdf`  | 16387                             | Free Trade Agreements                                          | Unstarred         | No — unused, available for future tests                         |
| 4   | `provisional questions (4).pdf`  | 16394                             | Increase in Exports                                            | Unstarred         | No — unused, available for future tests                         |
| 5   | `provisional questions (5).pdf`  | 16513                             | Effectiveness of Free Trade Agreements                         | Unstarred         | No — unused, available for future tests                         |
| 6   | `provisional questions (6).pdf`  | 16568                             | Pharmaceutical Economic Zone Initiatives                       | Unstarred         | No — unused (referenced in Bug Sheet DEF-031 by diary no. only) |
| 7   | `provisional questions (7).pdf`  | 16911                             | Identification and Registration of Tea Growers                 | Unstarred         | Yes — `Completed`                                               |
| 8   | `provisional questions (8).pdf`  | 16917                             | Impact of Ongoing War on India's Trade                         | Unstarred         | No — unused, available for future tests                         |
| 9   | `provisional questions (9).pdf`  | 16978                             | India–US Digital Trade Provisions                              | Unstarred         | Yes — `Completed`                                               |
| 10  | `provisional questions (10).pdf` | 14598                             | India's Trade Agreements                                       | **Starred**       | Yes — `Assigned`                                                |
| 11  | `provisional questions (11).pdf` | 16258                             | Impact of US Tariff on Import Export of Agricultural Products  | Unstarred         | Yes — `Draft in progress`                                       |
| 12  | `provisional questions (12).pdf` | 16305                             | Operational Status and Development of Malon International Haat | Unstarred         | Yes — `Completed`                                               |
| —   | `Admitted questions.pdf`         | (bulletin: 456, 460 for Commerce) | Exports Testing Facilities; Empowerment of APEDA               | Admitted bulletin | Yes — both `Completed`                                          |

## 3. How each is actually used

### 3.1 Upload fixture (drives a real, executed upload)

**`test-data/documents/provisional/district-export-hubs-16356.pdf`** (copied from
`provisional questions (1).pdf`) is the **only** document wired into an automated
upload (`Upload Provisional Questions`, see `test-data/documents.ts`). It was
chosen because:

- it is confirmed **not currently live** — uploading it cannot create a confusing
  duplicate diary number for other people using the shared demo environment;
- it is the smallest file (65.9 KB) — fastest, most reliable upload in CI;
- it is a single, well-formed Unstarred question — a clean happy-path case.

### 3.2 Reference fixtures (read-only assertions against existing state)

The six PDFs already live in the app (16365, 16911, 16978, 14598, 16258, 16305)
are **not** re-uploaded by any test. Their diary numbers, subjects, divisions and
statuses are captured once in `test-data/questions.ts` and reused by regression
assertions that need a question in a specific, real state — e.g. "the Completed
list contains D. No. 16978" or "D. No. 16258 shows `Draft in progress`". This
avoids uploading the same document repeatedly just to get back to a state that
already exists.

`Admitted questions.pdf` is documented here but **deliberately not re-uploaded**
by automation: D. No. 456 and 460 already exist as `Completed`, so re-running the
upload would risk creating duplicate/garbled records in a bulletin-extraction
pipeline that the bug sheet already shows to be imperfect (DEF-015 — incorrect
title extraction). The two resulting questions are used as read-only reference
fixtures instead (`test-data/questions.ts` — not all six are listed there, only
the ones a current test reads).

### 3.3 Untouched PDFs

`provisional questions (3), (4), (5), (6), (8).pdf` are not currently used by any
test. They are left at the project root, uncommitted to `test-data/`, so the next
person extending the suite has ready-made, realistic, not-yet-live fixtures to
draw from without needing to source new sample questions.

## 4. Why not "just re-upload everything before every run"

- The upload flow performs real, presumably AI-assisted extraction against a
  **shared** demo backend other people (manual testers, the product team) are
  actively using. Repeated automated uploads of the same PDFs would pollute that
  shared state with duplicate diary numbers, making manual testing and other
  people's exploration harder to reason about.
- It would make the suite slower and more fragile — one more network-bound,
  AI-processing-dependent step per test run for no additional regression signal
  once the happy path is covered once.
- Bug Sheet DEF-002 (413 on oversized PDF) cannot be reproduced with any of the
  provided fixtures (`Admitted questions.pdf`, the largest, is 1.5 MB, well under
  the observed 10 MB limit). Generating a synthetic oversized dummy file was
  considered and rejected as low-value: it does not exercise real parsing, only
  a size check, and the UI copy for the limit is already asserted via the
  Upload page object's static text where relevant.

## 5. Data creation policy (per test)

For each scenario needing an application record, the same three questions were
asked before writing the test (per the Phase C brief):

1. **Can it be created through the UI?** — Yes, for uploads (§3.1); used for the
   one upload test that needs a genuinely fresh record.
2. **Can it be reused safely?** — Yes, for the six already-seeded diary numbers
   in `test-data/questions.ts`; used for all read-only lifecycle/status/count
   assertions.
3. **Does it need to be created once and cleaned up?** — Not applicable here: no
   test in this suite creates a record that must later be deleted. If a future
   test needs disposable data, prefer creating it via the UI in that test's own
   `beforeEach`/body and scoping assertions narrowly, rather than adding shared
   mutable fixtures.

No database manipulation and no API-based data seeding are used anywhere in this
framework — every piece of state a test depends on was either already reachable
through the UI (read-only fixtures) or is created through the UI by the test
itself (the one upload test).

## 6. Known gap

Transfer Requests (Incoming/Sent) and a live, in-flight Input Collaboration
request/response round trip have no available seed data under the provided test
accounts (see `docs/application-overview.md` §5.13 and `docs/test-strategy.md`
§4/§8). Regression tests for these are scoped to the honestly-testable **empty
state** rather than faking a full round trip. Extending this properly needs
either a dedicated seed question routed through a full transfer/collaboration
cycle by the product team, or a documented, safe way to create one without
disrupting other testers' shared demo data.
