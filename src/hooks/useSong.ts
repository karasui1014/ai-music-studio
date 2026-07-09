import { useSongStore } from '@/store/useSongStore'

export function useSong(id: string | undefined) {
  return useSongStore((state) => state.songs.find((song) => song.id === id))
}
