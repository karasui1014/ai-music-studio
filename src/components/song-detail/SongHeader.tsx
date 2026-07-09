import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_META, STATUS_ORDER } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useSongStore } from '@/store/useSongStore'
import type { Song, SongStatus } from '@/lib/types'

export function SongHeader({ song }: { song: Song }) {
  const navigate = useNavigate()
  const updateBasicInfo = useSongStore((s) => s.updateBasicInfo)
  const updateStatus = useSongStore((s) => s.updateStatus)
  const toggleFavorite = useSongStore((s) => s.toggleFavorite)
  const removeSong = useSongStore((s) => s.removeSong)

  const [title, setTitle] = useState(song.title)
  const [genre, setGenre] = useState(song.genre ?? '')

  useEffect(() => {
    setTitle(song.title)
    setGenre(song.genre ?? '')
  }, [song.id, song.title, song.genre])

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-1.5 text-muted-foreground"
        onClick={() => navigate('/songs')}
      >
        <ArrowLeft className="h-4 w-4" />
        曲一覧に戻る
      </Button>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => updateBasicInfo(song.id, { title })}
            className="h-auto border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
            placeholder="曲名を入力"
          />
          <Input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            onBlur={() => updateBasicInfo(song.id, { genre })}
            className="mt-1 h-auto border-none bg-transparent px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
            placeholder="ジャンルを追加"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavorite(song.id)}
            aria-label="お気に入り切り替え"
          >
            <Star className={cn('h-4 w-4', song.favorite && 'fill-amber-400 text-amber-400')} />
          </Button>

          <Select value={song.status} onValueChange={(v) => updateStatus(song.id, v as SongStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((status) => {
                const meta = STATUS_META[status]
                return (
                  <SelectItem key={status} value={status}>
                    <span className="flex items-center gap-2">
                      <meta.icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <ConfirmDialog
            trigger={
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="曲を削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title={`「${song.title}」を削除しますか?`}
            description="歌詞・Sunoプロンプト・MVプロンプト・履歴などすべてのデータが完全に削除されます。この操作は取り消せません。"
            onConfirm={() => {
              removeSong(song.id)
              navigate('/songs')
            }}
          />
        </div>
      </div>
    </div>
  )
}
