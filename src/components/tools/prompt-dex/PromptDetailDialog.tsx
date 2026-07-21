import {
  ArrowUpRight,
  Music2,
  Pencil,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Wrench,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyButton } from '@/components/CopyButton'
import { ApplyToSongDialog } from '@/components/tools/prompt-dex/ApplyToSongDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  bpmBandLabel,
  SOURCE_LABELS,
  vocalLabel,
  type PromptEntry,
} from '@/lib/tools/prompt-dex/types'
import type { Song } from '@/lib/types'

function SpecRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  )
}

function PointList({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string
  icon: typeof ThumbsUp
  items: string[]
  tone: string
}) {
  if (items.length === 0) return null
  return (
    <div>
      <h4 className={cn('mb-1.5 flex items-center gap-1.5 text-sm font-semibold', tone)}>
        <Icon className="h-4 w-4" />
        {title}
      </h4>
      <ul className="flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-muted-foreground">•</span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PromptDetailDialog({
  entry,
  songs,
  related,
  activeSongId,
  isFavorite,
  onOpenChange,
  onToggleFavorite,
  onOpenRelated,
  onEdit,
  onDelete,
}: {
  entry: PromptEntry | null
  songs: Song[]
  related: PromptEntry[]
  activeSongId?: string
  isFavorite: (id: string) => boolean
  onOpenChange: (open: boolean) => void
  onToggleFavorite: (id: string) => void
  onOpenRelated: (id: string) => void
  onEdit: (entry: PromptEntry) => void
  onDelete: (id: string) => void
}) {
  const isUser = entry ? entry.source !== 'builtin' : false
  const fav = entry ? isFavorite(entry.id) : false

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        {entry && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-2 pr-6">
                <DialogTitle className="text-lg">{entry.title}</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onToggleFavorite(entry.id)}
                  aria-label={fav ? 'お気に入り解除' : 'お気に入りに追加'}
                >
                  <Star className={cn('h-4 w-4', fav && 'fill-amber-400 text-amber-400')} />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              {/* 1. タイトルと概要 */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="border-transparent bg-muted">
                  {entry.genre}
                  {entry.subgenre ? ` / ${entry.subgenre}` : ''}
                </Badge>
                {entry.beginnerFriendly && (
                  <Badge variant="outline" className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    初心者向け
                  </Badge>
                )}
                <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
                  {SOURCE_LABELS[entry.source]}
                </Badge>
                <span className="text-xs text-muted-foreground">ver. {entry.version}</span>
              </div>

              {/* 2. プロンプト本文 */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                    <Music2 className="h-4 w-4 text-primary" />
                    プロンプト本文
                  </h4>
                  <CopyButton text={entry.prompt} label="コピー" />
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                  {entry.prompt}
                </pre>
              </div>

              {/* 3. 日本語説明 */}
              {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}

              {/* 4. 推奨条件 */}
              <div>
                <h4 className="mb-1.5 text-sm font-semibold">推奨条件</h4>
                <dl className="grid gap-1.5 sm:grid-cols-2">
                  <SpecRow label="感情" value={entry.emotions.join('、')} />
                  <SpecRow label="用途" value={entry.uses.join('、')} />
                  <SpecRow label="BPM帯" value={bpmBandLabel(entry.bpm)} />
                  <SpecRow label="ボーカル" value={vocalLabel(entry.vocal)} />
                  <SpecRow label="楽器" value={entry.instruments.join('、')} />
                  <SpecRow label="時代感" value={entry.era} />
                  <SpecRow label="対応サービス" value={entry.services.join('、')} />
                </dl>
              </div>

              {/* 5-7. 成功/失敗/調整 */}
              <PointList title="成功しやすい点" icon={ThumbsUp} items={entry.successPoints} tone="text-emerald-600 dark:text-emerald-400" />
              <PointList title="失敗しやすい点" icon={ThumbsDown} items={entry.failurePoints} tone="text-rose-600 dark:text-rose-400" />
              <PointList title="調整方法" icon={Wrench} items={entry.adjustments} tone="text-sky-600 dark:text-sky-400" />

              {/* 8. タグ */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* 9. 関連プロンプト */}
              {related.length > 0 && (
                <div>
                  <h4 className="mb-1.5 text-sm font-semibold">関連プロンプト</h4>
                  <div className="flex flex-col gap-1.5">
                    {related.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onOpenRelated(r.id)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent/60"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{r.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {r.genre} ・ {r.emotions.slice(0, 2).join('、')}
                          </span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. 既存曲への反映操作 */}
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  既存曲へ反映
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <ApplyToSongDialog
                    entry={entry}
                    songs={songs}
                    defaultSongId={activeSongId}
                    trigger={
                      <Button size="sm" className="gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        曲へ反映(置換/追記/候補)
                      </Button>
                    }
                  />
                  <CopyButton text={entry.prompt} label="クリップボードへコピー" />
                </div>
                {songs.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    反映するには先に曲を作成してください(コピーはいつでも使えます)。
                  </p>
                )}
              </div>

              {/* 自分用プロンプトの編集/削除 */}
              {isUser && (
                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(entry)}>
                    <Pencil className="h-3.5 w-3.5" />
                    編集
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        削除
                      </Button>
                    }
                    title={`「${entry.title}」を削除しますか?`}
                    description="この自分用プロンプトを削除します。初期収録プロンプトには影響しません。"
                    onConfirm={() => {
                      onDelete(entry.id)
                      onOpenChange(false)
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
