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
import { useEventStore } from '@/store/useEventStore'
import { useSecretaryStore } from '@/store/useSecretaryStore'
import { useSongStore } from '@/store/useSongStore'

function App() {
  const hydrate = useSongStore((s) => s.hydrate)
  const hydrateSecretary = useSecretaryStore((s) => s.hydrate)
  const hydrateEvents = useEventStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
    void hydrateSecretary()
    hydrateEvents()
  }, [hydrate, hydrateSecretary, hydrateEvents])

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="songs" element={<SongsPage />} />
              <Route path="songs/:songId" element={<SongDetailPage />} />
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
