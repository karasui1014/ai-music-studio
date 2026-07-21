# AIプロデューサー HANDOFF(モジュール専用)

曲・歌詞・Sunoプロンプトを分析し、「次に直すこと」を提示する内蔵制作ツール。
採点ツールではなく、改善アクションの提示が目的。

## 場所

| 役割 | ファイル |
| --- | --- |
| ページ(`#/tools/ai-producer`) | `src/pages/tools/AiProducerPage.tsx` |
| 入力・結果の型/必須チェック | `src/lib/tools/ai-producer/types.ts` |
| 分析エンジン(モック=ルールベース) | `src/lib/tools/ai-producer/analyze.ts` |
| バージョン比較 | `src/lib/tools/ai-producer/compare.ts` |
| フォームUI | `src/components/tools/ai-producer/AiProducerForm.tsx` |
| 結果UI+反映アクション | `src/components/tools/ai-producer/AiProducerResultView.tsx` |
| 比較UI | `src/components/tools/ai-producer/RunComparisonView.tsx` |

導線: 制作ツール一覧(`#/tools`)のカード/曲詳細・概要タブの「この曲を制作ツールで改善する」(`?song=<id>` 付き)。

## データの流れ

1. 曲選択(`?song=<id>`)→ `Song` から歌詞・最新Sunoプロンプト・ジャンルをフォームへ自動入力。MVプロンプト・YouTube情報・ステータス・履歴数は `AiProducerSongContext` として分析に渡す。
2. 必須入力: 曲の狙い/想定する聴き手/公開予定の媒体 + (歌詞・Sunoプロンプト・説明のいずれか)。`validateInput()` が判定。
3. `analyzeWithMock(input, context)` が `AiProducerResult` を返す(完全に端末内・決定的)。
4. 結果は `useToolRunStore.addRun()` で `AiProducerRunRecord` として自動保存(localStorage、上限100件、バックアップ対象)。
5. 同じ曲の過去実行があれば `compareRuns(前回, 今回)` で「改善した項目/継続している課題/次に直す項目」を表示。

## 分析エンジン(analyze.ts)の構造

- `collectSuggestions()`: ルールの集合。各提案は安定した `ruleId` を持ち(比較に使う)、問題/理由/直し方/修正例/優先度(now|later)/期待できる変化を必ず含む。ルール追加はここに `RuleHit` を1件足すだけ。
- `buildRevisedPrompt()`: 既存プロンプトに不足要素(ジャンル/mood/BPM/楽器)を追記して修正版を組み立てる。何を変えたかを `revisedPromptNotes` に残す。
- `pickRotated()` + `input.seed`: 「一部だけ再生成」(`regenerateSection()`)はseedを+1してサビ案・タイトル案・修正版プロンプトだけ作り直す。
- 確信度は入力の充足数で high/medium/low を判定。

## 曲への反映(書き戻し)

すべて確認ダイアログ付き。既存データの自動上書きはしない。

- 修正版プロンプト → `addSunoPrompt()` で**新規追加**(既存プロンプトは残す)
- タイトル案 → `updateBasicInfo()` で曲名変更 + `addToolHistory()` で履歴記録(旧タイトルも履歴に残す)
- 要約 → `addToolHistory()`(履歴タイプ `tool_run`、アイコンは `HISTORY_ICON.tool_run`)

## 未実装・接続口

- **音源アップロード分析**: フォーム下部に案内枠のみ(接続口)。実装する場合もローカル解析(Web Audio API等)に限ること。
- **外部AIプロバイダー**: `provider.ts` 参照。現状は `mock` のみ。追加時は `analyzeWithMock` と同じ入出力型(`AiProducerInput`→`AiProducerResult`)を実装して分岐する。
- 曲の長さ(`duration`)は現状ルールで未使用(入力としては保存される)。

## 注意

- モック分析は日本語UI前提のヒューリスティック。キーワード表(GENRE_WORDS等)を増やすと精度が上がる。
- `AiProducerInput` はツール専用の型。Song型へフィールドを移さないこと(基盤HANDOFF参照)。
