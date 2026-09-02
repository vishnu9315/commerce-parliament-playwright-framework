# Locator Recommendations

The application ships with **no `data-testid` attributes anywhere** observed. The
framework was still built entirely on `getByRole`/`getByText`/`getByLabel` — no XPath, no
CSS-class selectors, no `nth()` as a primary strategy — but a handful of places required
workarounds that a small number of test IDs would make significantly more robust. These
are recorded here rather than applied to the app, per the brief ("do not modify the
application itself").

## Where a `data-testid` would have helped

| Area                                                                                                                | Current locator strategy used                                                                                                                                                                                        | Why it's fragile                                                                                                                                                                                        | Suggested `data-testid`                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| KPI count badges (Executive Dashboard, My Division Dashboard, list-page headings — e.g. "Admitted Questions **7**") | `heading.locator('xpath=following-sibling::*[1]')` — relies on the count being the very next DOM sibling of the heading, with no accessible name of its own                                                          | Any change to the wrapping markup (an icon added between them, a wrapping `<div>`) silently breaks this with no warning; the element has no semantic role or name to hang a `getByRole`/`getByText` off | `data-testid="kpi-count-admitted-questions"` (one per KPI card), `data-testid="list-header-count"` on list pages                         |
| Overall question status badge on Question Detail (e.g. "Completed" next to the H1)                                  | Same `xpath=following-sibling::*[1]` pattern off the heading                                                                                                                                                         | Same fragility as above — the badge is presentational (colored pill) with no ARIA role                                                                                                                  | `data-testid="question-status-badge"`                                                                                                    |
| Table rows on Provisional/Admitted/Assigned/Completed Questions                                                     | `table.locator('tbody tr').filter({ has: getByRole('cell', { name: diaryNo }) })`                                                                                                                                    | Works today because Diary No. happens to be the first, uniquely-identifying cell, but any column reordering or a future "search-highlighted" duplicate cell could produce a false match                 | `data-testid="question-row-{diaryNo}"` on each `<tr>`                                                                                    |
| Knowledge-base toggle (AI Assistant)                                                                                | The real `<input type="checkbox">` is visually hidden; clicks are targeted at the wrapper via `getByTitle('Answer from the parliamentary record...')` (the full sentence, used only because it happens to be unique) | Brittle: relies on a long, easily-edited copy string as a locator; a copy change (even fixing a typo) breaks the click target                                                                           | `data-testid="knowledge-base-toggle"` on the clickable wrapper                                                                           |
| Dashboard KPI cards generally (`View Completed Questions`, `View Admitted Questions`, ...)                          | `getByRole('link', { name: /^View {Label}/ })`                                                                                                                                                                       | Works, but depends on the "View " prefix convention holding for every card, everywhere, forever                                                                                                         | `data-testid="kpi-card-{slug}"`                                                                                                          |
| Sitting-date filter input vs. other free-text inputs on the same list pages                                         | `page.getByRole('textbox').first()`                                                                                                                                                                                  | Positional — correct today only because the sitting-date field happens to be the first textbox on the page; a new filter added to the left of it would silently break this                              | `data-testid="sitting-date-filter"`                                                                                                      |
| Collaboration/Transfer tab buttons whose accessible name embeds a live count (e.g. `"Received · 0"`)                | `getByRole('button', { name: /^Received/ })` for interaction, then reading the full label text to extract the count                                                                                                  | Mixing a stable prefix-match for finding the element with a fragile full-string-parse for its data is inherently awkward                                                                                | `data-testid="tab-received"` for the button, plus a `data-count` attribute so the number doesn't have to be parsed out of a label string |

## Why these matter more than they might look

None of the above caused a failing test in this build — every workaround above is
currently passing reliably. The recommendation is preventative: these are exactly the
kind of "worked by coincidence" locators that break silently on an unrelated UI tweak
(reordering a table column, wrapping a badge in a new `<span>` for a redesign, editing UI
copy) rather than on a real regression, which produces the worst kind of test-maintenance
cost — a red build with no corresponding bug.

## What was deliberately _not_ asked for

- Test IDs on every button/link with a perfectly good accessible role+name already
  (e.g. `Upload Provisional Questions`, `Continue`, `Account menu`) — `getByRole` already
  targets these robustly and a `data-testid` would add nothing.
- Test IDs on one-off, page-specific text that's unlikely to be reused or restyled (e.g.
  the "No transferred questions waiting for your acceptance." empty-state copy) — if that
  copy changes, the test _should_ fail, since it's asserting the copy itself is correct.

## A related, non-locator finding worth flagging to the dev team

Not a locator issue, but discovered while wiring up authentication: the app keeps its
active-role marker in `sessionStorage` (key `parliamentAppStore`), separately from the
user/membership data in `localStorage` (`parliament-identity`). This is why a plain
"restore cookies + localStorage" session-replay approach (Playwright's `storageState()`)
was not enough on its own to reuse a login — see `fixtures/test.ts` and
`tests/auth.setup.ts` for how this framework works around it. This is not something the
app needs to change for testing purposes, but it is a slightly unusual pattern worth the
dev team being aware of (e.g. it means a role/session cannot be restored from a new tab
opened via "duplicate tab," since `sessionStorage` does not carry over to new tabs in most
browsers).
