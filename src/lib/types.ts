export type SongStatus = 'idea' | 'lyrics' | 'suno' | 'mv' | 'published'

export interface SunoPrompt {
  id: string
  title: string
  stylePrompt: string
  excludeStyles?: string
  version?: string
  memo?: string
  createdAt: string
  updatedAt: string
}

export interface MvPrompt {
  id: string
  title: string
  prompt: string
  tool?: string
  memo?: string
  createdAt: string
  updatedAt: string
}

export interface YoutubePost {
  url?: string
  publishedAt?: string
  title?: string
  description?: string
  tags?: string
  memo?: string
  updatedAt?: string
}

export type HistoryEventType =
  | 'created'
  | 'status_changed'
  | 'lyrics_updated'
  | 'suno_prompt_added'
  | 'suno_prompt_updated'
  | 'suno_prompt_removed'
  | 'mv_prompt_added'
  | 'mv_prompt_updated'
  | 'mv_prompt_removed'
  | 'youtube_updated'
  | 'note_added'

export interface HistoryEntry {
  id: string
  type: HistoryEventType
  message: string
  createdAt: string
}

export interface Song {
  id: string
  title: string
  genre?: string
  status: SongStatus
  favorite: boolean
  lyrics: string
  sunoPrompts: SunoPrompt[]
  mvPrompts: MvPrompt[]
  youtube: YoutubePost
  history: HistoryEntry[]
  createdAt: string
  updatedAt: string
}

export type NewSongInput = Partial<
  Pick<Song, 'title' | 'genre' | 'status' | 'lyrics'>
>
