import type { HistoryEventType, SongStatus } from '@/lib/types'
import {
  Lightbulb,
  PenLine,
  Music2,
  Clapperboard,
  Rocket,
  Sparkles,
  RefreshCcw,
  SquarePlay,
  StickyNote,
  Captions,
  SlidersHorizontal,
  MessageSquareText,
} from 'lucide-react'

export const STATUS_ORDER: SongStatus[] = ['idea', 'lyrics', 'suno', 'mv', 'published']

export const STATUS_META: Record<
  SongStatus,
  { label: string; icon: typeof Lightbulb; badge: string; dot: string }
> = {
  idea: {
    label: 'アイデア',
    icon: Lightbulb,
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  lyrics: {
    label: '作詞中',
    icon: PenLine,
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  suno: {
    label: 'Suno制作中',
    icon: Music2,
    badge: 'bg-suno/15 text-suno',
    dot: 'bg-suno',
  },
  mv: {
    label: 'MV制作中',
    icon: Clapperboard,
    badge: 'bg-mv/15 text-mv',
    dot: 'bg-mv',
  },
  published: {
    label: '公開済み',
    icon: Rocket,
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
}

export const HISTORY_ICON: Record<HistoryEventType, typeof Sparkles> = {
  created: Sparkles,
  status_changed: RefreshCcw,
  lyrics_updated: PenLine,
  suno_prompt_added: Music2,
  suno_prompt_updated: Music2,
  suno_prompt_removed: Music2,
  mv_prompt_added: Clapperboard,
  mv_prompt_updated: Clapperboard,
  mv_prompt_removed: Clapperboard,
  youtube_updated: SquarePlay,
  note_added: StickyNote,
}

export interface ExternalTool {
  key: 'storyboard' | 'subtitle' | 'mastering' | 'stylePrompt' | 'review'
  name: string
  description: string
  url: string
  icon: typeof Sparkles
}

export const EXTERNAL_TOOLS: ExternalTool[] = [
  {
    key: 'storyboard',
    name: '絵コンテツール',
    description: 'MVのカット割り・構成を考える',
    url: 'https://karasui1014.github.io/lofi-detective-website/storyboard.html',
    icon: Clapperboard,
  },
  {
    key: 'subtitle',
    name: '字幕自動生成ツール',
    description: '歌詞から字幕を自動生成する',
    url: 'https://karasui1014.github.io/lofi-detective-website/lyric/',
    icon: Captions,
  },
  {
    key: 'mastering',
    name: 'マスタリング自動生成ツール',
    description: '楽曲のマスタリング設定を作る',
    url: 'https://karasui1014.github.io/lofi-detective-website/mastering/',
    icon: SlidersHorizontal,
  },
  {
    key: 'stylePrompt',
    name: 'スタイルプロンプト工房',
    description: 'Sunoのスタイルプロンプトを研究する',
    url: 'https://karasui1014.github.io/lofi-detective-website/style-prompt-koubou/',
    icon: Music2,
  },
  {
    key: 'review',
    name: '楽曲批評ツール',
    description: '完成した楽曲をAIにレビューしてもらう',
    url: 'https://karasui1014.github.io/gakkyoku-hihyou/',
    icon: MessageSquareText,
  },
]
