import type { Song } from '@/lib/types'

export const MAX_LEVEL = 100

/** 20 tiers spanning levels 1-100, each covering 5 levels, growing steadily grander-sounding. */
const TITLE_TIERS: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: '音の卵' },
  { minLevel: 6, title: '旋律の芽' },
  { minLevel: 11, title: '駆け出し作曲家' },
  { minLevel: 16, title: '音紡ぎの見習い' },
  { minLevel: 21, title: '調べの探究者' },
  { minLevel: 26, title: '旋律の職人' },
  { minLevel: 31, title: '音色の魔術師' },
  { minLevel: 36, title: '響きの詩人' },
  { minLevel: 41, title: '調べの賢者' },
  { minLevel: 46, title: '音楽の匠' },
  { minLevel: 51, title: '旋律の巨匠' },
  { minLevel: 56, title: '響奏の達人' },
  { minLevel: 61, title: '音楽の織り手' },
  { minLevel: 66, title: '調べの守護者' },
  { minLevel: 71, title: '音の賢人' },
  { minLevel: 76, title: '旋律の伝道師' },
  { minLevel: 81, title: '響きの巨星' },
  { minLevel: 86, title: '音楽の賢王' },
  { minLevel: 91, title: '調べの伝説' },
  { minLevel: 96, title: '音楽の神話' },
]

export function getTitle(level: number): string {
  let current = TITLE_TIERS[0].title
  for (const tier of TITLE_TIERS) {
    if (level >= tier.minLevel) current = tier.title
    else break
  }
  return current
}

/** completed songs needed to *reach* this level (level 1 needs 0). Concave curve: fast early
 * levels reward starting out, higher levels take real dedication to reach the level-100 cap. */
export function songsRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.ceil(((level - 1) ** 2) / 12.5)
}

export function levelForCompletedCount(count: number): number {
  const level = Math.floor(Math.sqrt(count * 12.5)) + 1
  return Math.min(level, MAX_LEVEL)
}

export interface ProgressInfo {
  completedCount: number
  level: number
  title: string
  isMaxLevel: boolean
  songsIntoLevel: number
  songsPerLevel: number
  songsToNextLevel: number
  progressRatio: number // 0-1
}

export function getProgress(songs: Song[]): ProgressInfo {
  const completedCount = songs.filter((s) => s.completedAt).length
  const level = levelForCompletedCount(completedCount)
  const isMaxLevel = level >= MAX_LEVEL
  const currentLevelStart = songsRequiredForLevel(level)
  const nextLevelStart = isMaxLevel ? currentLevelStart : songsRequiredForLevel(level + 1)
  const songsPerLevel = Math.max(1, nextLevelStart - currentLevelStart)
  const songsIntoLevel = completedCount - currentLevelStart
  const songsToNextLevel = isMaxLevel ? 0 : nextLevelStart - completedCount

  return {
    completedCount,
    level,
    title: getTitle(level),
    isMaxLevel,
    songsIntoLevel,
    songsPerLevel,
    songsToNextLevel,
    progressRatio: isMaxLevel ? 1 : Math.min(1, songsIntoLevel / songsPerLevel),
  }
}
