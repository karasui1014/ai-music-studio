import { useMemo } from 'react'
import { CalendarDays, Pencil, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { EventDialog } from '@/components/events/EventDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { countdownLabel, daysUntil, eventDateTime, sortByUpcoming } from '@/lib/events'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useEventStore } from '@/store/useEventStore'
import type { StudioEvent } from '@/lib/types'

function EventRow({ event, past }: { event: StudioEvent; past: boolean }) {
  const removeEvent = useEventStore((s) => s.removeEvent)
  const days = daysUntil(event)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border p-4',
        past && 'opacity-60',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{event.title}</p>
          {!past && (
            <Badge
              variant="outline"
              className={cn(
                'border-transparent',
                days <= 3
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-primary/10 text-primary',
              )}
            >
              {countdownLabel(days)}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatDate(eventDateTime(event).toISOString(), 'yyyy年M月d日(E)')}
          {event.time && ` ${event.time}〜`}
        </p>
        {event.memo && (
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{event.memo}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <EventDialog
          event={event}
          trigger={
            <Button variant="ghost" size="icon" aria-label="編集">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
          title={`「${event.title}」を削除しますか?`}
          onConfirm={() => removeEvent(event.id)}
        />
      </div>
    </div>
  )
}

export function EventsPage() {
  const events = useEventStore((s) => s.events)

  const { upcoming, past } = useMemo(() => {
    const sorted = sortByUpcoming(events)
    return {
      upcoming: sorted.filter((e) => daysUntil(e) >= 0),
      past: sorted.filter((e) => daysUntil(e) < 0).reverse(),
    }
  }, [events])

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">イベント予定</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            参加するフェスやイベント、提出締切をまとめて管理できます。
          </p>
        </div>
        <EventDialog />
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="イベントの予定はまだありません"
          description="参加するフェスやイベントを登録して、締切やスケジュールを管理しましょう。"
          action={<EventDialog />}
        />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">今後の予定</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">今後の予定はありません。</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((event) => (
                  <EventRow key={event.id} event={event} past={false} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">過去のイベント</h2>
              <div className="flex flex-col gap-3">
                {past.map((event) => (
                  <EventRow key={event.id} event={event} past />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
