# Test ledger — Many Centres, One World

**File tested:** `game.html`, 265,706 bytes, sha256 beginning `5eb6c565ab4d`, built
13 October 2026. If the file has changed since, re-run the checks below.

**Statuses:** **passed** (the check was run and it passed), **untested** (not run — this is
not a pass), **failed**.

**Testers:** *Agent* means an AI agent (Claude) drove a real browser with a script. *Script*
means an automated check ran. *Person* means a human did it. **No row in this ledger was done by
a person.**

## What was tested

| # | Check | Method and environment | Result | Tester, date |
|---|---|---|---|---|
| 1 | Gallery checker | `node tools/validate.mjs game.html` | passed: no blocking findings, no warnings | Script, 2026-10-13 |
| 2 | Plays offline from disk | Headless Chromium 1228 (Playwright), network switched off, file opened with a `file://` address; all 29 questions answered to the final map | passed: no network requests, no console errors | Agent, 2026-10-13 |
| 3 | Keyboard only | Same browser. Tab and Enter only, from the opening screen through every round to the final map; focus position recorded after every step | passed: every control was reached; after each screen change focus moved to the new heading, and after each answer to the *Next* button | Agent, 2026-10-13 |
| 4 | Survives a refresh | Reloaded the page in the middle of round 1 | passed: the same question came back, with the answer and explanation kept | Agent, 2026-10-13 |
| 5 | Map switch | Switched between the Atlantic and Pacific views during a question and on the final map | passed: pins and dots moved with the map | Agent, 2026-10-13 |
| 6 | Sources & assumptions screen | Opened from the final screen, then *Back to the game* | passed: the screen lists 59 sources and the source numbers for each place; focus returned to the final screen | Agent, 2026-10-13 |
| 7 | Phone-sized screen | 390 × 844 pixels | passed: no sideways scrolling; pins and buttons usable. Pins can sit close together at this size | Agent, 2026-10-13 |
| 8 | Dark mode | Browser set to dark colour scheme; screenshot after one answer | passed: text and marks readable | Agent, 2026-10-13 |
| 9 | Right and wrong are not shown by colour alone | Screenshots after answers | passed: ✓ and ✗ marks and the words "right" and "your pick" appear as well as colour | Agent, 2026-10-13 |
| 10 | The Elmina question is not scored | Answered it during the full play-through | passed: it says "This is Elmina Castle…" with no right/wrong mark, and the score table says it is not counted | Agent, 2026-10-13 |
| 11 | Facts spot-checked against the saved sources | Re-read five facts in the downloaded pages: Iwami 1526, Pizarro's 180 men, da Gama leaving Lisbon on 8 July 1497, the Casa de Contratación in 1503, the giraffe from Malindi | passed: all five matched | Agent, 2026-10-13 |

## What was not tested

| # | Check | Result | Why |
|---|---|---|---|
| 12 | Timing | **untested** | Nobody has timed a real play-through. The game says "about 15 minutes" for 29 questions; the listing's 25 minutes adds a briefing and debrief. |
| 13 | Classroom computer, projector, LMS | **untested** | Not tried. |
| 14 | Accuracy of all 29 answers, checked by a historian | **untested** | The agent wrote the answers from sources it read, and spot-checked only five facts (row 11). Eight items rest on Wikipedia alone (see `history-bible.md`). |
| 15 | Screen reader | **untested** | Pins and buttons have labels, but no screen reader was tried. The map image has a text description; the final map's places are also in a numbered list. |
| 16 | Browsers other than Chromium | **untested** | Safari, Firefox and Edge were not tried. |
| 17 | Touch screens | **untested** | The phone-sized check (row 7) used a mouse, not a real touch screen. |
| 18 | A person playing it | **untested** | No student or instructor has played it. Whether the rules are clear within a minute is not known. |

## Instructor's five-minute test

1. Download `game.html`, turn off the wifi, and double-click it. Answer three questions.
2. Press *Start over*, then play one question with only Tab and Enter.
3. Press *Sources & assumptions* and read the entry for one place you know well.
4. Open it once through your LMS on the classroom computer.
