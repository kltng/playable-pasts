# Playable Pasts — contract for agents

You are reading this because an instructor asked you to check or submit a classroom history
game. This file is the whole contract. It is stable, plain text, and needs no tools beyond the
ones you already have.

**Site:** https://kltng.github.io/playable-pasts
**Repository:** https://github.com/kltng/playable-pasts
**The workflow that builds these games:** https://gist.github.com/kltng/2a2b26a8817540531f3191412c308276

The instructor is not a programmer. Do not hand them git commands, JSON to edit, or a terminal.
Do the mechanical work yourself, and bring them decisions, not tasks.

---

## 1. What the gallery accepts

One folder per game. You supply these five files:

| File | Contents |
|---|---|
| `game.html` | The game. One self-contained HTML file. |
| `game.json` | The listing manifest. Schema in §4. |
| `teacher-guide.md` | Running one session, the debrief questions, how to edit the content. |
| `history-bible.md` | Source inventory and the claims ledger. |
| `test-ledger.md` | Every check, its method, its result, and who ran it. |

The folder name must equal `game.json`'s `slug`: lowercase letters, numbers, and hyphens, no
spaces.

The build tool (`node tools/build-index.mjs`, see §6) adds a sixth file, `index.html`, which is
the game's page in the gallery. It also writes a `validation` record into `game.json`. Do not
write either of those by hand. The five files must sit directly in the folder, and `game.html`
must not load any other file from it (see requirement 1).

## 2. Requirements for `game.html`

The checker tests these where a machine can, and each finding has one of two strengths:

- **Blocks submission.** The game will not work in a classroom as it is. A pull request with a
  blocking finding is not merged.
- **Flagged as a warning.** The game runs, but students will have a worse time. Fix it if you
  can; it does not stop the submission on its own.

Some parts cannot be checked by reading a file at all. Those are listed as **not checked** below
and belong to the six checks a person must run (§4, `human_tests`). Do not tell the instructor
they passed because the checker did not complain.

These are numbered as *requirements* so they are not confused with the numbered hard rules in
the Playable Past workflow itself.

**Requirement 1. Self-contained.** No external script, stylesheet, font, image, or media. Inline
everything; use inline SVG, emoji, or `data:` URIs for art.
- Blocks: a script, stylesheet, image, media file, or CSS font loaded from the internet.
- Blocks: the page loading another file next to it, such as `game.js`, `style.css`, or
  `map.png`. Students are given only `game.html`, so those files will be missing in class.
- Blocks: a `<meta http-equiv="refresh">` redirect or a `<base href>` pointing at a website.
- Warning: the page asks the browser to contact another site ahead of time (preload,
  prefetch, preconnect).
- Not checked: whether it really works offline. That is `manual-offline`.

**Requirement 2. No network during play.** No `fetch`, `XMLHttpRequest`, `WebSocket`,
`EventSource`, `sendBeacon`, or remote `import()`.
- Blocks: any of these in the game's code.

**Requirement 3. No model dependency.** No provider endpoint, SDK, or host-injected AI global.
The game must run forever with no account and no key.
- Blocks: any call to an AI service or reliance on one.

**Requirement 4. No secrets.** An API key in the file is an immediate rejection. If you find one,
tell the instructor to revoke it.
- Blocks: anything that looks like a secret key.

**Requirement 5. A "Sources & assumptions" screen**, reachable during play, listing sources and
marking what is attested, interpreted, assumed, invented, or counterfactual.
- Blocks: no such screen.
- Warning: nothing in the game is labelled as invented or assumed.
- Not checked: whether what the screen says is true. That is `manual-provenance-accuracy`.

**Requirement 6. A complete document.** `<!DOCTYPE html>` through `</html>`, no placeholders, no
ellipses, no "rest of the code here". Under 3 MB.
- Blocks: the file is not a complete HTML page, or it is over 10 MB.
- Warning: text that looks like a placeholder, or a file over 3 MB.

**Requirement 7. UTF-8 declared**, `lang` set to the classroom language, a viewport meta tag,
and a `<title>`.
- Blocks: no UTF-8 declaration in a file that contains any character beyond plain ASCII, such
  as curly quotes, dashes, accents, or another script (they can turn to gibberish on some
  machines).
- Warning: no UTF-8 declaration in a plain-English file, no `lang`, no viewport, or no title.

**Requirement 8. Real controls.** `<button>`, not clickable `<div>`. Everything reachable by
keyboard, with visible focus.
- Warning: clickable elements that are not real controls, play that happens only on a canvas,
  images with no text alternative, animation that ignores the reduced-motion setting, and audio
  or video that starts on its own.
- Not checked: whether focus is visible, and whether the whole game can really be played by
  keyboard. That is `manual-keyboard`.

**Requirement 9. A restart control**, and browser storage (if used at all) wrapped in
`try/catch`.
- Warning: no way to start over, or storage used without `try/catch`.

**Requirement 10. Content in one marked data block** near the top, with a comment telling the
instructor how to edit it.
- Warning: no marked content block.

Also flagged as a warning: a `debugger` statement left in the code.

**If the checker itself fails** partway through a file, that blocks too. The area it could not
finish counts as unchecked, and unchecked is not a pass. Report the file as a checker bug.

## 3. Run the validator before you submit

Do not submit and hope. The same checker the website runs is a plain ES module with no
dependencies.

```
git clone https://github.com/kltng/playable-pasts
cd playable-pasts
node tools/validate.mjs path/to/game.html            # human-readable
node tools/validate.mjs path/to/game.html --json     # machine-readable
node tools/validate.mjs path/to/game.html --markdown # for a PR comment
```

Exit status is `0` when nothing is blocking, `1` when something is, and `2` when a file could
not be read or the command was wrong.

The JSON has `blocking`, `warnings`, and `manual` arrays. Each finding carries `id`, `title`,
`plain` (an explanation written for the instructor), `fix` (what to change), and `evidence`
with line numbers.

If you cannot run Node, the instructor can drop the file on https://kltng.github.io/playable-pasts/check/ and
paste you the report. Do not guess at the result.

## 4. `game.json`

```json
{
  "slug": "silk-road-tolls",
  "title": "The Toll at Kashgar",
  "subtitle": "A caravan budgeting game",
  "emoji": "🐫",
  "summary": "One or two sentences. What students do, and what it makes them argue about.",
  "learning_mode": "Economics & scarcity",
  "game_form": "Resource allocation",
  "period": "c. 1300–1400",
  "region": "Central Asia",
  "language": "en",
  "level": "Upper-level undergraduate",
  "session_minutes": 50,
  "social_topology": "Pairs on one device",
  "players_per_instance": 2,
  "contributor": "A. Instructor, Somewhere University",
  "contributed_at": "2026-09-10",
  "license": "CC BY 4.0",
  "sources_rights": "Sources are public domain; the dataset is the instructor's own.",
  "files": {
    "game": "game.html",
    "teacher_guide": "teacher-guide.md",
    "history_bible": "history-bible.md",
    "test_ledger": "test-ledger.md"
  },
  "human_tests": [
    { "id": "manual-offline", "status": "passed", "tested_by": "person", "note": "Opened from disk with wifi off." },
    { "id": "manual-keyboard", "status": "untested", "note": "No browser available to the agent." }
  ],
  "provenance_note": "One paragraph. Where the content came from, and what was invented.",
  "tags": ["trade", "economy", "50 minutes"]
}
```

**Required.** The build refuses the whole gallery, and writes nothing, if any of these is
missing or wrong:

- `slug`: the folder name, lowercase letters, numbers, and hyphens.
- `title` and `summary`: non-empty text.
- `session_minutes`: a number, like `50` — not `"50"` and not `"50 minutes"`.
- `files`: an object with `game`, `teacher_guide`, `history_bible`, and `test_ledger`, each a
  plain file name in the game's own folder.

**Optional.** Every other field above. If given, text fields must be text and `tags` must be a
list of text. `learning_mode` should be one of the ten in `3-design.md` of the workflow.

`validation` is written by the build tool — do not fill it in yourself. A game with no
`validation` record is shown in the gallery as *not checked yet*, never as passing.

**`human_tests`** takes the six manual check IDs: `manual-offline`, `manual-keyboard`,
`manual-timing`, `manual-classroom-setup`, `manual-provenance-accuracy`, `manual-debrief`.
Report each at most once. An unknown ID or status stops the build.

- `status`: `passed`, `untested`, `failed`, or `not-applicable`.
- `note`: what was done and what was seen, in plain words.
- `tested_by` (optional): who ran the check — `person`, `agent`, or `automated script`. The
  gallery shows "Tested by a person", "Tested by an agent", or "Tested by a script". Without it,
  a passed check shows as "Tested (tester not stated)". Say `agent` if you, the agent, drove a
  browser yourself; say `automated script` if a test suite did it. Only say `person` if a person
  actually did it.

The gallery always shows all six checks. Any you leave out are shown as untested.

## 5. The honesty rules

These are the ones that get a submission refused, and they are not negotiable.

**Never record a check as passed unless you ran it.** If you have no browser, you did not test
keyboard operation, offline behaviour, or timing — mark them `untested` and say why in the
note. "Untested" is a perfectly good submission. A false "passed" is not.

**Never invent provenance.** No fabricated quotation, citation, page number, date, or archival
reference. Anything from your own background knowledge rather than the instructor's material is
*model recall*: label it as such in the history bible and have the instructor verify it before
it drives a mechanic or appears as fact.

**Invented content must be labelled.** Invented documents are welcome; unlabelled ones are not.

**Rights are the instructor's to state.** Ask; do not assume. Restricted source material informs
the analysis but stays out of the published file.

**Do not submit without showing the instructor.** Show them `game.json`, the licence line, and
the rights line, and wait for a yes. They are publishing under their own name.

## 6. How to submit

**If you can use `git` and `gh`:** fork, create `games/<slug>/` with the five files, run
`node tools/build-index.mjs` (it regenerates `games/index.json`, the game's `index.html`, and
the `validation` record in its `game.json`; if a manifest is wrong it writes nothing and says
why), commit,
and open a pull request. Title it `Add game: <title>`. In the body, paste the validator's
`--markdown` output and state plainly which human checks were run and which were not.

**If you cannot:** open an issue using the `submit-game` template at
https://github.com/kltng/playable-pasts/issues/new?template=submit-game.yml and attach the five files. A maintainer runs the
checker and moves it in. Opening an issue does not run the checker by itself, so run it
yourself first (§3) and paste the result into the issue.

**For pull requests:** CI runs the validator on every game and posts the report as a comment
on the pull request. The same report is in the job log. If it blocks, fix and push again — do
not argue with the report. If you think a finding is wrong, say so in the pull request with
your reasoning; the validator has bugs like anything else.

## 7. Checking an existing game for an instructor

To adapt a gallery game rather than submit a new one: download the folder, keep the same rules,
and update `history-bible.md` and `test-ledger.md` to match your changes. A test ledger that
still describes the original file is worse than no ledger.

Re-run the validator after every edit to `game.html`. Editing only the text inside the content
data block cannot break the structural checks, but it can break the timing.
