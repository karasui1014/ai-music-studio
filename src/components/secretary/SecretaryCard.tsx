import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'

import { SecretaryAvatar } from './SecretaryAvatar'
import { Button } from '@/components/ui/button'
import { buildSecretaryMessage, calcStreak } from '@/lib/secretary'
import { useSecretaryStore } from '@/store/useSecretaryStore'
import { useSongStore } from '@/store/useSongStore'

export function SecretaryCard() {
  const songs = useSongStore((s) => s.songs)
  const settings = useSecretaryStore((s) => s.settings)
  const activeDays = useSecretaryStore((s) => s.activeDays)
  const celebratedMilestones = useSecretaryStore((s) => s.celebratedMilestones)
  const markMilestoneCelebrated = useSecretaryStore((s) => s.markMilestoneCelebrated)
  const hydrated = useSecretaryStore((s) => s.hydrated)

  const streak = useMemo(() => calcStreak(activeDays), [activeDays])

  const message = useMemo(
    () =>
      buildSecretaryMessage({
        songs,
        settings,
        streak,
        celebratedMilestones,
      }),
    [songs, settings, streak, celebratedMilestones],
  )

  useEffect(() => {
    if (message.milestone) {
      markMilestoneCelebrated(message.milestone)
    }
  }, [message.milestone, markMilestoneCelebrated])

  if (!hydrated) return null

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <SecretaryAvatar className="h-14 w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{settings.name}</p>
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="text-xs text-muted-foreground">{streak}日連続</span>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link to="/secretary" aria-label="AI秘書の設定">
                <Settings2 className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed">{message.text}</p>
      </div>
    </div>
  )
}
