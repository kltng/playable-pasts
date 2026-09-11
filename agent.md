# Playable Pasts — contract for agents

You are reading this because an instructor asked you to check or submit a classroom history
game. This file is the whole contract. It is stable, plain text, and needs no tools beyond the
ones you already have.

**Site:** https://playablepasts.org
**Repository:** https://github.com/kltng/playable-pasts
**The workflow that builds these games:** https://gist.github.com/kltng/2a2b26a8817540531f3191412c308276

The instructor is not a programmer. Do not hand them git commands, JSON to edit, or a terminal.
Do the mechanical work yourself, and bring them decisions, not tasks.

---

## 1. What the gallery accepts

One folder per game, containing exactly these five files:

| File | Contents |
|---|---|
| `game.html` | The game. One self-contained HTML file. |
| `game.json` | The listing manifest. Schema in §4. |
| `teacher-guide.md` | Running one session, the debrief questions, how to edit the content. |
| `history-bible.md` | Source inventory and the claims ledger. |
| `test-ledger.md` | Every check, its method, its result, and who ran it. |

The folder name must equal `game.json`'s `slug`: lowercase, hyphens, no spaces.

## 2. Hard requirements for `game.html`

These are enforced automatically. A submission failing any of them is rejected before a human
looks at it.

1. **Self-contained.** No external script, stylesheet, font, image, or media. Inline everything;
   use inline SVG, emoji, or `data:` URIs for art.
2. **No network during play.** No `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`,
   `sendBeacon`, or remote `import()`.
3. **No model dependency.** No provider endpoint, SDK, or host-injected AI global. The game must
   run forever with no account and no key.
4. **No secrets.** An API key in the file is an immediate rejection. If you find one, tell the
   instructor to revoke it.
5. **A "Sources & assumptions" screen**, reachable during play, listing sources and marking what
   is attested, interpreted, assumed, invented, or counterfactual.
6. **A complete document.** `<!DOCTYPE html>` through `</html>`, no placeholders, no ellipses,
   no "rest of the code here".
7. **UTF-8 declared**, `lang` set to the classroom language, a viewport meta tag, and a
   `<title>`.
8. **Real controls.** `<button>`, not clickable `<div>`. Everything reachable by keyboard with
   visible focus.
9. **A restart control**, and browser storage (if used at all) wrapped in `try/catch`.
10. **Content in one marked data block** near the top, with a comment telling the instructor how
    to edit it.

Under 3 MB. Anything over 10 MB is rejected.

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

Exit status is `0` when nothing is blocking and `1` when something is.

The JSON has `blocking`, `warnings`, and `manual` arrays. Each finding carries `id`, `title`,
`plain` (an explanation written for the instructor), `fix` (what to change), and `evidence`
with line numbers.

If you cannot run Node, the instructor can drop the file on https://playablepasts.org/check/ and
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
    { "id": "manual-offline", "status": "passed", "note": "Opened from disk with wifi off." },
    { "id": "manual-keyboard", "status": "untested", "note": "No browser available to the agent." }
  ],
  "provenance_note": "One paragraph. Where the content came from, and what was invented.",
  "tags": ["trade", "economy", "50 minutes"]
}
```

`learning_mode` should be one of the ten in `3-design.md` of the workflow. `validation` is
written by the build tool — do not fill it in yourself.

`human_tests` takes the six manual check IDs: `manual-offline`, `manual-keyboard`,
`manual-timing`, `manual-classroom-setup`, `manual-provenance-accuracy`, `manual-debrief`.
Status is `passed`, `untested`, `failed`, or `not-applicable`.

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
`node tools/build-index.mjs` (it regenerates `games/index.json` and the game's page), commit,
and open a pull request. Title it `Add game: <title>`. In the body, paste the validator's
`--markdown` output and state plainly which human checks were run and which were not.

**If you cannot:** open an issue using the `submit-game` template at
https://github.com/kltng/playable-pasts/issues/new?template=submit-game.yml and attach the five files. A maintainer moves it in.

**Either way:** CI runs the validator on the submitted file and posts the report. If it blocks,
fix and push again — do not argue with the report. If you think a finding is wrong, say so in
the pull request with your reasoning; the validator has bugs like anything else.

## 7. Checking an existing game for an instructor

To adapt a gallery game rather than submit a new one: download the folder, keep the same rules,
and update `history-bible.md` and `test-ledger.md` to match your changes. A test ledger that
still describes the original file is worse than no ledger.

Re-run the validator after every edit to `game.html`. Editing only the text inside the content
data block cannot break the structural checks, but it can break the timing.
