import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatSec, shotSeconds } from '@/lib/tools/mv-idea/types'
import type { MvShot } from '@/lib/tools/mv-idea/types'

/** ショット1件の編集(秒数変更もここで行う) */
export function ShotEditDialog({
  shot,
  trigger,
  onSave,
}: {
  shot: MvShot
  trigger: ReactNode
  onSave: (patch: Partial<Omit<MvShot, 'id' | 'no'>>, durationSec?: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(shot)
  const [duration, setDuration] = useState(String(shotSeconds(shot)))

  useEffect(() => {
    if (!open) return
    setDraft(shot)
    setDuration(String(shotSeconds(shot)))
  }, [open, shot])

  const set = (patch: Partial<MvShot>) => setDraft((d) => ({ ...d, ...patch }))

  const handleSave = () => {
    const parsed = Number(duration)
    const nextDuration =
      Number.isFinite(parsed) && parsed > 0 && parsed !== shotSeconds(shot) ? parsed : undefined
    const { scene, composition, cameraMove, subjectMove, background, light, imagePrompt, videoPrompt, negativePrompt, assets, editMemo } = draft
    onSave(
      { scene, composition, cameraMove, subjectMove, background, light, imagePrompt, videoPrompt, negativePrompt, assets, editMemo },
      nextDuration,
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            S{String(shot.no).padStart(2, '0')} を編集({formatSec(shot.startSec)}〜)
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs">場面説明</Label>
            <Textarea value={draft.scene} onChange={(e) => set({ scene: e.target.value })} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">秒数(変更すると後続ショットの時間がずれます)</Label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="decimal" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">カメラ構図</Label>
            <Input value={draft.composition} onChange={(e) => set({ composition: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">カメラの動き</Label>
            <Input value={draft.cameraMove} onChange={(e) => set({ cameraMove: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">被写体の動き</Label>
            <Input value={draft.subjectMove} onChange={(e) => set({ subjectMove: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">背景</Label>
            <Input value={draft.background} onChange={(e) => set({ background: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">光</Label>
            <Input value={draft.light} onChange={(e) => set({ light: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs">画像生成プロンプト</Label>
            <Textarea
              value={draft.imagePrompt}
              onChange={(e) => set({ imagePrompt: e.target.value })}
              rows={3}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs">動画生成プロンプト</Label>
            <Textarea
              value={draft.videoPrompt}
              onChange={(e) => set({ videoPrompt: e.target.value })}
              rows={3}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs">ネガティブプロンプト</Label>
            <Textarea
              value={draft.negativePrompt}
              onChange={(e) => set({ negativePrompt: e.target.value })}
              rows={2}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">必要素材</Label>
            <Input value={draft.assets} onChange={(e) => set({ assets: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">編集メモ</Label>
            <Input value={draft.editMemo} onChange={(e) => set({ editMemo: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
