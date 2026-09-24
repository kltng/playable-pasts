# Test ledger — The Influenza Front Page

Artifact: `game.html`, 2.88 MB (2,879,667 bytes), gallery revision of 2026-09-24. It is based on version 2
("Newsroom edition"), built 2026-09-07 and added to the gallery 2026-09-14, when it was identical to
the source project's `influenza-front-page-v2.html` (SHA-256 begins `eed1ea60dbd9f6f0`). The
2026-09-24 revision recompressed the images and changed some text, so it is **no longer identical**
to that file. Rows 1–16 were run on the earlier file; see "Re-check after the 2026-09-24 changes".

Statuses: **passed** (the check was run and it passed), **untested** (not run — not a pass),
**not applicable** (with a reason).

The rows below record two kinds of test: the game's own Playwright suites, written for the source
project and **re-run on 2026-09-14** by the gallery agent against the earlier 4.8 MB file; and checks the
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
| 8 | Full regression suite: play path, chronology, checks, 3/4/5-story layouts, qualification, reload, exports, affirm/replace branches, invalid saves, canceled restart, responsive widths at 390, 768, and 1440 px, offline runtime | `tests/test_game.py` from the source project, Playwright with headless Chromium, re-run 2026-09-14 | passed | Two PASS lines, exit 0. This is an automated play-through, not a person. **Note (2026-09-24):** this suite is not included in this repository, so this result cannot be reproduced from here. It was run on the earlier file, not the recompressed one | Agent |
| 9 | Keyboard-only play-through with dialog focus restoration | `tests/test_keyboard.py` from the source project, re-run 2026-09-14 | passed | PASS line, exit 0. Uses Tab, Enter, Escape, native select type-ahead, and typed text. No person has played it by keyboard. **Note (2026-09-24):** this suite is not included in this repository, so this result cannot be reproduced from here. It was run on the earlier file, not the recompressed one | Agent |
| 10 | No console errors | Recorded by the Playwright suite during its play paths | passed | Suite asserts no console errors and no external requests. **Note (2026-09-24):** this suite is not included in this repository, so this result cannot be reproduced from here. It was run on the earlier file, not the recompressed one | Agent |
| 11 | Full session fits the stated 60 minutes | — | **untested** | The teacher guide plans sixty minutes and offers forty- and ninety-minute variants. No class has been timed | — |
| 12 | Debrief delivered | Playwright suite reaches the debrief screen; teacher guide read | passed | Descriptive indicators and an exportable record on the ending screen; six discussion questions and a feedback rubric in the guide | Agent |
| 13 | Screen-reader play-through | — | **untested** | No screen reader was run. The original QA report says the same | — |
| 14 | Opens on the instructor's classroom computer and LMS | — | **untested** | Cannot be run from here. The guide asks for a rehearsal on the exact classroom browser and warns against LMS preview frames | — |
| 15 | Historical accuracy of readings against the newspaper pages | Audit of 2026-09-07 against the eight embedded crops (see the audit in `history-bible.md`) | **partly checked; recorded as untested** | Eight of eighteen readings plus the reveal were checked against the crops and five figures corrected. The remaining readings are labelled in the game as not independently checked. Nobody has read the Sources screen against the Library of Congress pages since | — |
| 16 | Print view and checkpoint import | Playwright suite | passed | Print preparation and JSON round-trip asserted by the suite. No physical printer or PDF pagination checked. **Note (2026-09-24):** this suite is not included in this repository, so this result cannot be reproduced from here. It was run on the earlier file, not the recompressed one | Agent |

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

## Re-check after the 2026-09-24 changes

What changed:

- **File size, 5.06 MB to 2.88 MB.** 97% of the file was the eight embedded grayscale JPEG crops.
  Each was scaled to 80% of its pixel size (900 to 720 pixels wide; the October 12 crop 1100 to
  880) with Lanczos resampling, and saved again as progressive JPEG, quality 60, using Pillow.
  Progressive JPEG was chosen over WebP because every browser, including old ones on school
  machines, can show it. Nothing else in the data block changed byte for byte except the edits
  listed here (checked by diffing the file with the image data removed). Alt text is unchanged.
- **NEWS-003** no longer shows the October 3 crop, because its Water Bureau passage is not in
  that crop. Its `scanId` is now `null`; the game's existing code then shows "No image is
  embedded for this item."
- **Model recall labelled** in three context notes (NEWS-009, NEWS-014, NEWS-015), with matching
  rows C-026 to C-028 in the history bible (C-029 covers a first name used in the bible).
- **In-game stage times** now match the teacher guide's sixty-minute plan: 8, 10, 15, 7, 12
  minutes after about 8 minutes of setup (they were 7, 10, 18, 8, 10).
- **Sources screen** pointed to a `HISTORY-AUDIT.md` that is not in the folder; it now points to
  the history bible.
- **Teacher guide**: the editing section now matches the gallery folder (edit `GAME_DATA` in
  `game.html`; the build script is not included); the keyboard playthrough is described as an
  automated script; the two sets of debrief questions (five in the game, six in the guide) are
  explained; a licence section says CC BY 4.0 covers the game layer and the newspaper crops are
  public domain. `game.json` licence and rights fields say the same.

| # | Check | Method and environment | Result | Evidence | Tester |
|---|---|---|---|---|---|
| R1 | Validator | `node tools/validate.mjs`, run against both the committed validator and the working copy | passed | 0 blocking, 0 warnings; reported size 2.7 MB (the validator counts 1 MB as 1,048,576 bytes), so the file-size warning is gone. (One run of the working-copy validator, while another agent was editing it, reported an internal "stripJsComments is not defined" error for every game; a later run was clean) | Agent |
| R2 | Small print still legible after recompression | The agent cut the same regions from the original and the new October 10 and October 12 crops, scaled the new crop up to the original's size, and looked at them side by side, enlarged 2x | passed (agent view only) | October 10: "3357", "4013", "656", "514", "363", "151" readable in both. October 12: "3234", "1697", "938", "1191" readable in both. The new images are slightly softer; a version at 75% size and quality 65 was also made and looked blurrier, so it was not used. Only these two crops were compared | Agent |
| R3 | Legibility for people, on a projector or a classroom screen | — | **untested** | No person has looked at the recompressed crops, and the other six crops were not compared | — |
| R4 | All eight images decode and display | Chrome via DevTools over `http://localhost`: decoded each `data:` URI with `Image.decode()`; opened NEWS-001's reading layer and took a screenshot | passed | All eight decoded (720 × 2016 up to 720 × 2346; October 12 880 × 758). The October 3 crop showed in NEWS-001's dossier, readable headline and body | Agent |
| R5 | NEWS-003 without an image | Same browser: pulled NEWS-003, advanced to stage 2, bought its reading check | passed | No `<img>` in the dossier; the notice "No image is embedded for this item…" shown. The same was seen over `file://` | Agent |
| R6 | In-game stage times | Opened "How to play" with the keyboard | passed | 8, 10, 15, 7, 12 minutes and the new line about the sixty-minute lesson | Agent |
| R7 | Keyboard path through one stage | Tab, Enter, and Escape only: opened and closed "How to play", entered the newsroom, tabbed to NEWS-003 and pulled it | passed | Focus returned to "How to play" after Escape, moved to the stage heading after entering, and to the dossier's Close button when it opened; Escape returned focus to the card's "Open dossier" button. The rest of stage 1 and stage 2 was driven by scripted clicks, not keys | Agent |
| R8 | Restart in the standalone file | Opened as `file://` in Chrome; played into stage 2, then Save & export → "Start a new session", confirm accepted | passed | Returned to the intro with focus on "Enter the newsroom"; the same was seen over `http://`, where saved state went back to stage 0 | Agent |
| R9 | No network requests | `performance.getEntriesByType('resource')` over `file://` | passed | Empty list; no console messages over `http://` | Agent |
| R10 | Full play-through, reveal, debrief, exports, print on the new file | — | **untested** | Stages 3 to 5 were not played on the recompressed file | — |

