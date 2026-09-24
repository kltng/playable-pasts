> **Gallery copy.** This guide is the version 2 teacher guide from the game's source project,
> reproduced here with file names changed to match the gallery folder: the game is `game.html`,
> the history bible is `history-bible.md` (which now also contains the historical-content
> audit), and the QA report has become `test-ledger.md`. The source project, with its build
> script and Playwright tests, is not part of the gallery folder. The game's content is also
> editable directly: it sits in a JSON block marked `GAME_DATA` near the top of `game.html`.
>
> On 24 September 2026 the gallery copy was changed: the embedded images were recompressed to
> bring the file under 3 MB, NEWS-003 no longer shows an image, three context notes label model
> recall, and the in-game stage times now match the sixty-minute plan below. This guide was
> updated to match. See `test-ledger.md` and the end of `history-bible.md`.

# The Influenza Front Page — Teacher Guide

Version 2 classroom rules · Usually 40–60 minutes · One offline HTML file

The gallery listing gives 60 minutes: the full lesson below, with briefing and debrief. The in-game "How to play" screen uses the same stage times as this plan.

## The learning task

Students edit a retrospective newspaper front page from reports available through October 10, 1918, then receive evidence from October 12. They must choose what deserves space, decide what each source can establish, identify an important omission, and explain one later editorial decision.

This is a source-criticism game, not an epidemic simulator. Students do not save lives by selecting a hidden correct headline. Its constrained archive and rules are a teaching model, not a reconstruction of a particular historical newsroom. Several defensible pages can emerge from the same evidence.

The selection contains 18 readings from Philadelphia's *Evening Public Ledger*, dated October 3–10, with an October 12 reveal. It is a small, deliberately selected corpus, not a representative survey of the city or its press. The camp dispatch and Chester report have different geographical settings; they cannot silently become evidence about Philadelphia civilians.

## Prepare the classroom

Distribute `game.html`. Download the HTML from Canvas or your LMS and open it in a browser rather than relying on an LMS preview frame. The game is designed to operate offline; archive links need an internet connection.

Rehearse the exact file on the classroom browser before class. Browser-local saving can depend on browser policy and the file's location. Ask students to export a JSON checkpoint before changing devices or moving the file; the checkpoint is a portable continuation file, not a finished assignment. The final text export is the editorial record. Print / save PDF is useful for comparing pages.

Choose a difficulty and a playing method independently:

| Difficulty | Research allowance | Best starting use |
|---|---|---|
| Guided | Six checks | First encounter with historical newspapers, accessibility-focused practice, or a discussion emphasizing detail |
| Newsroom | Three checks | A second playthrough or a class ready to discuss research tradeoffs |

Both difficulties have the same three-dossier opening limit, six-unit page, chronology, and revision task. More checks increase access to research layers; they do not make one historical interpretation automatically correct.

## Three ways to play

### Newsroom team: three or four students, one device

Assign roles and rotate at each stage. The person operating the device should not make every decision.

- Managing editor: proposes the lead and allocates space; asks why a reader needs each item.
- Evidence editor: requests research checks and distinguishes a report, a quotation, a paraphrase, and an inference.
- Public-service editor: checks practical coverage, geographical scope, and whose lives are visible or absent.
- Skeptic / recorder: challenges the strongest claim and records the team's unresolved question and omission. In a team of three, combine this role with managing editor.

Before an irreversible choice, each role gets one short contribution. For a dossier pull: “What question will this source help us answer?” For a research check: “What could this check change on our page?”

### Solo: deliberate role-switching

Use Guided mode. Before filling the page, write a claim as managing editor, inspect it as evidence editor, then challenge it as skeptic. Make the omission decision last, after identifying the strongest story that did not fit. A solo player should not need to simulate a group conversation; the source notebook provides a record of these different passes.

### Paired editorial debate: two independent pages

Each student or team plays its own session without coordinating selections. After locking both pages, compare the leads, the allocation of space, and the omitted stories before discussing the reveal. Each side must explain one defensible choice on the other page. Different browsers or exported checkpoints keep the sessions separate; avoid sharing one unsaved browser session.

## Rules that matter

### Stage 1 — October 3: commit to three dossiers

Six source leads are available. Players can inspect their brief lead descriptions, but must choose exactly three permanent dossier pulls. A pull cannot be returned or traded for another. These are research-access choices, not yet the final front-page choices.

Facilitation prompt: “Are you using all three pulls on the most prominent official account? What question might another page or genre answer?” Do not tell students which three to choose.

### Stage 2 — October 4–7: investigate purposefully

The source pool expands to twelve. Research checks become available. Players may spend some now and reserve others for the next stage.

One check buys one research layer for a source:

| Layer | What opens together | What it cannot establish by itself |
|---|---|---|
| Reading | The editor's reading and an embedded scan crop, where a crop exists | That every word is an authenticated transcription, or that the newspaper's claim is true |
| Context | The surrounding-context teaching note | Independent corroboration of the account |
| Comparison | An available comparison with related earlier or same-date material | Independent corroboration merely because the same paper or official repeats a claim |

Reading access pairs image and readable text so that a student does not pay an additional check simply to access the material in a different format. Not every source has every layer or an embedded image. Read a layer's description before purchasing it; a comparison may answer a different question from a scan.

For each promising source, use the notebook's claim, uncertainty, and editorial-use fields. A useful note is specific: “The paper reports an order; our headline must not imply universal compliance.” A less useful note is “Seems reliable.”

### Stage 3 — October 8–10: build a six-unit page

All eighteen sources enter the pool. Remaining research checks can still be spent here, including on newly arrived sources. The later arrivals are a reason to consider reserving checks, not a requirement to do so.

The page must use exactly six column units and contain three to five stories:

- Lead: two or three units.
- Public-service item: one or two units; an editorial does not satisfy this requirement.
- Philadelphia local item: one or two units; the Chester regional report does not satisfy this requirement.
- Up to two secondary items: one unit each.

Possible layouts show the tradeoff between depth and breadth:

| Editorial choice | Lead | Service | Local | Secondary | Total stories |
|---|---:|---:|---:|---|---:|
| A dominant lead | 3 | 1 | 1 | One at 1 | 4 |
| More service detail | 2 | 2 | 1 | One at 1 | 4 |
| Widest selection | 2 | 1 | 1 | Two at 1 each | 5 |
| Three substantial items | 2 | 2 | 2 | None | 3 |

Students choose headlines, attribution, caveats, and an editorial stance. “Attributed” makes clear who claims something. “Tentative” marks an unresolved interpretation. “Established” is the team's stronger evidentiary commitment, not a synonym for “the newspaper printed it.” These are choices to justify, not automatic truth labels.

Before locking the page, the game requires a lead-source claim of at least 12 characters, an editorial rationale of at least 40 characters, and an omitted story with a reason of at least 20 characters. These minimums prevent blank submissions; they do not assess quality. Ask for a substantive explanation in ordinary sentences.

Model of a useful rationale: “We gave the closure notice prominence because readers needed to understand the announced restrictions. We paired it with local effects, but attributed the order and avoided claiming that everyone complied.” This illustrates a method, not the required editorial position.

### After lock — October 12: revise transparently

Only after the original page is locked does the October 12 evidence appear. Players select the later evidence relevant to their decision: weekly mortality, reporting-lag considerations, or continuing restrictions. A reporting-lag consideration is an interpretive caution; it must not be mistaken for a quantified fact supplied by the newspaper.

Choose one story and one action:

- Qualify: make a genuine change to the selected item's presentation or claim.
- Replace: use an unplaced source eligible for the selected role.
- Affirm: retain the item and explain why the later evidence does not overturn its carefully limited claim.

Every action needs an original explanation of at least 30 characters. The record preserves the original page, new evidence, action, and reasoning. Affirmation is not a shortcut around reasoning, and revision is not an admission that a reasonable earlier judgment was dishonest.

Prompt: “What exactly does the new material change: the event you reported, your interpretation, your wording, or its prominence? What remains supportable?”

## A sixty-minute lesson

| Minutes | Activity |
|---|---|
| 0–5 | Frame the question: what could an editor responsibly say with incomplete evidence? Explain that historical health advice is not present-day guidance. |
| 5–8 | Choose difficulty and playing method; assign roles. |
| 8–16 | Stage 1: choose and explain three dossier pulls. |
| 16–26 | Stage 2: investigate and take source notes. |
| 26–41 | Stage 3: allocate space, write the rationale and omission, then lock the page. |
| 41–48 | Read the reveal; qualify, replace, or affirm one item with reasons. |
| 48–60 | Export and compare pages; discuss the strongest disagreement. |

The in-game "How to play" screen gives the same stage times: 8, 10, 15, 7, and 12 minutes, after about 8 minutes of briefing and setup.

For forty minutes, introduce the roles and controls before class, use five minutes for dossier pulls, seven for research, twelve for building, six for revision, and ten for introduction and debrief combined. Shorten discussion, not access to necessary reading accommodations. The optional manual pace timer is a facilitation aid: it does not fail the game or grade speed.

For twenty minutes, run a projected whole-class editorial conference in Guided mode. Let students vote on research questions, demonstrate one check, and jointly build one page. This is a guided demonstration, not a substitute for an independent full playthrough; allow the written rationale or reveal discussion to continue outside class if needed.

For ninety minutes, use two independent pages and a debate. Add time to inspect the available crops, separate quotation from editorial reading, exchange source notebooks, and revisit one decision under the other difficulty. Require students to explain what the changed research allowance made possible and what it still could not prove.

## Discussion and feedback, not a hidden grade

The game reports descriptive indicators for coverage, research checks, attribution, and caution. It does not award a historical-prediction score or compare students against concealed ideal certainty settings. More genres do not automatically mean more representative coverage; more checks do not automatically mean better reasoning.

Use the following qualitative feedback guide alongside the exported record:

| Dimension | A developed response | A useful next question |
|---|---|---|
| Evidence | Connects a specific claim to a source and explains what the check established | “Did you verify the wording, the event, or the interpretation?” |
| Calibration | Distinguishes an order, an estimate, an opinion, and an observed outcome | “Which word in your headline makes the strongest promise?” |
| Editorial judgment | Explains space allocation and the consequence of an omission | “What does your reader fail to learn because this item was left out?” |
| Scope and visibility | Names geographical limits and missing perspectives without inventing testimony | “Who appears only as a number, and who receives a name or quotation?” |
| Revision | Identifies relevant later evidence and gives a reason to alter or retain one item | “Would this still be a reasonable choice without hindsight?” |

There are two sets of discussion questions. They are different on purpose, and neither replaces the other.

- **In the game (five questions).** The ending screen has a panel called "Hold the editorial conference". Its five questions are about the team's own page: which check changed your wording, which omitted source another team would print, what the revision did, whose experience is still invisible, and how the six-column limit and the check budget shaped the argument.
- **In this guide only (six questions).** The list below is for the instructor to lead a whole-class discussion. Students do not see it in the game.

Further debrief questions (this guide only):

1. Did an image, official title, confident headline, or fluent reading make a source seem more authoritative? Was that authority warranted?
2. Which research check changed an actual editorial decision? Which supplied information that was interesting but not decisive?
3. How did three versus six checks change the questions you asked?
4. What can these selected newspaper pages not tell us about Philadelphia?
5. Did the delayed reveal expose an unsupported claim or only the incompleteness of an earlier account?
6. What argument does the six-unit rule make? How would eight units or a different required category change the story?

## Source and accessibility cautions

The embedded archival images are selected crops, not full historical front pages. A crop can omit article continuations, neighboring material, and visual relationships. Some sources have no embedded crop. Source links and the History Bible help locate fuller archival context, but that additional online reading sits outside the offline research constraint unless the instructor explicitly allows it.

Distinguish four layers: archival image; editor's reading or summary; retained legacy OCR exercise; and generated teaching prompts. Legacy OCR snippets in this project are not an authenticated raw-OCR corpus and must not be used to claim exact archival transcription provenance. Fluent editor readings are not automatically verbatim quotations. The revision includes a numerical/source audit, but only claims supported by that audit should be described as checked; consult the current History Bible for scope and unresolved limits.

The reading view follows the current game stage so it does not expose all sources or the reveal in advance. Image and readable-text access are paired in a reading check. Rehearse zoom, keyboard access, screen-reader behavior, and print output with the accommodations your students actually use; a built-in reading view is not proof of compatibility with every browser's reading mode.

No student should have to decipher a damaged image to access the basic reading. Image inspection is a source-analysis opportunity, not a visual-acuity test. Historical illness, death, and care may be sensitive topics; allow a student to focus on institutional reporting or editorial method rather than a personal-loss story.

## Handoff and troubleshooting

Ask students to submit the full editorial text export. Add the printed page if layout itself is being assessed, and the checkpoint only if you need to reopen the session. The text record is the clearest place to inspect source notes, the rationale, the omission, and the before/after decision.

- LMS preview blocked: download and open the HTML locally.
- Reload or device change planned: export a JSON checkpoint first, then import it in the destination session.
- State seems stale: preserve a checkpoint before attempting a restart. Restart is for beginning a new playthrough, not undoing an irreversible choice.
- Small scan: use the paired editor reading and the zoom or reading controls; discuss the image only at a useful scale.
- Print layout unexpected: inspect print preview before saving, and retain the text export as the audit record.

Version 2 passed the source project's automated Chromium regression suite: complete play, source locks, three- to five-story layouts, all revision choices, reloads, checkpoint import/export, invalid-save recovery, and print preparation. A separate automated script (the source project's keyboard test) completed a full playthrough using only keyboard input and typed text; no person has played it by keyboard. These test scripts are not included in the gallery folder, so their results cannot be re-run from here. Layout checks used emulated widths of 390, 768, and 1440 pixels; these are not real-device or universal assistive-technology certification. See `test-ledger.md` for exact scope. Instructors still need to test LMS behavior, screen readers, classroom legibility, and discussion pace on their own setup.

## Licence and rights

The game layer, meaning its code, rules, prompts, readings, and other text, is licensed CC BY 4.0. The eight newspaper crops are not covered by that licence. They come from 1918 issues of the *Evening Public Ledger* in the Library of Congress Chronicling America collection (LCCN sn83045211), and are public domain: the Library describes these newspapers as public domain or having no known copyright restrictions. Check each item's rights statement before reusing it elsewhere.

## Editing and disclosure

The gallery folder contains only the finished file, `game.html`. The source project's separate files and its build script are not included. To change the content, open `game.html` in a plain text editor and edit the JSON block marked `GAME_DATA` near the top. Change only the text between quotation marks, keep every comma, bracket, and quotation mark, save, and reopen the file to check it. The images are long `data:` strings inside that block; leave them alone unless you are replacing an image. Preserve source IDs, dates, page references, and links when changing a reading. Label summaries honestly, record substantive corrections, and do not introduce a quotation without checking the original text.

This AI-assisted teaching artifact includes generated rules, prompts, readings, and interface text alongside historical material. The source publication is not the author of those teaching layers. Consult the source repository, History Bible, and archival rights statements for provenance and reuse; this guide does not grant rights in material owned by others.
