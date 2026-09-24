> **Gallery copy.** This is the version 2 history bible from the game's source project, followed
> by the historical-content audit of 7 September 2026 that it refers to. File names have been
> changed to match the gallery folder. The gallery changes of 24 September 2026 are listed at
> the end, under "Gallery changes"; nothing else has been altered. The audit's references to
> `src/content.json` describe the source project, whose content is compiled into the `GAME_DATA`
> block of `game.html`.

# The Influenza Front Page — History Bible

Version 2 · Newspaper reports, October 3–12, 1918 · Revised September 7, 2026

## Purpose and authority

The game asks how newspapers construct public knowledge during a changing crisis and how historians should evaluate their reporting. Players assemble a retrospective page using material released through October 10, then consider October 12 evidence. The page, newsroom roles, staged releases, investigation budget, and revision task are teaching models, not a reconstruction of a particular historical editorial meeting.

This document supersedes the historical and provenance claims in the earlier v1 History Bible. That edition contained substantive numerical errors and overstated transcription verification. Current readings are in `src/content.json`; the audit below records the corrections and their limits. `teacher-guide.md` explains current play. Historical statements here mean **what the newspaper reported**, not that an independent investigation has established the underlying event or population-health measurement.

## Corpus and source IDs

The source is Philadelphia’s *Evening Public Ledger*, published in this period as the *Evening Public Ledger and the Evening Telegraph*, Library of Congress Control Number `sn83045211`. The game selects eighteen editorial readings from October 3–10 and a delayed October 12 article. Eight embedded images are **crops**, not complete front-page facsimiles. Some inside-page readings have no embedded facsimile.

| ID | Newspaper issue or research aid | Role in this edition |
|---|---|---|
| SRC-001 | [Evening Public Ledger, Oct. 3, 1918](https://www.loc.gov/item/sn83045211/1918-10-03/ed-1/) | NEWS-001–006; selected readings from pp. 1, 8, 9, and 12 |
| SRC-002 | [Oct. 4, 1918](https://www.loc.gov/item/sn83045211/1918-10-04/ed-1/) | NEWS-007–010; pp. 1, 8, 12, and 17 |
| SRC-003 | [Oct. 5, 1918](https://www.loc.gov/item/sn83045211/1918-10-05/ed-1/) | NEWS-011; Chester report on p. 1 |
| SRC-004 | [Oct. 7, 1918](https://www.loc.gov/item/sn83045211/1918-10-07/ed-1/) | NEWS-012–014; pp. 1, 9, and 14 |
| SRC-005 | [Oct. 8, 1918](https://www.loc.gov/item/sn83045211/1918-10-08/ed-1/) | NEWS-015–016; pp. 1 and 9 |
| SRC-006 | [Oct. 9, 1918](https://www.loc.gov/item/sn83045211/1918-10-09/ed-1/) | NEWS-017; p. 1 |
| SRC-007 | [Oct. 10, 1918](https://www.loc.gov/item/sn83045211/1918-10-10/ed-1/) | NEWS-018; p. 1 |
| SRC-008 | [Oct. 11, 1918](https://www.loc.gov/item/sn83045211/1918-10-11/ed-1/) | Contextual source link; no independently audited game reading in this revision |
| SRC-009 | [Oct. 12, 1918](https://www.loc.gov/item/sn83045211/1918-10-12/ed-1/) | Delayed mortality/restrictions reveal; p. 1 |
| SRC-011 | [Library of Congress influenza teaching/research material](https://www.loc.gov/static/programs/teachers/professional-development/online-office-hours/documents/2020-03-26_Influenza-Pandemic-1918-Primary-Sources.pdf) | Research aid, not independent corroboration of each game claim |

SRC-010, a Washington comparison in v1, was removed from active content because its edition/page and passage were not independently verified. Source IDs have not been renumbered. Current comparison notes use earlier or same-date selected material; repeated reporting from one paper or official is not independent corroboration.

The Library of Congress describes Chronicling America newspapers as public domain or having no known copyright restrictions. Consult each item’s rights statement when reusing material. This project supplies no new permission for separately owned material and does not claim to have audited a complete forty-page research corpus.

## Verification scope and source layers

The September 2026 audit visually inspected all eight embedded crops and checked the relevant readings for NEWS-001, NEWS-002, NEWS-007, NEWS-011, NEWS-012, NEWS-015, NEWS-017, NEWS-018, and the reveal. It did not independently inspect every inside page or re-transcribe all eighteen cards. NEWS-003’s Water Bureau passage is outside the supplied October 3 crop; that image does not verify its 100-worker figure. Since 24 September 2026 the game no longer attaches the October 3 crop to NEWS-003 (`scanId` is `null`), so the card shows the “no image is embedded” notice instead.

| Layer | Provenance and appropriate use |
|---|---|
| Archival crop | Reproduction of part of a newspaper page. It supports visible wording and layout within the crop, but can omit continuations and surrounding material. |
| Editorial reading | AI-assisted teaching paraphrase or condensed reading. Notes distinguish crop-checked readings from retained readings not independently checked in this audit. It is not a diplomatic transcription and must not be quoted as exact newspaper wording. |
| Legacy OCR exercise | Retained v1 teaching extract, not authenticated against a preserved raw archive OCR response. Do not call it verbatim raw OCR or attribute its exact errors to the archive without further checking. |
| Context and comparison | Interpretive teaching notes, not additional historical witnesses. |
| Interface and student page | Generated rules/prompts and student decisions, not archival artifacts. |

Opening a reading check records a player action; it does not certify a source as true. A citation identifies where to look, not what the source proves.

## Source-reported chronology

These readings are supported by the embedded crops. Retain each number’s period, category, and estimate status.

| Newspaper date | What the selected printed material reports | Important limit |
|---|---|---|
| Oct. 3 | An immediate closing order for gathering places; **666 new cases**; downtown police stations assigned emergency medical work | An announced order is not measured compliance. A number repeated within an article is not independently corroborated. |
| Oct. 4 | Liquor establishments ordered shut at 7 p.m.; Common Pleas Courts to suspend for two weeks; **788 new cases in twenty-four hours** | Orders and notified cases do not measure all infections or universal compliance. |
| Oct. 5 | Chester authorities report **5,000 cases** and overtaxed undertakers; public funerals discouraged, with enforcement threatened | This is **Chester**, not Philadelphia. The passage does not establish the case-count method. |
| Oct. 7 | **5,561 new cases in forty-eight hours** and an estimate of about **175,000 still ill**; official hope alongside emergency mobilization | The estimate concerns people still ill, not everyone ever infected. Its quantity differs from newly reported cases. |
| Oct. 8 | Krusen’s “over top” assessment; **3,831 cases in the preceding twenty-four hours**; most described as discovered the prior day, with decline since midnight | The windows differ. The article also urges vigilance. Optimism remains an attributed assessment. |
| Oct. 9 | Official confidence and limited Episcopal church uses: private prayer, small early communion groups, and relief meetings | Not unrestricted reopening of all churches. The article says the fight continues and describes emergency hospital work. |
| Oct. 10 | **3,357 cases**, versus **4,013** in the preceding twenty-four-hour period: a fall of **656**; **514 deaths**, attributed as **363 influenza + 151 pneumonia** | The article does **not** label 514 as all-cause deaths. Cases and deaths count different events. |
| Oct. 12 | Weekly **all-cause deaths of 3,234**, versus **1,191** the previous week; **1,697 influenza** and **938 pneumonia** deaths; restrictions retained alongside “under control” language | The two named causes account for about 81.48%; the paper rounds to 81%. Weekly deaths are not interchangeable with daily cases. |

No independently audited Oct. 11 narrative is inserted here. Later mortality does not prove every earlier attributed report or order false. Reporting lag is an interpretive caution; its size and operation cannot be reconstructed from these excerpts alone.

## People, places, and representation

Dr. Wilmer Krusen (the game’s readings give only “Dr. Krusen” or “Director Krusen”; the first name is model recall, unverified, see C-029) appears as Philadelphia’s health director and a recurring source of orders, assessments, and figures. His institutional position matters: an attributed statement establishes what the paper represents an official as saying, not that the underlying inference is settled.

The selected reports also discuss police, hospitals, nurses, medical students, courts, liquor establishments, and clergy. The October 9 crop names Bishop Philip M. Rhinelander in its explanation of Episcopal practice. Reports can make institutions visible without showing everyone’s experience of them.

The main setting is Philadelphia. NEWS-011 concerns Chester. NEWS-008 is identified in its retained reading as a Camp Meade dispatch, not a Philadelphia civilian report. Do not aggregate their numbers with Philadelphia figures or erase their geographical labels. The Nancy Wynne society readings invite questions about social selection, but this corpus cannot establish how frequently particular populations appeared across the entire newspaper.

## Claims ledger

**Crop-checked** means visible wording or numbers were checked, not the underlying claim independently proved. **Retained reading** means the previous source attribution remains but the particular passage was not independently checked against its printed page in this audit. **Model recall (unverified)** means background the agent supplied from its own knowledge, not from any listed source. The game labels these sentences in the text itself. An instructor should check them before teaching them as fact.

| Claim ID | Current claim or question | Source and status | Used by |
|---|---|---|---|
| C-001 | The paper reports an immediate closing order | SRC-001 p. 1; crop-checked | NEWS-001 |
| C-002 | Oct. 3 prints **666**, not 566, new cases | SRC-001 p. 1; crop-checked twice in the article | NEWS-001 |
| C-003 | Downtown stations are described as emergency medical offices | SRC-001 p. 1; crop-checked | NEWS-002 |
| C-004 | Patrol wagons may take patients to hospitals | SRC-001 p. 1; crop-checked | NEWS-002 |
| C-005 | Water Bureau illness threatens operations; earlier reading gives 100 workers | SRC-001 p. 1; retained reading, **outside supplied crop** | NEWS-003 |
| C-006 | Advice concerns self-protection and crowded trolley cars | SRC-001 p. 8; retained reading, not current guidance | NEWS-004 |
| C-007 | Society readings describe sudden illness and personal loss | SRC-001 p. 9; SRC-004 p. 9; retained readings | NEWS-005, NEWS-013 |
| C-008 | Sports readings describe canceled games and continued practice | SRC-001 p. 12; SRC-002 p. 17; retained readings | NEWS-006, NEWS-010 |
| C-009 | Liquor establishments ordered shut; courts to suspend | SRC-002 p. 1; crop-checked | NEWS-007 |
| C-010 | Oct. 4 reports 788 new cases in twenty-four hours | SRC-002 p. 1; crop-checked | NEWS-007 |
| C-011 | Camp dispatch describes light work during convalescence | SRC-002 p. 8; retained reading | NEWS-008 |
| C-012 | Editorial frames doctors’ home-front work as patriotic service | SRC-002 p. 12; retained reading of opinion | NEWS-009 |
| C-013 | Chester authorities report 5,000 cases and overtaxed undertakers | SRC-003 p. 1; crop-checked; method not established | NEWS-011 |
| C-014 | 5,561 new cases over forty-eight hours; about 175,000 estimated still ill | SRC-004 p. 1; crop-checked | NEWS-012 only |
| C-015 | Oct. 8 attributes optimism to Krusen and prints 3,831 new cases | SRC-005 p. 1; crop-checked | NEWS-015 |
| C-016 | Society reading praises women’s hospital volunteering; framing invites analysis | SRC-005 p. 9; retained reading plus teaching interpretation | NEWS-016 |
| C-017 | Oct. 9 combines confidence with limited Episcopal uses and emergency work | SRC-006 p. 1; crop-checked | NEWS-017 |
| C-018 | Oct. 10 cases fall from 4,013 to 3,357: decrease 656 | SRC-007 p. 1; crop-checked | NEWS-018 |
| C-019 | 514 deaths: 363 influenza and 151 pneumonia | SRC-007 p. 1; crop-checked, not labeled all-cause | NEWS-018 |
| C-020 | Weekly all-cause deaths: 1,191 to 3,234; named causes: 1,697 and 938 | SRC-009 p. 1; crop-checked | Reveal |
| C-021 | Measures, periods, and institutional messages complicate comparisons | Teaching interpretation of SRC-004–009; not a quantified lag model | Comparison and debrief |
| C-022 | Investigation checks model limited attention and labor | Modeling assumption: three in Newsroom, six in Guided | Research access |
| C-023 | Six column units expose prominence and omission | Modeling assumption, not the paper’s actual production budget | Page building |
| C-024 | Students justify a claim stance rather than match a concealed ideal | Pedagogical rule | Editorial reasoning |
| C-025 | Different defensible editorial pages can coexist | Pedagogical principle; no historical-prediction winner | Debrief |
| C-026 | In 1918 many physicians were away in military service, so home-front doctors were in short supply | **Model recall (unverified).** Not in the retained NEWS-009 reading or any listed source. Labelled in the card's context note | NEWS-009 context |
| C-027 | “Over the top” was First World War slang for leaving the trenches to attack | **Model recall (unverified).** Not stated in any listed source. Labelled in the card's context note | NEWS-015 context |
| C-028 | The epidemic reduced trading activity in the financial district | **Model recall (unverified).** The retained NEWS-014 reading mentions only absences. Labelled in the card's context note | NEWS-014 context |
| C-029 | The health director's first name was Wilmer | **Model recall (unverified).** The game's readings name only “Krusen”. Used in this bible only, not in the game | This file |

NEWS-014’s financial-district reading retains its SRC-004 p. 14 citation. Its old link to C-014 was erroneous and is removed: citywide case figures do not substantiate that market-column account.

## Mechanic rationale

Version 2 offers Guided and Newsroom budgets, with team, solo, or paired-debate methods. The first three dossier choices expose selection. Later checks can be saved for newly released sources. A reading check pairs text and available image so access to another format does not consume an extra check.

Players allocate six units among a lead, public service, Philadelphia local coverage, and optional secondary stories. Discuss why these categories are required and what other rules would privilege. An editorial does not satisfy public service merely by sounding authoritative; Chester does not satisfy Philadelphia local coverage merely by being nearby.

Before the reveal, players record a claim, rationale, and consequential omission. They later qualify, replace, or affirm one story with reasons; the original page and subsequent decision remain available for comparison. Descriptive indicators concern editorial practice, not lives saved, epidemic outcomes, or concealed ideal certainty ranks. See the Teacher Guide for exact rules. This Bible does not certify software behavior or completed accessibility tests.

## Safeguards and unfinished research

- Distinguish orders, notified counts, estimates, opinions, and observed outcomes. Attribution is not independent corroboration.
- The interface stages evidence for play without hindsight. The offline file contains all content; staging is a classroom design, not a secure anti-cheating barrier.
- Ask whose experiences appear as names, institutions, or numbers, and whose cannot be recovered here. Do not invent testimony or infer archive-wide frequencies from this selection.
- Illness and death do not generate points. Historical medical instructions are evidence, never modern guidance.
- Crop inspection verifies visible wording, not administrative completeness. This selection cannot establish Philadelphia-wide press consensus, infection prevalence, or effects of closures.
- Further work should retrieve inside pages, preserve original OCR responses, produce passage-level transcriptions and correction logs, and obtain fuller page images before stronger transcription/layout claims. A second local newspaper would broaden comparison, but must be researched rather than simulated.

The game supports rigorous discussion when these limits remain visible. Recognizing a source’s boundary is an intellectual achievement, not failure to find the game’s hidden answer.


---

## Historical-content audit — September 7, 2026

This audit checked all eight newspaper crops embedded in the earlier game and corrected `src/content.json`. It did **not** inspect the complete run of newspaper pages or independently re-transcribe every card. The images are article/page crops, not eight complete front-page facsimiles. The earlier edition is retained as an archive; its factual and provenance claims must not be treated as the current authority.

### Confirmed corrections

| Card | Earlier version | Reading supported by the printed crop |
|---|---|---|
| NEWS-001, Oct. 3, p. 1 | 566 new cases | **666**. The figure occurs in both the opening and a later paragraph. |
| NEWS-012, Oct. 7, p. 1 | 175,000 residents “had been stricken” | An estimate of about **175,000 still ill**, not a cumulative infection total. The separate **5,561** figure concerns newly reported cases over **forty-eight hours**. |
| NEWS-015, Oct. 8, p. 1 | 1,031 new cases | **3,831**, printed in both headline and body. The article reports a twenty-four-hour total, says most cases were discovered the previous day, and describes a decline since midnight. These are distinct time windows. |
| NEWS-017, Oct. 9, p. 1 | Broadly modified church closing, without details | The described directions are to **Episcopal clergy**: private prayer, early communion in groups of no more than twenty or twenty-five, and relief meetings with safeguards. They do not establish unrestricted reopening of every church. |
| NEWS-018, Oct. 10, p. 1 | 511 deaths “from all causes,” including 33 influenza and 151 pneumonia | **514 deaths**, with **363 attributed to influenza** and **151 to pneumonia**. These sum to 514. The article does not identify this number as an all-cause total. Its case comparison is **4,013 to 3,357**, a decrease of **656**, across adjacent twenty-four-hour periods. |

The Oct. 4 **788** new-case figure, Oct. 5 Chester **5,000** figure, Oct. 7 **5,561** figure, and Oct. 12 reveal figures were also checked in the embedded crops. The Oct. 12 article explicitly distinguishes **3,234 all-cause deaths** from **1,697 attributed to influenza** and **938 to pneumonia**; it compares the weekly total with **1,191** the previous week. Its 81-percent statement is rounded: `(1697 + 938) / 3234 ≈ 81.48%`.

### Provenance and wording repairs

- All displayed readable passages are now labeled **editorial readings/paraphrases**, not diplomatic transcriptions. Several earlier “corrected” passages changed tense, inserted subjects, condensed paragraphs, or provided summaries. A blanket “human-checked transcript” claim was not supported.
- The old `raw` strings are preserved for the OCR exercise but explicitly labeled **legacy teaching extracts**. This audit could not authenticate them against preserved raw archive OCR responses. They must not be presented as verbatim raw OCR or as proof that a particular error was produced by the archive.
- Card-specific correction notes distinguish readings checked in the supplied crops from retained summaries that have not been independently checked in this audit. The Water Bureau passage (NEWS-003) is **outside** the supplied Oct. 3 crop. Its existing number must not be described as scan-verified.
- Cards without an embedded facsimile say so. A nearby or same-date front-page crop cannot substantiate an inside-page passage.
- The unverified Washington comparison link was removed from the active content; NEWS-001 now compares two portions of the same Oct. 3 article. The interface must explain that this is **not independent corroboration**.
- NEWS-009 is an editorial, not an official notice. Its official-placement eligibility was removed. NEWS-011 concerns **Chester**, not Philadelphia; its local-placement eligibility was removed and its regional label strengthened.
- NEWS-014’s unrelated C-014 claim reference was removed. Obsolete hidden `ideal` certainty labels were removed from all cards.
- Ungrounded quotation-style headline options in unverified inside-page readings were replaced with attributed summaries. Historical health advice remains source evidence, never current guidance.

### Primary-source locations

These are the newspaper pages corresponding to the supplied archival crops. The numeric corrections above were made by reading those existing images, not by trusting machine OCR.

- [Evening Public Ledger, October 3, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-03/ed-1/?sp=1)
- [October 4, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-04/ed-1/?sp=1)
- [October 5, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-05/ed-1/?sp=1)
- [October 7, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-07/ed-1/?sp=1)
- [October 8, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-08/ed-1/?sp=1)
- [October 9, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-09/ed-1/?sp=1)
- [October 10, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-10/ed-1/?sp=1)
- [October 12, 1918, p. 1](https://www.loc.gov/resource/sn83045211/1918-10-12/ed-1/?sp=1)

### Remaining limits for instructors

The core corpus is one commercial newspaper. Repeated reports from it are not independent agreement across Philadelphia’s press. Numerical claims remain what the paper reported, not validated epidemiological measurements. The internally verified cards are NEWS-001, NEWS-002, NEWS-007, NEWS-011, NEWS-012, NEWS-015, NEWS-017, and NEWS-018, plus the reveal. The remaining editorial readings need a fresh page-level transcription audit before exact wording is used in scholarly quotation. Current labels expose that limitation rather than silently certifying it.

---

## Gallery changes — 24 September 2026

These changes were made to the gallery copy. They do not come from the source project.

- **Images recompressed.** The eight embedded crops were scaled to 80% of their earlier pixel
  size (for example 900 to 720 pixels wide) and saved again as progressive JPEG at quality 60.
  This brought `game.html` from 5.06 MB to about 2.88 MB. The September 7 audit above was done
  on the earlier, larger images. The agent compared crops of the October 10 and October 12
  figures at both sizes (see `test-ledger.md`); a full re-reading of every crop at the new size
  has not been done.
- **NEWS-003 no longer shows an image.** Its passage is outside the October 3 crop, so the crop
  was removed from that card.
- **Model recall labelled.** Three context notes (NEWS-009, NEWS-014, NEWS-015) contained
  background not supported by any listed source. Each is now labelled "model recall
  (unverified)" in the game, and recorded as C-026 to C-028 above. C-029 records the same for
  the health director's first name in this file. Other context notes were not re-audited
  against the crops in this pass.
- **Timings.** The in-game "How to play" stage times now match the teacher guide's sixty-minute
  plan (8, 10, 15, 7, 12 minutes).
- **Sources screen.** It referred to a `HISTORY-AUDIT.md` file that is not in the gallery folder.
  It now points to this file.

