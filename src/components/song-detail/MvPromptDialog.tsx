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
import type { MvPrompt } from '@/lib/types'

export function MvPromptDialog({
  songId,
  prompt,
  trigger,
}: {
  songId: string
  prompt?: MvPrompt
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const addMvPrompt = useSongStore((s) => s.addMvPrompt)
  const updateMvPrompt = useSongStore((s) => s.updateMvPrompt)
  const isEdit = !!prompt

  const [title, setTitle] = useState(prompt?.title ?? '')
  const [tool, setTool] = useState(prompt?.tool ?? '')
  const [prompt_, setPrompt] = useState(prompt?.prompt ?? '')
  const [memo, setMemo] = useState(prompt?.memo ?? '')

  useEffect(() => {
    if (!open) return
    setTitle(prompt?.title ?? '')
    setTool(prompt?.tool ?? '')
    setPrompt(prompt?.prompt ?? '')
    setMemo(prompt?.memo ?? '')
  }, [open, prompt])

  const handleSubmit = () => {
    const input = {
      title: title.trim() || 'MVプロンプト',
      tool: tool.trim() || undefined,
      prompt: prompt_,
      memo: memo.trim() || undefined,
    }
    if (isEdit && prompt) {
      updateMvPrompt(songId, prompt.id, input)
    } else {
      addMvPrompt(songId, input)
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
            <DialogTitle>{isEdit ? 'MVプロンプトを編集' : 'MVプロンプトを追加'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 grid gap-1.5 sm:col-span-1">
              <Label>タイトル</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 雨夜の街並みVer"
                autoFocus
              />
            </div>
            <div className="col-span-2 grid gap-1.5 sm:col-span-1">
              <Label>使用ツール(任意)</Label>
              <Input
                value={tool}
                onChange={(e) => setTool(e.target.value)}
                placeholder="例: Runway, Kling, Pika"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>プロンプト</Label>
            <Textarea
              value={prompt_}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="rainy neon city street, cinematic lo-fi anime style, slow camera pan..."
              className="min-h-[120px] font-mono text-sm"
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
