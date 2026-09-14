# Test ledger — The Mill Fire

Artifact: `game.html`, 30 KB, version 1, 2026-09-14.

Statuses: **passed** (the check was run and it passed), **untested** (not run — not a pass),
**not applicable** (with a reason).

| # | Check | Method and environment | Result | Evidence | Tester |
|---|---|---|---|---|---|
| 1 | Self-contained: no external scripts, styles, fonts, or images | Static analysis, `tools/validate.mjs` | passed | 0 blocking, 0 warnings | Agent |
| 2 | No network requests during play | Static analysis for network APIs and remote URLs | passed | No fetch, XHR, WebSocket, EventSource, or remote URL in the file | Agent |
| 3 | Runs from disk | Opened as a `file://` URL in Chrome; full play-through driven to the ending screen | passed | `performance.getEntriesByType('resource')` returned an empty list on both the `file://` and the `http://` load | Agent |
| 4 | No AI model or API key dependency | Static analysis and source read | passed | No provider endpoint, SDK, or key present | Agent |
| 5 | Sources & assumptions screen present and reachable | Opened from the footer during play and from the ending screen | passed | Six-row table, notice, and instructor note rendered; focus moved to its heading | Agent |
| 6 | Invented content labelled as invented | Read the screen against the game content | passed | Stated in a notice before play, on the Sources screen, and in the history bible | Agent |
| 7 | Keyboard operation and visible focus | Rounds 1 and 3 played with Tab and Enter only; computed outline read at each step | passed | Round 1 sorted from a shuffled start to A B C D with twelve key presses. Focus moved to the round heading on each new screen, stayed on the moved card's button after every move, and went to the verdict after checking | Agent |
| 8 | Screen-reader announcements for moves | Read the `aria-live` region after each move | passed | "Lease of the mill is now in position 2 of 4." after the corresponding move. This is a read of the DOM, not a screen-reader session (see row 16) | Agent |
| 9 | Ordering feedback marks each card | Deliberately submitted a wrong order (F E G) in round 2 | passed | Verdict read "1 of 3 in the right place"; wrong cards showed "Belongs at position n", the right card "Right place" | Agent |
| 10 | Shuffle never presents the correct order | Code review of the shuffle; two launches observed | passed | Both launches shuffled (C A D B, then F G E). The shuffle re-rolls and finally reverses if it lands on the solution | Agent |
| 11 | No console errors | Browser console during a full play-through over `http://` | passed | Console clean. (Over `file://` the testing tool itself logged one "unsafe attempt to load URL" error from its own injection; it did not appear over `http://` and the game requests nothing) | Agent |
| 12 | Restart works and clears state | Pressed "Play again" from the ending screen | passed | Returned to the intro with the start button present; a new game shuffled afresh | Agent |
| 13 | Phone-width layout | Emulated a 390 × 844 mobile viewport in Chrome, round 1 on screen | passed | `scrollWidth` equal to `clientWidth` at 390 px, no horizontal scrolling. Move buttons are about 80–98 px wide and 32 px tall, usable but on the small side for touch | Agent |
| 14 | Full play-through fits the stated 15 minutes | **Estimated from word count, not timed with a player** | **untested** | 870 words on one path through, 1,154 with every explanation read: roughly 5–8 minutes of reading plus the ordering moves, so 15 minutes is a safe allowance. No person has played it against a clock | — |
| 15 | Debrief questions delivered | Ending screen | passed | Five questions present | Agent |
| 16 | Screen-reader play-through | — | **untested** | No screen reader was run. Semantic buttons, per-card `aria-label`s, and a live region are used, but that is a static observation, not a test | — |
| 17 | Reduced-motion preference respected | Static review of the stylesheet | passed | The only transitions sit inside a `@media (prefers-reduced-motion: no-preference)` block | Agent |
| 18 | Opens on the instructor's classroom computer and LMS | — | **untested** | Cannot be run from here. This is the instructor's five-minute rehearsal | — |
| 19 | Historical accuracy of sources | — | not applicable | The game uses no real sources. See `history-bible.md` | — |

## Fixed during testing

The accessibility snapshot read each document heading as one word, "FThe lord's rent roll",
because the letter tag and the label had no space between them. A space was added to the text
node. Rows 7 and 8 were re-run on the corrected file.

## Notes

Row 14 is the honest gap. The word count supports the fifteen-minute figure, but a word count
is not a clock, and nobody has watched a student move the cards.

Rows 16 and 18 are the ones that matter to anyone adopting this game. Semantic HTML and a live
region are good signs, not a screen-reader test, and nothing here can tell you how your
lecture-hall machine will behave.

Re-run rows 1–13 after any edit to `game.html`. Editing only the text inside `GAME_DATA`
cannot break rows 1–5, but it can break row 14, and re-ordering the documents in an ordering
round changes the answer key.
