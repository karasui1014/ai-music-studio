# プロンプト図鑑 HANDOFF(モジュール専用)

AI音楽制作に使えるプロンプトを、ジャンル・感情・用途などから探し、
「どんな条件で使い・何が成功しやすく・どう調整するか」まで学べる図鑑。
検索した結果を既存曲のSunoプロンプトへ反映できる(自動上書きなし)。

## 場所

| 役割 | ファイル |
| --- | --- |
| ページ(`#/tools/prompt-dex`) | `src/pages/tools/PromptDexPage.tsx` |
| 型・BPM帯/ボーカル定義・検証・正規化 | `src/lib/tools/prompt-dex/types.ts` |
| 初期収録データ(builtin 15件) | `src/lib/tools/prompt-dex/data.ts` |
| データ取得層(builtin+ユーザー、JSON入出力) | `src/lib/tools/prompt-dex/repository.ts` |
| 絞り込み・並び替え・関連・AIプロデューサー連携 | `src/lib/tools/prompt-dex/search.ts` |
| ストア(自分用/お気に入りの永続化) | `src/store/usePromptDexStore.ts` |
| 一覧カード | `src/components/tools/prompt-dex/PromptCard.tsx` |
| 絞り込みパネル | `src/components/tools/prompt-dex/PromptFilters.tsx` |
| 詳細ダイアログ | `src/components/tools/prompt-dex/PromptDetailDialog.tsx` |
| 自分用の追加/編集 | `src/components/tools/prompt-dex/PromptEditDialog.tsx` |
| 既存曲への反映(置換/追記/候補) | `src/components/tools/prompt-dex/ApplyToSongDialog.tsx` |
| JSON書き出し/読み込み | `src/components/tools/prompt-dex/ImportExportButtons.tsx` |
| テスト | `src/lib/tools/prompt-dex/__tests__/{search,types}.test.ts` |

導線: 制作ツール一覧(`#/tools`)/ 曲詳細・Sunoタブの「プロンプト図鑑」ボタン(`?song=<id>`)/ AIプロデューサー結果の「プロンプト図鑑で探す」。

## データモデル(PromptEntry)

`types.ts` 参照。必須の学び項目として `successPoints`(成功点)/`failurePoints`(失敗点)/
`adjustments`(調整方法)を持つ。`source` は `builtin | user | from-ai-producer | imported` の4種。
`schemaVersion`(現在1)と `version`(コンテンツのバージョン文字列)は別物。

- **BPM帯**: 数値ではなく `BPM_BANDS` の value(`slow|mid|upper|fast`)を1つ持つ。数値からは `bpmToBand()` で変換。
- **ボーカル**: `VOCAL_OPTIONS` の value(`female|male|mixed|instrumental`)。

## データ取得層の分離(将来のDB移行)

`repository.ts` の `PromptDexRepository` インターフェースが builtin とユーザーデータを抽象化している。
builtin をリモートJSONや外部DBへ移す場合は、この実装(`LocalPromptDexRepository`)を差し替えるだけで
ストア/UIは変更不要。`getBuiltins()` を async 化する場合はストアの `hydrate` を非同期にする。

## 保存方式(ブラウザ内)

- 自分用プロンプト: localStorage `ai-music-studio:prompt-dex:user:v1`(`STORAGE_KEYS.promptDexUser`、上限500件)
- お気に入りID: localStorage `ai-music-studio:prompt-dex:favorites:v1`(builtin/自分用どちらのIDも入る)
- 全体バックアップ(JSON/ZIP)へ `promptDex: { entries, favorites }` として含まれ、復元・全リセットにも対応済み(`src/lib/backup.ts`)。古いバックアップに無くても壊れない。
- ツール単体のJSON入出力は `repository.ts` の `buildExport()` / `parseImport()`(配列でもラッパー `{entries:[]}` でも読める。取り込み時 source は `imported` に統一、本文重複はスキップ)。

## 検索方式

- 状態はURLクエリに保持(`?keyword=&genre=&emotion=&use=&vocal=&bpm=&service=&tag=&fav=1&sort=&id=&song=`)。ブックマーク・共有・戻る操作に対応。
- `search.ts` の `filterAndSort()` が絞り込み+並び替え。`matchesFilters()` はキーワードAND検索+各facet完全一致。
- `relatedEntries()` はジャンル/サブジャンル/感情/用途/タグ/BPM/ボーカルの重なりでスコアリング。
- `?id=<entryId>` で詳細ダイアログを開く(ディープリンク可)。`?song=<id>` は反映先の既定曲。

## 既存曲への反映(ApplyToSongDialog)

`useSongStore` の `addSunoPrompt`(新規候補)/ `updateSunoPrompt`(置換・追記)を使用。
必ず反映先の曲・現在値・反映後を見せてから保存し、自動上書きしない。保存時は
`addToolHistory`(履歴タイプ `tool_run`)で制作履歴へ記録。コピーは `CopyButton`。

## AIプロデューサー連携

`search.ts` の `criteriaToFilters()` / `buildProducerSearchQuery()` が変換インターフェース。
扱う条件: ジャンル・感情(狙いaimから推定)・用途(媒体mediaから推定)・BPM帯(数値→帯)・ボーカル・問題の種類(target→タグ)・タグ。
`AiProducerResultView.tsx` は結果の「最も大きな問題」下にリンクを1つ追加しているだけ(AIプロデューサー側のロジックは不変)。

- **注意**: 自動生成リンクは意図的に genre+emotion+use の3条件のみ渡す。15件の小さなデータで
  facet を増やしすぎると0件になりやすいため。`criteriaToFilters()` 自体は bpm/vocal/tag/problem も
  引き続きサポートしており(ユニットテスト済み)、データが増えたらリンク側の条件も足せる。
- 曲のジャンルは自由入力なので、`GENRE_ALIASES` で英語/ローマ字→日本語へ寄せ、
  既知ジャンルに一致しない場合はジャンル絞り込みを外す(0件化の防止)。エイリアス表は増やせる。

## サンプルデータの構成(builtin 26件・Suno/Udio作り分け)

主要ジャンルは **Suno向け** と **Udio向け** をペアで収録(`services` が `['Suno']` / `['Udio']`)。
両ツールで「効き方」が違うため、プロンプト本文・成功点・失敗点・調整方法をサービス別に書き分けている。

- **Suno**: スタイル欄は4〜7語のカンマ区切り(ジャンル→テンポ→楽器→ボーカル→質感→雰囲気)。
  BPMは目安。不要な音は Style ではなく **Exclude Styles 欄**へ。構成は歌詞欄の `[Verse]`/`[Chorus]`、
  歌なしは Instrumental トグル + `[Instrumental]`。BPM/構成タグは確定ではなく確率的ヒント。
- **Udio**: 情景を文章で描写する自然言語型(セッションミュージシャンに指示する感覚)。
  **Prompt Strength** で忠実度を調整、強調語は繰り返す、精密制御は **Manual Mode**(タグのみ)。

収録ジャンル: J-POP、バラード、ロック、アニソン、Lo-fi(作業/Shorts)、EDM(フェス/フューチャーベース)、
ゲーム音楽(オーケストラ/チップチューン)、作業用BGM(アンビエント)、Shorts向け、
インストゥルメンタル(アコギ)、シティポップ、R&B。存命アーティストの模倣は含まない(色・雰囲気・構成で表現)。
出典リサーチ: Suno/Udio 各公式・解説ガイド(2026-07時点)。タイトル頭に `【Suno】`/`【Udio】` を付けて区別。

## 今回実装しない範囲 / 後続への改善作業

- 投稿コミュニティ・サーバー・認証・外部AI API(禁止事項どおり未実装)。
- 音源アップロードやプロンプトの自動生成は無し(図鑑は人手のキュレーション前提)。
- **後続で検討**:
  - builtin データの拡充(ジャンル網羅・Udio以外のサービス・BPMの実数併記など)。増えたら
    AIプロデューサー自動リンクに bpm/vocal も足すと精度が上がる。
  - タグ/感情/用途の複数選択(現在は各1つ)。
  - 一覧の仮想スクロール(件数が数百件規模になった場合)。
  - `GENRE_ALIASES` と `AIM_EMOTION_MAP` / `MEDIA_USE_MAP` の拡充(`search.ts`)。
  - builtin を外部JSON化して `repository.getBuiltins()` を async 取得に変更(DB移行の第一歩)。
