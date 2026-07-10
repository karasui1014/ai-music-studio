import type { Song } from '@/lib/types'

const MOODS = [
  '切ない',
  '疾走感のある',
  '郷愁を誘う',
  '幻想的な',
  '希望に満ちた',
  '内省的な',
  '高揚感のある',
  '静かで穏やかな',
  '解放感のある',
  '少し不思議な',
  'ノスタルジックな',
  '情熱的な',
  '雨の匂いがするような',
  '夢見心地な',
]

const SCENES = [
  '深夜のドライブ',
  '雨上がりの街並み',
  '夏の終わりの海辺',
  '始発電車の窓',
  '廃墟の中の光',
  '縁日の帰り道',
  '曇り空の午後',
  '都会の夜景',
  '学校帰りの裏道',
  '静かな図書館',
  '故郷への帰り道',
  '眠れない夜',
  '朝焼けの中の一歩',
  '古い写真の記憶',
  '街灯だけが灯る路地',
  '誰もいない教室',
  '窓辺で聴くレコード',
]

function topGenre(songs: Song[]): string | undefined {
  const counts = new Map<string, number>()
  for (const s of songs) {
    if (!s.genre) continue
    counts.set(s.genre, (counts.get(s.genre) ?? 0) + 1)
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0]
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export interface ThemeSuggestion {
  key: string
  text: string
}

/** Rule-based (no AI/API) theme suggestion — leans on the creator's own genre history so it
 * gets more personal the more songs pile up, and avoids repeating whatever was just shown. */
export function suggestTheme(songs: Song[], exclude: string[] = []): ThemeSuggestion {
  const genre = topGenre(songs)
  let combo = ''
  let attempts = 0
  do {
    combo = `${pickRandom(MOODS)}${pickRandom(SCENES)}`
    attempts++
  } while (exclude.includes(combo) && attempts < 12)

  const text = genre
    ? `${genre}で、${combo}をテーマにした曲はいかがでしょうか?`
    : `${combo}をテーマにした曲はいかがでしょうか?`

  return { key: combo, text }
}
