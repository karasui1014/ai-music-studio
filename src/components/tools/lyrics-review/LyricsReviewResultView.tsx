import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Compass,
  Download,
  Eye,
  Gauge,
  GitCompare,
  HelpCircle,
  Layers,
  ListOrdered,
  MessageSquareQuote,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Undo2,
  X,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyButton } from '@/components/CopyButton'
import { LyricsDiffView } from '@/components/tools/lyrics-review/LyricsDiffView'
import { SaveToSongDialog } from '@/components/tools/lyrics-review/SaveToSongDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatDate } from '@/lib/format'
import {
  buildDiffRows,
  buildFinalLyrics,
  countDecisions,
  decisionFor,
} from '@/lib/tools/lyrics-review/apply'
import { parseLyricsStructure } from '@/lib/tools/lyrics-review/structure'
import {
  REVIEW_MODES,
  validateResult,
  type LineSuggestion,
} from '@/lib/tools/lyrics-review/types'
import { getProviderMeta } from '@/lib/tools/provider'
import { cn } from '@/lib/utils'
import type { LyricsReviewRunRecord } from '@/lib/tools/types'
import type { Song } from '@/lib/types'

const CONFIDENCE_META = {
  high: { label: '確信度: 高', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  medium: { label: '確信度: 中', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  low: { label: '確信度: 低', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
} as const

const PRIORITY_META = {
  high: { label: '優先度 高', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  medium: { label: '優先度 中', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  low: { label: '優先度 低', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
} as const

const LEVEL_META = {
  good: { label: '◎ 良い', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  ok: { label: '◯ まずまず', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
  needs_work: { label: '△ 直したい', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
} as const

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string
  icon: typeof Sparkles
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="shrink-0 text-primary">•</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function LyricsReviewResultView({
  run,
  song,
  onDecide,
  onResetDecision,
  onAdoptAll,
  onRejectAll,
  onRegenerateLine,
  onRestoreOriginal,
}: {
  run: LyricsReviewRunRecord
  song?: Song
  onDecide: (suggestionId: string, status: 'adopted' | 'rejected', chosenText?: string) => void
  onResetDecision: (suggestionId: string) => void
  onAdoptAll: () => void
  onRejectAll: () => void
  onRegenerateLine: (suggestionId: string) => void
  onRestoreOriginal: () => void
}) {
  const { input, result, decisions } = run
  const [sectionTags, setSectionTags] = useState(false)

  const schemaErrors = useMemo(() => validateResult(result), [result])
  const structure = useMemo(() => parseLyricsStructure(input.lyrics), [input.lyrics])

  const finalLyrics = useMemo(
    () =>
      buildFinalLyrics(input.lyrics, result.lineSuggestions, decisions, {
        addSectionTags: sectionTags,
        structure,
      }),
    [input.lyrics, result.lineSuggestions, decisions, sectionTags, structure],
  )

  const diffRows = useMemo(
    () => buildDiffRows(input.lyrics, result.lineSuggestions, decisions, structure.headingLineIndexes),
    [input.lyrics, result.lineSuggestions, decisions, structure.headingLineIndexes],
  )

  const counts = countDecisions(result.lineSuggestions, decisions)
  const provider = getProviderMeta(run.provider)
  const modeLabel = REVIEW_MODES.find((m) => m.id === input.mode)?.label ?? input.mode
  const confidence = CONFIDENCE_META[result.confidence]

  const handleExportJson = () => {
    const payload = {
      app: 'ai-music-studio',
      tool: 'lyrics-review',
      exportedAt: new Date().toISOString(),
      run: { ...run, decisions },
      finalLyrics,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lyrics-review-${formatDate(run.createdAt, 'yyyyMMdd-HHmm')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (schemaErrors.length > 0) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4" />
          この添削結果は現在の形式(Schema v{String(result.schemaVersion ?? '?')})と合いません
        </p>
        <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
          {schemaErrors.slice(0, 5).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          古いバージョンの履歴の可能性があります。もう一度「添削する」を実行してください。
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* メタ情報+全体コメント */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
            {modeLabel}
          </Badge>
          <Badge variant="outline" className={cn('border-transparent', confidence.badge)}>
            {confidence.label}
          </Badge>
          {result.structureEstimated && (
            <Badge variant="outline" className="border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400">
              構造はAIの推定
            </Badge>
          )}
          <span>{formatDate(run.createdAt, 'yyyy/M/d HH:mm')}</span>
          <span>・{provider.name}</span>
          <span>・Schema v{result.schemaVersion}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed">{result.overallComment}</p>
        <p className="mt-2 text-xs text-muted-foreground">{result.confidenceNote}</p>
        {result.styleConversion && (
          <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              アーティスト名を一般要素へ変換しました
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{result.styleConversion.note}</p>
            <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              {result.styleConversion.elements.map((el) => (
                <div key={el.label} className="flex gap-2">
                  <dt className="shrink-0 font-medium text-muted-foreground">{el.label}:</dt>
                  <dd className="min-w-0">{el.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* 1. 良い部分 */}
      <SectionCard title="この歌詞の良い部分" icon={ThumbsUp}>
        <BulletList items={result.goodPoints} />
      </SectionCard>

      {/* 2. 最優先で直す部分 */}
      <SectionCard title="最優先で直す部分" icon={AlertTriangle}>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-relaxed">
          {result.topPriority}
        </p>
        {result.improvementOrder.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ListOrdered className="h-3.5 w-3.5" />
              改善の優先順位
            </p>
            <ol className="flex flex-col gap-1 text-sm">
              {result.improvementOrder.map((item, i) => (
                <li key={item} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </SectionCard>

      {/* 3. 項目別評価 */}
      <SectionCard title="項目別評価(点数ではなく状態で見る)" icon={Gauge}>
        <div className="grid gap-2 sm:grid-cols-2">
          {result.axes.map((axis) => {
            const meta = LEVEL_META[axis.level]
            return (
              <div key={axis.axis} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{axis.label}</p>
                  <Badge variant="outline" className={cn('shrink-0 border-transparent', meta.badge)}>
                    {meta.label}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{axis.comment}</p>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* 4. 原文と修正版の比較 */}
      <SectionCard
        title="原文と修正版の比較"
        icon={GitCompare}
        action={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400">採用 {counts.adopted}</span>
            <span>却下 {counts.rejected}</span>
            <span className="text-amber-600 dark:text-amber-400">未定 {counts.pending}</span>
          </div>
        }
      >
        {result.structureEstimated && (
          <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-600 dark:text-violet-400">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            セクション構造(サビの位置など)は原文に書かれていなかったため、AIの推定です。
          </p>
        )}
        {result.lineSuggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            行単位の修正提案はありません。原文のままで十分歌える状態です。
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdoptAll}>
                <Check className="h-3.5 w-3.5" />
                すべて採用
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={onRejectAll}>
                <X className="h-3.5 w-3.5" />
                すべて却下(原文のまま)
              </Button>
            </div>
            <LyricsDiffView
              rows={diffRows}
              onDecide={(id, status) => onDecide(id, status)}
              onReset={onResetDecision}
            />
          </>
        )}
      </SectionCard>

      {/* 5. 行単位の指摘 */}
      {result.lineSuggestions.length > 0 && (
        <SectionCard title={`行単位の指摘(${result.lineSuggestions.length}件)`} icon={MessageSquareQuote}>
          <div className="flex flex-col gap-3">
            {result.lineSuggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                decision={decisionFor(decisions, s.id)}
                onDecide={onDecide}
                onReset={() => onResetDecision(s.id)}
                onRegenerate={() => onRegenerateLine(s.id)}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 6. 添削後全文(最終版プレビュー) */}
      <SectionCard
        title="最終版プレビュー(採用した行だけを反映)"
        icon={Eye}
        action={<CopyButton text={finalLyrics} label="全文をコピー" />}
      >
        {result.structureEstimated && (
          <div className="mb-3 flex items-center gap-2">
            <Switch id="section-tags" checked={sectionTags} onCheckedChange={setSectionTags} />
            <Label htmlFor="section-tags" className="text-xs text-muted-foreground">
              推定セクションタグ([サビ]など)を最終版に入れる(Suno等で構成が安定します)
            </Label>
          </div>
        )}
        <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 font-mono text-sm leading-relaxed">
          {finalLyrics}
        </pre>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {song ? (
            <SaveToSongDialog song={song} finalLyrics={finalLyrics} />
          ) : (
            <p className="text-xs text-muted-foreground">
              曲を選んで添削すると、ここから曲へ保存できます(コピー・書き出しは利用できます)。
            </p>
          )}
          <Button variant="outline" className="gap-1.5" onClick={handleExportJson}>
            <Download className="h-4 w-4" />
            JSONで書き出す
          </Button>
          {song && song.lyrics !== input.lyrics && (
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="gap-1.5 text-muted-foreground">
                  <Undo2 className="h-4 w-4" />
                  添削前の原文に戻す
                </Button>
              }
              title="歌詞を添削前の原文に戻しますか?"
              description="曲の歌詞を、この添削を実行した時点の原文に戻します。"
              confirmLabel="原文に戻す"
              onConfirm={onRestoreOriginal}
            />
          )}
        </div>
      </SectionCard>

      {/* 7. 別の方向性 */}
      <SectionCard title="別の方向性(こう書く手もあります)" icon={Compass}>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.alternatives.map((alt) => (
            <div key={alt.title} className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium">{alt.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alt.description}</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs leading-relaxed">
                {alt.sampleLines.join('\n')}
              </pre>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 8. 次回意識すること+AIが推測した部分 */}
      <SectionCard title="次回意識すること" icon={ClipboardList}>
        <BulletList items={result.nextAdvice} />
        {result.assumptions.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
              AIが推測した部分(うのみにしないでください)
            </p>
            <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
              {result.assumptions.map((a) => (
                <li key={a} className="flex gap-1.5">
                  <span className="shrink-0">・</span>
                  <span className="min-w-0">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          ※ 提案はすべて下書きです。最終判断はいつでもあなた(作者)にあります。しっくり来ない行は迷わず「却下」してください。
        </p>
      </SectionCard>
    </div>
  )
}

function SuggestionCard({
  suggestion,
  decision,
  onDecide,
  onReset,
  onRegenerate,
}: {
  suggestion: LineSuggestion
  decision: { status: 'adopted' | 'rejected' | 'pending'; chosenText?: string }
  onDecide: (suggestionId: string, status: 'adopted' | 'rejected', chosenText?: string) => void
  onReset: () => void
  onRegenerate: () => void
}) {
  const priority = PRIORITY_META[suggestion.priority]
  const adoptedText = decision.chosenText ?? suggestion.suggestion
  const candidates = [suggestion.suggestion, ...suggestion.alternatives]

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        decision.status === 'adopted' && 'border-emerald-500/40 bg-emerald-500/5',
        decision.status === 'rejected' && 'border-border bg-muted/30 opacity-80',
        decision.status === 'pending' && 'border-border',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-transparent bg-primary/10 text-xs text-primary">
          {suggestion.sectionLabel} ・ {suggestion.lineNumber}行目
        </Badge>
        <p className="min-w-0 flex-1 text-sm font-medium">{suggestion.problem}</p>
        <Badge variant="outline" className={cn('shrink-0 border-transparent', priority.badge)}>
          {priority.label}
        </Badge>
      </div>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">元の行</dt>
          <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs">
            {suggestion.original}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">修正理由</dt>
          <dd className="text-sm leading-relaxed">{suggestion.reason}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium text-muted-foreground">
            修正候補(クリックでその案を採用)
          </dt>
          {candidates.map((candidate, i) => {
            const isChosen = decision.status === 'adopted' && adoptedText === candidate
            return (
              <button
                key={`${i}-${candidate}`}
                type="button"
                onClick={() => onDecide(suggestion.id, 'adopted', candidate)}
                className={cn(
                  'mb-1.5 block w-full whitespace-pre-wrap rounded-lg border px-3 py-2 text-left font-mono text-xs transition-colors',
                  isChosen
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40',
                )}
              >
                <span className="mb-0.5 flex items-center gap-1 text-[10px] font-sans font-medium text-muted-foreground">
                  {i === 0 ? '本命案' : `別案 ${i}`}
                  {isChosen && <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
                </span>
                {candidate}
              </button>
            )
          })}
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {decision.status !== 'adopted' && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-emerald-600 dark:text-emerald-400"
            onClick={() => onDecide(suggestion.id, 'adopted')}
          >
            <Check className="h-3.5 w-3.5" />
            採用
          </Button>
        )}
        {decision.status !== 'rejected' && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-muted-foreground"
            onClick={() => onDecide(suggestion.id, 'rejected')}
          >
            <X className="h-3.5 w-3.5" />
            却下(元のまま)
          </Button>
        )}
        {decision.status !== 'pending' && (
          <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            未定に戻す
          </Button>
        )}
        <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={onRegenerate}>
          <RefreshCcw className="h-3.5 w-3.5" />
          この行だけ再生成
        </Button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium">元のまま残す場合:</span> {suggestion.keepNote}
      </p>
    </div>
  )
}
