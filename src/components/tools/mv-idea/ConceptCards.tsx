import { ArrowRight, Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { APPROACH_META } from '@/lib/tools/mv-idea/generate'
import { BUDGET_META, DIFFICULTY_META } from '@/lib/tools/mv-idea/types'
import type { MvConcept } from '@/lib/tools/mv-idea/types'
import { cn } from '@/lib/utils'

function Row({ label, text }: { label: string; text: string }) {
  return (
    <div className="text-xs">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span>{text}</span>
    </div>
  )
}

/** 第1段階の結果: 方向性の異なる3案の比較カード */
export function ConceptCards({
  concepts,
  selectedId,
  onSelect,
}: {
  concepts: MvConcept[]
  selectedId?: string
  onSelect: (concept: MvConcept) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {concepts.map((concept, index) => {
        const selected = concept.id === selectedId
        return (
          <div
            key={concept.id}
            className={cn(
              'flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-colors',
              selected ? 'border-primary ring-1 ring-primary/40' : 'border-border',
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
                  案{index + 1}・{APPROACH_META[concept.approach].label}
                </Badge>
                {selected && (
                  <Badge variant="outline" className="gap-1 border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    選択中
                  </Badge>
                )}
              </div>
              <h3 className="mt-2 font-medium leading-snug">{concept.conceptTitle}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{concept.oneLiner}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Row label="狙い" text={concept.aim} />
              <Row label="世界観" text={concept.world} />
              <Row label="主な映像表現" text={concept.mainVisuals.join(' / ')} />
              <Row label="冒頭3秒" text={concept.opening3s} />
              <Row label="サビの見せ場" text={concept.chorusHighlight} />
              <Row label="ラスト" text={concept.ending} />
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <Badge variant="outline" className={cn('border-transparent', DIFFICULTY_META[concept.difficulty].badge)}>
                  難易度: {DIFFICULTY_META[concept.difficulty].label}
                </Badge>
                <Badge variant="outline" className={cn('border-transparent', BUDGET_META[concept.budgetTier].badge)}>
                  {BUDGET_META[concept.budgetTier].label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">制作時間の目安: {concept.timeEstimate}</p>
              <p className="text-xs text-muted-foreground">向いている媒体: {concept.suitableMedia.join('、')}</p>
              <Button
                size="sm"
                variant={selected ? 'outline' : 'default'}
                className="mt-1 gap-1.5"
                onClick={() => onSelect(concept)}
              >
                {selected ? '企画書を作り直す' : 'この案で企画書を作る'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
