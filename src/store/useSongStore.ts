import { create } from 'zustand'

import { genId } from '@/lib/id'
import { songRepository } from '@/lib/repository'
import { STATUS_META } from '@/lib/constants'
import type {
  HistoryEntry,
  MvPrompt,
  NewSongInput,
  Song,
  SongStatus,
  SunoPrompt,
  YoutubePost,
} from '@/lib/types'

type SunoPromptInput = Pick<
  SunoPrompt,
  'title' | 'stylePrompt' | 'excludeStyles' | 'version' | 'memo'
>
type MvPromptInput = Pick<MvPrompt, 'title' | 'prompt' | 'tool' | 'memo'>

function nowIso() {
  return new Date().toISOString()
}

function makeHistory(type: HistoryEntry['type'], message: string): HistoryEntry {
  return { id: genId(), type, message, createdAt: nowIso() }
}

function createEmptySong(input?: NewSongInput): Song {
  const timestamp = nowIso()
  return {
    id: genId(),
    title: input?.title?.trim() || '無題の曲',
    genre: input?.genre,
    status: input?.status ?? 'idea',
    favorite: false,
    lyrics: input?.lyrics ?? '',
    sunoPrompts: [],
    mvPrompts: [],
    youtube: {},
    history: [makeHistory('created', '曲を作成しました')],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

interface SongStore {
  songs: Song[]
  hydrated: boolean
  hydrate: () => Promise<void>
  createSong: (input?: NewSongInput) => Song
  removeSong: (id: string) => void
  toggleFavorite: (id: string) => void
  updateBasicInfo: (id: string, patch: { title?: string; genre?: string }) => void
  updateStatus: (id: string, status: SongStatus) => void
  updateLyrics: (id: string, lyrics: string) => void
  addSunoPrompt: (id: string, input: SunoPromptInput) => void
  updateSunoPrompt: (id: string, promptId: string, patch: Partial<SunoPromptInput>) => void
  removeSunoPrompt: (id: string, promptId: string) => void
  addMvPrompt: (id: string, input: MvPromptInput) => void
  updateMvPrompt: (id: string, promptId: string, patch: Partial<MvPromptInput>) => void
  removeMvPrompt: (id: string, promptId: string) => void
  updateYoutube: (id: string, patch: Partial<YoutubePost>) => void
  addNote: (id: string, message: string) => void
}

export const useSongStore = create<SongStore>((set, get) => {
  function mutate(id: string, mutator: (song: Song) => Song) {
    const songs = get().songs
    const index = songs.findIndex((s) => s.id === id)
    if (index === -1) return
    const updated = mutator(structuredClone(songs[index]))
    updated.updatedAt = nowIso()
    const next = [...songs]
    next[index] = updated
    set({ songs: next })
    void songRepository.save(updated)
  }

  let hydratePromise: Promise<void> | null = null

  return {
    songs: [],
    hydrated: false,

    hydrate: () => {
      if (hydratePromise) return hydratePromise
      hydratePromise = (async () => {
        const songs = await songRepository.getAll()
        songs.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        set({ songs, hydrated: true })
      })()
      return hydratePromise
    },

    createSong: (input) => {
      const song = createEmptySong(input)
      set({ songs: [song, ...get().songs] })
      void songRepository.save(song)
      return song
    },

    removeSong: (id) => {
      set({ songs: get().songs.filter((s) => s.id !== id) })
      void songRepository.remove(id)
    },

    toggleFavorite: (id) => {
      mutate(id, (song) => {
        song.favorite = !song.favorite
        return song
      })
    },

    updateBasicInfo: (id, patch) => {
      mutate(id, (song) => {
        if (patch.title !== undefined) song.title = patch.title.trim() || '無題の曲'
        if (patch.genre !== undefined) song.genre = patch.genre
        return song
      })
    },

    updateStatus: (id, status) => {
      mutate(id, (song) => {
        if (song.status === status) return song
        song.status = status
        song.history.unshift(
          makeHistory('status_changed', `ステータスを「${STATUS_META[status].label}」に変更しました`),
        )
        return song
      })
    },

    updateLyrics: (id, lyrics) => {
      mutate(id, (song) => {
        song.lyrics = lyrics
        return song
      })
    },

    addSunoPrompt: (id, input) => {
      mutate(id, (song) => {
        const timestamp = nowIso()
        const prompt: SunoPrompt = { id: genId(), createdAt: timestamp, updatedAt: timestamp, ...input }
        song.sunoPrompts.unshift(prompt)
        song.history.unshift(makeHistory('suno_prompt_added', `Sunoプロンプト「${prompt.title}」を追加しました`))
        return song
      })
    },

    updateSunoPrompt: (id, promptId, patch) => {
      mutate(id, (song) => {
        const prompt = song.sunoPrompts.find((p) => p.id === promptId)
        if (!prompt) return song
        Object.assign(prompt, patch, { updatedAt: nowIso() })
        song.history.unshift(makeHistory('suno_prompt_updated', `Sunoプロンプト「${prompt.title}」を更新しました`))
        return song
      })
    },

    removeSunoPrompt: (id, promptId) => {
      mutate(id, (song) => {
        const prompt = song.sunoPrompts.find((p) => p.id === promptId)
        song.sunoPrompts = song.sunoPrompts.filter((p) => p.id !== promptId)
        if (prompt) {
          song.history.unshift(makeHistory('suno_prompt_removed', `Sunoプロンプト「${prompt.title}」を削除しました`))
        }
        return song
      })
    },

    addMvPrompt: (id, input) => {
      mutate(id, (song) => {
        const timestamp = nowIso()
        const prompt: MvPrompt = { id: genId(), createdAt: timestamp, updatedAt: timestamp, ...input }
        song.mvPrompts.unshift(prompt)
        song.history.unshift(makeHistory('mv_prompt_added', `MVプロンプト「${prompt.title}」を追加しました`))
        return song
      })
    },

    updateMvPrompt: (id, promptId, patch) => {
      mutate(id, (song) => {
        const prompt = song.mvPrompts.find((p) => p.id === promptId)
        if (!prompt) return song
        Object.assign(prompt, patch, { updatedAt: nowIso() })
        song.history.unshift(makeHistory('mv_prompt_updated', `MVプロンプト「${prompt.title}」を更新しました`))
        return song
      })
    },

    removeMvPrompt: (id, promptId) => {
      mutate(id, (song) => {
        const prompt = song.mvPrompts.find((p) => p.id === promptId)
        song.mvPrompts = song.mvPrompts.filter((p) => p.id !== promptId)
        if (prompt) {
          song.history.unshift(makeHistory('mv_prompt_removed', `MVプロンプト「${prompt.title}」を削除しました`))
        }
        return song
      })
    },

    updateYoutube: (id, patch) => {
      mutate(id, (song) => {
        song.youtube = { ...song.youtube, ...patch, updatedAt: nowIso() }
        song.history.unshift(makeHistory('youtube_updated', 'YouTube投稿情報を更新しました'))
        return song
      })
    },

    addNote: (id, message) => {
      mutate(id, (song) => {
        song.history.unshift(makeHistory('note_added', message))
        return song
      })
    },
  }
})
