import { Check, RotateCcw, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DiffRow } from '@/lib/tools/lyrics-review/apply'

const STATE_META = {
  pending: { label: '提案', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  adopted: { label: '採用', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  rejected: { label: '却下', badge: 'bg-muted text-muted-foreground' },
} as const

/**
 * 原文と修正版の行単位比較。
 * 提案のある行では 採用/却下/戻す をその場で操作できる。
 */
export function LyricsDiffView({
  rows,
  onDecide,
  onReset,
}: {
  rows: DiffRow[]
  onDecide: (suggestionId: string, status: 'adopted' | 'rejected') => void
  onReset: (suggestionId: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="hidden gap-2 px-3 text-[11px] font-medium text-muted-foreground sm:grid sm:grid-cols-2">
        <span>原文</span>
        <span>修正版(採用状態を反映)</span>
      </div>
      {rows.map((row) => {
        const isBlank = !row.original.trim() && !row.revised.trim()
        if (isBlank) return <div key={row.lineNumber} className="h-2" />

        if (!row.suggestionId) {
          return (
            <div
              key={row.lineNumber}
              className={cn(
                'grid gap-2 rounded-lg px-3 py-1 text-sm sm:grid-cols-2',
                row.isHeading ? 'font-mono text-xs text-primary/80' : 'text-muted-foreground/70',
              )}
            >
              <span className="whitespace-pre-wrap">
                <span className="mr-2 inline-block w-6 select-none text-right text-[10px] text-muted-foreground/50">
                  {row.lineNumber}
                </span>
                {row.original}
              </span>
              <span className="hidden whitespace-pre-wrap sm:block">{row.revised}</span>
            </div>
          )
        }

        const meta = STATE_META[row.state as keyof typeof STATE_META] ?? STATE_META.pending
        return (
          <div
            key={row.lineNumber}
            className={cn(
              'rounded-xl border px-3 py-2',
              row.state === 'adopted' && 'border-emerald-500/40 bg-emerald-500/5',
              row.state === 'pending' && 'border-amber-500/40 bg-amber-500/5',
              row.state === 'rejected' && 'border-border bg-muted/30',
            )}
          >
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <span
                className={cn(
                  'whitespace-pre-wrap',
                  row.state === 'adopted' && 'text-muted-foreground line-through decoration-muted-foreground/40',
                )}
              >
                <span className="mr-2 inline-block w-6 select-none text-right text-[10px] text-muted-foreground/50">
                  {row.lineNumber}
                </span>
                {row.original}
              </span>
              <span
                className={cn(
                  'whitespace-pre-wrap',
                  row.state === 'rejected' && 'text-muted-foreground/60',
                )}
              >
                {row.revised}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.badge)}>
                {meta.label}
              </span>
              {row.state === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 gap-1 px-2 text-xs text-emerald-600 dark:text-emerald-400"
                    onClick={() => onDecide(row.suggestionId!, 'adopted')}
                  >
                    <Check className="h-3 w-3" />
                    採用
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                    onClick={() => onDecide(row.suggestionId!, 'rejected')}
                  >
                    <X className="h-3 w-3" />
                    却下
                  </Button>
                </>
              )}
              {row.state !== 'pending' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                  onClick={() => onReset(row.suggestionId!)}
                >
                  <RotateCcw className="h-3 w-3" />
                  未定に戻す
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
