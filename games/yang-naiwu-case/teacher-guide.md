> **Gallery copy.** This guide was written for the gallery from the game's source project: its
> teacher materials (`teacher/teacher.yaml`), its design documents, and its work journal. The
> source project is private. Its own teacher pages show the answers, so they are not public,
> and nothing here gives answers away. Ask the author if you need the answer pages.

# The Yang Naiwu Case (楊乃武案) — Teacher Guide

Six short chapters · About 65 minutes of play · Planned for a 90-minute class · Chinese and English · Hosted online

**Play it here:** https://kltng.github.io/yuhang-case-web/

## What this game is

In 1873 a man named Ge Pinlian died in Yuhang County, Zhejiang. The county magistrate decided
he had been poisoned. His wife, Ge Bishi, and a new provincial graduate, Yang Naiwu, confessed
under torture, and the officials proposed death sentences for both. The case went up and down the Qing review system
for more than three years, through two appeals to the capital and a retrial, until the Board
of Punishments in Beijing settled it in 1877.

Students play this case in six chapters. In most chapters they take the place of a real person
in the case and face the decisions that person faced. They read short extracts from the real
documents: the Board of Punishments' memorial of 1877, imperial edicts, the Great Qing Code,
the forensic handbook *Collected Cases of Injustice Rectified* (洗冤集錄), a petition to the
capital, and reports in the Shanghai newspaper *Shenbao*.

It is a game about procedure and evidence, not a murder mystery. There is no hidden killer to
find. Students do not change history: what they decide inside a chapter only changes that
chapter's ending. Then the game shows what really happened, with the source, and the next
chapter starts again from the real history.

## Before you use it: four practical points

1. **It needs the internet.** This is a web game made with the Godot engine. It is not a
   single file you can hand out. The files are about 49 MB; when an agent loaded the site in
   September 2026, the browser downloaded about 18 MB. Students need a working connection
   every time they open it. If thirty students start at the same moment on a weak network,
   expect a slow start. Open it on the classroom network a few days before class.
2. **It needs a reasonably modern computer.** Use an up-to-date browser on a laptop or
   desktop computer. Only Chrome has been tested (see `test-ledger.md`); try your students'
   browsers before class. The design also supports tablets held sideways, but this has not been
   tested. **Phones are not supported.**
3. **Progress is saved in the browser.** On a shared lab computer the next student will see
   the last student's progress. The title screen has a "Clear local data" button. Students
   can also export a save file.
4. **Screen readers are not supported in any tested way.** The game draws on a canvas, and no
   screen-reader test has been done. If a student needs this, plan another way for them to do
   the work (for example, a written exercise on the same documents).

## Languages

The game is fully bilingual. One control switches the whole screen between three layers:

- **原文** — the original classical Chinese, used only for quotations from documents;
- **白話** — a modern Chinese version (traditional characters);
- **English** — an English translation.

The title screen also has a 中文 / English switch. Students can change language at any time
without losing their place. AI agents wrote and revised the English. It is still marked as a
draft in the source project, and no person has signed it off.

## Content note

The game warns players before the parts that need it. It mentions torture, including finger
presses (拶指) used on a woman; the inquest on the body and, later, the opening of the coffin;
the original sentence of death by slicing (凌遲); and insulting language about women from the
official documents of the time. Nothing is shown in a bloody way. In chapter 1 there is a
**"Skip descriptions"** option: torture and the body are then described only briefly, and
grades do not change.

## The learning goals

| Goal | Students should be able to… |
|---|---|
| G1 | Describe how a Qing homicide case moved up the review chain |
| G2 | Explain how a wrongful conviction was made |
| G3 | Read and apply key articles of the Code |
| G4 | Understand the rules on confessions, the legal limits of torture, and degree holders |
| G5 | Understand the limits of appeal |
| G6 | Tell history from legend and ask for the source |

## The chapters

| Chapter | Who the student plays | Period | Minutes | Goals |
|---|---|---|---|---|
| 序章 流言 · Prologue: The Rumour | Narrator (reading only) | 1872–1873 | 3 | G6 |
| 第一章 縣官 · Chapter 1: The County Magistrate | Liu Xitong (劉錫彤), magistrate of Yuhang | November–December 1873 | 15 | G2, G4 |
| 第二章 京控 · Chapter 2: Appeal to the Capital | Yang Juzhen (楊菊貞), Yang Naiwu's elder sister; then Zhan Caifeng (詹彩鳳), his wife | 1873–1874 | 12 | G5 |
| 第三章 覆審 · Chapter 3: The Retrial | Hu Ruilan (胡瑞瀾), education commissioner | 1875 | 10 | G5, G4 |
| 第四章 刑部 · Chapter 4: The Board of Punishments | An official of the Board of Punishments | 1876–1877 | 22 | G1, G2, G3 |
| 尾聲 後來 · Epilogue: Afterwards | Narrator | 1877 and after | 3 | G6 |
| **Total** | | | **65** | |

These minutes are the design's estimates for the required path. Nobody has timed a real class.

**Every chapter can be started on its own.** Each one opens with a short summary of what
happened before. A student who starts at chapter 4 sees the same material as a student who
played from the beginning. So you can use one chapter in a shorter class. Chapter 4 is the
core of the game.

## What students do

The whole game uses only five kinds of action:

- **Read** case documents, passage by passage, in any of the three language layers.
- **Pick a passage** from a document as a point of doubt or as evidence.
- **Present** a document or piece of evidence against a statement in a witness's testimony.
- **Choose** one of two to four options, each with a written consequence.
- **Fill in a form** with fixed fields, chosen from options (for example, a sentencing form:
  person → Code article → punishment → reason).

Reading is never timed. Full documents are optional; the required path asks only for the
extracts.

**How each passage is labelled.** The game marks every piece of text by its form — original
text, paraphrase, reconstruction, or game fiction — and marks historical statements by status,
such as "established", "recorded assertion" or "inference". Some statements show "Not yet
checked". Point these labels out to students early. Asking "how does the game know this?" is
part of the exercise.

**Pictures.** The portraits and scenes are imagined pictures made with AI. The game says so.
No real portrait of anyone in this case is known. Illustrations can be switched off.

## Grading inside the game

The game's grades are feedback for students, not a course grade. There are no accounts.

- Each graded item is shown as **Achieved**, **Partly achieved**, or **Not achieved**.
- A wrong answer gives feedback, and the student can try again. After two different wrong
  answers a **Hint** button appears. After three, a **Show answer** button appears (sooner if a
  question has fewer wrong options). Some questions can be answered only once and have no
  hint.
- Grades come in two separate parts: **A Procedure** (did the student act as the Code and the
  forensic handbook required?) and **B Reasoning from evidence** (did they point to the right
  passage?). A third part, **C Comparison with history**, is shown but not graded. There is no
  total score.
- A student can reason well and still reach a different conclusion from the historical
  official. That can still be "Achieved".
- At the end of a chapter students can download their results as a JSON file or as printable
  text. You can ask them to hand this in.

## Running one 90-minute class

The design plans a 90-minute class: about 60–65 minutes of play and about 30 minutes for the
briefing and the discussion. The chapter times above add up to 65, so this is tight. If your
class is shorter, use chapters 1 and 4, or chapter 4 alone.

A plan for 90 minutes:

| Time | What happens |
|---|---|
| 0–10 | Briefing. Show the site on the projector. Set the language. Explain the labels (original, paraphrase, reconstruction, fiction). Read the content note together. |
| 10–25 | Prologue and chapter 1. |
| 25–45 | Chapters 2 and 3. |
| 45–70 | Chapter 4. |
| 70–75 | Epilogue. Students download their results. |
| 75–90 | Debrief, with the questions below. |

Tips:

- Have every student open the site before class starts. The first load is the slow one.
- Students who finish early can open the optional documents in any chapter.
- If a computer fails, the student can start again from any chapter on another machine.

## Debrief questions

These are the questions from the game's teacher materials, in the order of the chapters. The
answers are not given here.

**Prologue**

1. 葛品連自己竊聽過幾次，聽到了甚麼？流言為甚麼還是傳開了？
   How many times did Ge Pinlian listen at the door, and what did he hear? Why did the rumour
   still spread?
2. 沈喻氏起疑，是因為看到了甚麼，還是聽到了甚麼？
   Did Shen Yushi become suspicious because of something she saw, or something she heard?

**Chapter 1**

1. 劉錫彤第一個錯是甚麼？請引原文。
   What was Liu Xitong's first mistake? Quote the source.
2. 葛畢氏的口供為甚麼不可靠？
   Why is Ge Bishi's confession unreliable?
3. 如果銀針依法擦洗，案子會不會不同？
   If the silver needle had been washed as the manual says, would the case have gone
   differently?

**Chapter 2**

1. 第一次京控為甚麼沒有用？
   Why did the first appeal to the capital fail?
2. 呈詞為甚麼不能把沒有旁證的事寫成確實的事？
   Why should a petition not state an unsupported allegation as fact?

**Chapter 3**

1. 胡瑞瀾訊出的供詞和原題不合，為甚麼還是照原擬奏結？
   Hu Ruilan found testimony that did not match the original verdict. Why did he still send up
   a closing memorial with the original sentences?
2. 「回護同官」是律例上的罪名嗎？它怎樣在本案中發生？
   Was "shielding fellow officials" a legal offence? How did it happen in this case?

**Chapter 4**

1. 如果沒有京控，這個案下一步會怎樣？
   Without the appeals to the capital, what would have happened next?
2. 選出冤案形成的第一個錯誤，並附上奏摺原文。
   Choose the first error that made the wrongful conviction, and quote the memorial.

**Epilogue**

1. 刑部說楊乃武「不知遠嫌」，說葛畢氏「不守婦道」；為甚麼對他只是責備，對她卻成了罪名？
   The Board said Yang Naiwu "did not keep a proper distance" and Ge Bishi "did not keep a
   wife's proper conduct". Why was it only a rebuke for him, but the ground of punishment for
   her?
2. 傳說為甚麼比檔案流傳得更廣？
   Why did the legends spread further than the archive?

Each chapter's results screen also asks students to compare what they did with what the
historical official did ("what is the same, and what is different?"). Their downloaded results
are a good starting point for the discussion.

**A gap to know about.** None of these questions asks students to criticise the game itself as
an account of the past — for example, what the five kinds of action leave out, or what it means
that the two reconstructed documents and the imagined pictures sit next to real sources. If you
want that discussion, add your own question.

## If something goes wrong

- **The game will not load.** Check the internet connection, then try another browser. Clear
  the browser's cache if an old version seems stuck.
- **A chapter's progress is gone.** If the game content was updated, the game resets that
  chapter and says so. The learning record is kept. Students can use "Restart chapter" at any
  time; it asks before clearing.
- **The text is too small.** Use the text-size setting in the game's Settings.

## More reading

`history-bible.md` lists the sources the game quotes, what is documented and what is
reconstructed or invented, and the open questions. `test-ledger.md` records what has been
tested and what has not.
