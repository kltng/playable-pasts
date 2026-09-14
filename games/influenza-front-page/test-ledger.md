# Test ledger — The Influenza Front Page

Artifact: `game.html`, 4.8 MB, version 2 ("Newsroom edition"), built 2026-09-07; added to the gallery
2026-09-14. Identical to the source project's `influenza-front-page-v2.html` (SHA-256 begins `eed1ea60dbd9f6f0`).

Statuses: **passed** (the check was run and it passed), **untested** (not run — not a pass),
**not applicable** (with a reason).

The rows below record two kinds of test: the game's own Playwright suites, written for the source
project and **re-run on 2026-09-14** by the gallery agent against this exact file; and checks the
gallery agent ran directly. The original QA report of 2026-09-07 is summarised at the end.

| # | Check | Method and environment | Result | Evidence | Tester |
|---|---|---|---|---|---|
| 1 | Self-contained: no external scripts, styles, fonts, or images | Static analysis, `tools/validate.mjs` | passed | 0 blocking, 1 warning (file size, row 4). Two earlier findings were checker false positives, fixed in the same pull request: the screen is called "Sources & limitations", and the readings elide with "..." | Agent |
| 2 | No network requests during play | Static analysis for network APIs and remote URLs | passed | No fetch, XHR, WebSocket, EventSource, or remote resource. Archive links are ordinary anchors the player may follow online | Agent |
| 3 | Runs from disk | Opened as a `file://` URL in Chrome 141 | passed | `performance.getEntriesByType('resource')` returned an empty list; title, language, and the intro screen's eight controls rendered | Agent |
| 4 | File size | `tools/validate.mjs` | passed with a warning | 4.8 MB, from eight embedded JPEG crops. Under the 10 MB limit, over the 3 MB comfort line. Slow on a lecture-hall network with thirty simultaneous downloads | Agent |
| 5 | No AI model or API key dependency | Static analysis and source read | passed | No provider endpoint, SDK, or key present | Agent |
| 6 | Sources screen present and reachable | Intro screen controls read in the browser | passed | "Sources & limitations" button on the intro; "Provenance & limitations" in the play interface | Agent |
| 7 | Browser storage guarded | Static analysis | passed | Storage use is wrapped; the game also exports a JSON checkpoint as its backup | Agent |
| 8 | Full regression suite: play path, chronology, checks, 3/4/5-story layouts, qualification, reload, exports, affirm/replace branches, invalid saves, canceled restart, responsive widths at 390, 768, and 1440 px, offline runtime | `tests/test_game.py` from the source project, Playwright with headless Chromium, re-run 2026-09-14 | passed | Two PASS lines, exit 0. This is an automated play-through, not a person | Agent |
| 9 | Keyboard-only play-through with dialog focus restoration | `tests/test_keyboard.py` from the source project, re-run 2026-09-14 | passed | PASS line, exit 0. Uses Tab, Enter, Escape, native select type-ahead, and typed text. No person has played it by keyboard | Agent |
| 10 | No console errors | Recorded by the Playwright suite during its play paths | passed | Suite asserts no console errors and no external requests | Agent |
| 11 | Full session fits the stated 60 minutes | — | **untested** | The teacher guide plans sixty minutes and offers forty- and ninety-minute variants. No class has been timed | — |
| 12 | Debrief delivered | Playwright suite reaches the debrief screen; teacher guide read | passed | Descriptive indicators and an exportable record on the ending screen; six discussion questions and a feedback rubric in the guide | Agent |
| 13 | Screen-reader play-through | — | **untested** | No screen reader was run. The original QA report says the same | — |
| 14 | Opens on the instructor's classroom computer and LMS | — | **untested** | Cannot be run from here. The guide asks for a rehearsal on the exact classroom browser and warns against LMS preview frames | — |
| 15 | Historical accuracy of readings against the newspaper pages | Audit of 2026-09-07 against the eight embedded crops (see the audit in `history-bible.md`) | **partly checked; recorded as untested** | Eight of eighteen readings plus the reveal were checked against the crops and five figures corrected. The remaining readings are labelled in the game as not independently checked. Nobody has read the Sources screen against the Library of Congress pages since | — |
| 16 | Print view and checkpoint import | Playwright suite | passed | Print preparation and JSON round-trip asserted by the suite. No physical printer or PDF pagination checked | Agent |

## What the original QA report of 2026-09-07 adds

The source project's report records the same two suites passing on that date, visual review of
screenshots at desktop and mobile widths, and these limits, which still stand: no real iOS or
Android device, no Safari or Firefox, no specific screen reader, no LMS, no projector, and no
student pilot.

## Notes

Rows 11, 13, 14, and 15 are the ones that matter to anyone adopting this game. Rows 8 and 9 are
strong evidence that the file works, but an automated browser is not a student, and a passing
keyboard script is not a screen-reader session.

Row 15 is the honest position on a game built from real sources. The history bible names each
checked reading. If you will quote a reading in class as the newspaper's wording, check it
against the linked page first.

Re-run rows 1–10 after any edit to `game.html`. Editing the `GAME_DATA` block changes the answer
material and the audit trail in `history-bible.md`, which must be updated to match.
