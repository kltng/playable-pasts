# Test ledger — The Grain Shipment

Artifact: `game.html`, 24 KB, version 2, 2026-09-24 (version 1 was 2026-09-10). Rows 1–17 below
were run on version 1. What was re-run on version 2 is listed under "Re-check after the
2026-09-24 fixes" at the end.

Statuses: **passed** (the check was run and it passed), **untested** (not run — not a pass),
**not applicable** (with a reason).

| # | Check | Method and environment | Result | Evidence | Tester |
|---|---|---|---|---|---|
| 1 | Self-contained: no external scripts, styles, fonts, or images | Static analysis, `tools/validate.mjs` | passed | 0 blocking, 0 warnings | Agent |
| 2 | No network requests during play | Static analysis for network APIs and remote URLs | passed | No fetch, XHR, WebSocket, EventSource, or remote URL in the file | Agent |
| 3 | No network requests during play | Live: loaded through the site's checker in Chrome 141 under a Content-Security-Policy of `default-src 'none'` | passed | Zero CSP violations reported; the checker's live pass returned "Nothing was fetched from outside" | Agent |
| 4 | Runs from disk | Opened as a `file://` URL in Chrome; full play-through driven to the ending screen | passed | `performance.getEntriesByType('resource')` returned an empty list — the page loaded nothing beyond itself | Agent |
| 5 | No AI model or API key dependency | Static analysis and source read | passed | No provider endpoint, SDK, or key present | Agent |
| 6 | Sources & assumptions screen present and reachable | Played to the screen from the footer and the ending | passed | Reachable from every screen | Agent |
| 7 | Invented content labelled as invented | Read the screen against the game content | passed | Stated in a notice before play, on the Sources screen, and in the ledger table | Agent |
| 8 | Keyboard operation and visible focus | Focused and activated each control without a pointer, checking the computed outline at every step | passed | All five controls on the round screen reachable and operable; a visible outline on each. Focus moves to the new question after each choice and to the Next control after answering | Agent |
| 9 | No console errors | Browser console during a full play-through | passed | Console clean | Agent |
| 10 | Restart works and clears state | Pressed "Play again" mid-round and after the ending | passed | Returns to intro with score reset | Agent |
| 11 | Phone-width layout | Rendered at 390 px wide | passed | No horizontal scrolling; controls remain full-width and tappable | Agent |
| 12 | Full play-through fits the 10 minutes of play in the 25-minute session plan | **Estimated from word count, not timed with a player** | **untested** | 557 words on one path through, 936 with every explanation read: roughly 3–5 minutes of reading, so 10 minutes is a safe allowance. No person has played it against a clock | — |
| 13 | Debrief questions delivered | Ending screen | passed | Five questions present | Agent |
| 14 | Reduced-motion preference respected | Static review of the stylesheet | passed | The only transitions in the file sit inside a `@media (prefers-reduced-motion: no-preference)` block, so they cannot apply when reduced motion is requested | Agent |
| 15 | Screen-reader play-through | — | **untested** | No screen reader was run. Semantic buttons and a live region are used, but that is a static observation, not a test. (In version 1 the "live region" was the whole `<main>`; version 2 replaces it with a small status region, see below) | — |
| 16 | Opens on the instructor's classroom computer and LMS | — | **untested** | Cannot be run from here. This is the instructor's five-minute rehearsal | — |
| 17 | Historical accuracy of sources | — | not applicable | The game uses no real sources. See `history-bible.md` | — |

## Fixed during testing

Running the keyboard pass found that focus dropped to `<body>` every time a screen changed, so a
keyboard or screen-reader user was returned to the top of the document after every choice. Each
screen now moves focus to its own heading. Row 8 was re-run after the fix.

## Notes

Row 12 is an honest downgrade. An earlier draft of this ledger recorded a timed play-through
that had not happened. The word count supports the ten-minute figure, but a word count is not a
clock, and nobody has watched a student play this.

Rows 15 and 16 are the ones that matter to anyone adopting this game. Semantic HTML is a good
sign, not a screen-reader test, and nothing here can tell you how your lecture-hall machine will
behave.

Re-run rows 1–14 after any edit to `game.html`. Editing only the text inside `GAME_DATA` cannot
break rows 1–5, but it can break row 12.

## Re-check after the 2026-09-24 fixes

What changed in version 2:

- **Document headings** read "AHarbour tally" because the letter tag and the label had no space
  between them. A space is now added, as in *The Mill Fire*.
- **Button fonts.** `font: … inherit` is not valid CSS, so browsers dropped the whole rule and
  buttons fell back to about 13 px. Replaced with `font-family: inherit` and `font-size: 1rem`
  (16 px).
- **Screen-reader announcements.** `<main>` had `aria-live="polite"`, so a screen reader would
  read the whole screen on every change, on top of focus moving to the heading. That is removed.
  A small hidden status region now announces only "Well judged." or "Not quite." after an answer.
- **Contrast.** The faint text colour went from #8d8574 (3.3:1 on the page) to #6b6353 (5.4:1 on
  the page, 5.8:1 on a card, 4.86:1 on the notice). The dark-mode colour went from #8a8272
  (4.4:1 on a card) to #9d9583 (5.65:1). Ratios computed with the WCAG formula.
- **Wording.** The progress line says "Round n of 3", not "Document n of 3", and the button says
  "Next round". The merchant explanation no longer says "in another town", which no document
  says. The Baron explanation no longer says "unfalsifiable" twice.
- **Sources screen.** "Back to the game" now returns to the screen the student left, with their
  progress. The footer "Play again" is now "Restart from the beginning".
- **Session length.** `session_minutes` is now 25 (the teacher guide's plan with debrief), to
  match how the other gallery games use it. The 10 minutes is labelled as play time.

| # | Check | Method and environment | Result | Evidence | Tester |
|---|---|---|---|---|---|
| R1 | Validator | `node tools/validate.mjs`, run against both the committed validator and the working copy | passed | 0 blocking, 0 warnings. (One run of the working-copy validator, while another agent was editing it, reported an internal "stripJsComments is not defined" error for every game; a later run was clean) | Agent |
| R2 | Button font size | Chrome via DevTools over `http://localhost`; `getComputedStyle` | passed | Every button 16 px, system-ui family, including the answer buttons (checked while focused) | Agent |
| R3 | Headings and progress text | Read in the page | passed | "A Harbour tally, kept by the port clerk", "B Letter…", "C City chronicle"; progress "Round 1 of 3" | Agent |
| R4 | Live region | DOM read | passed | `<main>` has no `aria-live`; the status region read "Not quite. The explanation is above the Next round button." after a wrong answer. This is a DOM read, not a screen-reader session (row 15 stays untested) | Agent |
| R5 | Faint text colour applied | `getComputedStyle` on the document-type line | passed | rgb(107, 99, 83), that is #6b6353. Dark mode was not rendered | Agent |
| R6 | Keyboard path through round one | Tab and Enter only | passed | Tab to "Open the first file", Enter; focus on the question heading; Tab twice to the second answer (visible outline), Enter; focus moved to "Next round"; the new merchant explanation shown | Agent |
| R7 | Sources, then Back, keeps progress | Keyboard: Tab to the footer "Sources & assumptions", Enter, Tab to "Back to the game", Enter | passed | Returned to the answered round one ("Not quite" still shown), focus on the question heading | Agent |
| R8 | Sources from the ending, then Back; restart | Scripted clicks | passed | Back returned to the ending screen; "Restart from the beginning" returned to the intro | Agent |
| R9 | Round two text | Scripted clicks, after a reload | passed | The Baron explanation shows the new wording | Agent |
| R10 | No network requests | `performance.getEntriesByType('resource')` | passed | Empty list | Agent |
| R11 | Rows 3, 4, 9, 11, 14, 15 on version 2 (live CSP pass, file://, console, phone width, reduced motion, screen reader) | — | **untested** | Not re-run on version 2 | — |
| R12 | Timing | — | **untested** | Still not timed with a player | — |

