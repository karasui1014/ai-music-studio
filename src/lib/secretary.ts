import type { Song } from '@/lib/types'

export type SpeakingStyle = 'polite' | 'friendly' | 'cool'
export type CheerStyle = 'gentle' | 'energetic' | 'stoic'

export interface SecretarySettings {
  name: string
  firstPerson: string
  speakingStyle: SpeakingStyle
  personality: string
  catchphrase: string
  cheerStyle: CheerStyle
}

export const DEFAULT_SECRETARY_SETTINGS: SecretarySettings = {
  name: 'アシスタント',
  firstPerson: '私',
  speakingStyle: 'polite',
  personality: '',
  catchphrase: '',
  cheerStyle: 'gentle',
}

export const SPEAKING_STYLE_LABEL: Record<SpeakingStyle, string> = {
  polite: 'ていねい',
  friendly: 'フレンドリー',
  cool: 'クール',
}

export const CHEER_STYLE_LABEL: Record<CheerStyle, string> = {
  gentle: 'やさしく見守る',
  energetic: '元気に盛り上げる',
  stoic: '淡々と支える',
}

export const SONG_MILESTONES = [10, 30, 50, 100, 200, 300, 500]

export interface SecretaryContext {
  songs: Song[]
  settings: SecretarySettings
  streak: number
  celebratedMilestones: number[]
  now?: Date
}

export interface SecretaryMessage {
  text: string
  /** set when this message celebrates a song-count milestone (store should mark it) */
  milestone?: number
}

function greeting(hour: number, style: SpeakingStyle): string {
  if (hour < 5 || hour >= 18) {
    return style === 'polite' ? 'こんばんは。' : style === 'friendly' ? 'こんばんは!' : 'こんばんは。'
  }
  if (hour < 11) {
    return style === 'polite'
      ? 'おはようございます。'
      : style === 'friendly'
        ? 'おはよう!'
        : 'おはよう。'
  }
  return style === 'polite' ? 'こんにちは。' : style === 'friendly' ? 'こんにちは!' : 'こんにちは。'
}

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length]
}

function byCheer(cheer: CheerStyle, gentle: string, energetic: string, stoic: string): string {
  return cheer === 'energetic' ? energetic : cheer === 'stoic' ? stoic : gentle
}

export function buildSecretaryMessage(ctx: SecretaryContext): SecretaryMessage {
  const { songs, settings, streak, celebratedMilestones } = ctx
  const now = ctx.now ?? new Date()
  const cheer = settings.cheerStyle
  const me = settings.firstPerson || '私'
  const daySeed = Math.floor(now.getTime() / 86_400_000)

  // 1. song-count milestones (celebrated once)
  const total = songs.length
  const milestone = [...SONG_MILESTONES]
    .reverse()
    .find((m) => total >= m && !celebratedMilestones.includes(m))
  if (milestone) {
    const text = byCheer(
      cheer,
      `${milestone}曲目ですね。かなり作品が増えました。${me}も嬉しいです。`,
      `ついに${milestone}曲達成です!すごいペースですね!`,
      `${milestone}曲。着実に積み上がっています。`,
    )
    return { text: withCatchphrase(text, settings), milestone }
  }

  // 2. streak milestones (shown on the exact day)
  if (streak === 7) {
    return {
      text: withCatchphrase(
        byCheer(
          cheer,
          '一週間続きましたね。この調子で、無理せずいきましょう。',
          '7日連続です!習慣になってきましたね!',
          '7日継続。継続は力です。',
        ),
        settings,
      ),
    }
  }
  if (streak === 30) {
    return {
      text: withCatchphrase(
        byCheer(
          cheer,
          '30日継続、おつかれさまです。もう立派な習慣ですね。',
          '30日連続!ここまで続く人はなかなかいませんよ!',
          '30日。数字は裏切りません。',
        ),
        settings,
      ),
    }
  }

  // 3. situational suggestions (rotates daily among applicable ones)
  const suggestions: string[] = []

  if (total === 0) {
    suggestions.push(
      byCheer(
        cheer,
        `${greeting(now.getHours(), settings.speakingStyle)}今日は何から作りますか?まずは1曲、気軽に登録してみましょう。`,
        `${greeting(now.getHours(), settings.speakingStyle)}最初の1曲を作りましょう!「新しい曲」からすぐ始められますよ!`,
        `${greeting(now.getHours(), settings.speakingStyle)}まずは1曲。登録から始めましょう。`,
      ),
    )
  }

  const lyricsDoneNoSuno = songs.find(
    (s) => s.lyrics.trim().length > 0 && s.sunoPrompts.length === 0,
  )
  if (lyricsDoneNoSuno) {
    suggestions.push(
      byCheer(
        cheer,
        `「${lyricsDoneNoSuno.title}」の歌詞、いい感じですね。次はスタイルプロンプトを作りましょう。`,
        `「${lyricsDoneNoSuno.title}」の歌詞ができてますね!次はSunoプロンプトいきましょう!`,
        `「${lyricsDoneNoSuno.title}」は歌詞まで完了。次はスタイルプロンプトです。`,
      ),
    )
  }

  const sunoDoneNoMv = songs.find((s) => s.sunoPrompts.length > 0 && s.mvPrompts.length === 0)
  if (sunoDoneNoMv) {
    suggestions.push(
      byCheer(
        cheer,
        `「${sunoDoneNoMv.title}」、そろそろMVのイメージを考えてみませんか?絵コンテツールも使えますよ。`,
        `「${sunoDoneNoMv.title}」のMV、作っちゃいましょう!絵コンテから始めるのがおすすめです!`,
        `「${sunoDoneNoMv.title}」はMV未着手。絵コンテから固めるのが近道です。`,
      ),
    )
  }

  const readyToPublish = songs.find((s) => s.status === 'mv' && !s.youtube.url)
  if (readyToPublish) {
    suggestions.push(
      byCheer(
        cheer,
        `「${readyToPublish.title}」、公開の準備を始めませんか?YouTubeタブに下書きを残せます。`,
        `「${readyToPublish.title}」、もうすぐ公開ですね!タイトル案を考えましょう!`,
        `「${readyToPublish.title}」は公開待ち。概要欄の下書きを進めましょう。`,
      ),
    )
  }

  const published = songs.filter((s) => s.status === 'published')
  if (published.length > 0) {
    const target = pick(published, daySeed)
    suggestions.push(
      byCheer(
        cheer,
        `「${target.title}」、批評ツールで改善点を確認してみませんか?次の作品のヒントになります。`,
        `「${target.title}」を批評ツールでチェックしてみましょう!伸びしろが見つかりますよ!`,
        `「${target.title}」のレビュー未実施。振り返りは次作の材料になります。`,
      ),
    )
  }

  if (suggestions.length > 0) {
    return { text: withCatchphrase(pick(suggestions, daySeed), settings) }
  }

  // 4. fallback greeting
  return {
    text: withCatchphrase(
      `${greeting(now.getHours(), settings.speakingStyle)}今日は何から作りますか?`,
      settings,
    ),
  }
}

function withCatchphrase(text: string, settings: SecretarySettings): string {
  if (!settings.catchphrase.trim()) return text
  return `${text} ${settings.catchphrase.trim()}`
}

/** consecutive-day streak ending today (or yesterday, so the streak isn't lost before today's first visit) */
export function calcStreak(activeDays: string[], now = new Date()): number {
  if (activeDays.length === 0) return 0
  const days = new Set(activeDays)
  const day = new Date(now)
  let streak = 0
  // allow the streak to be anchored at today or yesterday
  if (!days.has(toDateKey(day))) {
    day.setDate(day.getDate() - 1)
    if (!days.has(toDateKey(day))) return 0
  }
  while (days.has(toDateKey(day))) {
    streak += 1
    day.setDate(day.getDate() - 1)
  }
  return streak
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
