# Test ledger — Courtroom Reversal (逆轉公堂)

**What was tested.** The historical bilingual pilot on the `codex/historical-bilingual-pilot`
branch of the `yzgt-codex` repository, last commit `2446d64` (9 October 2026, "Expand
historical campaign to three bilingual chapters with checkpoints"). The game is a small static
site: `index.html` plus an `assets` folder (scripts, stylesheet, art, and the source
transcription), about 12 MB in all, most of it art.

**Where it lives.** This is a hosted listing. The gallery links to the game's own website and
does not store the game. It is published at https://kltng.github.io/yzgt-codex/ from the
`codex/historical-bilingual-pilot` branch (commit `2446d64`), since 13 October 2026. Only row 12
was run against the live copy.

Statuses: **passed** (the check was run and it passed), **untested** (not run — not a pass),
**failed** (the check does not hold for this listing).

| # | Check | Method and environment | Result | Evidence | Tester |
|---|---|---|---|---|---|
| 1 | Content: every text has both languages; every quotation is in the source; source hash; chapter structure; no missing files; no analytics script | `node tests/content.test.cjs` in the source repository, Node v24.7.0, macOS, re-run 2026-10-13 | passed | Output: `PASS: 289 bilingual pairs, 12 verbatim source excerpts, three chapter graphs, provenance hash, local assets.` Exit code 0. The test only reads files | Agent (re-ran the project's script) |
| 2 | Built copy matches the source | `diff -rq` between `dist/yzgt-historical-pilot/` and the source's `index.html` and `assets/`, 2026-10-13 | passed | No differences. The built copy (made 2026-10-09) is the same as the current source. `dist/` is not kept in git | Agent |
| 3 | Full browser play-through in both languages: three chapters and the closing choices; wrong evidence, failure at zero standing, chapter replay; save, reload and resume; broken and blocked storage; source dialog and local source page; language switching mid-dialogue; sound toggle; phone (390 px), tablet (820 px) and 320 px widths; the packaged copy under a sub-folder; a full offline play-through from disk; no page errors or failed requests | `tests/playthrough.py`, Playwright 1.63.0 with headless Chromium | passed on 2026-10-09 (not re-run) | A local log, `tmp/browser-tests.log` (dated 2026-10-09 23:27), ends with the test's PASS line. `tmp/` is ignored by git, so this log is not in the repository's history and does not say who ran it. 29 screenshots from the run are in `tmp/qa/`; they were not reviewed for this ledger. The agent did not re-run the test: it needs Playwright installed, and it rebuilds `dist/` and writes screenshots inside the source repository, which the agent was told not to change | Automated script |
| 4 | Runs offline | Same script: the browser is set offline and the packaged `index.html` is opened from disk, then all three chapters and the closing choice are played (`tests/playthrough.py`, lines 286–302) | passed on 2026-10-09 for the **files**; **failed** for this **listing** | The listing links to a website, so students need the internet. A person has not tried the folder offline | Automated script |
| 5 | Gallery checker (`tools/validate.mjs`) | — | **not run** | The gallery's checker reads one HTML file. It cannot check a game on another website. This game is also a folder, not a single file: its `index.html` loads `assets/pilot.js` and other files next to it. As a single-file gallery entry it would not meet requirement 1 in `agent.md`; that is one reason it is listed as hosted | — |
| 6 | Keyboard-only play | — | **untested** | All controls are native buttons and selects, with a visible focus outline in `assets/pilot.css` (line 55). The browser test clicks with a mouse and only presses Escape to close dialogs. Nobody has played it by keyboard | — |
| 7 | Screen reader | — | **untested** | No screen reader was run. The character art is hidden from screen readers (`aria-hidden`) and the dialogue area is a live region, but nobody has listened to it | — |
| 8 | Full session fits 45 minutes | — | **untested** | The game says "About 20–30 minutes" (`assets/campaign-content.js`, line 17). That is the author's estimate. Nobody has timed a play-through or a class | — |
| 9 | Opens on the classroom computer, projector, and LMS | — | **untested** | Not possible before the game is published. Only headless Chromium has run it; not Safari, Firefox, or a real phone or tablet | — |
| 10 | Historical accuracy of explanations and translations | — | **untested** | Row 1 shows the Chinese quotations match the local transcription. Nobody has checked the English translations or the Traditional Chinese explanations against the memorial, or the transcription against an archival copy | — |
| 11 | Debrief questions | Teacher guide read | **untested** | The game has no debrief questions. The teacher guide has six suggested questions drafted by an agent from the game's content. No instructor has reviewed or used them | — |
| 12 | The hosted website loads | Headless Chromium (Playwright), 1280×800, opened `?lang=en`, clicked "Start new case" | **passed** | The page loaded in English, the first chapter opened with its first line of dialogue, and every request went to kltng.github.io. One error: the site has no `favicon.ico` (404), which does not affect play | Agent, 2026-10-13 |
| 13 | The hosted website, played | — | **untested** | Nobody has played a whole chapter on the live copy, or checked that the Sources & glossary links work there | — |

## How to re-run the tests

In the source repository (`https://github.com/kltng/yzgt-codex`, branch
`codex/historical-bilingual-pilot`):

```sh
node tests/content.test.cjs
```

This needs only Node. It reads files and changes nothing.

The browser test needs Playwright. The source README gives these steps:

```sh
python3 -m venv .venv
.venv/bin/pip install -r tests/requirements.txt
.venv/bin/python -m playwright install chromium
.venv/bin/python tests/playthrough.py
```

It rebuilds `dist/`, writes screenshots to `tmp/qa/`, and prints a PASS line at the end.

## Notes

Rows 6 to 12 are the ones that matter to an instructor. Row 3 is strong evidence that the game
works in Chromium, but an automated browser is not a student, a keyboard user, or a classroom.

After the game is published, replace the placeholder `hosted_url` in `game.json`, open the real
address once, and add a row here with the date and what was seen. If the game changes after
commit `2446d64`, this ledger no longer describes it: re-run row 1 and, if you can, row 3.
