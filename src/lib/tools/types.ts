import type { AiProducerInput, AiProducerResult } from '@/lib/tools/ai-producer/types'
import type {
  LineDecision,
  LyricsReviewInput,
  LyricsReviewResult,
} from '@/lib/tools/lyrics-review/types'
import type { MvIdeaInput, MvIdeaResult } from '@/lib/tools/mv-idea/types'

/** 内蔵制作ツールのID。新しいツールを追加したらここへ足す */
export type ToolId = 'ai-producer' | 'lyrics-review' | 'mv-idea'

/**
 * AIプロバイダーのID。
 * MVPでは外部AI APIを使わないため 'mock'(端末内ルールベース分析)のみ。
 * 将来サーバーレス経由のAIを足す場合もこの型に追加するだけで済む。
 */
export type AiProviderId = 'mock'

interface ToolRunRecordBase {
  id: string
  toolId: ToolId
  /** 曲を選ばずに実行した場合は undefined */
  songId?: string
  /** 実行時点の曲名スナップショット(曲が後で改名・削除されても履歴が読める) */
  songTitle: string
  provider: AiProviderId
  createdAt: string
}

export interface AiProducerRunRecord extends ToolRunRecordBase {
  toolId: 'ai-producer'
  input: AiProducerInput
  result: AiProducerResult
}

export interface LyricsReviewRunRecord extends ToolRunRecordBase {
  toolId: 'lyrics-review'
  input: LyricsReviewInput // 原文・添削モードを含む
  result: LyricsReviewResult // 添削後全文・Schemaバージョンを含む
  /** 行ごとの採用/却下の記録(あとから見返せる) */
  decisions: LineDecision[]
}

export interface MvIdeaRunRecord extends ToolRunRecordBase {
  toolId: 'mv-idea'
  input: MvIdeaInput
  /** 3案+選択した案の詳細企画書。ショット編集のたびにupdateRunで丸ごと更新する */
  result: MvIdeaResult
}

/** ツール実行履歴。ツールが増えたらユニオンに追加する */
export type ToolRunRecord = AiProducerRunRecord | LyricsReviewRunRecord | MvIdeaRunRecord
