import type { ReactNode } from 'react'
import {
  CalendarClock,
  Clapperboard,
  ClipboardList,
  Download,
  FileJson,
  History,
  Image,
  ListOrdered,
  Palette,
  Save,
  Smartphone,
  SquarePlay,
  Table,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyButton } from '@/components/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  downloadTextFile,
  resultToJson,
  resultToMarkdown,
  sanitizeFilename,
  shotsToCsv,
} from '@/lib/tools/mv-idea/export'
import type { MvIdeaExportMeta } from '@/lib/tools/mv-idea/export'
import {
  BUDGET_META,
  DIFFICULTY_META,
  formatSec,
} from '@/lib/tools/mv-idea/types'
import type {
  MvConsistency,
  MvIdeaInput,
  MvIdeaResult,
  MvPlanDetail,
  MvShot,
} from '@/lib/tools/mv-idea/types'
import { totalSeconds } from '@/lib/tools/mv-idea/shots'
import { cn } from '@/lib/utils'
import type { Song } from '@/lib/types'
import { ConsistencyPanel } from './ConsistencyPanel'
import { SaveToSongDialog } from './SaveToSongDialog'
import { ShotTable } from './ShotTable'

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string
  icon: typeof Clapperboard
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 12)}`} className="flex gap-2">
          <span className="shrink-0 text-primary">•</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function DefRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span>{text}</span>
    </div>
  )
}

/** 詳細企画書ビュー(結果画面の2〜11番+一貫性設定+書き出し+保存) */
export function PlanDetailView({
  input,
  result,
  detail,
  song,
  exportMeta,
  onShotMove,
  onShotDuplicate,
  onShotRemove,
  onShotRegenerate,
  onShotReapplyConsistency,
  onShotUpdate,
  onConsistencyChange,
  onReapplyAllConsistency,
  onRecordHistory,
}: {
  input: MvIdeaInput
  result: MvIdeaResult
  detail: MvPlanDetail
  song?: Song
  exportMeta: MvIdeaExportMeta
  onShotMove: (id: string, direction: 'up' | 'down') => void
  onShotDuplicate: (id: string) => void
  onShotRemove: (id: string) => void
  onShotRegenerate: (id: string) => void
  onShotReapplyConsistency: (id: string) => void
  onShotUpdate: (id: string, patch: Partial<Omit<MvShot, 'id' | 'no'>>, durationSec?: number) => void
  onConsistencyChange: (patch: Partial<MvConsistency>) => void
  onReapplyAllConsistency: () => void
  onRecordHistory: () => void
}) {
  const fileBase = `mv-plan-${sanitizeFilename(input.title)}`
  const markdown = () => resultToMarkdown(input, result, exportMeta)

  const handleDownload = (kind: 'md' | 'json' | 'csv') => {
    if (kind === 'md') {
      downloadTextFile(`${fileBase}.md`, markdown(), 'text/markdown')
    } else if (kind === 'json') {
      downloadTextFile(`${fileBase}.json`, resultToJson(input, result, exportMeta), 'application/json')
    } else {
      downloadTextFile(`${fileBase}-shots.csv`, shotsToCsv(detail.shots), 'text/csv')
    }
    toast.success('書き出しました(ダウンロードフォルダを確認してください)')
  }

  const total = totalSeconds(detail.shots)

  return (
    <div className="flex flex-col gap-4">
      {/* 書き出し・保存アクション */}
      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="mr-auto text-sm font-medium">この企画書を使う</p>
        <CopyButton text={markdown()} label="Markdownをコピー" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownload('md')}>
          <Download className="h-3.5 w-3.5" />
          Markdown
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownload('json')}>
          <FileJson className="h-3.5 w-3.5" />
          JSON
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownload('csv')}>
          <Table className="h-3.5 w-3.5" />
          ショットCSV
        </Button>
        {song ? (
          <>
            <SaveToSongDialog
              song={song}
              detail={detail}
              videoAiTool={input.videoAiTool}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  この曲へ保存
                </Button>
              }
            />
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  制作履歴へ記録
                </Button>
              }
              title="制作履歴へ記録しますか?"
              description={`「${song.title}」の制作履歴に、この企画を作ったことを記録します(曲のデータは変更しません)。`}
              confirmLabel="記録する"
              onConfirm={onRecordHistory}
            />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">曲を選んで生成すると、曲への保存もできます</span>
        )}
      </section>

      {/* 2. 選択した企画の全体像 */}
      <SectionCard title="選択した企画の全体像" icon={Clapperboard}>
        <div className="flex flex-col gap-2">
          <p className="font-medium">{detail.conceptTitle}</p>
          <p className="text-sm">{detail.overview}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn('border-transparent', DIFFICULTY_META[detail.difficulty].badge)}>
              難易度: {DIFFICULTY_META[detail.difficulty].label}
            </Badge>
            <Badge variant="outline" className={cn('border-transparent', BUDGET_META[detail.budgetTier].badge)}>
              {BUDGET_META[detail.budgetTier].label}
            </Badge>
            <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
              {detail.orientation === 'vertical' ? '縦型 9:16' : '横型 16:9'}・{formatSec(detail.durationSec)}
            </Badge>
          </div>
          <div className="mt-1 grid gap-1.5">
            <DefRow label="狙い" text={detail.aim} />
            <DefRow label="想定視聴者" text={detail.audience} />
            <DefRow label="制作時間の目安" text={detail.timeEstimate} />
            <DefRow label="冒頭3秒" text={detail.opening3s} />
            <DefRow label="サビの見せ場" text={detail.chorusHighlight} />
            <DefRow label="ラストシーン" text={detail.lastScene} />
          </div>
        </div>
      </SectionCard>

      {/* 3. 世界観設定 */}
      <SectionCard title="世界観設定" icon={Palette}>
        <div className="grid gap-1.5">
          <DefRow label="世界観" text={detail.world} />
          <DefRow label="色と光" text={detail.colorAndLight} />
          <DefRow label="登場人物" text={detail.characters} />
          <DefRow label="舞台" text={detail.stage} />
        </div>
        <p className="mb-1.5 mt-3 text-xs font-semibold text-muted-foreground">物語の流れ</p>
        <BulletList items={detail.storyFlow} />
      </SectionCard>

      {/* 4. 時系列の構成 */}
      <SectionCard title="時系列の構成" icon={CalendarClock}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">区間</th>
                <th className="py-2 pr-3 font-medium">開始</th>
                <th className="py-2 pr-3 font-medium">終了</th>
                <th className="py-2 font-medium">内容</th>
              </tr>
            </thead>
            <tbody>
              {detail.timeline.map((block) => (
                <tr key={block.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 font-medium">{block.label}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{formatSec(block.startSec)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{formatSec(block.endSec)}</td>
                  <td className="py-2 text-xs text-muted-foreground">{block.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 一貫性設定(ショットへ反映する共通設定) */}
      <SectionCard title="一貫性設定(全ショット共通)" icon={Palette}>
        <ConsistencyPanel
          consistency={detail.consistency}
          onChange={onConsistencyChange}
          onReapplyAll={onReapplyAllConsistency}
        />
      </SectionCard>

      {/* 5. ショットリスト */}
      <SectionCard
        title={`ショットリスト(全${detail.shots.length}件・合計${formatSec(total)})`}
        icon={ListOrdered}
      >
        <ShotTable
          shots={detail.shots}
          onMove={onShotMove}
          onDuplicate={onShotDuplicate}
          onRemove={onShotRemove}
          onRegenerate={onShotRegenerate}
          onReapplyConsistency={onShotReapplyConsistency}
          onUpdate={onShotUpdate}
        />
      </SectionCard>

      {/* 6. 画像生成プロンプト */}
      <SectionCard
        title="画像生成プロンプト(一覧)"
        icon={Image}
        action={
          <CopyButton
            text={detail.shots.map((s) => `S${String(s.no).padStart(2, '0')}: ${s.imagePrompt}`).join('\n')}
            label="全部コピー"
          />
        }
      >
        <div className="flex flex-col gap-2">
          {detail.shots.map((s) => (
            <p key={s.id} className="rounded-lg bg-muted px-3 py-2 font-mono text-xs">
              <span className="font-semibold text-primary">S{String(s.no).padStart(2, '0')}</span> {s.imagePrompt}
            </p>
          ))}
        </div>
      </SectionCard>

      {/* 7. 動画生成プロンプト */}
      <SectionCard
        title="動画生成プロンプト(一覧)"
        icon={SquarePlay}
        action={
          <CopyButton
            text={detail.shots.map((s) => `S${String(s.no).padStart(2, '0')}: ${s.videoPrompt}`).join('\n')}
            label="全部コピー"
          />
        }
      >
        <div className="flex flex-col gap-2">
          {detail.shots.map((s) => (
            <p key={s.id} className="rounded-lg bg-muted px-3 py-2 font-mono text-xs">
              <span className="font-semibold text-primary">S{String(s.no).padStart(2, '0')}</span> {s.videoPrompt}
            </p>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ネガティブプロンプトは各ショットの「生成プロンプトを見る」から確認できます。
        </p>
      </SectionCard>

      {/* 8. 必要素材 */}
      <SectionCard title="必要素材" icon={ClipboardList}>
        <BulletList items={detail.requiredAssets} />
      </SectionCard>

      {/* 9. 制作チェックリスト */}
      <SectionCard title="制作チェックリスト" icon={ClipboardList}>
        <ol className="flex flex-col gap-1.5 text-sm">
          {detail.checklist.map((item, i) => (
            <li key={`${i}-${item.slice(0, 12)}`} className="flex gap-2">
              <span className="shrink-0 font-mono text-xs leading-6 text-primary">{i + 1}.</span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* 10. サムネイル案 */}
      <SectionCard title="サムネイル案" icon={Image}>
        <BulletList items={detail.thumbnailIdeas} />
      </SectionCard>

      {/* 11. Shorts転用案 */}
      <SectionCard title="Shorts転用案" icon={Smartphone}>
        <BulletList items={detail.shortsIdeas} />
      </SectionCard>

      {/* 全体の編集メモ */}
      <SectionCard title="編集メモ(全体)" icon={ClipboardList}>
        <BulletList items={detail.editNotes} />
      </SectionCard>
    </div>
  )
}
