import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { makeCombinedVideoPrompt, makePlanMemoText } from '@/lib/tools/mv-idea/export'
import type { MvPlanDetail } from '@/lib/tools/mv-idea/types'
import { useSongStore } from '@/store/useSongStore'
import { cn } from '@/lib/utils'
import type { Song } from '@/lib/types'

type SaveMode = 'new' | 'memo' | 'replace' | 'append'

const MODE_META: Record<
  SaveMode,
  { label: string; hint: string; confirm: string; needsTarget: boolean }
> = {
  new: {
    label: '新しい候補として保存',
    hint: '全ショットの動画プロンプトを、新しいMVプロンプトとして追加します',
    confirm: '新しい候補として保存する',
    needsTarget: false,
  },
  memo: {
    label: '企画概要をMVメモへ保存',
    hint: '企画の概要・狙い・見せ場を、MVプロンプト欄のメモとして追加します',
    confirm: 'MVメモとして保存する',
    needsTarget: false,
  },
  replace: {
    label: '既存MVプロンプトを置き換え',
    hint: '選んだ既存プロンプトの内容を、動画プロンプトへ置き換えます',
    confirm: '確認して置き換える',
    needsTarget: true,
  },
  append: {
    label: '既存MVプロンプトへ追記',
    hint: '選んだ既存プロンプトの末尾に、動画プロンプトを追記します',
    confirm: '確認して追記する',
    needsTarget: true,
  },
}

/**
 * 既存曲への保存ダイアログ。
 * 自動上書きはせず、現在値と反映後を必ず見せてから保存する(開発憲章・基盤HANDOFF)。
 */
export function SaveToSongDialog({
  song,
  detail,
  videoAiTool,
  trigger,
}: {
  song: Song
  detail: MvPlanDetail
  /** 入力フォームの「使用予定の動画生成AI」(MvPromptのツール名に使う) */
  videoAiTool: string
  trigger: ReactNode
}) {
  const addMvPrompt = useSongStore((s) => s.addMvPrompt)
  const updateMvPrompt = useSongStore((s) => s.updateMvPrompt)
  const addToolHistory = useSongStore((s) => s.addToolHistory)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<SaveMode>('new')
  const [targetId, setTargetId] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setMode('new')
    setTargetId(song.mvPrompts[0]?.id ?? '')
  }, [open, song.mvPrompts])

  const combined = useMemo(() => makeCombinedVideoPrompt(detail), [detail])
  const memoText = useMemo(() => makePlanMemoText(detail), [detail])

  const target = song.mvPrompts.find((p) => p.id === targetId)
  const needsTarget = MODE_META[mode].needsTarget
  const currentValue = needsTarget ? (target?.prompt ?? '') : null
  const newValue =
    mode === 'memo' ? memoText : mode === 'append' ? [target?.prompt ?? '', combined].filter(Boolean).join('\n\n') : combined

  const canSave = !needsTarget || !!target

  const handleSave = () => {
    const title = detail.conceptTitle
    if (mode === 'new') {
      addMvPrompt(song.id, {
        title: `MV企画: ${title}`,
        prompt: combined,
        tool: videoAiTool.trim() || 'MVアイデア生成AI',
        memo: `MVアイデア生成AIで生成(全${detail.shots.length}ショット)`,
      })
      addToolHistory(song.id, `MVアイデア生成AIの企画「${title}」を新しいMVプロンプト候補として保存しました`)
    } else if (mode === 'memo') {
      addMvPrompt(song.id, {
        title: `MV企画メモ: ${title}`,
        prompt: memoText,
        tool: 'MVアイデア生成AI',
        memo: '企画概要のメモ(プロンプトではありません)',
      })
      addToolHistory(song.id, `MVアイデア生成AIの企画概要「${title}」をMVメモとして保存しました`)
    } else if (target) {
      updateMvPrompt(song.id, target.id, { prompt: newValue })
      addToolHistory(
        song.id,
        mode === 'replace'
          ? `MVプロンプト「${target.title}」をMVアイデア生成AIの企画「${title}」で置き換えました`
          : `MVプロンプト「${target.title}」へMVアイデア生成AIの企画「${title}」を追記しました`,
      )
    }
    toast.success('曲へ保存しました(制作履歴にも記録)')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>「{song.title}」へ保存</DialogTitle>
          <DialogDescription>
            自動上書きはしません。反映後の内容を確認してから保存してください。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(MODE_META) as SaveMode[]).map((m) => {
            const disabled = MODE_META[m].needsTarget && song.mvPrompts.length === 0
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  mode === m ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/60',
                  disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                )}
              >
                <span className="block text-sm font-medium">{MODE_META[m].label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {disabled ? 'この曲にはまだMVプロンプトがありません' : MODE_META[m].hint}
                </span>
              </button>
            )
          })}
        </div>

        {needsTarget && song.mvPrompts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">対象のMVプロンプト</span>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="対象を選択" />
              </SelectTrigger>
              <SelectContent>
                {song.mvPrompts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentValue !== null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">現在値</p>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                {currentValue || '(空)'}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-primary">反映後</p>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 font-mono text-xs">
                {newValue}
              </pre>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-1 text-xs font-medium text-primary">保存される内容</p>
            <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 font-mono text-xs">
              {newValue}
            </pre>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {MODE_META[mode].confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
