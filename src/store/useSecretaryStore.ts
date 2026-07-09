import { create } from 'zustand'

import { idbFiles } from '@/lib/idb'
import {
  DEFAULT_SECRETARY_SETTINGS,
  toDateKey,
  type SecretarySettings,
} from '@/lib/secretary'
import { AVATAR_IDB_KEY, STORAGE_KEYS } from '@/lib/storageKeys'

const SETTINGS_KEY = STORAGE_KEYS.secretarySettings
const ACTIVITY_KEY = STORAGE_KEYS.activityDays
const MILESTONES_KEY = STORAGE_KEYS.celebratedMilestones

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

interface SecretaryStore {
  settings: SecretarySettings
  avatarUrl: string | null
  activeDays: string[]
  celebratedMilestones: number[]
  hydrated: boolean
  hydrate: () => Promise<void>
  updateSettings: (patch: Partial<SecretarySettings>) => void
  setAvatar: (file: File) => Promise<void>
  removeAvatar: () => Promise<void>
  recordActivityToday: () => void
  markMilestoneCelebrated: (milestone: number) => void
}

let hydratePromise: Promise<void> | null = null

export const useSecretaryStore = create<SecretaryStore>((set, get) => ({
  settings: DEFAULT_SECRETARY_SETTINGS,
  avatarUrl: null,
  activeDays: [],
  celebratedMilestones: [],
  hydrated: false,

  hydrate: () => {
    if (hydratePromise) return hydratePromise
    hydratePromise = (async () => {
      const settings = {
        ...DEFAULT_SECRETARY_SETTINGS,
        ...readJson<Partial<SecretarySettings>>(SETTINGS_KEY, {}),
      }
      const activeDays = readJson<string[]>(ACTIVITY_KEY, [])
      const celebratedMilestones = readJson<number[]>(MILESTONES_KEY, [])

      let avatarUrl: string | null = null
      try {
        const blob = await idbFiles.get(AVATAR_IDB_KEY)
        if (blob) avatarUrl = URL.createObjectURL(blob)
      } catch {
        // IndexedDB unavailable (e.g. private mode) — fall back to default avatar
      }

      set({ settings, activeDays, celebratedMilestones, avatarUrl, hydrated: true })
      get().recordActivityToday()
    })()
    return hydratePromise
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch }
    set({ settings })
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  },

  setAvatar: async (file) => {
    await idbFiles.set(AVATAR_IDB_KEY, file)
    const prev = get().avatarUrl
    if (prev) URL.revokeObjectURL(prev)
    set({ avatarUrl: URL.createObjectURL(file) })
  },

  removeAvatar: async () => {
    await idbFiles.remove(AVATAR_IDB_KEY)
    const prev = get().avatarUrl
    if (prev) URL.revokeObjectURL(prev)
    set({ avatarUrl: null })
  },

  recordActivityToday: () => {
    const today = toDateKey(new Date())
    const days = get().activeDays
    if (days.includes(today)) return
    const next = [...days, today].slice(-400)
    set({ activeDays: next })
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
  },

  markMilestoneCelebrated: (milestone) => {
    const current = get().celebratedMilestones
    if (current.includes(milestone)) return
    const next = [...current, milestone]
    set({ celebratedMilestones: next })
    window.localStorage.setItem(MILESTONES_KEY, JSON.stringify(next))
  },
}))
