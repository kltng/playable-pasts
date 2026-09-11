# Test ledger — The Grain Shipment

Artifact: `game.html`, 22 KB, version 1, 2026-09-10.

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
| 12 | Full play-through fits the stated 10 minutes | **Estimated from word count, not timed with a player** | **untested** | 557 words on one path through, 936 with every explanation read: roughly 3–5 minutes of reading, so 10 minutes is a safe allowance. No person has played it against a clock | — |
| 13 | Debrief questions delivered | Ending screen | passed | Five questions present | Agent |
| 14 | Reduced-motion preference respected | Static review of the stylesheet | passed | The only transitions in the file sit inside a `@media (prefers-reduced-motion: no-preference)` block, so they cannot apply when reduced motion is requested | Agent |
| 15 | Screen-reader play-through | — | **untested** | No screen reader was run. Semantic buttons and a live region are used, but that is a static observation, not a test | — |
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
