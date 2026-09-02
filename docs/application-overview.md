# Application Overview — Commerce Parliament AI Question Handler

> Source of truth for this document: **the live application** at
> `https://commerce-parliament.myscheme.in/` as explored on 2026-08-31 (build `v1.0.24`,
> updated 16/07/2026), cross-checked against `BRD - AI-Powered Parliament Question Handling
System (AI-PQHS)...docx` and `Commerce_Parliament_Bugsheet.xlsx`.
>
> Per project instructions: **where the live application and the BRD disagree, the live
> application wins.** Every BRD-only concept that could not be observed live is explicitly
> marked **"Not verified"** below instead of being assumed to exist.

## 1. What this system is

A web portal ("COMPASS" in the bug sheet, "Parliament AI Platform" in the UI) used by the
Department of Commerce's Parliament Section and its Divisions to manage the lifecycle of
Lok Sabha / Rajya Sabha Parliamentary Questions (PQs): upload → admit → assign to a
division → draft an answer (optionally AI-assisted) → collaborate across divisions →
submit → consolidate → mark completed. A separate AI chatbot ("Parliamentary Questions
Assistant") lets any logged-in user ask natural-language questions answered from past
Parliament replies.

## 2. Authentication (as implemented today — differs from BRD)

- The BRD (§12, NFR-01) specifies **Parichay SSO** as the exclusive authentication
  mechanism, with no separate platform credentials.
- **Live behaviour is different and much simpler**: the landing page is a "Dev sign-in"
  screen with a single email textbox and a **Continue** button. No password, OTP, or SSO
  redirect is involved. Entering a known user's email and clicking Continue logs the
  session in immediately.
- Session persists across page loads (looks cookie/local-storage backed) until **Log out**
  is used from the Account menu.
- Users with **Division access only** (e.g. `divisionuser@gmail.com`) land on a **role
  picker** screen ("Select your role to continue") with two options: **Department User**
  and **AI Assistant**. Users with Parliament access go straight to their dashboard.
- **Not verified**: any real Parichay SSO integration. It is not present in the current
  build; the BRD's SSO requirement should be treated as a future/aspirational item, not
  current behavior.

### Known test users (provided by the team, `additional_require.md`)

| Email                             | Intended access                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `secretary@gmail.com`             | Secretary — ministry-wide dashboard only                                                |
| `joint-secretary@gmail.com`       | Joint Secretary — Dashboard + Parliament                                                |
| `joint-secretary1@gmail.com`      | Joint Secretary — Dashboard + Parliament + multiple Divisions (Establishment-I, Cash-I) |
| `joint-secretary2@gmail.com`      | Joint Secretary — Dashboard + multiple Divisions, no direct Parliament menu observed    |
| `director@gmail.com`              | Director — Parliament + Dashboard                                                       |
| `divisionuser@gmail.com`          | Division only, no Dashboard (Export Promotion (Agriculture))                            |
| `parliament-user@gmail.com`       | Parliament access only                                                                  |
| `parliament-admin-user@gmail.com` | Parliament Super Admin — full access incl. Settings                                     |

Confirmed live via **Settings → Add Users** (`/v2/parliament/settings/users`) as the
Super Admin — this list is the authoritative user/role registry, not the BRD's 3-role
model (Parliament Section User / Division Section User / System Administrator). The real
app has a **finer-grained, additive permission model**: `Parliament` access,
`Division` access (one or many named divisions), a `Super admin` flag, `Secretary
Dashboard`, `Executive Dashboard`, and `Settings` are independently toggleable per user
(seen on the Edit User screen and the users list badges).

## 3. Roles observed live (do not assume the BRD's 3-role model)

| Role (as behaves in the app)             | Landing route                            | Distinguishing UI                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Parliament Super Admin**               | `/v2/parliament/executive-dashboard`     | Full Parliament nav + **Settings** (Add Users, Add Divisions)                                                                                                                                              |
| **Parliament User** (no dashboard flags) | `/v2/parliament/executive-dashboard`     | Full Parliament question-lifecycle nav, no Settings                                                                                                                                                        |
| **Secretary**                            | `/v2/parliament/secretary-dashboard`     | Ministry-wide "Secretary Dashboard" — division-wise breakup table, delay list across divisions, no question-lifecycle nav in sidebar                                                                       |
| **Joint Secretary (single/no division)** | `/v2/parliament/executive-dashboard`     | Same Executive Dashboard as Parliament User                                                                                                                                                                |
| **Joint Secretary (multi-division)**     | `/v2/parliament/executive-dashboard`     | Executive Dashboard **+ a SCOPE selector** ("Dashboard scope: Parliament ▾") that lets the user switch the dashboard between "Parliament" and each of their named divisions (e.g. Cash-I, Establishment-I) |
| **Division/Department User**             | role picker → `/v2/department/dashboard` | "My Division Dashboard" with division-scoped KPIs; separate nav (Dashboard, Provisional Questions, Admitted Questions, Completed Questions, Profile)                                                       |

**Not verified**: a distinct "Director" dashboard variant beyond the standard Executive
Dashboard — `director@gmail.com` was listed but not deeply explored this pass.

## 4. Navigation structure (live)

### Parliament-side left nav (Super Admin / Parliament User)

`Dashboard` · `Provisional Questions` · `Admitted Questions` · `Assigned Questions` ·
`E-File Processed` · `Completed Questions` · `Settings` (Super Admin only: **Add Users**,
**Add Divisions**)

> ⚠️ **Naming inconsistency (regression-worthy):** the nav item is labelled **"E-File
> Processed"**, but the Executive Dashboard's own KPI card linking to the same URL
> (`/v2/parliament/received-answers`) is labelled **"Replies Received"**. Same route, two
> different labels depending on entry point. See Bug Sheet DEF-061 for a related labelling
> inconsistency ("Received Answers" vs "Answer Submitted").

### Executive Dashboard mini-nav (Parliament/JS/Director/Secretary)

`Dashboard` · `AI Assistant` (a separate, full-page chatbot at `/ai-assistant`) · a
mini sitting-date calendar widget (Done/In progress/Delayed legend) embedded in the
sidebar.

### Department/Division-side left nav

`Dashboard` · `Provisional Questions` · `Admitted Questions (n)` · `Completed Questions` ·
`Profile`. Two more sections — **Collaboration Requests** and **Transfer Requests** —
exist as routes (`/v2/department/collaboration-requests`,
`/v2/department/transfer-requests`) and are reachable only via **dashboard KPI cards**,
not the left nav.

## 5. Modules and what they do (live-verified)

### 5.1 Executive Dashboard (`/v2/parliament/executive-dashboard`)

Filters: **Scope** (Parliament or a division, JS-multi-division users only), **Sitting
Date** (calendar picker), **House** (auto-derived from sitting date, read-only display),
**Parliament Session** (read-only range display).
KPI row: Provisional Questions, Admitted Questions, Assigned Questions, Replies Received,
Delayed Questions — each a clickable card that deep-links into the corresponding list
pre-filtered by the selected sitting date.
Below: "Today's Action Plan" (0-state message when empty), "AI Daily Briefing" (narrative
summary), a 15-day trend chart, "Division Work Load" (per-division % + completion ratio,
with a "View All" → `/v2/parliament/department-load`), and "Top Delayed Questions".

### 5.2 Secretary Dashboard (`/v2/parliament/secretary-dashboard`)

Ministry-wide, no per-question-type left nav. KPI row: Provisional, Admitted, Delayed,
"Yet to be assigned", E-File Processed — each with an LS/RS split. "AI Ministry Summary"
narrative. **Division-wise breakup table** (Division, Joint Secretary, Questions
assigned, Provisional, Admitted assigned, Completed, Delayed) — this is the
"division-wise visibility" callout in `additional_require.md`. "Delay and Pending Issues"
— a prioritized list of the longest-overdue questions across _all_ divisions, each
deep-linking to the question detail page.

### 5.3 My Division Dashboard (`/v2/department/dashboard`)

Filters: Sitting Date, House, Parliament Session (no scope selector — always scoped to
the logged-in user's division). KPI row: Questions Received, Provisional Questions,
Admitted Questions, Delayed Questions, Completed Questions, **Input Collaboration
Received**, **Transfer Requests**. "Questions Activity" table. "Transfer Requests"
panel ("Questions another division transferred to you..."). "Today's Action Plan"
with sub-filters (All/Prepare/Review/Clarify/Submit). "AI Daily Briefing" scoped to the
division. "Top Delayed Questions".

### 5.4 Provisional Questions (Parliament: `/v2/parliament/provisional-questions`;

Department: `/v2/department/provisional-questions`)
List of uploaded PQ documents not yet admitted, or admitted-but-still-listed (see bug
below). Filters: House, Sitting date, Assignment (All/Assigned/Not assigned) on the
Parliament side; House/Sitting date/Assignment on the Department side (division-scoped).
Table columns: Diary no., Subject, House, Question Type, Department, Sitting Date, Due
Date, Question Status, Action (**View question**). Parliament side has an **Upload
Provisional Questions** action → `/v2/upload`, a single-PDF dropzone, 10 MB max, with a
4-step "Routing Plan" explainer (Submit & route → Department reviews → If forwarded →
Drafting begins), matching the BRD's Division-1/Division-2 forwarding model (UC-01).

### 5.5 Admitted Questions (Parliament: `/v2/parliament/admitted-questions`; Department:

`/v2/department/admitted-questions`)
Same shape as Provisional Questions, filtered to admitted PQ batches. Has its own
**Upload Admitted Questions** action (bug sheet DEF-002/DEF-015/DEF-024 relate to this
upload's PDF parsing).

> ⚠️ **Live-reproduced bug**: a question already in status **Completed** (D. No. 28641)
> was still present in this list at exploration time — matches Bug Sheet **DEF-081**
> ("Completed question remains displayed in Admitted Questions") and is a strong,
> currently-reproducible regression candidate.

### 5.6 Assigned Questions (`/v2/parliament/questions`)

Parliament-wide list of questions currently assigned to a division and still in
progress (including admitted ones). Filters: House, Sitting date, Question type
(All/Provisional/Admitted). Question Status column shows granular states observed live:
`Assigned`, `Draft in progress`, `Completed`.

### 5.7 E-File Processed / Replies Received (`/v2/parliament/received-answers`)

Same route, two labels depending on entry point (see §4). Represents questions whose
divisional answers have been received/processed.

### 5.8 Completed Questions (Parliament: `/v2/parliament/completed-questions`;

Department: `/v2/department/confirmed-questions`)
"Only questions with status Completed (Final Answer PDF uploaded)." Verified working
correctly on the Parliament side (7 completed questions listed, including D. No. 28641 —
confirming it is _correctly_ in Completed while _also incorrectly_ still in Admitted,
i.e. the bug is duplication, not misclassification).

### 5.9 Question Detail (`/v2/parliament/questions/{id}` and

`/v2/department/questions/{id}`)
The central workflow screen. Header: title/subject, Diary No., House, sitting date,
overall status badge (`Draft in progress`, `Completed`, etc.), Assigned department,
Current custodian, Parliament Section Remark, **View Uploaded Question** (opens the
source PDF) and an **Actions** menu (observed: **Pull Back Question** — disabled unless
eligible, **Mark as Provisional**).
Below: **AI Generated Summary** of the question. **Final Consolidated Answer** panel
(once generated) with **Regenerate Final Answer** and **Download**, rendered as a
formatted GOI answer document (Ministry header, sub-question (a)/(b)/(c)/(d), Minister
attribution block).
**Collaboration Inputs** — inputs from other divisions "included automatically when you
draft with AI", each tagged with the contributing Division and free-text remarks.
**Collaboration Requests** — count + list of open cross-division requests.
**Questions in this Document** — one card per sub-question (Part A/B/C/D...), each with
its own status (`Assigned`/`Answer pending`, `Completed`/`Answer received`) and, per the
bug sheet, department-user-only actions **Accept Question**, **Draft with AI**, **Provide
Input**, **Request Question Transfer**.
**Movement Timeline** — a swimlane/grouped-list visualization (toggle) of every lifecycle
event with actor, division, timestamp and "time at stage": Uploaded → Admitted →
Assigned → (Transfer → Rejected → Transfer → Assigned, if forwarded) → Submitted (one
event per sub-question save) → Final Answer (one event per regeneration) → Parliament
Completed. Collaboration request/response events appear as their own sub-lane under the
relevant Part.

### 5.10 Settings (Super Admin only)

**Add Users** (`/v2/parliament/settings/users`) — searchable/sortable user directory,
Access filter (All/Parliament/Division/Parliament+Division), **Create user**, per-user
**Edit**/**Delete** (protected accounts have no Delete). **Add Divisions**
(`/v2/parliament/settings/divisions`) — division taxonomy CRUD (bug sheet DEF-029/DEF-037
document authorization/UX defects here).

### 5.11 Profile (Department, `/v2/department/profile`)

Salutation/Name/Email/Mobile (name/email/mobile read-only), editable Division
description, and a **Documents** section with **Upload document** (PDF/Word/Excel/
PowerPoint/text/CSV/images, max 10 MB) — bug sheet DEF-080 notes no success confirmation
is shown after upload.

### 5.12 AI Assistant (`/ai-assistant`)

A **separate, full-page chatbot**, distinct from the in-question "Draft with AI" feature.
Ask/Search mode toggle, House filter, Question-type filter (Starred/Unstarred), Document
Year filter, a **Knowledge base** toggle ("Answer from the parliamentary record. Switch
off to answer only from what you attach."), file attach, a **Recents** history sidebar,
and dark-theme toggle. Answers are scoped to "replies given in Parliament by the
Department of Commerce." Several bug-sheet defects target this surface specifically:
fixed "10 Sources" count (DEF-057), no delete for chat history (DEF-059), other users'
chat history leaking into Recents (DEF-062 — a **privacy/security defect**), source panel
that cannot be closed (DEF-053).

### 5.13 Not directly exercised this pass (documented from the bug sheet / BRD only)

- **Transfer Requests** (Incoming/Sent tabs) — UI confirmed present and empty for the
  test account used; full accept/reject flow not exercised live (no seed data available
  under the credentials provided). Documented via DEF-013/DEF-021/DEF-034/DEF-051/DEF-055.
- **Input Collaboration** request/response full round trip (create → respond →
  resubmit) — partially observed via one completed question's timeline
  (`Collab Request` → `Collab Response` events), but the live create/respond forms were
  not filled in this pass. Documented via DEF-005/DEF-010/DEF-032/DEF-033/DEF-048/DEF-065/
  DEF-066/DEF-074/DEF-075/DEF-076.
- **LS/RS master bulletin extraction (BRD UC-03)** — **Not verified**. No "upload
  bulletin" entry point was found in any explored nav; this may not be implemented in the
  current build, or may live behind a screen not reached this pass.
- **e-Office integration / computer number capture** — **Not verified** live; BRD marks
  it Medium priority / phased.
- **TIA Portal API-backed chatbot answers (BRD UC-02)** — the AI Assistant and "Draft with
  AI" exist, but whether responses are truly backed by a live TIA Portal API vs. a static
  knowledge base is **not verified** from the UI alone.

## 6. Business states observed on questions

Overall question status values seen: `Provisional`, `Admitted`, `Assigned`,
`Draft in progress`, `Completed`.
Sub-question status pairs seen: `Assigned`/`Answer pending`, `Completed`/`Answer received`.
Transfer-related states referenced in the bug sheet: `Transfer Pending Parliament
Review`, `Returned from Dept. of X`, `Transferred to Dept. of X`.

## 7. High-value regression areas (summary — see `docs/test-strategy.md` for the full

prioritized list)

1. Question lifecycle integrity: a question/sub-question's status and its presence in
   exactly one list (Provisional vs Admitted vs Assigned vs Completed) must stay
   consistent — this is the single most bug-dense area in the sheet (DEF-056, DEF-070,
   DEF-071, DEF-079, DEF-081, DEF-083).
2. Dashboard KPI accuracy and card→list navigation consistency (DEF-041, DEF-043,
   DEF-046, DEF-065, DEF-068, DEF-072, DEF-074, DEF-082).
3. Role-based visibility and data isolation (DEF-045, DEF-062, DEF-072) — includes a
   genuine data-privacy defect (chat history leak).
4. Transfer and collaboration workflows and their effect on available actions
   (DEF-013, DEF-021, DEF-047, DEF-055, DEF-064, DEF-078).
5. Draft/AI-answer workflow state persistence (DEF-018, DEF-022, DEF-023, DEF-084).
6. Filtering/sorting controls that currently appear inert (DEF-020, DEF-025).
7. Upload flows and file-size/error handling (DEF-002, DEF-030, DEF-069, DEF-080).

## 8. Explicit open questions (need product/QA-lead confirmation before automation)

- Is the "Dev sign-in" screen genuinely the production-parity auth for this mock/demo
  environment (confirmed: **yes**, this is intentional for the mock portal), or should
  automation instead assume a future Parichay SSO flow will replace it? → Assumption used
  in this framework: **automate against the current dev sign-in**, isolate it behind a
  single login helper so swapping to SSO later only touches one file.
- No test data exists (via the given accounts) for an _in-progress_ division workflow
  (accept → draft → submit) end-to-end under a fresh, isolated question. Regression tests
  that need this will either (a) operate read-only against existing seeded questions
  identified by Diary No., and clearly document that dependency, or (b) be marked as
  requiring seed data the team must provide.
