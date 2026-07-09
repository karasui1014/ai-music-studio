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
import { useSongStore } from '@/store/useSongStore'
import type { SunoPrompt } from '@/lib/types'

export function SunoPromptDialog({
  songId,
  prompt,
  trigger,
}: {
  songId: string
  prompt?: SunoPrompt
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const addSunoPrompt = useSongStore((s) => s.addSunoPrompt)
  const updateSunoPrompt = useSongStore((s) => s.updateSunoPrompt)
  const isEdit = !!prompt

  const [title, setTitle] = useState(prompt?.title ?? '')
  const [version, setVersion] = useState(prompt?.version ?? '')
  const [stylePrompt, setStylePrompt] = useState(prompt?.stylePrompt ?? '')
  const [excludeStyles, setExcludeStyles] = useState(prompt?.excludeStyles ?? '')
  const [memo, setMemo] = useState(prompt?.memo ?? '')

  useEffect(() => {
    if (!open) return
    setTitle(prompt?.title ?? '')
    setVersion(prompt?.version ?? '')
    setStylePrompt(prompt?.stylePrompt ?? '')
    setExcludeStyles(prompt?.excludeStyles ?? '')
    setMemo(prompt?.memo ?? '')
  }, [open, prompt])

  const handleSubmit = () => {
    const input = {
      title: title.trim() || 'スタイルプロンプト',
      version: version.trim() || undefined,
      stylePrompt,
      excludeStyles: excludeStyles.trim() || undefined,
      memo: memo.trim() || undefined,
    }
    if (isEdit && prompt) {
      updateSunoPrompt(songId, prompt.id, input)
    } else {
      addSunoPrompt(songId, input)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Sunoプロンプトを編集' : 'Sunoプロンプトを追加'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 grid gap-1.5 sm:col-span-1">
              <Label>タイトル</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: Lo-fiドライブVer"
                autoFocus
              />
            </div>
            <div className="col-span-2 grid gap-1.5 sm:col-span-1">
              <Label>バージョン(任意)</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="例: v2"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>スタイルプロンプト</Label>
            <Textarea
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="lo-fi hip hop, warm vinyl texture, mellow piano, rain ambience..."
              className="min-h-[100px] font-mono text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>除外スタイル(任意)</Label>
            <Textarea
              value={excludeStyles}
              onChange={(e) => setExcludeStyles(e.target.value)}
              placeholder="metal, screaming vocals..."
              className="min-h-[60px] font-mono text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>メモ(任意)</Label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <DialogFooter>
            <Button type="submit">{isEdit ? '更新する' : '追加する'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
