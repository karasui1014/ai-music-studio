import { strToU8, strFromU8, unzipSync, zipSync } from 'fflate'

import { idbFiles } from '@/lib/idb'
import { STATUS_META } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import { DEFAULT_SECRETARY_SETTINGS, type SecretarySettings } from '@/lib/secretary'
import { AVATAR_IDB_KEY, STORAGE_KEYS } from '@/lib/storageKeys'
import type { Song, SongStatus, StudioEvent } from '@/lib/types'

const MAX_IMPORT_BYTES = 100 * 1024 * 1024 // 100MB — generous, but bounds memory use from a hostile file
const VALID_STATUSES: SongStatus[] = ['idea', 'lyrics', 'suno', 'mv', 'published']

/** Coerce an unknown value into a well-formed StudioEvent, dropping anything unusable. */
function normalizeEvent(raw: unknown): StudioEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.date !== 'string') return null
  const nowFallback = new Date().toISOString()
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    time: typeof r.time === 'string' ? r.time : undefined,
    memo: typeof r.memo === 'string' ? r.memo : undefined,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : nowFallback,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : nowFallback,
  }
}

/** Coerce an unknown value into a well-formed Song, defaulting any missing/malformed
 * fields so a corrupted or hand-edited backup can never crash the app on render. */
function normalizeSong(raw: unknown): Song | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.title !== 'string') return null
  const nowFallback = new Date().toISOString()
  return {
    id: r.id,
    title: r.title,
    genre: typeof r.genre === 'string' ? r.genre : undefined,
    status: VALID_STATUSES.includes(r.status as SongStatus) ? (r.status as SongStatus) : 'idea',
    favorite: typeof r.favorite === 'boolean' ? r.favorite : false,
    lyrics: typeof r.lyrics === 'string' ? r.lyrics : '',
    sunoPrompts: Array.isArray(r.sunoPrompts) ? (r.sunoPrompts as Song['sunoPrompts']) : [],
    mvPrompts: Array.isArray(r.mvPrompts) ? (r.mvPrompts as Song['mvPrompts']) : [],
    youtube: typeof r.youtube === 'object' && r.youtube !== null ? (r.youtube as Song['youtube']) : {},
    history: Array.isArray(r.history) ? (r.history as Song['history']) : [],
    completedAt: typeof r.completedAt === 'string' ? r.completedAt : undefined,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : nowFallback,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : nowFallback,
  }
}

export interface BackupData {
  app: 'ai-music-studio'
  version: 1
  exportedAt: string
  songs: Song[]
  events: StudioEvent[]
  secretary: {
    settings: SecretarySettings
    activeDays: string[]
    celebratedMilestones: number[]
    avatar?: { type: string; base64: string }
  }
  theme?: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToU8(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function buildBackup(): Promise<BackupData> {
  const songs = readJson<Song[]>(STORAGE_KEYS.songs, [])
  const events = readJson<StudioEvent[]>(STORAGE_KEYS.events, [])
  const settings = {
    ...DEFAULT_SECRETARY_SETTINGS,
    ...readJson<Partial<SecretarySettings>>(STORAGE_KEYS.secretarySettings, {}),
  }
  const activeDays = readJson<string[]>(STORAGE_KEYS.activityDays, [])
  const celebratedMilestones = readJson<number[]>(STORAGE_KEYS.celebratedMilestones, [])
  const theme = window.localStorage.getItem(STORAGE_KEYS.theme) ?? undefined

  let avatar: BackupData['secretary']['avatar']
  try {
    const blob = await idbFiles.get(AVATAR_IDB_KEY)
    if (blob) {
      avatar = { type: blob.type, base64: await blobToBase64(blob) }
    }
  } catch {
    // IndexedDB unavailable — export without the avatar image
  }

  return {
    app: 'ai-music-studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    songs,
    events,
    secretary: { settings, activeDays, celebratedMilestones, avatar },
    theme,
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || 'untitled'
}

export function songToMarkdown(song: Song): string {
  const lines: string[] = []
  lines.push(`# ${song.title}`)
  lines.push('')
  lines.push(`- ステータス: ${STATUS_META[song.status].label}`)
  if (song.genre) lines.push(`- ジャンル: ${song.genre}`)
  lines.push(`- 作成日: ${formatDate(song.createdAt)}`)
  lines.push(`- 最終更新: ${formatDate(song.updatedAt)}`)
  lines.push('')

  if (song.lyrics.trim()) {
    lines.push('## 歌詞')
    lines.push('')
    lines.push('```')
    lines.push(song.lyrics)
    lines.push('```')
    lines.push('')
  }

  if (song.sunoPrompts.length > 0) {
    lines.push('## Sunoプロンプト')
    lines.push('')
    for (const p of song.sunoPrompts) {
      lines.push(`### ${p.title}${p.version ? ` (${p.version})` : ''}`)
      lines.push('')
      lines.push('```')
      lines.push(p.stylePrompt)
      lines.push('```')
      if (p.excludeStyles) {
        lines.push('')
        lines.push(`除外スタイル: ${p.excludeStyles}`)
      }
      if (p.memo) {
        lines.push('')
        lines.push(`メモ: ${p.memo}`)
      }
      lines.push('')
    }
  }

  if (song.mvPrompts.length > 0) {
    lines.push('## MVプロンプト')
    lines.push('')
    for (const p of song.mvPrompts) {
      lines.push(`### ${p.title}${p.tool ? ` (${p.tool})` : ''}`)
      lines.push('')
      lines.push('```')
      lines.push(p.prompt)
      lines.push('```')
      if (p.memo) {
        lines.push('')
        lines.push(`メモ: ${p.memo}`)
      }
      lines.push('')
    }
  }

  const yt = song.youtube
  if (yt.url || yt.title || yt.description || yt.tags || yt.memo) {
    lines.push('## YouTube')
    lines.push('')
    if (yt.url) lines.push(`- URL: ${yt.url}`)
    if (yt.publishedAt) lines.push(`- 公開日: ${yt.publishedAt}`)
    if (yt.title) lines.push(`- タイトル: ${yt.title}`)
    if (yt.tags) lines.push(`- タグ: ${yt.tags}`)
    lines.push('')
    if (yt.description) {
      lines.push('### 概要欄')
      lines.push('')
      lines.push('```')
      lines.push(yt.description)
      lines.push('```')
      lines.push('')
    }
    if (yt.memo) {
      lines.push(`メモ: ${yt.memo}`)
      lines.push('')
    }
  }

  if (song.history.length > 0) {
    lines.push('## 制作履歴')
    lines.push('')
    for (const entry of song.history) {
      lines.push(`- ${formatDate(entry.createdAt, 'yyyy-MM-dd HH:mm')} ${entry.message}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export async function exportAsJson() {
  const backup = await buildBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  download(blob, `ai-music-studio-backup-${dateStamp()}.json`)
}

export async function exportAsMarkdown() {
  const backup = await buildBackup()
  const parts = backup.songs.map(songToMarkdown)
  const body = `# AI Music Studio 全曲エクスポート (${dateStamp()})\n\n---\n\n${parts.join('\n\n---\n\n')}\n`
  const blob = new Blob([body], { type: 'text/markdown' })
  download(blob, `ai-music-studio-songs-${dateStamp()}.md`)
}

const AVATAR_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function exportAsZip() {
  const backup = await buildBackup()
  const files: Record<string, Uint8Array> = {
    'data.json': strToU8(JSON.stringify(backup, null, 2)),
  }
  for (const song of backup.songs) {
    files[`songs/${sanitizeFilename(song.title)}-${song.id.slice(0, 8)}.md`] = strToU8(
      songToMarkdown(song),
    )
  }
  if (backup.secretary.avatar) {
    const ext = AVATAR_EXT[backup.secretary.avatar.type] ?? 'png'
    files[`secretary-avatar.${ext}`] = base64ToU8(backup.secretary.avatar.base64)
  }
  const zipped = zipSync(files, { level: 6 })
  download(new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' }), `ai-music-studio-backup-${dateStamp()}.zip`)
}

function isBackupShape(value: unknown): value is Record<string, unknown> & { songs: unknown[] } {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.app === 'ai-music-studio' && Array.isArray(v.songs)
}

/** Parse a backup file (.json or .zip). Throws with a user-facing message on failure.
 * Every song is defensively normalized, so a corrupted or tampered file can't crash the app. */
export async function parseBackupFile(file: File): Promise<BackupData> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error('ファイルサイズが大きすぎます(上限100MB)')
  }

  let jsonText: string
  if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip') {
    const unzipped = unzipSync(new Uint8Array(await file.arrayBuffer()))
    const entry = unzipped['data.json']
    if (!entry) throw new Error('ZIPの中に data.json が見つかりませんでした')
    jsonText = strFromU8(entry)
  } else {
    jsonText = await file.text()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('バックアップファイルを読み取れませんでした')
  }
  if (!isBackupShape(parsed)) {
    throw new Error('AI Music Studioのバックアップファイルではないようです')
  }

  const songs = parsed.songs.map(normalizeSong).filter((s): s is Song => s !== null)
  const events = Array.isArray(parsed.events)
    ? parsed.events.map(normalizeEvent).filter((e): e is StudioEvent => e !== null)
    : []
  return { ...parsed, songs, events } as BackupData
}

/** Replace all local data with the backup, then reload the page. */
export async function restoreBackup(backup: BackupData): Promise<void> {
  window.localStorage.setItem(STORAGE_KEYS.songs, JSON.stringify(backup.songs))
  window.localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(backup.events ?? []))
  window.localStorage.setItem(
    STORAGE_KEYS.secretarySettings,
    JSON.stringify(backup.secretary?.settings ?? DEFAULT_SECRETARY_SETTINGS),
  )
  window.localStorage.setItem(
    STORAGE_KEYS.activityDays,
    JSON.stringify(backup.secretary?.activeDays ?? []),
  )
  window.localStorage.setItem(
    STORAGE_KEYS.celebratedMilestones,
    JSON.stringify(backup.secretary?.celebratedMilestones ?? []),
  )
  if (backup.theme) {
    window.localStorage.setItem(STORAGE_KEYS.theme, backup.theme)
  }

  try {
    if (backup.secretary?.avatar) {
      const bytes = base64ToU8(backup.secretary.avatar.base64)
      await idbFiles.set(
        AVATAR_IDB_KEY,
        new Blob([bytes.buffer as ArrayBuffer], { type: backup.secretary.avatar.type }),
      )
    } else {
      await idbFiles.remove(AVATAR_IDB_KEY)
    }
  } catch {
    // IndexedDB unavailable — restore everything else
  }

  window.location.reload()
}

/** Wipe every trace of local data (songs, secretary settings/avatar, theme), then reload
 * to a genuinely first-run state. Irreversible unless the caller took a backup first. */
export async function resetAllData(): Promise<void> {
  for (const key of Object.values(STORAGE_KEYS)) {
    window.localStorage.removeItem(key)
  }
  try {
    await idbFiles.remove(AVATAR_IDB_KEY)
  } catch {
    // IndexedDB unavailable — the rest is still cleared
  }
  window.location.reload()
}
