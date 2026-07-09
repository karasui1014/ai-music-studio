import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSongStore } from '@/store/useSongStore'

export function NewSongDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const createSong = useSongStore((s) => s.createSong)
  const navigate = useNavigate()

  const handleCreate = () => {
    const song = createSong({ title, genre: genre || undefined })
    setOpen(false)
    setTitle('')
    setGenre('')
    navigate(`/songs/${song.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            新しい曲
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreate()
          }}
          className="grid gap-5"
        >
          <DialogHeader>
            <DialogTitle>新しい曲を作成</DialogTitle>
            <DialogDescription>
              まずはタイトルだけでOK。あとからいつでも編集できます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="new-song-title">曲名</Label>
            <Input
              id="new-song-title"
              placeholder="例: 深夜のドライブ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-song-genre">ジャンル(任意)</Label>
            <Input
              id="new-song-genre"
              placeholder="例: Lo-fi Hip Hop"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit">作成する</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
