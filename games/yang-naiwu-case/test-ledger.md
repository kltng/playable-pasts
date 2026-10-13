# Test ledger — The Yang Naiwu Case (楊乃武案)

**What was tested:** the hosted web game at https://kltng.github.io/yuhang-case-web/ and the
source project it is built from. The game is a Godot 4 web export: about 49 MB of files
(mostly a 39.5 MB engine file), loaded over the internet. It is not a single HTML file.

**Where this comes from.** Every row below is copied from the source project's records,
mainly its work journal (`docs/multi_agent/JOURNAL.md`, cited by line) and its test code. The
source project is private. The gallery agent who wrote this ledger on 2026-10-13 did not play
the game. Its only own checks are row 13 and the file comparison in the notes.

**Statuses:** **passed** (the check was run and passed), **untested** (not run — this is not a
pass), **failed**.

**Testers:** *Agent* means an AI agent drove a real browser. *Script* means an automated test
ran with no one watching. *Person* means a human did it. No row in this ledger was done by a
person.

## The gallery's automated checker cannot run on this game

The gallery's checker (`tools/validate.mjs` and the Check page) reads one self-contained HTML
file. This game is a set of files on another website, so the checker has nothing to read. **No
gallery check has been run on it**, and none of its findings apply. In particular, the
checker's rules on "no network" and "works offline" would block this game: it needs the
network by design.

## What was tested

| # | Check | Method and environment | Result | Evidence | Tester |
|---|---|---|---|---|---|
| 1 | Full build and test suite | The project's `tools/ci.sh`: content validation, quotation check against the downloaded sources, font check, 642 Python tests and 1,829 Godot engine tests | passed, 2026-10-10 | JOURNAL.md line 342 | Script |
| 2 | Every quotation matches its source exactly | Part of row 1. The build refuses a quotation that is not found, unchanged, in the downloaded source file, and checks each file's sha256 | passed, 2026-10-10 | JOURNAL.md lines 73–77 (the rule), 342 (the run) | Script |
| 3 | Whole of chapter 4 by keyboard only | Godot test `test_whole_chapter_by_keyboard` (`game/tests/test_views_m1.gd` line 970): Tab and Enter only, from the content note to the downloads at the end; checks after every key that the focused control is fully visible; at 1280×800 and at 1024×640 with 200% text | passed, as part of row 1 | test file line 970; JOURNAL.md line 342 | Script |
| 4 | Early web build by keyboard only | Playwright with Chrome, keyboard only: title, chapter, reader, source labels, language switch, reload | passed, with problems found and later fixed (missing characters) | JOURNAL.md lines 129–135, 147 | Agent, 2026-09-25 |
| 5 | Chapter 4, start to end, in a browser | Playwright with a fresh browser profile, reloading before every step; three passes, each finding problems that were then fixed | passed on the third pass | JOURNAL.md lines 170–175, 180–188, 194–200 | Agent, 2026-09-25 |
| 6 | Chapter 4, later additions | Same method, new steps only | passed (one cosmetic problem noted) | JOURNAL.md line 241 | Agent, 2026-09-25 or 26 |
| 7 | Chapter 1, all steps | Same method, with "Skip descriptions" on | passed (two cosmetic problems noted) | JOURNAL.md line 259 | Agent, 2026-09-25 or 26 |
| 8 | Chapter 3 in full; chapter 2 start | Same method | passed for what was played | JOURNAL.md lines 278, 286 | Agent, 2026-09-25 or 26 |
| 9 | Epilogue | Same method. It found that a label on the answer buttons gave the answer away; this was removed | passed after the fix | JOURNAL.md lines 292, 297 | Agent, 2026-09-25 or 26 |
| 10 | The public site loads | Playwright from a clean browser cache, after each publish: page loads, fonts show, a chapter opens, no console errors. Downloads measured: 14.4 MB, 15.3 MB, then 17.7 MB once the pictures were added | passed each time | JOURNAL.md lines 209–215, 300–305, 316–322 | Agent, 2026-09-25 and 2026-09-26 |
| 11 | Text size on high-resolution screens; language switch | Browser check at 1440×900 at 2× scaling and 1920×1080: body text about 22–27 CSS pixels; the 中文/English switch and the single language control change the whole screen | passed | JOURNAL.md lines 323–327 | Agent, 2026-09-26 or 27 |
| 12 | Current public build | Live check after the last publish, at 1440×900 at 2× scaling: large text, language switch works | passed | JOURNAL.md line 329 | Agent, 2026-09-27 |
| 13 | The site is still up | The gallery agent requested the page | passed: the server answered (HTTP 200); the page was last changed on 2026-09-27 | — | Agent, 2026-10-13 (no play, no browser) |

Code and design reviews by a second AI (Codex) approved each part of the game before it was
accepted (JOURNAL.md lines 201, 244, 263, 280, 294, 315). An AI agent (GLM) checked the
history of each chapter. These are reviews, not play tests, so they are not rows above.

## What was not tested

| # | Check | Result | Why |
|---|---|---|---|
| 14 | Works offline | **failed** | It is a hosted web game and needs the internet to load. Nobody tried to make it work offline. |
| 15 | A whole play-through, all six chapters, in one sitting | **untested** | The browser passes above covered chapters one at a time. Chapter 2 was only started in a browser (line 286). The prologue was only seen to open (line 304). |
| 16 | Timing: the session fits 90 minutes | **untested** | The design plans 65 minutes of play plus about 30 for briefing and discussion, "to be adjusted after a trial" (`docs/design/GAME_DESIGN.md` lines 81–91). Nobody has timed it. |
| 17 | Student trial | **untested** | The design's acceptance for the last stage includes a student trial for the owner to arrange (GAME_DESIGN.md lines 290, 307; JOURNAL.md line 294: "accepted except the student trial"). No trial is recorded. |
| 18 | Keyboard play of chapters other than 4, and any keyboard play by a person | **untested** | Only chapter 4 has a whole-chapter keyboard test (row 3), and it runs in the engine, not in a browser. |
| 19 | Screen reader | **untested** | The design said to test Godot's web screen-reader support early (GAME_DESIGN.md line 249) and left the fallback to the owner (line 304). No result is recorded. |
| 20 | Browsers other than Chrome | **untested** | Every recorded browser test used Chrome. No Safari, Firefox or Edge test is recorded. |
| 21 | Tablets | **untested** | The design supports tablets held sideways (GAME_DESIGN.md line 26). No tablet test is recorded. Phones are not supported. |
| 22 | Classroom computer, projector, LMS, or thirty students at once | **untested** | Nothing recorded. |
| 23 | Historical accuracy, checked by a person | **untested** | A script checks quotations (row 2) and an AI agent checked each chapter's history. No historian has reviewed it. 10 of 32 historical statements and all English translations are still marked "draft" in the project, and its release check fails on these sign-offs (JOURNAL.md lines 342–344). See `history-bible.md`. |

## Notes

**The live site is older than the source project.** The public build is from 2026-09-27. On
2026-10-10 the owner approved all 33 pictures (JOURNAL.md lines 337–344), but the journal
records no publish after that. So the game's Credits and sources screen may still show the
pictures as "draft". Rows 1–3 ran on the 2026-10-10 source. The gallery agent compared the source files of the
published version (commit cb8092e) with the 2026-10-10 version: the game content differs only
in the pictures' approval status (draft → approved).

**A person did use the game, but not as a test.** The owner reported that the text was too
small, that switching language mid-game left some parts unchanged, and that a decoration
covered text (JOURNAL.md lines 323, 326, 328). Each report was fixed. These show the owner
opened the game; they are not a recorded play test, so no check above is marked as done by a
person.

**Approving the art is not a play test.** The owner's approval on 2026-10-10 was of the
pictures only.

**Re-run** rows 1–12 after any change to the game, and record the result here.
