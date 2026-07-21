import { create } from 'zustand'

import { genId } from '@/lib/id'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import type { ToolRunRecord } from '@/lib/tools/types'

/** 実行履歴の上限。古いものから自動的に削る(localStorageの肥大化防止) */
const MAX_RUNS = 100

/**
 * ユニオン型の各メンバーごとにキーを除外する。
 * 通常のOmitはユニオンを共通プロパティだけに潰してしまうため、
 * ツール固有フィールド(例: 歌詞添削AIの decisions)が失われてしまう。
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

function readRuns(): ToolRunRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.toolRuns)
    return raw ? (JSON.parse(raw) as ToolRunRecord[]) : []
  } catch {
    return []
  }
}

function writeRuns(runs: ToolRunRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.toolRuns, JSON.stringify(runs))
  } catch {
    // 容量超過などで保存に失敗しても、画面上の結果表示は継続する
  }
}

interface ToolRunStore {
  runs: ToolRunRecord[]
  hydrated: boolean
  hydrate: () => void
  addRun: (run: DistributiveOmit<ToolRunRecord, 'id' | 'createdAt'>) => ToolRunRecord
  updateRun: (id: string, patch: Partial<DistributiveOmit<ToolRunRecord, 'id' | 'toolId'>>) => void
  removeRun: (id: string) => void
}

export const useToolRunStore = create<ToolRunStore>((set, get) => ({
  runs: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return
    const runs = readRuns()
    runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    set({ runs, hydrated: true })
  },

  addRun: (run) => {
    const record = {
      ...run,
      id: genId(),
      createdAt: new Date().toISOString(),
    } as ToolRunRecord
    const runs = [record, ...get().runs].slice(0, MAX_RUNS)
    set({ runs })
    writeRuns(runs)
    return record
  },

  updateRun: (id, patch) => {
    const runs = get().runs.map((r) => (r.id === id ? ({ ...r, ...patch } as ToolRunRecord) : r))
    set({ runs })
    writeRuns(runs)
  },

  removeRun: (id) => {
    const runs = get().runs.filter((r) => r.id !== id)
    set({ runs })
    writeRuns(runs)
  },
}))
