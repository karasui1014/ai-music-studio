import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarDays, History } from 'lucide-react'

import { EventDialog } from '@/components/events/EventDialog'
import { Badge } from '@/components/ui/badge'
import { countdownLabel, daysUntil, eventDateTime, sortByUpcoming } from '@/lib/events'
import { cn } from '@/lib/utils'
import { useEventStore } from '@/store/useEventStore'
import type { StudioEvent } from '@/lib/types'

function DateBadge({ event, size }: { event: StudioEvent; size: 'lg' | 'md' }) {
  const d = eventDateTime(event)
  const urgent = daysUntil(event) <= 3
  const dims = size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col items-center justify-center rounded-xl leading-none',
        dims,
        urgent ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary',
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
        {format(d, 'M月', { locale: ja })}
      </span>
      <span className={cn('font-bold', size === 'lg' ? 'text-2xl' : 'text-lg')}>{d.getDate()}</span>
    </div>
  )
}

export function UpcomingEventsCard() {
  const events = useEventStore((s) => s.events)

  const { upcoming, pastCount } = useMemo(() => {
    const sorted = sortByUpcoming(events)
    return {
      upcoming: sorted.filter((e) => daysUntil(e) >= 0),
      pastCount: sorted.filter((e) => daysUntil(e) < 0).length,
    }
  }, [events])

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">参加予定のイベント</h2>
        </div>
        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <Link to="/events" className="text-xs font-medium text-primary hover:underline">
              すべて見る
            </Link>
          )}
          <EventDialog
            trigger={
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
              >
                + 追加
              </button>
            }
          />
        </div>
      </div>

      {upcoming.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted-foreground">参加予定のフェスやイベントはまだありません</p>
          {pastCount > 0 && (
            <Link
              to="/events"
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <History className="h-3.5 w-3.5" />
              過去のイベント履歴を見る({pastCount}件)
            </Link>
          )}
          <EventDialog />
        </div>
      )}

      {upcoming.length === 1 && (
        <div className="flex items-center gap-5">
          <DateBadge event={upcoming[0]} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold">{upcoming[0].title}</p>
              <Badge
                variant="outline"
                className={cn(
                  'border-transparent',
                  daysUntil(upcoming[0]) <= 3
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-primary/10 text-primary',
                )}
              >
                {countdownLabel(daysUntil(upcoming[0]))}
              </Badge>
            </div>
            {upcoming[0].time && (
              <p className="mt-0.5 text-sm text-muted-foreground">{upcoming[0].time}〜</p>
            )}
            {upcoming[0].memo && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {upcoming[0].memo}
              </p>
            )}
          </div>
        </div>
      )}

      {upcoming.length >= 2 && upcoming.length <= 3 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <DateBadge event={event} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {countdownLabel(daysUntil(event))}
                  {event.time ? ` ・ ${event.time}〜` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 3 && (
        <div className="flex flex-col divide-y divide-border">
          {upcoming.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                  {format(eventDateTime(event), 'M/d(EEEEE)', { locale: ja })}
                </span>
                <span className="truncate text-sm">{event.title}</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 border-transparent',
                  daysUntil(event) <= 3
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-primary/10 text-primary',
                )}
              >
                {countdownLabel(daysUntil(event))}
              </Badge>
            </div>
          ))}
          <Link
            to="/events"
            className="pt-2.5 text-xs font-medium text-primary hover:underline"
          >
            他{upcoming.length - 3}件を見る →
          </Link>
        </div>
      )}
    </div>
  )
}
