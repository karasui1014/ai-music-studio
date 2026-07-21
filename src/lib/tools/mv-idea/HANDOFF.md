# MVアイデア生成AI HANDOFF(モジュール専用)

曲の情報から「方向性の異なる3案」を出し、選んだ1案をショットリストつきのMV企画書へ展開する内蔵制作ツール。
アイデアの箇条書きではなく、画像生成→動画生成→編集へそのまま進める企画書を作るのが目的。

## 場所

| 役割 | ファイル |
| --- | --- |
| ページ(`#/tools/mv-idea`) | `src/pages/tools/MvIdeaPage.tsx` |
| 型・Schema検証・尺の解析 | `src/lib/tools/mv-idea/types.ts` |
| モック生成エンジン(3案/詳細/再生成/固有名詞変換) | `src/lib/tools/mv-idea/generate.ts` |
| ショット編集ヘルパー(純関数) | `src/lib/tools/mv-idea/shots.ts` |
| 書き出し(Markdown/JSON/CSV)・保存用テキスト | `src/lib/tools/mv-idea/export.ts` |
| 入力フォーム | `src/components/tools/mv-idea/MvIdeaForm.tsx` |
| 3案比較カード | `src/components/tools/mv-idea/ConceptCards.tsx` |
| 詳細企画書ビュー(結果画面の並び) | `src/components/tools/mv-idea/PlanDetailView.tsx` |
| ショット一覧+行アクション | `src/components/tools/mv-idea/ShotTable.tsx` |
| ショット編集ダイアログ(秒数変更含む) | `src/components/tools/mv-idea/ShotEditDialog.tsx` |
| 一貫性設定パネル | `src/components/tools/mv-idea/ConsistencyPanel.tsx` |
| 曲への保存ダイアログ(現在値/反映後の比較つき) | `src/components/tools/mv-idea/SaveToSongDialog.tsx` |
| テスト(vitest・25件) | `src/lib/tools/mv-idea/__tests__/` |

導線: 制作ツール一覧(`#/tools`)のカード / 曲詳細・MVタブの「MV企画を作る」(`?song=<id>` 付き)。

## データの流れ(2段階生成)

1. 曲選択(`?song=<id>`)→ 曲名・ジャンル・歌詞・(YouTube概要欄→曲の説明・媒体)を自動入力。Sunoプロンプト・既存MVプロンプト・YouTube情報・履歴数は `MvIdeaSongContext` として渡す。
2. 必須入力: 曲名/曲の説明/ジャンル/曲の感情/曲の長さ/公開予定の媒体 + 企画モード(7種)。`validateInput()` が判定。
3. **第1段階** `generateResult()` → `MvConcept[]`(3案)。モードごとの方向性プール(`MODE_POOLS`)から3つの異なる `MvApproach` を選ぶため、言い換えただけの類似案にならない。seedはプールのローテーションに使う(「別の方向性で作り直す」でseed+1)。
4. **第2段階** `expandConcept()` → `MvPlanDetail`。尺(`parseDurationSec`)からタイムラインブロックを作り、モード別の基準ショット秒数でショットを生成(上限24ショット、超える場合は基準秒数を伸ばす)。
5. 結果は `MvIdeaResult { schemaVersion, concepts, conversionNotes, selectedConceptId?, detail? }` として `useToolRunStore` に保存。**ショット編集・一貫性変更のたびに `updateRun` でresultを丸ごと更新**するので、リロードしても編集が残る。
6. 表示前に `validateConcepts()` / `validatePlanDetail()` でSchema検証(将来AIプロバイダーがJSONを返す時も同じゲートを通す)。

## ショット管理(shots.ts)

- すべて純関数。移動/複製/削除/秒数変更の後は `renumberAndRetime()` で「各ショットの秒数を保ったまま、編集前の先頭時刻を起点に番号と時間を詰め直す」。
- タイムラインブロック(`detail.timeline`)は企画時の設計図として残し、ショット編集では自動変更しない。
- 「一部再生成」は `regenerateShot(shot, approach, consistency, seedOffset)`。ページ側のカウンター(`regenSeedRef`)で毎回違う構図/カメラになる。

## 一貫性設定

- `MvConsistency`(登場人物/年齢層/髪型/衣装/表情/舞台/時代/色/光/レンズ感/質感/禁止事項)。
- プロンプトへの反映は `buildShotPrompts()` に一元化。`reapplyConsistency()` で1件、または全ショットへ再反映(手編集したプロンプトは上書きされる旨を確認ダイアログで警告)。
- 禁止事項は常に「実在の人物・有名人の顔/実在のロゴ・商標」を含み、ネガティブプロンプトへ入る。

## 固有名詞の変換(generate.ts `neutralizeStyleText`)

存命監督・映像作家・制作会社の名前(`STYLE_CONVERSIONS` 約15件)を検出したら、色/光/構図/編集速度/カメラワーク/質感/時代感/背景密度/キャラクター表現の一般要素へ置き換え、`conversionNotes` に変換メモを残してUIに表示する。作風の直接再現機能にはしないこと(要件)。表を増やす時も「名前→一般要素」の形を守る。

## 曲への保存(SaveToSongDialog)

4モードすべて保存前にプレビューを見せ、自動上書きしない。

- 新しい候補として保存 → `addMvPrompt()`(title: `MV企画: <企画タイトル>`、prompt: 全ショットの動画プロンプト連結 `makeCombinedVideoPrompt()`)
- 企画概要をMVメモへ保存 → `addMvPrompt()`(prompt: `makePlanMemoText()`。プロンプトではなくメモである旨をmemoに明記)
- 既存MVプロンプトを置き換え/追記 → 対象を選択し**現在値と反映後を並べて表示**してから `updateMvPrompt()`
- どのモードでも `addToolHistory()` で制作履歴(`tool_run`)に記録。履歴だけの記録は詳細ビューの「制作履歴へ記録」(ConfirmDialog付き)。

## 書き出し(export.ts)

- Markdown: 結果画面と同じ順序(3案→全体像→世界観→時系列→ショット→画像P→動画P→素材→チェックリスト→サムネ案→Shorts案→一貫性設定)。
- JSON: `{ tool:'mv-idea', version, meta, input, result }` をそのまま(再取り込み・他ツール連携用)。
- CSV: ショット一覧15列。Excel互換のためBOM+CRLF、`csvCell()` でエスケープ。
- ダウンロードは `downloadTextFile()`(Blob+aタグ。GitHub Pages互換、外部送信なし)。

## 未実装・接続口(後続タスク候補)

- **実際の画像/動画生成・動画生成APIの本番接続**: 対象外(要件)。将来足す場合は `provider.ts` にプロバイダーを追加し、`generateResult`/`expandConcept` と同じ入出力型で分岐 → `validateConcepts`/`validatePlanDetail` を必ず通す。
- 音源の自動解析・映像の自動編集・実在人物の顔生成: 対象外(要件)。
- ショットのドラッグ&ドロップ並べ替え(現状は上下ボタン)。
- 歌詞動画モードで歌詞の行をショットへ自動割り付け(現状は歌詞を素材リストと字幕チェックに使うのみ)。
- タイムラインブロックの手動編集UI。
- モックのプロンプトはテンプレ英語+入力日本語の混在。語彙表(`MOOD_TOKENS`/`COLOR_TOKENS`)を増やすと精度が上がる。

## 注意

- `MvIdeaInput` はツール専用。Song型へフィールドを移さない(基盤HANDOFF)。
- `MvIdeaResult` は `input`+`result` を持つ形を守る(`backup.ts` の `normalizeToolRun` が `input`/`result` の存在で正当性判定するため。壊すとバックアップ復元時にレコードが捨てられる)。
- 詳細企画書つきレコードは1件20〜40KB程度。実行履歴は上限100件で自動削除されるが、localStorage容量が気になる場合は古い実行を手動削除できる(実行履歴セレクタ→今後の改善候補)。
