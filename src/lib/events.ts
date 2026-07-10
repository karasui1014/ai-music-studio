import type { StudioEvent } from '@/lib/types'

export function eventDateTime(event: StudioEvent): Date {
  return new Date(`${event.date}T${event.time || '00:00'}:00`)
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Calendar-day difference (not a strict 24h count), so "tomorrow morning" reads as 1 regardless of the current hour. */
export function daysUntil(event: StudioEvent, now = new Date()): number {
  const todayKey = dateKey(now)
  const eventDay = new Date(`${event.date}T00:00:00`)
  const today = new Date(`${todayKey}T00:00:00`)
  return Math.round((eventDay.getTime() - today.getTime()) / 86_400_000)
}

export function isPastEvent(event: StudioEvent, now = new Date()): boolean {
  return eventDateTime(event).getTime() < now.getTime() - 60 * 60 * 1000 && daysUntil(event, now) < 0
}

export function sortByUpcoming(events: StudioEvent[]): StudioEvent[] {
  return [...events].sort((a, b) => eventDateTime(a).getTime() - eventDateTime(b).getTime())
}

export function countdownLabel(days: number): string {
  if (days === 0) return '今日'
  if (days === 1) return '明日'
  if (days > 1) return `あと${days}日`
  if (days === -1) return '昨日'
  return `${Math.abs(days)}日前`
}
