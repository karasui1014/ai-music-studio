import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings2, Sparkles } from 'lucide-react'

import { SecretaryAvatar } from './SecretaryAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getProgress } from '@/lib/leveling'
import { buildSecretaryMessage, calcStreak } from '@/lib/secretary'
import { suggestTheme } from '@/lib/themeSuggestions'
import { useSecretaryStore } from '@/store/useSecretaryStore'
import { useSongStore } from '@/store/useSongStore'
import type { Song } from '@/lib/types'

function ThemeSuggestionBox({ songs }: { songs: Song[] }) {
  const [suggestion, setSuggestion] = useState(() => suggestTheme(songs))
  const [exclude, setExclude] = useState<string[]>([])

  const regenerate = () => {
    const nextExclude = [...exclude, suggestion.key].slice(-8)
    setExclude(nextExclude)
    setSuggestion(suggestTheme(songs, nextExclude))
  }

  return (
    <div className="mt-3 rounded-xl bg-muted/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">次の曲のテーマ提案</p>
        <button
          type="button"
          onClick={regenerate}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          他には?
        </button>
      </div>
      <p className="mt-1 text-sm leading-relaxed">{suggestion.text}</p>
    </div>
  )
}

export function SecretaryCard() {
  const songs = useSongStore((s) => s.songs)
  const settings = useSecretaryStore((s) => s.settings)
  const activeDays = useSecretaryStore((s) => s.activeDays)
  const celebratedMilestones = useSecretaryStore((s) => s.celebratedMilestones)
  const markMilestoneCelebrated = useSecretaryStore((s) => s.markMilestoneCelebrated)
  const hydrated = useSecretaryStore((s) => s.hydrated)

  const streak = useMemo(() => calcStreak(activeDays), [activeDays])
  const progress = useMemo(() => getProgress(songs), [songs])

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{settings.name}</p>
            <Badge variant="outline" className="gap-1 border-transparent bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
              Lv.{progress.level} {progress.title}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {streak >= 2 && <span className="text-xs text-muted-foreground">{streak}日連続</span>}
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link to="/secretary" aria-label="AI秘書の設定">
                <Settings2 className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed">{message.text}</p>
        {!progress.isMaxLevel && (
          <p className="mt-1 text-xs text-muted-foreground">
            次のレベルまであと{progress.songsToNextLevel}曲
          </p>
        )}
        {progress.completedCount > 0 && <ThemeSuggestionBox songs={songs} />}
      </div>
    </div>
  )
}
