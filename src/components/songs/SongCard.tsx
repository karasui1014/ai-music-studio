import { Link } from 'react-router-dom'
import { Clapperboard, Music2, PenLine, SquarePlay, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { STATUS_META } from '@/lib/constants'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Song } from '@/lib/types'

function ProgressDot({
  active,
  icon: Icon,
  label,
}: {
  active: boolean
  icon: typeof PenLine
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md',
            active ? 'bg-primary/10 text-primary' : 'text-muted-foreground/40',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{active ? `${label} 済み` : `${label} 未着手`}</TooltipContent>
    </Tooltip>
  )
}

export function SongCard({ song }: { song: Song }) {
  const status = STATUS_META[song.status]

  return (
    <Link
      to={`/songs/${song.id}`}
      className="group block rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold group-hover:text-primary">{song.title}</p>
          {song.genre ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{song.genre}</p>
          ) : (
            <p className="mt-0.5 truncate text-xs text-muted-foreground/50">ジャンル未設定</p>
          )}
        </div>
        {song.favorite && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge variant="outline" className={cn('gap-1 border-transparent', status.badge)}>
          <status.icon className="h-3 w-3" />
          {status.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{relativeTime(song.updatedAt)}</span>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3">
        <ProgressDot active={song.lyrics.trim().length > 0} icon={PenLine} label="歌詞" />
        <ProgressDot active={song.sunoPrompts.length > 0} icon={Music2} label="Suno" />
        <ProgressDot active={song.mvPrompts.length > 0} icon={Clapperboard} label="MV" />
        <ProgressDot active={!!song.youtube.url} icon={SquarePlay} label="YouTube" />
      </div>
    </Link>
  )
}
