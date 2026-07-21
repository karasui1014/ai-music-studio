import { Sparkles, Star } from 'lucide-react'

import { CopyButton } from '@/components/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { bpmBandLabel, SOURCE_LABELS, vocalLabel, type PromptEntry } from '@/lib/tools/prompt-dex/types'

/**
 * 一覧カード。情報を詰め込みすぎないよう、要点だけ表示する。
 * (タイトル/ジャンル/感情/用途/対応サービス/BPM帯/初心者向け/お気に入り/詳細/コピー)
 */
export function PromptCard({
  entry,
  favorite,
  onToggleFavorite,
  onOpenDetail,
}: {
  entry: PromptEntry
  favorite: boolean
  onToggleFavorite: () => void
  onOpenDetail: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold leading-snug">{entry.title}</h3>
            {entry.beginnerFriendly && (
              <Badge variant="outline" className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                初心者向け
              </Badge>
            )}
            {entry.source !== 'builtin' && (
              <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
                {SOURCE_LABELS[entry.source]}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {entry.genre}
            {entry.subgenre ? ` / ${entry.subgenre}` : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onToggleFavorite}
          aria-label={favorite ? 'お気に入り解除' : 'お気に入りに追加'}
        >
          <Star className={cn('h-4 w-4', favorite && 'fill-amber-400 text-amber-400')} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5">{bpmBandLabel(entry.bpm)}</span>
        <span className="rounded-full bg-muted px-2 py-0.5">{vocalLabel(entry.vocal)}</span>
        {entry.emotions.slice(0, 2).map((e) => (
          <span key={e} className="rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-600 dark:text-rose-400">
            {e}
          </span>
        ))}
        {entry.uses.slice(0, 2).map((u) => (
          <span key={u} className="rounded-full bg-sky-500/10 px-2 py-0.5 text-sky-600 dark:text-sky-400">
            {u}
          </span>
        ))}
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground">{entry.description}</p>

      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-muted-foreground">
          {entry.services.join(' / ')}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <CopyButton text={entry.prompt} label="コピー" />
          <Button size="sm" className="gap-1.5" onClick={onOpenDetail}>
            <Sparkles className="h-3.5 w-3.5" />
            詳細
          </Button>
        </div>
      </div>
    </div>
  )
}
