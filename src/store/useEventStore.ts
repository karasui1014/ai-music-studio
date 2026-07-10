import { create } from 'zustand'

import { genId } from '@/lib/id'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import type { EventInput, StudioEvent } from '@/lib/types'

function nowIso() {
  return new Date().toISOString()
}

function read(): StudioEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.events)
    return raw ? (JSON.parse(raw) as StudioEvent[]) : []
  } catch {
    return []
  }
}

function write(events: StudioEvent[]) {
  window.localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events))
}

interface EventStore {
  events: StudioEvent[]
  hydrated: boolean
  hydrate: () => void
  createEvent: (input: EventInput) => StudioEvent
  updateEvent: (id: string, input: EventInput) => void
  removeEvent: (id: string) => void
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return
    set({ events: read(), hydrated: true })
  },

  createEvent: (input) => {
    const timestamp = nowIso()
    const event: StudioEvent = {
      id: genId(),
      title: input.title.trim() || '無題のイベント',
      date: input.date,
      time: input.time || undefined,
      memo: input.memo?.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const next = [...get().events, event]
    set({ events: next })
    write(next)
    return event
  },

  updateEvent: (id, input) => {
    const next = get().events.map((e) =>
      e.id === id
        ? {
            ...e,
            title: input.title.trim() || '無題のイベント',
            date: input.date,
            time: input.time || undefined,
            memo: input.memo?.trim() || undefined,
            updatedAt: nowIso(),
          }
        : e,
    )
    set({ events: next })
    write(next)
  },

  removeEvent: (id) => {
    const next = get().events.filter((e) => e.id !== id)
    set({ events: next })
    write(next)
  },
}))
