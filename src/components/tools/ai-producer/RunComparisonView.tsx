import { GitCompare } from 'lucide-react'

import { formatDate } from '@/lib/format'
import type { RunComparison } from '@/lib/tools/ai-producer/compare'

function CompareList({
  title,
  items,
  emptyText,
  accent,
}: {
  title: string
  items: string[]
  emptyText: string
  accent: string
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className={`mb-1.5 text-xs font-semibold ${accent}`}>{title}</p>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-sm">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="shrink-0 text-muted-foreground">•</span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  )
}

export function RunComparisonView({ comparison }: { comparison: RunComparison }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <GitCompare className="h-4 w-4 text-primary" />
          前回の分析との比較
        </h3>
        <p className="text-xs text-muted-foreground">
          前回: {formatDate(comparison.previousAt, 'M/d HH:mm')} → 今回:{' '}
          {formatDate(comparison.currentAt, 'M/d HH:mm')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CompareList
          title={`前回の問題(${comparison.previousProblems.length}件)`}
          items={comparison.previousProblems}
          emptyText="前回は問題が見つかりませんでした"
          accent="text-muted-foreground"
        />
        <CompareList
          title={`今回の問題(${comparison.currentProblems.length}件)`}
          items={comparison.currentProblems}
          emptyText="今回は問題が見つかりませんでした"
          accent="text-muted-foreground"
        />
        <CompareList
          title="改善した項目"
          items={comparison.improved}
          emptyText="前回から解消した項目はまだありません"
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <CompareList
          title="継続している課題"
          items={comparison.continuing}
          emptyText="継続している課題はありません"
          accent="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="mt-3">
        <CompareList
          title="次に直す項目"
          items={comparison.nextFocus}
          emptyText="優先して直す項目はありません。生成と微調整を繰り返しましょう"
          accent="text-primary"
        />
      </div>
    </div>
  )
}
