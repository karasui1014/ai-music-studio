import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ClipboardList,
  Gauge,
  HelpCircle,
  History,
  Library,
  ListOrdered,
  Music2,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SquarePlay,
  ThumbsUp,
  Type,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyButton } from '@/components/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { getProviderMeta } from '@/lib/tools/provider'
import { buildProducerSearchQuery } from '@/lib/tools/prompt-dex/search'
import { cn } from '@/lib/utils'
import { useSongStore } from '@/store/useSongStore'
import type { RegenerableSection } from '@/lib/tools/ai-producer/analyze'
import type { Suggestion } from '@/lib/tools/ai-producer/types'
import type { AiProducerRunRecord } from '@/lib/tools/types'
import type { Song } from '@/lib/types'

const CONFIDENCE_META = {
  high: { label: '高', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  medium: { label: '中', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  low: { label: '低', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
} as const

const PRIORITY_META = {
  now: { label: '今すぐ', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  later: { label: '後から', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
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

function RegenerateButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onClick}>
      <RefreshCcw className="h-3.5 w-3.5" />
      この部分だけ再生成
    </Button>
  )
}

function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number }) {
  const priority = PRIORITY_META[suggestion.priority]
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium">{suggestion.problem}</p>
        <Badge variant="outline" className={cn('border-transparent', priority.badge)}>
          {priority.label}
        </Badge>
      </div>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">理由</dt>
          <dd>{suggestion.reason}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">直し方</dt>
          <dd>{suggestion.fix}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">修正例</dt>
          <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs">
            {suggestion.example}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">期待できる変化</dt>
          <dd>{suggestion.expected}</dd>
        </div>
      </dl>
    </div>
  )
}

interface AiProducerResultViewProps {
  run: AiProducerRunRecord
  song?: Song
  onReanalyze: () => void
  onRegenerate: (section: RegenerableSection) => void
}

export function AiProducerResultView({
  run,
  song,
  onReanalyze,
  onRegenerate,
}: AiProducerResultViewProps) {
  const addSunoPrompt = useSongStore((s) => s.addSunoPrompt)
  const updateBasicInfo = useSongStore((s) => s.updateBasicInfo)
  const addToolHistory = useSongStore((s) => s.addToolHistory)

  const result = run.result
  const confidence = CONFIDENCE_META[result.confidence]
  const provider = getProviderMeta(run.provider)
  const nowItems = result.suggestions.filter((s) => s.priority === 'now')
  const laterItems = result.suggestions.filter((s) => s.priority === 'later')

  const handleApplyPrompt = () => {
    if (!song) return
    addSunoPrompt(song.id, {
      title: `AIプロデューサー修正版 ${formatDate(run.createdAt, 'M/d HH:mm')}`,
      stylePrompt: result.revisedSunoPrompt,
      memo: 'AIプロデューサーの分析結果から作成(既存プロンプトは変更していません)',
    })
    toast.success('修正版プロンプトを新しいSunoプロンプトとして追加しました')
  }

  const handleApplyTitle = (title: string) => {
    if (!song) return
    const before = song.title
    updateBasicInfo(song.id, { title })
    addToolHistory(song.id, `AIプロデューサーのタイトル案「${title}」を曲名に反映しました(旧: ${before})`)
    toast.success(`曲名を「${title}」に変更しました`)
  }

  const handleAddSummaryToHistory = () => {
    if (!song) return
    addToolHistory(
      song.id,
      `AIプロデューサー分析(確信度: ${confidence.label}) 最優先の改善点:「${result.biggestProblem}」`,
    )
    toast.success('分析の要約を制作履歴に追加しました')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className={cn('border-transparent', confidence.badge)}>
            確信度: {confidence.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(run.createdAt, 'yyyy年M月d日 HH:mm')} ・ {provider.name} ・ 結果は自動保存済み
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {song && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddSummaryToHistory}>
              <History className="h-3.5 w-3.5" />
              要約を制作履歴へ追加
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onReanalyze}>
            <RefreshCcw className="h-3.5 w-3.5" />
            再分析する
          </Button>
        </div>
      </div>

      <SectionCard title="良い部分" icon={ThumbsUp}>
        <BulletList items={result.goodPoints} />
      </SectionCard>

      <SectionCard title="最も大きな問題" icon={AlertTriangle}>
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
          {result.biggestProblem}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            この曲の条件(ジャンル・狙い・BPM・媒体)に合うプロンプトを図鑑から探せます。
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link
              to={buildProducerSearchQuery({
                genre: run.input.genre,
                aim: run.input.aim,
                media: run.input.media,
                bpm: run.input.bpm,
              })}
            >
              <Library className="h-3.5 w-3.5" />
              プロンプト図鑑で探す
            </Link>
          </Button>
        </div>
      </SectionCard>

      {result.suggestions.length > 0 && (
        <SectionCard title="改善の優先順位" icon={ListOrdered}>
          <div className="flex flex-col gap-3">
            {result.suggestions.map((s, i) => (
              <SuggestionCard key={s.ruleId} suggestion={s} index={i} />
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="mb-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">今すぐ直すこと</p>
              {nowItems.length > 0 ? (
                <BulletList items={nowItems.map((s) => s.problem)} />
              ) : (
                <p className="text-sm text-muted-foreground">今すぐ直すべき問題はありません</p>
              )}
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="mb-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">後から直すこと</p>
              {laterItems.length > 0 ? (
                <BulletList items={laterItems.map((s) => s.problem)} />
              ) : (
                <p className="text-sm text-muted-foreground">後回しにできる項目はありません</p>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title="変更しなくてよい部分" icon={ShieldCheck}>
        <BulletList items={result.keepAsIs} />
      </SectionCard>

      <SectionCard
        title="修正版Sunoプロンプト"
        icon={Music2}
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <RegenerateButton onClick={() => onRegenerate('revisedSunoPrompt')} />
            <CopyButton text={result.revisedSunoPrompt} label="コピー" />
            {song && (
              <ConfirmDialog
                trigger={
                  <Button size="sm" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    この曲へ反映
                  </Button>
                }
                title="修正版プロンプトを曲へ反映しますか?"
                description={`「${song.title}」に新しいSunoプロンプトとして追加します。既存のプロンプトは上書き・削除されません。`}
                confirmLabel="追加する"
                onConfirm={handleApplyPrompt}
              />
            )}
          </div>
        }
      >
        <pre className="whitespace-pre-wrap rounded-xl bg-muted/60 px-4 py-3 font-mono text-xs">
          {result.revisedSunoPrompt}
        </pre>
        {result.revisedPromptNotes.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">変更点</p>
            <BulletList items={result.revisedPromptNotes} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="サビ改善案"
        icon={Sparkles}
        action={<RegenerateButton onClick={() => onRegenerate('chorusIdeas')} />}
      >
        <BulletList items={result.chorusIdeas} />
      </SectionCard>

      <SectionCard
        title="タイトル案"
        icon={Type}
        action={<RegenerateButton onClick={() => onRegenerate('titleIdeas')} />}
      >
        <ul className="flex flex-col gap-2">
          {result.titleIdeas.map((idea) => (
            <li
              key={idea}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5"
            >
              <span className="min-w-0 text-sm font-medium">{idea}</span>
              {song && (
                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm" className="shrink-0">
                      曲名へ反映
                    </Button>
                  }
                  title={`曲名を「${idea}」に変更しますか?`}
                  description={`現在の曲名「${song.title}」は上書きされます(変更の記録は制作履歴に残ります)。`}
                  confirmLabel="変更する"
                  onConfirm={() => handleApplyTitle(idea)}
                />
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="YouTube向け改善案" icon={SquarePlay}>
          <BulletList items={result.youtubeTips} />
        </SectionCard>
        <SectionCard title="Shorts向け改善案" icon={Smartphone}>
          <BulletList items={result.shortsTips} />
        </SectionCard>
      </div>

      <SectionCard title="次回生成チェックリスト" icon={ClipboardList}>
        <BulletList items={result.nextChecklist} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="AIが確認できなかった情報" icon={HelpCircle}>
          <BulletList items={result.unknowns} />
        </SectionCard>
        <SectionCard title="提案の確信度" icon={Gauge}>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className={cn('w-fit border-transparent', confidence.badge)}>
              確信度: {confidence.label}
            </Badge>
            <p className="text-sm text-muted-foreground">{result.confidenceNote}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
