# Teacher guide — Many Centres, One World

A map quiz of the great voyages, c. 1400–1600, for an undergraduate world-history survey.

## What the game argues

The age of the great voyages had many centres. Ming China, the Indian Ocean and Southeast
Asian ports, the Swahili coast, the Ottomans, the Atlantic powers and the states of the Americas
were all part of it. Goods such as pepper, nutmeg, silk, porcelain and silver tied them
together.

The game makes this argument by its choices. It starts in East Asia, not in Lisbon. It gives
each region about five places. It ends by asking students why the usual "Age of Discovery"
story starts in Europe. Students should notice these choices, and the debrief asks them to.

## What students do

Each question names an event or a trade ("In 1567 the Ming made this Fujian harbour the legal
port for overseas trade. Where?"). Four lettered pins appear on a world map. Students pick one
by clicking the pin or the button below the map. Then they read what happened there, how sure
historians are (attested, interpretation, or contested), and which sources say so.

There are five rounds and 29 questions:

1. East Asia (5)
2. The Indian Ocean and Southeast Asia (8)
3. The Mediterranean, the Atlantic and Africa (6)
4. The Americas (5)
5. Connections (5): where did silver, silk, pepper and nutmeg mostly go?

A button switches the map between an Atlantic-centred and a Pacific-centred view. The last
screen shows every place on one map, a score by region, a closing question, and the debrief
questions.

The question about Elmina Castle is not scored. It became a centre of the Atlantic slave trade,
and finding a place of enslavement should not earn a point.

## Running one session (about 25 minutes)

- **Briefing, 3 minutes.** "This is a quiz, but it is also an argument. Watch which places it
  picks and in what order."
- **Play, about 15 minutes.** Students play alone on their own laptops. There is no time
  limit. Nobody has timed a real play-through yet, so time it yourself once.
- **Debrief, 7–10 minutes.** Use the questions below. Ask students to switch the map view
  before question 2.

## Debrief questions

These are on the game's last screen too.

1. This quiz chose the places, the rounds and the order. Which centre did it treat as most
   important? What does putting the Atlantic round third, not first, argue?
2. Switch the map between the Atlantic and the Pacific. Which view made Europe look central?
   Which made the Pacific look like a highway instead of an edge?
3. The quiz asks you to find places, not people. Whose experience of these voyages is missing
   from a map of ports and routes?
4. Pick one place marked "contested" in the Sources screen. What would change in the story if
   the other reading were right?
5. The game gives a point for the right pin. What does that reward, and what kind of historical
   thinking does it not reward?

The closing screen also asks each student to write one sentence: why might the story so often
be told from Europe? You can collect these sentences, or ask students to screenshot the final
screen. The game sends nothing anywhere.

## Before class

- **Check the answers.** The agent found the sources itself, and no historian has checked them
  yet. Read the History Bible, especially the eight items that rest on Wikipedia alone, and
  change anything you disagree with.
- **Open the file once on the classroom setup**, and through your LMS if students will get it
  there.
- **Time one play-through.**

## If something goes wrong

- **The page looks broken or blank:** make sure the file was saved as `.html`, then open it
  again in Chrome, Edge, Firefox or Safari.
- **A student wants to start again:** the *Start over* button at the top clears their answers.
- **A student refreshed the page:** the game remembers where they were in that browser.
- **Saving does not work** (for example in a private window): the game still plays; it just
  cannot continue after a refresh.

## Changing the game

All the text is in one block near the top of `game.html`, marked `GAME CONTENT`. You can edit
it in any plain-text editor (TextEdit in plain-text mode, Notepad, VS Code). Each place has a
question, an explanation, a map position, how sure it is, and source numbers. To remove a
question, delete its `{ ... }` block and the comma after it. Save and reopen the file to check.
If you change a fact, change the History Bible too.

## What was tested

An agent played the whole game in a browser, offline and by keyboard only, on a wide screen
and a phone-sized screen, and in dark mode. No person has played it yet. Timing, your classroom
setup and the accuracy of the answers are **untested**. See `test-ledger.md`.

## For students: how this game was made

This game was built with an AI agent (Claude). The agent found the sources and wrote the
questions from them. Every answer lists its sources on the *Sources & assumptions* screen, and
nothing in the game is invented.

## Licence

The instructor owns this game. The sources it cites keep their own terms. The world outline is
from Natural Earth, which is public domain.
