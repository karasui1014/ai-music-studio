import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { HistoryPanel } from '@/components/song-detail/HistoryPanel'
import { LyricsPanel } from '@/components/song-detail/LyricsPanel'
import { MvPromptsPanel } from '@/components/song-detail/MvPromptsPanel'
import { OverviewPanel } from '@/components/song-detail/OverviewPanel'
import { SongHeader } from '@/components/song-detail/SongHeader'
import { SunoPromptsPanel } from '@/components/song-detail/SunoPromptsPanel'
import { YoutubePanel } from '@/components/song-detail/YoutubePanel'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSong } from '@/hooks/useSong'
import { useSongStore } from '@/store/useSongStore'

const TABS = [
  { value: 'overview', label: '概要' },
  { value: 'lyrics', label: '歌詞' },
  { value: 'suno', label: 'Suno' },
  { value: 'mv', label: 'MV' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'history', label: '履歴' },
]

export function SongDetailPage() {
  const { songId } = useParams<{ songId: string }>()
  const song = useSong(songId)
  const hydrated = useSongStore((s) => s.hydrated)
  const [tab, setTab] = useState('overview')

  if (!song) {
    if (!hydrated) return null
    return (
      <EmptyState
        icon={FileQuestion}
        title="曲が見つかりませんでした"
        description="削除されたか、URLが正しくない可能性があります。"
        action={
          <Button asChild>
            <Link to="/songs">曲一覧に戻る</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SongHeader song={song} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel song={song} onNavigateTab={setTab} />
        </TabsContent>
        <TabsContent value="lyrics">
          <LyricsPanel song={song} />
        </TabsContent>
        <TabsContent value="suno">
          <SunoPromptsPanel song={song} />
        </TabsContent>
        <TabsContent value="mv">
          <MvPromptsPanel song={song} />
        </TabsContent>
        <TabsContent value="youtube">
          <YoutubePanel song={song} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryPanel song={song} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
