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
import { cn } from '@/lib/utils'
import { useSongStore } from '@/store/useSongStore'
import type { PromptEntry } from '@/lib/tools/prompt-dex/types'
import type { Song } from '@/lib/types'

type SaveMode = 'new' | 'replace' | 'append'

const MODE_META: Record<SaveMode, { label: string; hint: string; confirm: string; needsTarget: boolean }> = {
  new: {
    label: '新しい候補として保存',
    hint: 'このプロンプトを、新しいSunoプロンプトとして追加します',
    confirm: '新しい候補として保存する',
    needsTarget: false,
  },
  replace: {
    label: '既存プロンプトを置き換え',
    hint: '選んだ既存プロンプトの本文を、このプロンプトへ置き換えます',
    confirm: '確認して置き換える',
    needsTarget: true,
  },
  append: {
    label: '既存プロンプトへ追記',
    hint: '選んだ既存プロンプトの末尾に、このプロンプトを追記します',
    confirm: '確認して追記する',
    needsTarget: true,
  },
}

/**
 * 図鑑のプロンプトを既存曲のSunoプロンプトへ反映する。
 * 自動上書きはせず、反映先の曲・モード・現在値/反映後を必ず確認してから保存する。
 */
export function ApplyToSongDialog({
  entry,
  songs,
  defaultSongId,
  trigger,
}: {
  entry: PromptEntry
  songs: Song[]
  defaultSongId?: string
  trigger: ReactNode
}) {
  const addSunoPrompt = useSongStore((s) => s.addSunoPrompt)
  const updateSunoPrompt = useSongStore((s) => s.updateSunoPrompt)
  const addToolHistory = useSongStore((s) => s.addToolHistory)

  const [open, setOpen] = useState(false)
  const [songId, setSongId] = useState('')
  const [mode, setMode] = useState<SaveMode>('new')
  const [targetId, setTargetId] = useState('')

  const song = songs.find((s) => s.id === songId)

  useEffect(() => {
    if (!open) return
    const initial = defaultSongId && songs.some((s) => s.id === defaultSongId) ? defaultSongId : songs[0]?.id ?? ''
    setSongId(initial)
    setMode('new')
  }, [open, defaultSongId, songs])

  useEffect(() => {
    setTargetId(song?.sunoPrompts[0]?.id ?? '')
    if (song && song.sunoPrompts.length === 0) setMode('new')
  }, [song])

  const target = song?.sunoPrompts.find((p) => p.id === targetId)
  const needsTarget = MODE_META[mode].needsTarget
  const currentValue = needsTarget ? (target?.stylePrompt ?? '') : null
  const newValue = useMemo(() => {
    if (mode === 'append') return [target?.stylePrompt ?? '', entry.prompt].filter(Boolean).join('\n\n')
    return entry.prompt
  }, [mode, target, entry.prompt])

  const canSave = !!song && (!needsTarget || !!target)

  const handleSave = () => {
    if (!song) return
    if (mode === 'new') {
      addSunoPrompt(song.id, {
        title: `図鑑: ${entry.title}`,
        stylePrompt: entry.prompt,
        memo: `プロンプト図鑑から追加(${entry.genre}${entry.subgenre ? ` / ${entry.subgenre}` : ''})`,
      })
      addToolHistory(song.id, `プロンプト図鑑「${entry.title}」を新しいSunoプロンプト候補として保存しました`)
    } else if (target) {
      updateSunoPrompt(song.id, target.id, { stylePrompt: newValue })
      addToolHistory(
        song.id,
        mode === 'replace'
          ? `Sunoプロンプト「${target.title}」を図鑑「${entry.title}」で置き換えました`
          : `Sunoプロンプト「${target.title}」へ図鑑「${entry.title}」を追記しました`,
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
          <DialogTitle>既存曲へ反映</DialogTitle>
          <DialogDescription>
            自動上書きはしません。反映先と反映後の内容を確認してから保存してください。
          </DialogDescription>
        </DialogHeader>

        {songs.length === 0 ? (
          <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            まだ曲がありません。先に曲を作成してください。
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">反映先の曲</span>
              <Select value={songId} onValueChange={setSongId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="曲を選択" />
                </SelectTrigger>
                <SelectContent>
                  {songs.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(MODE_META) as SaveMode[]).map((m) => {
                const disabled = MODE_META[m].needsTarget && (song?.sunoPrompts.length ?? 0) === 0
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
                      {disabled ? 'この曲にはまだSunoプロンプトがありません' : MODE_META[m].hint}
                    </span>
                  </button>
                )
              })}
            </div>

            {needsTarget && song && song.sunoPrompts.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">対象のSunoプロンプト</span>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="対象を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {song.sunoPrompts.map((p) => (
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
          </>
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
