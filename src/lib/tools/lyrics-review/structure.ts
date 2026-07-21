/**
 * 歌詞構造(セクション)の認識と推定。
 * - 見出し行([Verse] / サビ / 【Aメロ】 など)を正規化して認識する
 * - 見出しが無い場合は空行ブロックからAIが推定する(推定フラグを必ず立てる)
 */

export interface ParsedSection {
  /** 正規化ラベル(例: 'Verse 1', 'サビ')。推定時もこの形式 */
  label: string
  /** 原文の見出し行(推定の場合は null) */
  rawHeading: string | null
  /** 本文の開始行(0始まり、見出し行は含まない) */
  startLine: number
  /** 本文の終了行(0始まり、この行を含む) */
  endLine: number
  /** AIによる推定かどうか */
  estimated: boolean
}

export interface ParsedStructure {
  /** 原文を行分割したもの(そのまま) */
  lines: string[]
  sections: ParsedSection[]
  /** 原文に見出しが1つ以上書かれていたか */
  explicit: boolean
  /** 見出しとして扱った行番号(0始まり)。添削対象から除外する */
  headingLineIndexes: number[]
}

/** 見出しキーワード → 正規化ラベル */
const HEADING_WORDS: [RegExp, string][] = [
  [/^intro$/i, 'Intro'],
  [/^verse$/i, 'Verse'],
  [/^pre[-\s]?chorus$/i, 'Pre-Chorus'],
  [/^chorus$/i, 'Chorus'],
  [/^bridge$/i, 'Bridge'],
  [/^outro$/i, 'Outro'],
  [/^hook$/i, 'Chorus'],
  [/^(inst|instrumental|interlude)$/i, '間奏'],
  [/^aメロ$/i, 'Aメロ'],
  [/^bメロ$/i, 'Bメロ'],
  [/^cメロ$/i, 'Cメロ'],
  [/^dメロ$/i, 'Dメロ'],
  [/^サビ$/, 'サビ'],
  [/^ラスサビ$/, 'ラスサビ'],
  [/^大サビ$/, '大サビ'],
  [/^落ちサビ$/, '落ちサビ'],
  [/^間奏$/, '間奏'],
  [/^イントロ$/, 'Intro'],
  [/^アウトロ$/, 'Outro'],
  [/^ブリッジ$/, 'Bridge'],
]

/**
 * 行が見出しかどうか判定し、見出しなら正規化ラベルを返す。
 * 対応形式: [Verse] / 【サビ】 / (Aメロ) / Verse 1 / サビ2 / Chorus:
 */
export function parseHeadingLine(line: string): string | null {
  let core = line.trim()
  if (!core || core.length > 20) return null
  // 囲み記号を1層はがす
  const wrapped = core.match(/^[[【((]\s*(.*?)\s*[\]】))]$/)
  if (wrapped) core = wrapped[1].trim()
  // 末尾のコロンを除去
  core = core.replace(/[::]\s*$/, '').trim()
  // 末尾の番号を分離(Verse 1 / サビ2 / Aメロ 3)
  const numMatch = core.match(/^(.*?)[\s・]*([0-90-9]{1,2})$/)
  let num = ''
  if (numMatch && numMatch[1].trim()) {
    core = numMatch[1].trim()
    num = numMatch[2].replace(/[0-9]/g, (d) => String('0123456789'.indexOf(d)))
  }
  for (const [re, label] of HEADING_WORDS) {
    if (re.test(core)) return num ? `${label} ${num}` : label
  }
  return null
}

/** サビ系ラベルか(Pre-Chorusは含まない) */
export function isChorusLabel(label: string): boolean {
  return /^(chorus|hook|サビ|ラスサビ|大サビ|落ちサビ)/i.test(label.trim())
}

/** 空行区切りのブロックに分ける(見出しなし歌詞の推定用) */
function splitBlocks(lines: string[]): { start: number; end: number }[] {
  const blocks: { start: number; end: number }[] = []
  let start = -1
  lines.forEach((line, i) => {
    const empty = !line.trim()
    if (!empty && start === -1) start = i
    if (empty && start !== -1) {
      blocks.push({ start, end: i - 1 })
      start = -1
    }
  })
  if (start !== -1) blocks.push({ start, end: lines.length - 1 })
  return blocks
}

function normalizeBlock(lines: string[], block: { start: number; end: number }): string {
  return lines
    .slice(block.start, block.end + 1)
    .map((l) => l.trim().replace(/\s+/g, ''))
    .join('\n')
}

/** 見出しが無い歌詞のセクション推定 */
function estimateSections(lines: string[]): ParsedSection[] {
  const blocks = splitBlocks(lines)
  if (blocks.length === 0) return []
  if (blocks.length === 1) {
    return [
      {
        label: 'Verse',
        rawHeading: null,
        startLine: blocks[0].start,
        endLine: blocks[0].end,
        estimated: true,
      },
    ]
  }

  // 同じ内容のブロックが2回以上出てくればサビとみなす
  const counts = new Map<string, number>()
  for (const b of blocks) {
    const key = normalizeBlock(lines, b)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const hasRepeats = [...counts.values()].some((c) => c >= 2)

  const sections: ParsedSection[] = []
  if (hasRepeats) {
    const verseLabels = ['Aメロ', 'Bメロ', 'Cメロ', 'Dメロ']
    let verseIndex = 0
    let chorusCount = 0
    blocks.forEach((b, i) => {
      const isChorus = (counts.get(normalizeBlock(lines, b)) ?? 0) >= 2
      let label: string
      if (isChorus) {
        chorusCount += 1
        label = chorusCount === 1 ? 'サビ' : `サビ ${chorusCount}`
      } else if (i === blocks.length - 1 && chorusCount > 0 && b.end - b.start <= 1) {
        label = 'Outro'
      } else {
        label = verseLabels[verseIndex] ?? 'Verse'
        verseIndex += 1
      }
      sections.push({ label, rawHeading: null, startLine: b.start, endLine: b.end, estimated: true })
    })
  } else {
    // 繰り返しが無い場合は A→B→サビ の定型で推定する
    const cycle = ['Aメロ', 'Bメロ', 'サビ']
    blocks.forEach((b, i) => {
      const base = cycle[i % cycle.length]
      const round = Math.floor(i / cycle.length)
      sections.push({
        label: round > 0 ? `${base} ${round + 1}` : base,
        rawHeading: null,
        startLine: b.start,
        endLine: b.end,
        estimated: true,
      })
    })
  }
  return sections
}

/** 歌詞全体を解析してセクション構造を返す */
export function parseLyricsStructure(lyrics: string): ParsedStructure {
  const lines = lyrics.split('\n')
  const headingLineIndexes: number[] = []
  const headings: { index: number; label: string; raw: string }[] = []

  lines.forEach((line, i) => {
    const label = parseHeadingLine(line)
    if (label) {
      headings.push({ index: i, label, raw: line.trim() })
      headingLineIndexes.push(i)
    }
  })

  if (headings.length === 0) {
    return {
      lines,
      sections: estimateSections(lines),
      explicit: false,
      headingLineIndexes: [],
    }
  }

  const sections: ParsedSection[] = []
  headings.forEach((h, hi) => {
    const bodyStart = h.index + 1
    const bodyEnd = (hi + 1 < headings.length ? headings[hi + 1].index : lines.length) - 1
    // 末尾の空行を切り詰める
    let end = bodyEnd
    while (end >= bodyStart && !lines[end].trim()) end -= 1
    // 先頭の空行も切り詰める
    let start = bodyStart
    while (start <= end && !lines[start].trim()) start += 1
    if (start <= end) {
      sections.push({ label: h.label, rawHeading: h.raw, startLine: start, endLine: end, estimated: false })
    } else {
      // 本文ゼロ行の見出し(間奏など)もセクションとして残す
      sections.push({ label: h.label, rawHeading: h.raw, startLine: bodyStart, endLine: bodyStart - 1, estimated: false })
    }
  })

  return { lines, sections, explicit: true, headingLineIndexes }
}

/** 指定行がどのセクションに属するかを返す(見出し行・区切りの空行は '') */
export function sectionLabelForLine(structure: ParsedStructure, lineIndex: number): string {
  for (const s of structure.sections) {
    if (lineIndex >= s.startLine && lineIndex <= s.endLine) return s.label
  }
  return ''
}

/** サビとして扱うセクション(明示 or 推定)を返す */
export function findChorusSections(structure: ParsedStructure): ParsedSection[] {
  return structure.sections.filter((s) => isChorusLabel(s.label))
}
