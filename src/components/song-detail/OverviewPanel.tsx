import { Link } from 'react-router-dom'
import { Check, Clapperboard, Music2, PartyPopper, PenLine, SquarePlay, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { STATUS_META } from '@/lib/constants'
import { formatDate, relativeTime } from '@/lib/format'
import { getProgress } from '@/lib/leveling'
import { cn } from '@/lib/utils'
import { useSongStore } from '@/store/useSongStore'
import type { Song } from '@/lib/types'

export function OverviewPanel({
  song,
  onNavigateTab,
}: {
  song: Song
  onNavigateTab: (tab: string) => void
}) {
  const songs = useSongStore((s) => s.songs)
  const markCompleted = useSongStore((s) => s.markCompleted)

  const checklist = [
    { key: 'lyrics', label: '歌詞を書く', done: song.lyrics.trim().length > 0, icon: PenLine, tab: 'lyrics' },
    { key: 'suno', label: 'Sunoプロンプトを保存', done: song.sunoPrompts.length > 0, icon: Music2, tab: 'suno' },
    { key: 'mv', label: 'MVプロンプトを保存', done: song.mvPrompts.length > 0, icon: Clapperboard, tab: 'mv' },
    { key: 'youtube', label: 'YouTube情報を記録', done: !!song.youtube.url, icon: SquarePlay, tab: 'youtube' },
  ]
  const doneCount = checklist.filter((c) => c.done).length

  const handleComplete = () => {
    const before = getProgress(songs)
    markCompleted(song.id)
    const after = getProgress(useSongStore.getState().songs)
    if (after.level > before.level) {
      toast.success(`レベルアップ!Lv.${after.level}「${after.title}」になりました🎉`)
    } else {
      toast.success('お疲れ様でした!ひとまず完成にしました🎉')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">制作の進み具合</h3>
          <span className="text-xs text-muted-foreground">
            {doneCount}/{checklist.length} 完了
          </span>
        </div>
        <Progress value={(doneCount / checklist.length) * 100} className="mb-4" />
        <div className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigateTab(item.tab)}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-accent/60',
                item.done && 'bg-primary/5',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  item.done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {item.done ? <Check className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">基本情報</h3>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">ステータス</dt>
            <dd>
              <Badge variant="outline" className={cn('gap-1 border-transparent', STATUS_META[song.status].badge)}>
                {STATUS_META[song.status].label}
              </Badge>
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">作成日</dt>
            <dd>{formatDate(song.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">最終更新</dt>
            <dd>{relativeTime(song.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">この曲を制作ツールで改善する</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              AIプロデューサーが歌詞・Sunoプロンプトを分析し、次に直すポイントを提案します。
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-1.5">
            <Link to={`/tools/ai-producer?song=${song.id}`}>
              <Wand2 className="h-4 w-4" />
              AIプロデューサーを開く
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3">
        {song.completedAt ? (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <PartyPopper className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">ひとまず完成済みです</p>
              <p className="text-xs text-muted-foreground">{formatDate(song.completedAt)}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">この曲、ひとまず完成しましたか?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                完成にすると経験値が貯まり、秘書が次のテーマを提案してくれます。
              </p>
            </div>
            <Button className="shrink-0 gap-1.5" onClick={handleComplete}>
              <PartyPopper className="h-4 w-4" />
              ひとまず完成にする
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
