import { useState } from 'react'
import { History, Plus } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HISTORY_ICON } from '@/lib/constants'
import { formatDate, relativeTime } from '@/lib/format'
import { useSongStore } from '@/store/useSongStore'
import type { Song } from '@/lib/types'

export function HistoryPanel({ song }: { song: Song }) {
  const addNote = useSongStore((s) => s.addNote)
  const [note, setNote] = useState('')

  const handleAdd = () => {
    if (!note.trim()) return
    addNote(song.id, note.trim())
    setNote('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="制作メモを残す(例: ミックス調整が完了)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button onClick={handleAdd} disabled={!note.trim()} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>

      {song.history.length === 0 ? (
        <EmptyState icon={History} title="履歴はまだありません" />
      ) : (
        <ol className="flex flex-col gap-0 border-l border-border pl-5">
          {song.history.map((entry) => {
            const Icon = HISTORY_ICON[entry.type]
            return (
              <li key={entry.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                  <Icon className="h-3 w-3" />
                </span>
                <p className="text-sm">{entry.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(entry.createdAt, 'yyyy年M月d日 HH:mm')} ・ {relativeTime(entry.createdAt)}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
