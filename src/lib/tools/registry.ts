import { Clapperboard, Library, NotebookPen, Wand2 } from 'lucide-react'

import type { ToolId } from '@/lib/tools/types'

export interface StudioToolDef {
  id: ToolId
  name: string
  description: string
  icon: typeof Wand2
  route: string
  available: boolean
  /** 「ベータ」などの補足バッジ(任意) */
  badge?: string
}

/** 内蔵制作ツールのレジストリ。ツール追加時はここへ1件足し、App.tsxへルートを追加する */
export const STUDIO_TOOLS: StudioToolDef[] = [
  {
    id: 'ai-producer',
    name: 'AIプロデューサー',
    description: '曲、歌詞、生成プロンプトを分析し、次に直すべきポイントを提案します。',
    icon: Wand2,
    route: '/tools/ai-producer',
    available: true,
  },
  {
    id: 'lyrics-review',
    name: '歌詞添削AI',
    description: '保存済みの歌詞を読み込み、作者の意図を残したまま歌いやすさ・サビ・情景を改善します。',
    icon: NotebookPen,
    route: '/tools/lyrics-review',
    available: true,
    badge: 'ベータ',
  },
  {
    id: 'mv-idea',
    name: 'MVアイデア生成AI',
    description: '曲の情報から方向性の異なる3案を出し、ショットリストつきのMV企画書へ展開します。',
    icon: Clapperboard,
    route: '/tools/mv-idea',
    available: true,
    badge: 'ベータ',
  },
  {
    id: 'prompt-dex',
    name: 'プロンプト図鑑',
    description: 'ジャンル・感情・用途から使えるプロンプトを探し、条件・成功のコツごと既存曲へ反映します。',
    icon: Library,
    route: '/tools/prompt-dex',
    available: true,
    badge: 'ベータ',
  },
]

export function getToolDef(id: ToolId): StudioToolDef | undefined {
  return STUDIO_TOOLS.find((t) => t.id === id)
}
