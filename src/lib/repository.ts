import { STORAGE_KEYS } from '@/lib/storageKeys'
import type { Song } from '@/lib/types'

const STORAGE_KEY = STORAGE_KEYS.songs

/**
 * Repository abstraction so the LocalStorage implementation below can be
 * swapped for a Firestore-backed one later without touching call sites.
 */
export interface SongRepository {
  getAll(): Promise<Song[]>
  getById(id: string): Promise<Song | undefined>
  save(song: Song): Promise<Song>
  remove(id: string): Promise<void>
  subscribe(listener: () => void): () => void
}

class LocalStorageSongRepository implements SongRepository {
  private listeners = new Set<() => void>()

  private read(): Song[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Song[]) : []
    } catch {
      return []
    }
  }

  private write(songs: Song[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
    this.listeners.forEach((listener) => listener())
  }

  async getAll(): Promise<Song[]> {
    return this.read()
  }

  async getById(id: string): Promise<Song | undefined> {
    return this.read().find((song) => song.id === id)
  }

  async save(song: Song): Promise<Song> {
    const songs = this.read()
    const index = songs.findIndex((s) => s.id === song.id)
    if (index === -1) {
      songs.unshift(song)
    } else {
      songs[index] = song
    }
    this.write(songs)
    return song
  }

  async remove(id: string): Promise<void> {
    const songs = this.read().filter((song) => song.id !== id)
    this.write(songs)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const songRepository: SongRepository = new LocalStorageSongRepository()
