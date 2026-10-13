> **Gallery copy.** The source project has no separate history bible. Its historical notes are
> in its README (section "Historical scope and editorial decisions"), in
> `assets/sources/provenance.json`, and in the game's own Sources & glossary screen. An agent
> gathered them here on 13 October 2026 from the `codex/historical-bilingual-pilot` branch of
> the `yzgt-codex` repository (last commit `2446d64`, 9 October 2026). Nothing below adds a
> source that the repository does not name. Anything not found in the repository is marked
> **unverified**.

# Courtroom Reversal (逆轉公堂) — History Bible

## Purpose

The game teaches one habit of source criticism: agreement and repetition are not the same as
proof. It uses the Yang Naiwu and Xiaobaicai case (楊乃武與小白菜案), 1873–1877, because the
official record of that case shows, step by step, how one unsafe statement supported the next.
The courtroom, the lawyer, and the dialogue are a teaching frame, not a reconstruction of any
real hearing.

## The source

The game uses **one** historical source. The repository records it like this, in
`assets/sources/provenance.json`:

| Field | Value as recorded |
|---|---|
| Title | 光緒三年二月刑部定案奏摺 |
| URL | https://zh.wikisource.org/wiki/光緒三年二月刑部定案奏摺 |
| Archived | 2026-09-25 |
| Upstream project | `qing_court_game` |
| Upstream commit | `7048e2f` |
| Upstream path | `research/sources/case/ws_光緒三年二月刑部定案奏摺.html` |
| Upstream SHA-256 | `379d4880e0e0745322ab858761fc5ab5ce5d76aeaa38c0a75d5669785b2d5964` |
| Local SHA-256 | `899c9eb7ba8710294b72062d5bb0bfb51392e43a22ce1e353104fab644e8c817` |
| Extraction | "HTML paragraph text from opening memorial paragraph through closing petition. Site footer excluded. Simplified-character transcription retained." |
| Rights | "Underlying Qing government text is public domain; Wikisource transcription may contain errors." |
| Editorial | "Game explanations and English translations are newly authored. Not checked against an archival facsimile." |

In English the game calls it the "Board of Punishments case-settlement memorial, Guangxu 3/2
(1877)". The transcription opens with 光绪三年二月刑部尚书皂保等奏, so the memorial is presented
by the Board under its president Zaobao (皂保) and others. The year 1877 is the repository's
own conversion of Guangxu 3; this listing did not check the exact Western date of the second
month.

The local copy is `assets/sources/memorial-1877.txt`. The game also ships a reading page,
`assets/sources/memorial-1877.html`, built from that text by `scripts/build_source.py`. Students
can open it from the Sources & glossary screen without the internet. The online Wikisource link
needs the internet.

**What kind of source it is.** It is an official, retrospective account written by the office
that reversed the verdict. It is not a transcript of any hearing. It has its own point of view:
for example, it says the earlier officials did not act from malice (先后承审各员尚非故勘故入).
The game says this kind of thing plainly: "The official closing account also has its own
perspective."

**What has not been checked.** The Wikisource transcription has not been compared with an
archival copy of the memorial. The full text keeps apparent errors, punctuation, and character
forms. For example, it spells the attendant's name both 沈采泉 and 沈彩泉.

## The twelve quotations

The game quotes twelve short passages in their original simplified characters. The test
`tests/content.test.cjs` checks that each one appears word for word in the local transcription,
and that the transcription matches its recorded hash. An agent re-ran that test on 13 October
2026 and it passed (see `test-ledger.md`).

| Where in the game | Record | Quotation |
|---|---|---|
| Chapter 1 | The initial denial | 及钱宝生到县，供无其事，且称：“名唤钱坦，并无宝生名字。” |
| Chapter 1 | How he heard the prior account | 陈竹山详述杨乃武供词，并称：“卖砒毒鼠，不知害人，不过枷责罪名，劝其尽可承认。”钱宝生依从，随照杨乃武所供，出具“卖砒”等语 |
| Chapter 1 | A statement without confrontation | 未令钱宝生与杨乃武对质，仅将其甘结送府，陈鲁即据县讯甘结定案 |
| Chapter 2 | The needle was not washed | 称系砒毒，互相争论，未将银针用皂角水擦拭 |
| Chapter 2 | The reported washing | 捏称“银针已用皂角水擦洗，青黑不去” |
| Chapter 2 | No definite poison identified | 沈祥不能执定何毒，含糊报称服毒身死 |
| Chapter 3 | Absent from the first petition | 检查沈喻氏控县初呈并无是语 |
| Chapter 3 | Coercion at the initial hearing | 当将葛毕氏带回县署审问，供不知情，加以刑讯，葛毕氏受刑不过 |
| Chapter 3 | Review without re-examination | 未究仵作，未加复验，昼夜熬审，杨乃武、葛毕氏仍复诬认 |
| Final screen | The later official finding | 验明葛品连尸骨委系无毒，因病身死 |
| Final screen | The limits of vindication | 虽无奸私实据，究属不守妇道 |
| Final screen | The limits of vindication | 业已革去举人，免其再议 |

The table copies the game's text exactly. The test checks the game's files, not this table.

The test checks only that the Chinese words are in the transcription. It does **not** check
that the English translation or the Traditional Chinese explanation of each passage is right.
No historian has read the explanations against the memorial yet.

## Claims ledger

**Documented** means the claim is in the memorial transcription. **Game's own** means the
repository states it but this listing did not trace it to the memorial. **Invented** means a
teaching device that the game labels as fiction. **Unverified** means it is not supported by
anything in the repository.

| # | Claim in the game | Status | Note |
|---|---|---|---|
| C-01 | Ge Pinlian died in Yuhang, Zhejiang; Ge Bishi and Yang Naiwu were accused of poisoning him | Documented | 浙江余杭县民妇葛毕氏毒毙本夫一案 |
| C-02 | The death was in 1873 | Game's own | The game writes 同治十二年（1873）. The memorial gives the marriage in 同治十一年 and later events in 十二年, without repeating the reign name. The conversion to 1873 is the game's; it was not checked with a calendar tool for this listing |
| C-03 | Qian Baosheng first denied the sale and gave his name as Qian Tan | Documented | Quotation, chapter 1 |
| C-04 | Chen Zhushan recounted Yang's confession to Qian and urged him to admit the sale | Documented | Quotation, chapter 1 |
| C-05 | Qian was not confronted with Yang; Prefect Chen Lu settled the case on Qian's signed statement | Documented | Quotation, chapter 1 |
| C-06 | Yang confessed to buying arsenic out of fear of torture | Documented | 杨乃武畏刑诬服. Yang's spoken line in the prison scene is invented (C-17) |
| C-07 | The needle was not wiped with soap-pod water at the scene, but the report said it was | Documented | Two quotations, chapter 2 |
| C-08 | The examiner Shen Xiang could not identify a poison but reported death by poison | Documented | Quotation, chapter 2 |
| C-09 | Shen Xiang and the attendant Shen Caiquan disagreed about the poison | Documented | 门丁沈采泉 … 互相争论 |
| C-10 | The Board found the claim of an elicited confession absent from Shen Yushi's first petition | Documented | Quotation, chapter 3 |
| C-11 | Ge Bishi first denied knowledge, then was tortured and could not endure it | Documented | Quotation, chapter 3 |
| C-12 | Hu Ruilan's review did not re-examine the remains and used prolonged questioning; both confessed again | Documented | Quotation, chapter 3 |
| C-13 | The Board's re-examination found no poison and death by illness | Documented | Quotation, final screen. The game says this is a historical finding, not a modern diagnosis |
| C-14 | The memorial still censured Ge Bishi and proposed punishment, and did not restore Yang's degree | Documented | Two quotations, final screen. The game adds that a proposed penalty is not proof it was carried out, and notes the commutation and redemption arrangements in the text (分别折责进取赎银) |
| C-15 | The Airentang pharmacy (愛仁堂) | Documented | 仓前地方有钱姓爱仁堂药铺 |
| C-16 | The name "Xiaobaicai" (小白菜) | Unverified | Not in the memorial. The game calls it "the familiar name". It comes from later popular tradition; this listing has no source for it in the repository |
| C-17 | All spoken dialogue, including lines for Yang Naiwu, Qian Baosheng and Ge Bishi | Invented | Labelled in the game: "Reconstructed dialogue · Not a historical quotation" |
| C-18 | Cheng Yilong, a modern lawyer | Invented | Labelled in the game's opening framing. Carried over from the earlier, novel-based version |
| C-19 | Three hearings, each a single courtroom session | Invented | The game says the real reviews took years |
| C-20 | In chapter 2 the presiding official reads claims from the file | Invented | The game says these are not Shen Xiang's verbatim testimony, and does not show a portrait of the examiner |
| C-21 | The player sees records together that people at the time did not | Invented | The game says so in chapter 1 |
| C-22 | Witness claims that the player challenges ("no one told me", "repetition means it was voluntary") | Invented | The README calls these "constructed puzzle claims, not quotations" |
| C-23 | Chapter order (statement, then examination, then confession) | Invented | The game says the chapters follow the questions backward, not the order of events |
| C-24 | Glossary definitions (甘結, 對質, 刑部, 仵作, 相驗／覆驗, 詳稿, 葛畢氏) | Game's own | Written for the game; not checked for this listing |

## What remains from the novel-based original

The `main` branch of the same repository holds an earlier game, made in May 2026, based on a
late Qing novel about the case. Its notice links to the Chinese Text Project
(中國哲學書電子化計劃, `https://ctext.org/wiki.pl?if=gb&res=973161`) as the source of the story.
The repository also contains a novel text, `ylmyxbc.txt`, whose preface names two novels (by
黃南丁氏 and by 靈岩樵子). This listing did not check whether that file is the same text as the
ctext page: **unverified**.

**Kept in this edition:**

- The courtroom background (`assets/courtroom-key-art.png`) and the character sprite sheets in
  `assets/characters/`. The old notice says the characters, script, and art were "adapted and
  generated by this project" (本專案改編與生成). The repository does not say which tool made the
  images, or under what terms. This edition uses five of the sheets (Cheng Yilong, the
  presiding official, Yang Naiwu, Qian Baosheng, Ge Bishi). Two others (`liu-sheet.png`,
  `sangu-sheet.png`) are still in the folder but are not shown.
- The fictional lawyer Cheng Yilong.
- The game mechanics: investigation, pressing, presenting evidence, and court standing.
- The colour palette and much of the page styling.

**Dropped in this edition:**

- The novel's plot, including the magistrate's son as the real murderer and a forged pharmacy
  ledger. One wrong closing choice names the magistrate's son, so that the game can explain
  why a novel's plot cannot fill a gap in the evidence.
- The novel text as a source. `ylmyxbc.txt` is still in the repository, but the game does not
  load it and the packaging script does not copy it.
- The old link to ctext.org, and the old page's Google Analytics script. The source project's
  test checks that the analytics script is gone.

## Sensitive content

The game mentions torture, a death, an accusation of adultery, and the memorial's judgment of
Ge Bishi's conduct. It does not describe violence in detail. The final screen points students
to the gender and moral judgments inside the official finding.

## For anyone editing the game

Keep the rule the source project follows: every Chinese quotation must appear word for word in
`assets/sources/memorial-1877.txt`, and the test will fail if it does not. If the transcription
itself changes, rebuild the reading page with `scripts/build_source.py` and update the hash in
`provenance.json`. New background facts that do not come from the memorial must be labelled in
the game, and added to the ledger above as unverified until checked.
