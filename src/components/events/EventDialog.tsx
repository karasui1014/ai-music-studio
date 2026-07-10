import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CalendarPlus } from 'lucide-react'

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
import { useEventStore } from '@/store/useEventStore'
import type { StudioEvent } from '@/lib/types'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function EventDialog({
  event,
  trigger,
}: {
  event?: StudioEvent
  trigger?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const createEvent = useEventStore((s) => s.createEvent)
  const updateEvent = useEventStore((s) => s.updateEvent)
  const isEdit = !!event

  const [title, setTitle] = useState(event?.title ?? '')
  const [date, setDate] = useState(event?.date ?? todayIso())
  const [time, setTime] = useState(event?.time ?? '')
  const [memo, setMemo] = useState(event?.memo ?? '')

  useEffect(() => {
    if (!open) return
    setTitle(event?.title ?? '')
    setDate(event?.date ?? todayIso())
    setTime(event?.time ?? '')
    setMemo(event?.memo ?? '')
  }, [open, event])

  const handleSubmit = () => {
    const input = { title, date, time: time || undefined, memo: memo || undefined }
    if (isEdit && event) {
      updateEvent(event.id, input)
    } else {
      createEvent(input)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <CalendarPlus className="h-4 w-4" />
            イベントを追加
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>{isEdit ? 'イベントを編集' : 'イベントを追加'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="event-title">イベント名</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 冬コミ音楽祭 vol.3"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="event-date">日付</Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-time">時刻(任意)</Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="event-memo">メモ(任意)</Label>
            <Textarea
              id="event-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: 提出締切は3日前、参加費振込済み"
              className="min-h-[70px]"
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
