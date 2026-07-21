import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/hooks/useTheme'
import { DashboardPage } from '@/pages/DashboardPage'
import { DataPage } from '@/pages/DataPage'
import { EventsPage } from '@/pages/EventsPage'
import { SecretaryPage } from '@/pages/SecretaryPage'
import { SongDetailPage } from '@/pages/SongDetailPage'
import { SongsPage } from '@/pages/SongsPage'
import { ToolsPage } from '@/pages/ToolsPage'
import { AiProducerPage } from '@/pages/tools/AiProducerPage'
import { LyricsReviewPage } from '@/pages/tools/LyricsReviewPage'
import { MvIdeaPage } from '@/pages/tools/MvIdeaPage'
import { useEventStore } from '@/store/useEventStore'
import { useSecretaryStore } from '@/store/useSecretaryStore'
import { useSongStore } from '@/store/useSongStore'
import { useToolRunStore } from '@/store/useToolRunStore'

function App() {
  const hydrate = useSongStore((s) => s.hydrate)
  const hydrateSecretary = useSecretaryStore((s) => s.hydrate)
  const hydrateEvents = useEventStore((s) => s.hydrate)
  const hydrateToolRuns = useToolRunStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
    void hydrateSecretary()
    hydrateEvents()
    hydrateToolRuns()
  }, [hydrate, hydrateSecretary, hydrateEvents, hydrateToolRuns])

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="songs" element={<SongsPage />} />
              <Route path="songs/:songId" element={<SongDetailPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="tools/ai-producer" element={<AiProducerPage />} />
              <Route path="tools/lyrics-review" element={<LyricsReviewPage />} />
              <Route path="tools/mv-idea" element={<MvIdeaPage />} />
              <Route path="secretary" element={<SecretaryPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="data" element={<DataPage />} />
            </Route>
          </Routes>
        </HashRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
