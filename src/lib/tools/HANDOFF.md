# 制作ツール共通基盤 HANDOFF

既存AI Music Studioに「スタジオ内蔵の制作ツール」を追加していくための共通基盤。
新しいツールを追加する開発者(またはAI)は、このファイルだけ読めば着手できる。

## 全体像

| 役割 | ファイル |
| --- | --- |
| ツールID・実行履歴の型 | `src/lib/tools/types.ts` |
| 内蔵ツールのレジストリ(一覧カードの元データ) | `src/lib/tools/registry.ts` |
| 共通AIプロバイダー定義 | `src/lib/tools/provider.ts` |
| 実行履歴ストア(localStorage永続化) | `src/store/useToolRunStore.ts` |
| 制作ツール一覧ページ(`#/tools`) | `src/pages/ToolsPage.tsx` |
| 各ツールのページ | `src/pages/tools/*.tsx` |
| 各ツールのロジック | `src/lib/tools/<tool-id>/` |
| 各ツールのUI部品 | `src/components/tools/<tool-id>/` |
| テスト(vitest) | `src/lib/tools/<tool-id>/__tests__/*.test.ts` |

## テスト

- `npm test`(= `vitest run`)。ロジック層(純関数)のみを対象とし、jsdomは使わない。
- テストファイルはアプリのビルド(型チェック)から除外済み(`tsconfig.app.json` の `exclude`)。
- 特定ツールだけ回す場合: `npx vitest run src/lib/tools/<tool-id>`。

## データ保存

- 実行履歴は `ToolRunRecord` として localStorage キー `ai-music-studio:tool-runs:v1` に保存(`STORAGE_KEYS.toolRuns`)。
- 上限100件。古いものから自動削除(`useToolRunStore` の `MAX_RUNS`)。
- バックアップ(JSON/ZIP)に `toolRuns` として含まれ、復元・全リセットにも対応済み(`src/lib/backup.ts`)。
- ツール固有フィールド(例: 歌詞添削AIの `decisions`)をレコードに持てるよう、`useToolRunStore` の `addRun`/`updateRun` は `DistributiveOmit` で型付けしている(消さないこと)。
- 開発憲章どおり、外部送信は一切しない。

## AIプロバイダー

- MVPでは外部AI APIを使わない(開発憲章)。プロバイダーは `mock`(端末内ルールベース)のみ。
- 将来AI APIを足す場合: `AiProviderId` にIDを追加 → `AI_PROVIDERS` にメタ情報を追加 → 各ツールの分析関数でプロバイダー分岐。APIキーの扱いは開発憲章「AI API・AI秘書について」を厳守。

## 新しいツールの追加手順

1. `src/lib/tools/types.ts` の `ToolId` にIDを追加し、`ToolRunRecord` ユニオンに実行レコード型を追加。
2. `src/lib/tools/<tool-id>/` にロジック(types/analyze等)を作る。UIは `src/components/tools/<tool-id>/`。
3. `src/pages/tools/<ToolName>Page.tsx` を作り、`src/App.tsx` にルート(`tools/<tool-id>`)を追加。
4. `src/lib/tools/registry.ts` の `STUDIO_TOOLS` に1件追加(`available: false` なら「準備中」カードになる)。
5. 実行結果は `useToolRunStore.addRun()` で保存。曲へ書き戻す時は必ず確認ダイアログ(`ConfirmDialog`)を挟み、既存データを自動上書きしない。
6. 曲の制作履歴へ記録する時は `useSongStore.addToolHistory()`(履歴タイプ `tool_run`)を使う。
7. ツール専用の `HANDOFF.md` を `src/lib/tools/<tool-id>/` に置く。
8. ロジック層の基本テストを `src/lib/tools/<tool-id>/__tests__/` に置く(vitest、`describe/it/expect` を明示import)。
9. AI風の構造化結果を返すツールは、結果Schemaに `schemaVersion` を持たせ、検証関数(`validateResult` 等)で表示前に検証する(歌詞添削AIの `src/lib/tools/lyrics-review/types.ts` が実例)。

## 曲詳細画面からの導線

`src/components/song-detail/OverviewPanel.tsx` に「この曲を制作ツールで改善する」カードがある。
歌詞に関わるツールは `src/components/song-detail/LyricsPanel.tsx`(歌詞タブ)からも開ける(歌詞添削AIが実例)。
MVに関わるツールは `src/components/song-detail/MvPromptsPanel.tsx`(MVタブ)からも開ける(MVアイデア生成AIが実例)。
ツール側は `?song=<songId>` クエリで曲を受け取り、自動入力する(HashRouterの `useSearchParams` を使用)。

## 歌詞バージョン(候補)

`Song.lyricsVersions?: LyricsVersion[]`(オプショナル・上限20件)に、歌詞の候補・退避版を保存できる。
`useSongStore` の `addLyricsVersion` / `removeLyricsVersion` / `restoreLyricsVersion` を使う。
既存歌詞を置き換えるツールは、**先に原文を `addLyricsVersion` で退避**してから `updateLyrics` すること(自動上書き禁止)。

## 守ること(開発憲章の要点)

- サーバー・ログイン・外部送信・新規大型依存の追加は禁止。
- 既存Song型を安易に肥大化させない(ツール固有の入力はツール側で持つ)。
- GitHub Pages(静的ホスティング+HashRouter)で動くこと。
