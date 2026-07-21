import type { AiProviderId } from '@/lib/tools/types'

export interface AiProviderMeta {
  id: AiProviderId
  name: string
  description: string
  available: boolean
}

/**
 * 共通AIプロバイダー一覧。
 * 開発憲章によりMVPでは外部AI APIへ接続しないため、内蔵のルールベース分析のみ。
 * 将来AI APIを追加する場合はここへメタ情報を足し、各ツールの分析関数で分岐する。
 */
export const AI_PROVIDERS: AiProviderMeta[] = [
  {
    id: 'mock',
    name: 'スタジオ内蔵分析(オフライン)',
    description:
      'ルールベースで端末内だけで分析します。データは外部へ一切送信されません。',
    available: true,
  },
]

export const DEFAULT_PROVIDER_ID: AiProviderId = 'mock'

export function getProviderMeta(id: AiProviderId): AiProviderMeta {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0]
}
