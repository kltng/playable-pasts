> **Gallery copy.** This history bible was written for the gallery from the game's source
> project, which is private. It copies citations from three files there: `content/sources.yaml`
> (the sources the game actually quotes), `research/notes/R1_case_timeline.md` (the case
> timeline and its list of disputed points), and `research/notes/R3_law_text.md` (the Code
> articles). Nothing here was added from memory. Where the source project leaves a point open,
> this file says so. Answers to the game's questions are left out on purpose.

# The Yang Naiwu Case (楊乃武案) — History Bible

Game built 25 September – 10 October 2026 · Published build of 27 September 2026 · Written for the gallery 13 October 2026

## Who did the research

AI agents did the research, and the source project records this openly. GLM-5.3 searched for
and downloaded the sources; Claude (the lead agent) divided the work, checked it and wrote the
game; Codex reviewed the design and the code. The owner, Kwok-leong Tang, made the decisions
about scope, audience and publishing. The work journal records no historian outside the
project reviewing the content.

Two safeguards are built into the project:

- **Every quotation is checked by a script.** The game has 163 quoted passages. Each one is
  copied by program from a downloaded copy of its source, and the build refuses a quotation
  that does not match that copy exactly. Each source file is fixed by a checksum (sha256), so a
  changed file is caught too.
- **Each chapter's history was checked by a second AI agent** (GLM), separate from the agent
  that wrote it. Checks are recorded in `research/qc/` of the source project.

These checks show that the quotations match the downloaded texts. They do not show that the
downloaded texts are good editions (see "Known problems" below), and they are not a review by
a historian.

## The sources the game quotes

All of these are listed in the source project's `content/sources.yaml`, with the URL, the
download date, and the rights note as recorded there. "Quoted" is the number of passages the
game quotes from that source.

### The case

| Source | Edition as recorded | Quoted | Rights as recorded |
|---|---|---|---|
| 光緒三年二月刑部定案奏摺 — Memorial of the Board of Punishments Settling the Case, Guangxu 3/2 (1877). https://zh.wikisource.org/wiki/光緒三年二月刑部定案奏摺 | Wikisource transcription in simplified characters (a few characters have OCR errors); downloaded 2026-09-25 | 88 | Qing official document, public domain (PD-QINGGov) |
| 光緒三年二月壬寅諭旨 — Edict of Guangxu 3/2, renyin day (1877). https://zh.wikisource.org/wiki/光緒三年二月壬寅諭旨 | Wikisource transcription in simplified characters; downloaded 2026-09-25 | 5 | Qing official document, public domain |
| 浙江餘杭楊詹氏二次叩閽原呈 — The Second Appeal to the Capital by Yang Zhanshi of Yuhang, Zhejiang. https://zh.wikisource.org/wiki/浙江餘杭楊詹氏二次叩閽原呈 | Wikisource text (Shenbao, 7–8 December 1874, without punctuation); downloaded 2026-09-25 | 10 | Shenbao text, anonymous work, public domain (PD-anon-80-1996) |
| 同治十三年九月都察院左都御史廣壽等奏摺 — Memorial of Guangshou and Others of the Censorate, Tongzhi 13/9 (1874). https://zh.wikisource.org/wiki/同治十三年九月都察院御史广寿等奏折 | Wikisource transcription in simplified characters; downloaded 2026-09-25 | 2 | Qing official document, public domain |
| 德宗景皇帝實錄 — Veritable Records of the Guangxu Emperor, juan 19, 20 and 40. https://zh.wikisource.org/wiki/德宗景皇帝實錄/卷19 ; https://zh.wikisource.org/zh-hant/德宗景皇帝實錄/卷20 ; https://zh.wikisource.org/wiki/德宗景皇帝實錄/卷40 | Wikisource text (juan 19 and 40 in simplified characters); downloaded 2026-09-25 | 4 | Qing official history, public domain |

### The Shenbao (申報)

All from Wikisource, OCR transcriptions with some characters missing, downloaded 2026-09-25,
recorded as anonymous works in the public domain. One passage quoted from each.

| Shenbao date | Title | URL |
|---|---|---|
| 6 January 1874 | 記禹航某生因姦謀命事細情 — A Detailed Account of the Yuhang Scholar's Murder for Adultery | https://zh.wikisource.org/wiki/記禹航某生因姦謀命事細情 |
| 13 January 1874 | 詳述禹航某生因姦謀命事案情 — More on the Case of the Yuhang Scholar | https://zh.wikisource.org/wiki/詳述禹航某生因姦謀命事案情 |
| 15 January 1874 | 禹航生並非監斃 — The Yuhang Scholar Did Not Die in Prison | https://zh.wikisource.org/wiki/禹航生並非監斃 |
| 10 December 1874 | 諭餘杭案 — On the Yuhang Case (an editorial; the title follows Wikisource, where 諭 is probably an error for 論) | https://zh.wikisource.org/wiki/諭餘杭案 |
| 11 February 1875 | 續述楊氏案略 — More on the Yang Case | https://zh.wikisource.org/wiki/續述楊氏案略 |
| 7 June 1875 | 諭旨預錄 — An Advance Copy of the Edict of Guangxu 1/4/25 (1875); 2 passages quoted | https://zh.wikisource.org/wiki/諭旨預錄 |
| 2 August 1875 | 審餘杭葛畢氏案雜闈 — Various Reports on the Trial of Ge Bishi of Yuhang (the title follows Wikisource, where 闈 is probably an error for 聞) | https://zh.wikisource.org/wiki/審餘杭葛畢氏案雜闈 |
| 14 August 1875 | 諭覆審餘杭絮 — Notes on the Retrial of the Yuhang Case | https://zh.wikisource.org/wiki/諭覆審餘杭絮 |
| 28 September 1875 | 訊案瑣述 — Small Notes on the Hearing | https://zh.wikisource.org/wiki/訊案瑣述 |

### Law and procedure

| Source | Edition as recorded | Quoted | Rights as recorded |
|---|---|---|---|
| 讀例存疑 — Xue Yunsheng, *Lingering Doubts after Reading the Substatutes*, juan 1, 39, 48, 49. http://www.terada.law.kyoto-u.ac.jp/dlcy/dlcy01eu.htm (and dlcy39eu, dlcy48eu, dlcy49eu) | Kyoto University electronic text (the Beijing printing of Guangxu 31, 1905; the website says the corrections are not finished); downloaded 2026-09-25 | 22 | Old text public domain; the electronic edition is Kyoto University scholarly material |
| 讀例存疑 juan 42. http://www.terada.law.kyoto-u.ac.jp/dlcy/dlcy42eu.htm | As above | 0 (basis of one note only) | As above |
| 大清律例・名例律 — Great Qing Code, General Principles. https://zh.wikisource.org/wiki/大清律例/名例律 | Wikisource text, saved as plain text (small notes in square brackets); downloaded 2026-09-25 | 4 | Public domain |
| 洗冤集錄 — *Collected Cases of Injustice Rectified*, juan 1–4. https://zh.wikisource.org/zh-hant/洗冤集錄/卷1 (and 卷2, 卷3, 卷4) | Wikisource text (from the line of the edition collated by Sun Xingyan); downloaded 2026-09-25 | 10 | Public domain |
| 汪輝祖《佐治藥言》 — Wang Huizu, *Advice on Assisting in Government*. https://zh.wikisource.org/zh-hant/佐治藥言 | Wikisource text; downloaded 2026-09-25 | 2 | Public domain |
| 清史稿・卷一百四十四（刑法志三） — *Draft History of the Qing*, juan 144 (Treatise on Law, part 3). https://zh.wikisource.org/zh-hant/清史稿/卷144 | Wikisource text (compiled officially under the Republic, 1914–1927); downloaded 2026-09-25 | 2 | Public domain |

The Code passages in the game include, among others, articles and substatutes under these
headings, as named in `R3_law_text.md` §1: under 名例律, 五刑 and 職官有犯 (with the
substatutes on degree holders); under 訴訟, 越訴 and 誣告; under 斷獄, 故禁故勘平人,
檢驗屍傷不以實 and 官司出入人罪.

### The epilogue

| Source | Kind | Quoted | Rights as recorded |
|---|---|---|---|
| 清史稿・卷四百四十七（楊昌濬傳） — *Draft History of the Qing*, juan 447 (Biography of Yang Changjun). https://zh.wikisource.org/zh-hant/清史稿/卷447 ; downloaded 2026-09-26 | Treated as research (an official history of the Republic) | 1 | Public domain |
| 劉體智《異辭錄》卷二 — Liu Tizhi, *Yicilu*, juan 2. https://zh.wikisource.org/zh-hant/異辭錄/卷二 ; downloaded 2026-09-26 | Treated as a popular account (second-hand anecdote) | 2 | Public domain |
| 張學勤〈清朝曾出現類「勞教」機構　楊乃武出獄後被送入〉 — Zhang Xueqin (2013), copying the Shenbao of 25 May 1897. *Yangcheng Evening News*, 2013-11-20, reprinted by China News Service: https://www.chinanews.com/cul/2013/11-20/5526917.shtml | Popular | 1 | Newspaper article, short quotation only |
| 黃南丁氏《楊乃武與小白菜》 — Huang Nanding, *Yang Naiwu and Little Cabbage* (a novel). https://zh.wikisource.org/wiki/楊乃武與小白菜 | Popular | 0 (basis only) | Public domain |
| Chinese Wikipedia, 楊乃武與小白菜案. https://zh.wikipedia.org/wiki/楊乃武與小白菜案 | Popular compilation | 0 (basis only) | CC BY-SA 4.0 |
| William P. Alford, "Of Arsenic and Old Laws" (1984), *California Law Review* 72.6, 1180–1256 | Research | 0 (basis only, not quoted) | Scholarly article |

## How the game marks what is documented

The game labels every passage by its **form**, and the project counts them like this:

| Form | What it means | Passages |
|---|---|---|
| Quotation | Original text from a source above, shown with its source. Students can switch it to a modern Chinese or an English version. | 155 |
| Paraphrase | The game's own retelling of a source, with the source named ("Based on …"). | 64 |
| Reconstruction | A scene, a line of dialogue or a document rebuilt from a source, where the original does not survive or was not collected. Marked "Reconstruction" with its basis. | 36 |
| Game fiction | Text invented for play. The label exists, but no passage in the content files uses it. | 0 |

Historical **statements** carry a second label: *established*, *recorded assertion* (someone
said it at the time; it may be false), *disputed*, or *inference*. There are 32 such
statements in the game. Some of these labels stay hidden until the student has answered the
question they would give away.

Things a historian should know about:

- **Two documents are reconstructed, and say so in their titles:** "Shen Yushi's First
  Petition to the County (reconstructed)" and "Joint Report of Hangzhou Prefecture and Yuhang
  County (excerpt, reconstructed)" in chapter 4. Neither original was collected; both are
  rebuilt from the 1877 memorial's account of them.
- **One witness line is an inference.** In chapter 4, one of Liu Xitong's statements is
  rebuilt from the memorial, which records no statement by him on that point. The game says
  this in the label.
- **The player's choices are counterfactual.** Inside each chapter the student may act
  differently from the real official. The game then shows what the real official did, with the
  source, and the next chapter starts again from the real history. The chapter structure, the
  five kinds of action, and the grading are teaching models, not a reconstruction of how any
  Qing office worked day to day.
- **Background summaries and "Notes on the options"** pages are written by the game.
- **All pictures are imagined.** 29 portraits and scenes were made with AI image generation,
  and 4 paper textures were made for the game. The game says: "All pictures are imagined
  illustrations based on the documents. They are not historical sources. No portrait of anyone
  in this case can be verified." The owner approved all 33 pictures on 2026-10-10.
- **Popular stories appear only as popular stories.** The epilogue sets some well-known
  legends about the case beside the archive and asks students to sort them. Those stories are
  labelled with their popular source.
- **The English is the project's own translation**, made by AI agents. Every translation is
  still marked "draft" in the source project.

## A short timeline

Dates below are as the source project records them in `R1_case_timeline.md` §1. Western dates
marked "converted" were worked out by the research agent from the Chinese calendar (method in
R1 §5.5; it says some are accurate to about ±1 day). This list only gives the steps of the
procedure; the game itself gives the findings.

| Chinese date | Western date | Step |
|---|---|---|
| 同治十二年十月初九日 | 1873-11-28 | Ge Pinlian dies in Yuhang |
| 十月十一日 | 1873-11-30 | Shen Yushi asks for an inquest; magistrate Liu Xitong holds it the same day |
| 十月二十日 | 1873-12-09 (converted) | Trial at Hangzhou prefecture |
| 同治十三年四月 | 1874-05 | First appeal to the capital (Yang Juzhen, through a proxy, at the Censorate) |
| 同治十三年九月二十日 | about 1874-10-30 (converted) | Second appeal to the capital (Zhan Caifeng, through a proxy) |
| 光緒元年四月二十五日 | about 1875-05-29 (converted) | Edict sends Hu Ruilan to retry the case |
| 光緒元年十月 | 1875 | Hu Ruilan's closing memorial (exact day uncertain, see below) |
| 光緒元年十二月 | early 1876 | Case sent to the Board of Punishments |
| 光緒二年九月十七日 | 1876-11-02 | Edict: Liu Xitong removed; the coffin brought to Beijing |
| 光緒二年十二月 | early 1877 | Coffin opened at Haihui Temple (海會寺), Beijing (exact day uncertain, see below) |
| 光緒二年十二月十六日 | 1877-01-29 | Edict on the re-examination |
| 光緒三年二月十六日 | 1877-03-30 | The Board's memorial and the final edict settle the case |

The official name of the case in the Board's memorial and the edicts is 「浙江民人葛品連身死案」
(R1 §0).

## Known problems and open questions

These come from the source project's own notes. They are not settled.

**About the texts**

1. **The transcriptions are modern and imperfect.** The Qing documents come from Wikisource,
   mostly in simplified characters, with OCR-type errors. The Shenbao reports are OCR
   transcriptions with missing characters. The research notes say the game's quotations should
   ideally be checked against photographic reprints of the Veritable Records and the Shenbao
   before formal use (R1, opening warning; `research/README.md`). This has not been done.
2. **The Code is the 1905 text, not the one used in 1873–1877.** The game quotes Xue Yunsheng's
   *Duli cunyi* (Beijing printing of 1905). The articles were not checked one by one against a
   Tongzhi-era printing of the Code (R3 §12.2 item 2). The Kyoto website also says its
   corrections are not finished.
3. **No legal text was found for the rule that a provincial graduate (舉人) must lose his degree
   before he can be tortured.** The case file shows the county asked to strip Yang Naiwu's degree
   first, and the heavy torture came at the prefecture. The game says the rule's text has not
   been found (R3 §12.2 item 3; design document, chapter 1).

**About the facts**

4. **Which office took the second appeal.** The Board's memorial says the Gendarmerie
   (步軍統領衙門); the Peking Gazette copy of Guangshou's memorial says the Censorate. The game
   keeps both (R1 §4 item 3).
5. **The day the coffin was opened.** Chinese Wikipedia and 五味知子's timeline both
   give 光緒二年十二月初九日 (1877-01-22). The primary documents do not record
   the day (R1 §4 item 13).
6. **The day of Hu Ruilan's closing memorial.** The research note gives 十月初三; the primary
   documents do not record it (design document, chapter 3).
7. **The names of Hu Ruilan's deputies** are spelled differently in the memorial, the
   Veritable Records and the edict (for example 邊葆城 / 邊葆諴 / 邊葆誠) (R1 §4 item 12).
8. **Ge Bishi's personal name.** Official documents call her only 葛畢氏 or 畢氏. The name
   畢秀姑 and the nickname "Little Cabbage" come from popular sources (R1 §4 item 10).
9. **Yang Naiwu's year of birth** is uncertain: the 1874 petition implies about 1839; popular
   works often say 1841 (R1 §4 item 9).
10. **Whether there was an affair.** The Board of Punishments found no proof and did not pursue
    it. The research note says the game should present it as a suspicion, not a fact (R1 §4
    item 1).
11. **Shenbao reports are partly hearsay.** Some vivid scenes in the Shenbao (for example the
    provincial judge's words to the prefect) are reports of what people said, and the project
    labels them so (R1 §4 item 6).

**Books the project could not get**

12. The three most important modern works have no legal full text online, and the project did
    not use them: 陸永棣《落日殘照》(2018), 王策來《楊乃武與小白菜案真情披露》(2002), and
    《浙江文史資料選輯》第52輯 (1993). The archive facsimile 《楊乃武小白菜奇案御檔》 (2003)
    could settle several small points. Weng Tonghe's diary was not available in full text
    (`research/README.md`).

## Review status in the source project

The source project tracks a review status for each historical statement and each translation.
As of 10 October 2026:

- **22 of 32 historical statements** are marked `history_checked` — checked by an AI agent
  (GLM) against the sources. **10 are still `draft`**: the four in chapter 1 and six of
  Liu Xitong's statements in chapter 4. The game shows draft statements as "Not yet checked".
- **Every English translation is `draft`.**
- The project's own "release" check, which requires all of these to be approved, **fails**
  (883 items, journal entry of 2026-10-10). So the game can only be built at the project's
  development level, which allows draft text. The published game is such a build.

Before quoting the game's English, or one of its "Not yet checked" statements, as fact in
class, check it against the source linked above.
