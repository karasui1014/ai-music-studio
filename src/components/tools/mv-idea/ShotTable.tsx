import type { ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Pencil,
  RefreshCcw,
  Trash2,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyButton } from '@/components/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatSec, shotSeconds } from '@/lib/tools/mv-idea/types'
import type { MvShot } from '@/lib/tools/mv-idea/types'
import { ShotEditDialog } from './ShotEditDialog'

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

/** ショットリスト(編集・コピー・再生成・削除・複製・順番変更・秒数変更・一貫性再反映) */
export function ShotTable({
  shots,
  onMove,
  onDuplicate,
  onRemove,
  onRegenerate,
  onReapplyConsistency,
  onUpdate,
}: {
  shots: MvShot[]
  onMove: (id: string, direction: 'up' | 'down') => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onRegenerate: (id: string) => void
  onReapplyConsistency: (id: string) => void
  onUpdate: (id: string, patch: Partial<Omit<MvShot, 'id' | 'no'>>, durationSec?: number) => void
}) {
  const copyShotText = async (shot: MvShot) => {
    const text = [
      `S${String(shot.no).padStart(2, '0')} ${formatSec(shot.startSec)}〜${formatSec(shot.endSec)}(${shotSeconds(shot)}秒)`,
      `場面: ${shot.scene}`,
      `画像生成プロンプト: ${shot.imagePrompt}`,
      `動画生成プロンプト: ${shot.videoPrompt}`,
      `ネガティブプロンプト: ${shot.negativePrompt}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`S${String(shot.no).padStart(2, '0')}をコピーしました`)
    } catch {
      toast.error('コピーに失敗しました')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {shots.map((shot, index) => (
        <div key={shot.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-transparent bg-primary/10 font-mono text-primary">
                S{String(shot.no).padStart(2, '0')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatSec(shot.startSec)}〜{formatSec(shot.endSec)}({shotSeconds(shot)}秒)
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <IconAction label="上へ移動" onClick={() => onMove(shot.id, 'up')} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </IconAction>
              <IconAction
                label="下へ移動"
                onClick={() => onMove(shot.id, 'down')}
                disabled={index === shots.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </IconAction>
              <ShotEditDialog
                shot={shot}
                onSave={(patch, durationSec) => onUpdate(shot.id, patch, durationSec)}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="編集" title="編集(秒数変更もここから)">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              <IconAction label="プロンプトをコピー" onClick={() => void copyShotText(shot)}>
                <Copy className="h-4 w-4" />
              </IconAction>
              <IconAction label="このショットを再生成" onClick={() => onRegenerate(shot.id)}>
                <RefreshCcw className="h-4 w-4" />
              </IconAction>
              <IconAction label="一貫性設定を再反映" onClick={() => onReapplyConsistency(shot.id)}>
                <Wand2 className="h-4 w-4" />
              </IconAction>
              <IconAction label="複製" onClick={() => onDuplicate(shot.id)}>
                <Copy className="h-4 w-4 rotate-90" />
              </IconAction>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="削除"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
                title={`S${String(shot.no).padStart(2, '0')}を削除しますか?`}
                description="削除すると後続ショットの番号と時間が詰め直されます。"
                onConfirm={() => onRemove(shot.id)}
              />
            </div>
          </div>

          <p className="mt-2 text-sm">{shot.scene}</p>

          <div className="mt-2 grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
            <span>構図: {shot.composition}</span>
            <span>カメラ: {shot.cameraMove}</span>
            <span>被写体: {shot.subjectMove}</span>
            <span>背景: {shot.background}</span>
            <span>光: {shot.light}</span>
            <span>素材: {shot.assets}</span>
            {shot.editMemo && <span className="sm:col-span-2">編集メモ: {shot.editMemo}</span>}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              生成プロンプトを見る
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">画像生成プロンプト</span>
                  <CopyButton text={shot.imagePrompt} label="コピー" />
                </div>
                <p className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-xs">{shot.imagePrompt}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">動画生成プロンプト</span>
                  <CopyButton text={shot.videoPrompt} label="コピー" />
                </div>
                <p className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-xs">{shot.videoPrompt}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">ネガティブプロンプト</span>
                  <CopyButton text={shot.negativePrompt} label="コピー" />
                </div>
                <p className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-xs">{shot.negativePrompt}</p>
              </div>
            </div>
          </details>
        </div>
      ))}
    </div>
  )
}
