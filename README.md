# Playable Pasts — gallery and checker

A static website that does the half the [Playable Past workflow](https://gist.github.com/kltng/2a2b26a8817540531f3191412c308276) does not: it checks
whether a finished classroom history game will survive a real classroom, and keeps the games
instructors have built, with the evidence still attached.

The instructions in the gist get a teacher from *"I have some sources"* to *"here is a file."*
This site answers *"will it work, and can someone else use it?"*

**The people using it do not write code.** They ask an agent to do the work. So every job this
site needs doing — validating, packaging, submitting — is something an agent can do from
[`agent.md`](agent.md), and the pages are written for the instructor reading over its shoulder.

## A note on the name

**Playable Pasts** is this site. **Playable Past** is the instruction set in the gist that
agents follow to build the games — a separate, versioned document. The plural is the gallery of
many games and many readings of the past; the singular is the workflow. Both spellings appear
on purpose.

## What is here

| Path | What it is |
|---|---|
| `index.html`, `start/`, `check/`, `games/`, `submit/`, `for-agents/` | The site. Plain HTML, no framework, no build step. |
| `assets/js/validator.js` | The classroom-readiness checker. One dependency-free ES module, used unchanged by the website, the CLI, and CI. |
| `assets/js/check-ui.js` | The checker page: the static pass, plus a live pass that runs the game under a strict CSP and reports what the browser blocked. |
| `tools/validate.mjs` | The checker on the command line. Exit 0 when nothing blocks, 1 when something does. |
| `tools/test-validator.mjs` | 26 tests. Each names the rule it defends. |
| `tools/build-index.mjs` | Regenerates `games/index.json` and each game's page from its `game.json`. Authoring-time only. |
| `games/<slug>/` | One game: the HTML file, its manifest, teacher guide, history bible, and test ledger. |
| `agent.md` | The submission contract, in plain text, for agents. |

## Working on it

```sh
node --test tools/test-validator.mjs          # run the tests
node tools/validate.mjs games/*/game.html     # check every game
node tools/build-index.mjs                    # rebuild the gallery, then commit what changes
python3 -m http.server 8765                   # serve it locally
```

No install step and no dependencies. Node 20 or newer for the tools; the site itself is just
files.

## The one rule that shapes everything

**Never report a check as passed unless it actually ran.**

The validator reads a file. It cannot play a game, sit in a classroom, or judge whether the
history is right. So it returns three lists — blocking, warnings, and *six checks only a person
can run* — and the third list survives a clean report. The gallery shows what contributors left
untested rather than quietly rounding it up to "verified."

This is why a green result says "passed every automated check" and not "classroom ready." If
you change the validator, keep that distinction. It is the only thing making the badge worth
anything.

## Adding a game

See [`agent.md`](agent.md) for the full contract. In short: a folder under `games/` with five
files, `node tools/build-index.mjs`, then a pull request. CI runs the validator and posts the
report.

## Licence

Site code and the validator: MIT. The
[workflow instructions](https://gist.github.com/kltng/2a2b26a8817540531f3191412c308276) are CC BY 4.0. Games in the gallery carry their own terms, and
their sources carry theirs.
