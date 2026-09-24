# Teacher guide — The Mill Fire

**One file. About fifteen minutes of play, thirty minutes with the briefing and debrief. No accounts, no wifi needed.**

## What the game argues

Two things. First, that undated documents can be put in order from what each one takes for
granted, and that this order is evidence in its own right. Second, that the date a document
was *written* is not the date of what it *describes*, and that confusing the two lets a late
rumour pass as an early witness.

It ends on a third point that students who have played *The Grain Shipment* may not expect: a
probable cause can be argued from independent papers that fit, and "the evidence cannot say"
is sometimes the lazy answer rather than the honest one.

## What students do

Three rounds.

1. **Order four papers.** A carpenter's bill, a lease, a private letter, and parish minutes.
   None is dated. Each one assumes something another one describes happening: the bill is
   still unpaid and does not know who the tenant will be, and the lease says the carpenter has
   been paid. Students move
   the cards up and down and check their order; the game marks each card and explains the
   clue that fixes its place.
2. **Order three more, and meet the trap.** A petition, a rent roll, and a town chronicle. The
   chronicle describes the fire, the earliest event, but was written last, from memory. Students
   who order by the events described get it wrong, and the explanation says why that matters.
3. **Decide the cause.** With the papers in sequence, three answers: the rumour repeated in two
   documents, a hedged inference from three independent ones, and a refusal to infer at all. The
   hedged inference is the one the evidence carries.

## Running one session

| Time | What happens |
|---|---|
| 0–3 min | **Briefing.** Say only this: every paper is invented, the skill is real, and none of the papers carries a date. Do not explain how to date documents first. The game is the explanation. |
| 3–15 min | **Play.** Individually, or in pairs on one device. Pairs argue about where the chronicle goes, and that argument is the lesson. |
| 15–30 min | **Debrief.** The five questions on the ending screen. Questions 2 and 4 are the ones worth real time. |

If you have taught with *The Grain Shipment*, play the two back to back. One ends in "the
evidence cannot settle it" and the other in "probably", and students should be asked why the
same habits of reading led to different kinds of answer.

## Getting it to students

Post `game.html` to your LMS as a file, or email it. They download and double-click. It needs no
internet after that, stores nothing, and collects no data about them.

## If something goes wrong

Refresh the page. The game restarts cleanly and nothing is stored. If the file will not open, it
was probably saved as `game.html.txt`; rename it. If the text looks like garbled symbols, the
file was saved in the wrong encoding; download it again.

## Editing it yourself

Open `game.html` in any plain text editor. The block marked `GAME_DATA` near the top holds every
word in the game. Change the text between the quotation marks, keep the commas and brackets,
save, and reopen.

For an ordering round, list the documents in their **correct** order in the file. The game
shuffles them for the player. Each document's `clue` is the sentence shown after checking that
explains what fixes its place.

The most valuable edit is replacing round one with four undated documents from your own unit.
The mechanic carries over unchanged, and students then practise on material where knowing the
period helps.

## What was tested, and what was not

| Check | Result |
|---|---|
| Runs with no network, opened from disk | Passed |
| Keyboard-only operation, visible focus, focus kept on the moved card | Passed |
| Full play-through timing | **Estimated at 5–8 min from word count, never timed with a player** |
| Debrief questions present | Passed |
| Opens on *your* classroom computer and LMS | **Untested — yours to do** |
| Historical accuracy of the sources | Not applicable: there are none, by design |

Full detail in `test-ledger.md`.

## Licence and attribution

The game file is CC BY 4.0. It contains no third-party material and no real sources, so you can
post, edit, and redistribute it freely. Built with an AI agent following the
[Playable Past](https://gist.github.com/kltng/2a2b26a8817540531f3191412c308276) workflow.
