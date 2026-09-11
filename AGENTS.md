# Guidance for agents working on this repository

Read `README.md` first, then `agent.md` — the contract this site publishes to outside agents.

This is a plain static website. There is no framework, no bundler, no package.json, and no
dependencies. Do not add any. If a change seems to need a build step, it probably needs a
simpler change.

## What this project is for

Instructors who do not write code, whose agents do the work for them. Two consequences:

1. **Every user-facing string is written for a historian, not a developer.** "The game loads a
   stylesheet from the internet" and "offline it looks broken, usually unreadable on a
   projector" — not "external resource detected." Findings say what breaks, in a classroom,
   and give wording to paste to an agent.
2. **Anything the site asks a person to do, an agent must be able to do instead.** That is why
   the validator is a CLI as well as a page, and why `agent.md` is plain text.

## The honesty rule

Never report a check as passed unless it actually ran. This governs the code, the documents,
and your own reports in this repo.

- `MANUAL_CHECKS` in `assets/js/validator.js` survives a clean report. Do not let a green
  result absorb them.
- A test ledger in `games/*/` must record what was actually run. If you cannot open a browser,
  write `untested` — that is a perfectly good entry, and a false `passed` is not.
- Do not describe a page as "verified" because you wrote it carefully. Run it.

## Making changes

**The validator** (`assets/js/validator.js`) is the heart of the project and runs in both the
browser and Node, so keep it plain ESM with no imports. Every check needs a test in
`tools/test-validator.mjs` naming the rule it defends. Run `node --test tools/test-validator.mjs`
before you finish.

Watch for false positives. A finding that fires on a correct game is worse than a missing check,
because the instructor cannot tell which to believe. Two live examples worth knowing:

- Wording checks read the **content data block**, not just the markup, because the build
  standard tells authors to put game text there.
- `//` is a comment in JavaScript but the start of a URL in CSS, so the two have separate
  comment strippers.

**The gallery** is generated. Edit `games/<slug>/game.json` and the markdown, then run
`node tools/build-index.mjs` and commit what it writes. Do not hand-edit
`games/*/index.html` or `games/index.json`.

**The pages** duplicate their masthead and footer on purpose — it keeps the site buildless and
readable. If you change navigation, change it in every page, including the template inside
`tools/build-index.mjs`.

## Checking your work

```sh
node --test tools/test-validator.mjs
node tools/validate.mjs games/*/game.html
node tools/build-index.mjs && git diff --stat -- games/
python3 -m http.server 8765
```

For anything visual or interactive, open it in a browser and drive it. Contrast, focus order,
and whether the live CSP pass actually fires are not things you can tell by reading the source —
a real keyboard pass on the demo game is what found that focus was being dropped on every
screen change.
