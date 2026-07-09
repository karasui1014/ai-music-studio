import { genId } from './id'
import type { HistoryEntry, Song } from './types'

function daysAgo(days: number, hours = 0): string {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString()
}

function h(type: HistoryEntry['type'], message: string, createdAt: string): HistoryEntry {
  return { id: genId(), type, message, createdAt }
}

export function createSeedSongs(): Song[] {
  const nightDrive: Song = {
    id: genId(),
    title: '深夜のドライブ',
    genre: 'Lo-fi Hip Hop',
    status: 'published',
    favorite: true,
    lyrics:
      '[Verse]\n窓の外流れる街の灯り\n国道沿いラジオが静かに歌う\n\n[Chorus]\n深夜のドライブ 誰もいない道\n君のことだけ考えていた\n\n[Verse]\n信号待ちの間に浮かぶ横顔\nもう少しだけこの夜に浸りたい\n\n[Chorus]\n深夜のドライブ 誰もいない道\n君のことだけ考えていた\n\n[Outro]\nこのまま朝が来なければいいのに',
    sunoPrompts: [
      {
        id: genId(),
        title: '夜のドライブVer',
        version: 'v2',
        stylePrompt:
          'lo-fi hip hop, warm vinyl crackle, mellow rhodes piano, soft rain ambience, nostalgic late-night mood, 85 bpm',
        excludeStyles: 'metal, screaming vocals, EDM drops',
        memo: 'サビ前に一瞬ブレイクを入れると良い感じ',
        createdAt: daysAgo(8),
        updatedAt: daysAgo(7),
      },
    ],
    mvPrompts: [
      {
        id: genId(),
        title: '雨夜の街並みVer',
        tool: 'Runway',
        prompt:
          'rainy neon city street at night, cinematic lo-fi anime style, slow camera pan, reflections on wet asphalt, warm street lamps',
        memo: 'サビでカメラをゆっくりズームアウトさせる',
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5),
      },
    ],
    youtube: {
      url: 'https://youtube.com/watch?v=example1',
      publishedAt: daysAgo(1).slice(0, 10),
      title: '深夜のドライブ / Lo-fi Hip Hop [作業用BGM]',
      description: '夜のドライブにぴったりなAI生成Lo-fi楽曲です。',
      tags: 'lofi, AI music, 作業用BGM, ドライブ',
      memo: 'サムネはネオン反射の写真を使用',
      updatedAt: daysAgo(1, 2),
    },
    history: [
      h('status_changed', 'ステータスを「公開済み」に変更しました', daysAgo(1)),
      h('youtube_updated', 'YouTube投稿情報を更新しました', daysAgo(1, 2)),
      h('note_added', 'MV書き出し完了、色調補正も反映済み', daysAgo(2)),
      h('mv_prompt_added', 'MVプロンプト「雨夜の街並みVer」を追加しました', daysAgo(5)),
      h('suno_prompt_updated', 'Sunoプロンプト「夜のドライブVer」を更新しました', daysAgo(7)),
      h('suno_prompt_added', 'Sunoプロンプト「夜のドライブVer」を追加しました', daysAgo(8)),
      h('lyrics_updated', '歌詞を更新しました', daysAgo(9)),
      h('created', '曲を作成しました', daysAgo(10)),
    ],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  }

  const recollection: Song = {
    id: genId(),
    title: '回想録',
    genre: 'Ambient Lo-fi',
    status: 'mv',
    favorite: false,
    lyrics:
      '[Verse]\n落ち葉が舞う 見慣れた公園で\nふと足を止めた 記憶のかけら\n\n[Chorus]\nあの日の光が 今も胸にある',
    sunoPrompts: [
      {
        id: genId(),
        title: '秋の記憶Ver',
        version: 'v1',
        stylePrompt: 'ambient lo-fi, soft piano loop, tape hiss, melancholic autumn mood, 70 bpm',
        memo: '',
        createdAt: daysAgo(4),
        updatedAt: daysAgo(4),
      },
    ],
    mvPrompts: [
      {
        id: genId(),
        title: '落ち葉の記憶Ver(試作)',
        tool: 'Kling',
        prompt:
          'falling autumn leaves in a quiet park, soft golden hour light, dreamy slow motion, shallow depth of field',
        memo: 'まだ試作段階、光の色味を調整したい',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
    ],
    youtube: {},
    history: [
      h('status_changed', 'ステータスを「MV制作中」に変更しました', daysAgo(2)),
      h('mv_prompt_added', 'MVプロンプト「落ち葉の記憶Ver(試作)」を追加しました', daysAgo(2)),
      h('status_changed', 'ステータスを「Suno制作中」に変更しました', daysAgo(4)),
      h('suno_prompt_added', 'Sunoプロンプト「秋の記憶Ver」を追加しました', daysAgo(4)),
      h('lyrics_updated', '歌詞を更新しました', daysAgo(5)),
      h('created', '曲を作成しました', daysAgo(6)),
    ],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(2),
  }

  const morningLight: Song = {
    id: genId(),
    title: 'アイデアメモ: 朝の光',
    genre: undefined,
    status: 'idea',
    favorite: false,
    lyrics: '',
    sunoPrompts: [],
    mvPrompts: [],
    youtube: {},
    history: [
      h('note_added', '朝の光をテーマにした曲を作りたい。ジャンルはシティポップ寄りで', daysAgo(1, 1)),
      h('created', '曲を作成しました', daysAgo(1, 2)),
    ],
    createdAt: daysAgo(1, 2),
    updatedAt: daysAgo(1, 1),
  }

  return [nightDrive, recollection, morningLight]
}
