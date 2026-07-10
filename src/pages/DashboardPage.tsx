import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart, ListMusic, Music4, Rocket, Sparkles } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { StatCard } from '@/components/dashboard/StatCard'
import { UpcomingEventsCard } from '@/components/events/UpcomingEventsCard'
import { SecretaryCard } from '@/components/secretary/SecretaryCard'
import { SongCard } from '@/components/songs/SongCard'
import { NewSongDialog } from '@/components/songs/NewSongDialog'
import { HISTORY_ICON } from '@/lib/constants'
import { relativeTime } from '@/lib/format'
import { useSongStore } from '@/store/useSongStore'

export function DashboardPage() {
  const songs = useSongStore((s) => s.songs)

  const stats = useMemo(
    () => ({
      total: songs.length,
      inProgress: songs.filter((s) => s.status !== 'published').length,
      published: songs.filter((s) => s.status === 'published').length,
      favorite: songs.filter((s) => s.favorite).length,
    }),
    [songs],
  )

  const recentSongs = useMemo(
    () => [...songs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [songs],
  )

  const activity = useMemo(() => {
    const items = songs.flatMap((song) =>
      song.history.map((entry) => ({ ...entry, songId: song.id, songTitle: song.title })),
    )
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  }, [songs])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ダッシュボード</h1>
          <p className="mt-1 text-sm text-muted-foreground">今日も制作を進めていきましょう。</p>
        </div>
        <NewSongDialog />
      </div>

      <SecretaryCard />

      <UpcomingEventsCard />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="総曲数"
          value={stats.total}
          icon={Music4}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="制作中"
          value={stats.inProgress}
          icon={Sparkles}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          label="公開済み"
          value={stats.published}
          icon={Rocket}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="お気に入り"
          value={stats.favorite}
          icon={Heart}
          accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
      </div>

      {songs.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="まだ曲がありません"
          description="最初の曲を作成して、歌詞・Sunoプロンプト・MVプロンプト・YouTube情報を一箇所で管理しましょう。"
          action={<NewSongDialog />}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">最近更新した曲</h2>
              <Link
                to="/songs"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                すべて見る
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {recentSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">最近の制作履歴</h2>
            <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
              <ul className="divide-y divide-border">
                {activity.map((entry) => {
                  const Icon = HISTORY_ICON[entry.type]
                  return (
                    <li key={entry.id}>
                      <Link
                        to={`/songs/${entry.songId}`}
                        className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/60"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{entry.message}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="truncate">{entry.songTitle}</span>
                            <span>·</span>
                            <span className="shrink-0">{relativeTime(entry.createdAt)}</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
