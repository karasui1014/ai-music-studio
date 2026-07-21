# 歌詞添削AI HANDOFF(モジュール専用)

既存曲の歌詞を読み込み、**作者の意図を残したまま**「歌いやすさ・リズム・一行の長さ・サビ・情景・独自性・繰り返し・AI音楽生成での扱いやすさ」を行単位で添削する内蔵ツール。
一般的な文章校正ツールではない。点数は出さず、3段階の状態表示+理由+具体的な修正候補で示す。

## 場所

| 役割 | ファイル |
| --- | --- |
| ページ(`#/tools/lyrics-review`) | `src/pages/tools/LyricsReviewPage.tsx` |
| 入力・結果Schema・検証 | `src/lib/tools/lyrics-review/types.ts` |
| 歌詞構造の認識/推定 | `src/lib/tools/lyrics-review/structure.ts` |
| 添削エンジン(モック=ルールベース) | `src/lib/tools/lyrics-review/analyze.ts` |
| 採用/却下→最終版の組み立て・差分行 | `src/lib/tools/lyrics-review/apply.ts` |
| サンプル入力(モック確認用) | `src/lib/tools/lyrics-review/sample.ts` |
| フォームUI | `src/components/tools/lyrics-review/LyricsReviewForm.tsx` |
| 結果UI(8セクション) | `src/components/tools/lyrics-review/LyricsReviewResultView.tsx` |
| 行単位差分+採用/却下UI | `src/components/tools/lyrics-review/LyricsDiffView.tsx` |
| 保存前の比較確認ダイアログ | `src/components/tools/lyrics-review/SaveToSongDialog.tsx` |
| テスト | `src/lib/tools/lyrics-review/__tests__/*.test.ts`(`npx vitest run src/lib/tools/lyrics-review`) |

導線: 制作ツール一覧(ベータ表示)/ 曲詳細・歌詞タブの「歌詞添削AIを開く」(`?song=<id>` 付き)。

## データの流れ

1. 曲選択(`?song=<id>`)→ `Song` から歌詞・ジャンルをフォームへ自動入力。Sunoプロンプト・MVプロンプト・履歴数は `LyricsReviewSongContext` として渡す。曲を選ばなくても使える。
2. 必須入力: 歌詞本文・ジャンル・感情・聴き手(`validateInput()`)。添削モード8種+強さ3段階。
3. `reviewLyrics(input, context, providerId)` → 現状 `reviewWithMock()` のみ(**決定的**: 同じ入力→同じ結果。乱数不使用、`input.seed`で回転)。
4. 結果は `validateResult()` でSchema検証(`LYRICS_REVIEW_SCHEMA_VERSION = 1`)してから `useToolRunStore.addRun()` で `LyricsReviewRunRecord` として保存。**`decisions`(行ごとの採用/却下/選択テキスト)もこのレコードに永続化**し、`updateRun()` で更新する。
5. 過去の実行は曲別(未選択時は曲なし実行のみ)にセレクタで再表示できる。古い/壊れた結果はSchema検証で弾き、再添削を促す。

## 添削エンジン(analyze.ts)の構造

- `collectLineHits()`: 行単位ルールの集合。各ヒットは `ruleId` / 問題 / 理由 / 候補(本命+別案) / 優先度 / 重み / keepNote(元のまま残す考え方)を持つ。**ルール追加はここに1件足すだけ**。
- 変換は文法を壊さない操作のみ: 読点・助詞位置での行分割(`splitLongLine`)、語尾スワップ(`swapEnding`)、埋め草除去、間投詞前置、辞書置換(硬い言葉/定番フレーズ/数字・英字の読み)、情景語の前置・並置(`IMAGERY_POOLS`)。
- `MODE_BOOST` でモードごとに関連ルールの重みを1.6倍。`light` は重み55未満を捨てる。`rewrite` は未対象行にも候補を出す。強さ(gentle/standard/bold)で件数上限。
- 残したい表現(`keepPhrases`)を含む行には**提案を出さない**。
- **存命アーティスト対策**: `ARTIST_STYLE_MAP` が名前入力(era/theme/genre/concern)を8つの一般要素(ジャンル/時代感/テンポ/感情/楽器/言葉の密度/抽象度/構成)へ変換し、`styleConversion` として明示。作風の再現はしない。
- `regenerateLineSuggestion()`: 「この行だけ再生成」= 候補リストの回転(決定的)。

## 構造認識(structure.ts)

- 見出し対応: `[Verse]` `【サビ】` `(Aメロ)` `Verse 1` `サビ2` `Chorus:` など(EN/JP、`HEADING_WORDS`)。
- 見出しが無い場合は空行ブロック+繰り返し検出で推定し、`explicit: false` → 結果の `structureEstimated: true`。**UIに「構造はAIの推定」バッジを必ず出す**。推定タグは最終版へ任意挿入できる(Switch)。

## 曲への保存(すべて確認つき・自動上書きなし)

- `SaveToSongDialog` が現在の歌詞と反映後を並べて表示してから実行:
  - **候補として保存**: `addLyricsVersion()`(`Song.lyricsVersions` へ。上限20件)
  - **置き換え**: 先に原文を `addLyricsVersion('添削前の歌詞(原文)')` で退避 → `updateLyrics()`
- どちらも `addToolHistory()` で制作履歴(`tool_run`)へ記録。
- 「添削前の原文に戻す」ボタン(ConfirmDialog付き)/ 歌詞タブの「歌詞バージョン」からも復元・削除できる(`restoreLyricsVersion` は現歌詞を自動退避)。
- 全文コピー(`CopyButton`)/ JSON書き出し(Blobダウンロード、run+decisions+finalLyricsを含む)。

## Song型への影響

`Song.lyricsVersions?: LyricsVersion[]` をオプショナル追加(`src/lib/types.ts`)。既存データは未定義のまま動く。`backup.ts` の `normalizeSong` にも1行追加済み。ツール固有の入力(感情・BPM等)はSong型に持たせず `LyricsReviewInput` 側で持つ(基盤HANDOFF準拠)。

## 未実装・接続口

- **外部AIプロバイダー**: `reviewLyrics()` が分岐口。追加時は `LyricsReviewInput`→`LyricsReviewResult` を実装し、`validateResult()` を必ず通すこと(Schema検証が防波堤)。
- モーラ数(拍)は文字数近似(`singableLength`)。かな変換による正確なモーラ計算は未実装。
- 英語主体の歌詞は未対応(日本語ヒューリスティック)。
- `bpm` / `duration` / `vocal` は保存されるが、現状ルールでは未使用(確信度の材料のみ)。

## 注意

- 提案文言は「AIの提案=絶対の正解ではない」前提の書き方を守る(keepNote必須、結果画面末尾の注意書きを消さない)。
- 既存アーティスト曲の歌詞・続き生成の用途は推奨しない(フォームに注意書きあり)。
- `useToolRunStore` の `DistributiveOmit` は消さないこと(ユニオンにツール固有フィールドを持つ場合に必要)。
