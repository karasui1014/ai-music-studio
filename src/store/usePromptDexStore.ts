import { create } from 'zustand'

import { genId } from '@/lib/id'
import { promptDexRepository } from '@/lib/tools/prompt-dex/repository'
import {
  PROMPT_DEX_SCHEMA_VERSION,
  type PromptEntry,
  type PromptEntryInput,
  type PromptSource,
} from '@/lib/tools/prompt-dex/types'

/** 自分用プロンプトの保存上限(localStorage肥大化の防止) */
const MAX_USER_ENTRIES = 500

function nowIso() {
  return new Date().toISOString()
}

interface PromptDexStore {
  userEntries: PromptEntry[]
  favorites: string[]
  hydrated: boolean
  hydrate: () => void
  /** 自分用(またはAIプロデューサー由来)プロンプトを追加 */
  addEntry: (input: PromptEntryInput, source?: PromptSource) => PromptEntry
  updateEntry: (id: string, patch: PromptEntryInput) => void
  removeEntry: (id: string) => void
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  /** インポートしたプロンプト配列を取り込む(IDは付与し直し、重複本文はスキップ) */
  importEntries: (entries: PromptEntry[]) => number
}

export const usePromptDexStore = create<PromptDexStore>((set, get) => ({
  userEntries: [],
  favorites: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return
    set({
      userEntries: promptDexRepository.getUserEntries(),
      favorites: promptDexRepository.getFavorites(),
      hydrated: true,
    })
  },

  addEntry: (input, source = 'user') => {
    const entry: PromptEntry = {
      ...input,
      id: genId(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      source,
      schemaVersion: PROMPT_DEX_SCHEMA_VERSION,
    }
    const userEntries = [entry, ...get().userEntries].slice(0, MAX_USER_ENTRIES)
    set({ userEntries })
    promptDexRepository.saveUserEntries(userEntries)
    return entry
  },

  updateEntry: (id, patch) => {
    const userEntries = get().userEntries.map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e,
    )
    set({ userEntries })
    promptDexRepository.saveUserEntries(userEntries)
  },

  removeEntry: (id) => {
    const userEntries = get().userEntries.filter((e) => e.id !== id)
    const favorites = get().favorites.filter((f) => f !== id)
    set({ userEntries, favorites })
    promptDexRepository.saveUserEntries(userEntries)
    promptDexRepository.saveFavorites(favorites)
  },

  toggleFavorite: (id) => {
    const current = get().favorites
    const favorites = current.includes(id) ? current.filter((f) => f !== id) : [id, ...current]
    set({ favorites })
    promptDexRepository.saveFavorites(favorites)
  },

  isFavorite: (id) => get().favorites.includes(id),

  importEntries: (entries) => {
    const existing = get().userEntries
    const seen = new Set(existing.map((e) => e.prompt.trim()))
    const toAdd: PromptEntry[] = []
    for (const e of entries) {
      const key = e.prompt.trim()
      if (seen.has(key)) continue
      seen.add(key)
      toAdd.push({ ...e, id: genId(), source: 'imported', updatedAt: nowIso() })
    }
    if (toAdd.length === 0) return 0
    const userEntries = [...toAdd, ...existing].slice(0, MAX_USER_ENTRIES)
    set({ userEntries })
    promptDexRepository.saveUserEntries(userEntries)
    return toAdd.length
  },
}))
