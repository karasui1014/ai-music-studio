import { useMemo, useState } from 'react'
import { Heart, ListMusic, Search, SearchX, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/EmptyState'
import { NewSongDialog } from '@/components/songs/NewSongDialog'
import { SongCard } from '@/components/songs/SongCard'
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
import type { SongStatus } from '@/lib/types'

export function SongsPage() {
  const songs = useSongStore((s) => s.songs)
  const loadSampleData = useSongStore((s) => s.loadSampleData)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SongStatus | 'all'>('all')
  const [favoriteOnly, setFavoriteOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return songs
      .filter((s) => statusFilter === 'all' || s.status === statusFilter)
      .filter((s) => !favoriteOnly || s.favorite)
      .filter((s) => !q || s.title.toLowerCase().includes(q) || (s.genre ?? '').toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [songs, statusFilter, favoriteOnly, query])

  const hasFilters = query.trim() !== '' || statusFilter !== 'all' || favoriteOnly

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">曲一覧</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {songs.length}曲を管理中
          </p>
        </div>
        <NewSongDialog />
      </div>

      {songs.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="曲名・ジャンルで検索"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SongStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのステータス</SelectItem>
              {STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_META[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={favoriteOnly ? 'default' : 'outline'}
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setFavoriteOnly((v) => !v)}
          >
            <Heart className={cn('h-4 w-4', favoriteOnly && 'fill-current')} />
            お気に入り
          </Button>
        </div>
      )}

      {songs.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="まだ曲がありません"
          description="「新しい曲」から最初のプロジェクトを作成しましょう。"
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <NewSongDialog />
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  loadSampleData()
                  toast.success('サンプルの曲を3件追加しました')
                }}
              >
                <Wand2 className="h-4 w-4" />
                サンプルデータを試す
              </Button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="条件に一致する曲がありません"
          description={hasFilters ? '検索条件やフィルタを変更してみてください。' : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  )
}
