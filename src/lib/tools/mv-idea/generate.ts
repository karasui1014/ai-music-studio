import type {
  MvApproach,
  MvBudgetTier,
  MvConcept,
  MvConsistency,
  MvDifficulty,
  MvIdeaInput,
  MvIdeaResult,
  MvIdeaSongContext,
  MvOrientation,
  MvPlanDetail,
  MvPlanMode,
  MvShot,
  MvTimelineBlock,
} from '@/lib/tools/mv-idea/types'
import { MV_IDEA_SCHEMA_VERSION, formatSec, parseDurationSec } from '@/lib/tools/mv-idea/types'

/**
 * モック生成エンジン(端末内・決定的)。
 * 同じ入力+同じseedなら同じ結果を返す。外部送信は一切しない。
 * 将来AIプロバイダーを足す場合も、この入出力型(MvIdeaInput→MvConcept[]/MvPlanDetail)を
 * 実装して分岐し、結果は必ず types.ts のSchema検証を通すこと。
 */

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** 配列からseedでずらして選ぶ(決定的ローテーション) */
function pick<T>(items: T[], index: number, seed: number): T {
  return items[(index + seed) % items.length]
}

// ---------------------------------------------------------------------------
// 固有名詞 → 一般要素への変換
// 特定の存命監督・映像作家・制作会社の作風をそのまま再現しないための変換表。
// 名前を検出したら、色/光/構図/編集速度/カメラワーク/質感/時代感/背景密度/
// キャラクター表現の一般要素に置き換え、変換メモを残す。
// ---------------------------------------------------------------------------

interface StyleConversion {
  /** 検出する表記ゆれ */
  names: string[]
  /** 置き換え後の一般要素(日本語) */
  elements: string
}

const STYLE_CONVERSIONS: StyleConversion[] = [
  { names: ['新海誠', '新海'], elements: '逆光と強いレンズフレア、彩度の高い空の色、緻密で密度の高い背景、感傷的な色彩設計' },
  { names: ['ジブリ', '宮崎駿', '宮﨑駿'], elements: '手描き質感、柔らかい自然光、緑豊かな背景密度、素朴で丸みのあるキャラクター表現、牧歌的な時代感' },
  { names: ['細田守'], elements: 'フラットな陰影の少ない色面、夏の強い日差し、広角気味の構図、日常と非日常の対比' },
  { names: ['庵野秀明', 'エヴァ'], elements: '大胆な文字組みの挿入、明滅する高速カット、極端なローアングル構図、電柱や鉄塔など無機物の背景密度' },
  { names: ['京都アニメーション', '京アニ'], elements: '柔らかいハイライトの髪の質感、繊細な日常芝居の被写体の動き、透明感のある光、丁寧な背景密度' },
  { names: ['ufotable'], elements: 'エフェクトと3Dカメラワークの融合、コントラストの強い光、疾走感のある編集速度' },
  { names: ['MAPPA'], elements: 'シャープな輪郭線、彩度を抑えた色、重心の低いカメラワーク、リアル寄りのキャラクター表現' },
  { names: ['湯浅政明'], elements: '伸縮する大胆なデフォルメ、原色に近い色使い、うねるカメラワーク、速い編集速度' },
  { names: ['ウェス・アンダーソン', 'ウェスアンダーソン'], elements: '左右対称の構図、パステル調の色、水平・垂直移動だけのカメラワーク、レトロな時代感' },
  { names: ['ノーラン'], elements: '実写的な質感、青とオレンジの対比色、時間の交差する編集構成、重低音を意識した編集速度' },
  { names: ['ヴィルヌーヴ'], elements: '霧がかった単色の色面、巨大構造物のスケール構図、ゆっくりとした編集速度、静かな光' },
  { names: ['ティム・バートン', 'ティムバートン'], elements: 'ゴシック調の暗い色、渦巻くシルエットの背景、細長くデフォルメされたキャラクター表現' },
  { names: ['フィンチャー'], elements: '緑や黄色に転んだ暗い色調、正確に固定されたカメラワーク、影の多い光、速すぎない編集速度' },
  { names: ['タランティーノ'], elements: 'ビビッドな色、トランクショットなど遊びのある構図、レトロな時代感、会話主体の長回し編集速度' },
  { names: ['A24'], elements: '自然光中心の淡い色、フィルムグレインの質感、余白の多い構図、ゆったりした編集速度' },
]

/** 固有名詞を一般要素へ変換する。変換した場合はメモを返す */
export function neutralizeStyleText(text: string): { text: string; notes: string[] } {
  let out = text
  const notes: string[] = []
  for (const conv of STYLE_CONVERSIONS) {
    for (const name of conv.names) {
      if (!out.includes(name)) continue
      // 「〇〇風」「〇〇っぽい」などの語尾ごと置き換える
      const pattern = new RegExp(`${name}(監督|さん)?(風|調|っぽい|のような|みたいな|系)?`, 'g')
      out = out.replace(pattern, conv.elements)
      notes.push(`「${name}」→ 一般要素(${conv.elements})に変換しました`)
      break
    }
  }
  return { text: out, notes }
}

// ---------------------------------------------------------------------------
// 語彙変換(日本語入力 → 生成AI向けトークン)
// ---------------------------------------------------------------------------

const MOOD_TOKENS: [string[], string][] = [
  [['切な', 'せつな', '哀', '悲し'], 'bittersweet, melancholic'],
  [['ノスタルジ', '懐かし', '郷愁'], 'nostalgic, warm memories'],
  [['落ち着', 'チル', 'リラックス', '穏やか', 'lofi', 'ローファイ'], 'calm, relaxed, mellow'],
  [['元気', '明る', 'ハッピー', '楽し'], 'upbeat, cheerful, bright'],
  [['激し', '熱', 'エネルギ', '疾走'], 'energetic, intense, dynamic'],
  [['怖', 'ダーク', '闇', '不気味'], 'dark, mysterious, eerie'],
  [['幻想', '夢', 'ファンタジ'], 'dreamy, ethereal, fantastical'],
  [['かっこい', 'クール', 'スタイリッシュ'], 'stylish, cool, sleek'],
  [['雨', '夜'], 'night mood, rainy atmosphere'],
]

const COLOR_TOKENS: [string[], string][] = [
  [['青', 'ブルー', '寒色'], 'cool blue tones'],
  [['暖色', 'オレンジ', '夕焼け', '夕暮'], 'warm amber and orange palette'],
  [['モノクロ', '白黒'], 'monochrome palette'],
  [['パステル'], 'soft pastel palette'],
  [['ネオン', 'サイバー'], 'neon glow palette'],
  [['セピア', 'レトロ', '茶'], 'sepia retro tones'],
  [['緑', 'グリーン'], 'natural green tones'],
  [['紫', 'パープル'], 'purple and violet tones'],
  [['ピンク'], 'pink accent palette'],
  [['赤'], 'bold red accents'],
]

function matchTokens(source: string, table: [string[], string][], fallback: string): string {
  const hits: string[] = []
  for (const [keys, token] of table) {
    if (keys.some((k) => source.toLowerCase().includes(k.toLowerCase()))) hits.push(token)
    if (hits.length >= 2) break
  }
  return hits.length > 0 ? hits.join(', ') : fallback
}

// ---------------------------------------------------------------------------
// 方向性(アプローチ)の定義
// ---------------------------------------------------------------------------

interface ApproachMeta {
  label: string
  difficulty: MvDifficulty
  budgetTier: MvBudgetTier
  /** ショットの基準秒数 */
  shotLen: number
  timeEstimate: string
  suitableMedia: string[]
  mainVisuals: string[]
  compositions: string[]
  cameraMoves: string[]
  subjectMoves: string[]
  /** 画像/動画プロンプトへ足すスタイルトークン */
  styleTokens: string
  oneLiner: (i: MvIdeaInput) => string
  aim: (i: MvIdeaInput) => string
  world: (i: MvIdeaInput) => string
  opening3s: (i: MvIdeaInput) => string
  chorus: (i: MvIdeaInput) => string
  ending: (i: MvIdeaInput) => string
  storyFlow: (i: MvIdeaInput) => string[]
}

function subjectOf(i: MvIdeaInput): string {
  return i.characters.trim() || '主人公(顔を大きく見せない一人の人物)'
}

function stageOf(i: MvIdeaInput): string {
  return i.stage.trim() || '街と部屋を行き来する日常の風景'
}

export const APPROACH_META: Record<MvApproach, ApproachMeta> = {
  story: {
    label: '物語型',
    difficulty: 'hard',
    budgetTier: 'mid',
    shotLen: 6,
    timeEstimate: '2〜4日(画像生成→動画化→編集)',
    suitableMedia: ['YouTube', 'ニコニコ動画'],
    mainVisuals: ['三幕構成の短編ストーリー', '感情の変化を追うクローズアップ', '象徴的な小道具の反復'],
    compositions: ['ワイドショット(状況説明)', 'ミディアムショット', 'クローズアップ', 'オーバーショルダー', 'ロングショット(孤独感)', 'インサート(小道具)'],
    cameraMoves: ['ゆっくりドリーイン', '固定', '横パン', 'ゆっくりドリーアウト', '手持ち風の微揺れ'],
    subjectMoves: ['歩く', '立ち止まり振り返る', '手元の動作', '空を見上げる', '走り出す'],
    styleTokens: 'cinematic, film still, shallow depth of field',
    oneLiner: (i) => `「${i.title}」の感情を、一人の登場人物の小さな物語として描くMV`,
    aim: (i) => `${i.mood}という曲の感情を物語に翻訳し、最後まで見たくなる引きを作る`,
    world: (i) => `${stageOf(i)}を舞台に、${subjectOf(i)}の心の変化を追う世界`,
    opening3s: (i) => `${subjectOf(i)}の後ろ姿から始まり、タイトル「${i.title}」が静かに重なる`,
    chorus: () => '溜めてきた感情が解放される見せ場。カット割りを倍速にし、光量を一段上げる',
    ending: (i) => `冒頭と同じ構図に戻るが、${subjectOf(i)}の表情や光がわずかに変化している`,
    storyFlow: (i) => [
      `起: ${stageOf(i)}で${subjectOf(i)}の日常を見せる`,
      '承: 小さな違和感・出来事が起こる',
      `転: サビで感情が溢れ、映像のトーンが変わる`,
      '結: 日常に戻るが、最初とは少し違う景色になっている',
    ],
  },
  performance: {
    label: '演出型',
    difficulty: 'normal',
    budgetTier: 'low',
    shotLen: 5,
    timeEstimate: '1〜2日(AI動画中心)',
    suitableMedia: ['YouTube', 'Shorts', 'TikTok'],
    mainVisuals: ['空間と光で見せるビジュアル重視の画', 'シルエットのパフォーマンス', 'ビートに同期するカット'],
    compositions: ['シンメトリー構図', 'シルエットのロングショット', 'ローアングル', '真俯瞰', 'クローズアップ(手・目元)', '広角ワイド'],
    cameraMoves: ['ゆっくり回り込み', 'ドリーイン', '固定', '縦チルト', 'スローズームアウト'],
    subjectMoves: ['リズムに合わせて揺れる', '髪や衣装が風になびく', '手を伸ばす', '振り向く', '静止'],
    styleTokens: 'music video aesthetic, dramatic lighting, high contrast',
    oneLiner: (i) => `${i.mood}の空気を、光と空間の演出だけで魅せるビジュアル重視MV`,
    aim: () => '物語を追わせず、画の気持ちよさとリズム同期で最後まで見せる',
    world: (i) => `${stageOf(i)}を抽象化した、光と影のコントラストが強い空間`,
    opening3s: (i) => `暗闇に一筋の光が差し、${subjectOf(i)}のシルエットが浮かび上がる`,
    chorus: () => '光源が一気に増え、ビート同期のカット割りで空間が開ける最大の見せ場',
    ending: () => '光がゆっくり絞られ、最初の暗闇に一つだけ残り火が灯って終わる',
    storyFlow: () => [
      '導入: 暗い空間に光が生まれる',
      '展開: 光と被写体の動きが増えていく',
      'サビ: 空間全体が光で満ちる',
      '終息: 光が引いていき、余韻を残す',
    ],
  },
  'lyric-graphic': {
    label: '歌詞グラフィック型',
    difficulty: 'easy',
    budgetTier: 'free',
    shotLen: 6,
    timeEstimate: '半日〜1日(背景画像+文字アニメ)',
    suitableMedia: ['YouTube', 'Shorts'],
    mainVisuals: ['歌詞タイポグラフィのモーション', '歌詞と連動する背景の色変化', 'キネティックテキスト'],
    compositions: ['文字中心のフラット構図', '背景+下部歌詞', '画面全面テキスト', '余白を活かした配置', '対角線のテキスト配置'],
    cameraMoves: ['背景のゆっくりズーム', '固定', '横スクロール', '文字へのフォーカス送り', '縦スクロール'],
    subjectMoves: ['文字がフェードイン', '文字が拍で弾む', '文字が流れて消える', '一文字ずつ表示', '文字が光る'],
    styleTokens: 'lyric video background, minimal, typographic space, negative space',
    oneLiner: (i) => `歌詞を主役に、${i.mood}の世界観を文字と背景で描く歌詞動画`,
    aim: () => '歌詞を読ませて曲の意味を届ける。少ない素材で確実に完成させる',
    world: (i) => `${matchTokens(i.colorMood || i.mood, COLOR_TOKENS, '落ち着いた色調')}の抽象背景に歌詞が浮かぶ世界`,
    opening3s: (i) => `無地の背景に「${i.title}」のタイトルタイポが拍に合わせて現れる`,
    chorus: () => 'サビの歌詞だけ文字サイズと動きを大きくし、背景色も転調させる',
    ending: (i) => `最後のフレーズが画面に残り、ゆっくりフェードして「${i.title}」ロゴで締める`,
    storyFlow: () => [
      '導入: タイトルタイポの提示',
      'Aメロ: 歌詞が小さく静かに流れる',
      'サビ: 文字が大きく動き、色が転調する',
      'ラスト: 最後の一行が余韻として残る',
    ],
  },
  'still-anime': {
    label: '静止画アニメ型',
    difficulty: 'easy',
    budgetTier: 'free',
    shotLen: 8,
    timeEstimate: '1日(画像生成+ズーム/パン編集)',
    suitableMedia: ['YouTube', 'ニコニコ動画'],
    mainVisuals: ['イラスト連作をズーム/パンで映像化', '場面ごとの一枚絵', 'ゆるやかなパララックス'],
    compositions: ['一枚絵のワイド', '引きの風景', '寄りの表情カット', '俯瞰の全景', '窓越し・隙間越しの構図'],
    cameraMoves: ['ゆっくりズームイン', 'ゆっくりズームアウト', '横パン', '縦パン', '固定'],
    subjectMoves: ['静止(絵の中の時間が止まる)', '髪だけ揺れる想定', '光の明滅', '雨や雪だけ動く想定', '瞬きだけの想定'],
    styleTokens: 'illustration, anime style painting, detailed background art',
    oneLiner: (i) => `${i.mood}の情景イラストを連ねて、ズームとパンだけで魅せる静止画MV`,
    aim: () => '動画生成を使わず低コストで、画のクオリティに全振りする',
    world: (i) => `${stageOf(i)}を描いた連作イラストの世界。1枚ごとに時間帯と光が移ろう`,
    opening3s: (i) => `${stageOf(i)}の全景イラストへゆっくりズームインしながらタイトルが出る`,
    chorus: () => 'サビで最も感情的な一枚絵に切り替え、ズーム速度を上げて高揚感を作る',
    ending: () => '最後の一枚絵からゆっくりズームアウトし、世界全体を見せて終わる',
    storyFlow: () => [
      '導入: 舞台全景の一枚絵',
      '展開: 時間帯の違う情景を順に見せる',
      'サビ: 感情のピークを描いた一枚絵',
      'ラスト: 引きの絵で世界を俯瞰して終わる',
    ],
  },
  abstract: {
    label: '抽象ビジュアライザー型',
    difficulty: 'easy',
    budgetTier: 'free',
    shotLen: 7,
    timeEstimate: '半日〜1日',
    suitableMedia: ['YouTube', '作業用BGM配信'],
    mainVisuals: ['音に同期する抽象モーション', '流体・粒子・光のうねり', 'ループする幾何学模様'],
    compositions: ['中央対称の抽象構図', '全面テクスチャ', '地平線のあるミニマル構図', '渦の中心構図', '格子・反復構図'],
    cameraMoves: ['ゆっくり前進', '回転', '固定', '波のような揺れ', '無限ズーム'],
    subjectMoves: ['粒子が拍で脈動', '流体がうねる', '光が明滅', '模様が増殖', '色が転調'],
    styleTokens: 'abstract motion background, particles, fluid gradient, seamless loop',
    oneLiner: (i) => `${i.mood}を色と動きだけで表現する、音に同期した抽象ビジュアライザーMV`,
    aim: () => '人物や物語なしで権利リスクを最小化し、BGM用途の長時間視聴にも耐える画面を作る',
    world: (i) => `${matchTokens(i.colorMood || i.mood, COLOR_TOKENS, '深い色調')}のグラデーションが呼吸するように動く抽象空間`,
    opening3s: () => '静かな単色から粒子が一斉に生まれ、ビートの頭で画面全体に広がる',
    chorus: () => 'サビで粒子と光の量を最大化し、色相を大きく転調させる',
    ending: () => '動きが徐々に収束し、最初の単色へ還って終わる',
    storyFlow: () => [
      '導入: 静的な色面から動きが生まれる',
      '展開: リズムに同期して模様が育つ',
      'サビ: 色と動きのピーク',
      'ラスト: 収束して無音の色面に戻る',
    ],
  },
  'slice-of-life': {
    label: '日常ドキュメンタリー型',
    difficulty: 'normal',
    budgetTier: 'low',
    shotLen: 5,
    timeEstimate: '1〜2日',
    suitableMedia: ['YouTube', 'Instagram Reels'],
    mainVisuals: ['情景スケッチの積み重ね', '生活の手元・足元のディテール', '定点観測的なカット'],
    compositions: ['定点のワイド', '手元のクローズアップ', '窓辺の逆光構図', '路地のロングショット', 'テーブル俯瞰'],
    cameraMoves: ['固定(定点)', '手持ち風の微揺れ', 'ゆっくり横パン', 'ゆっくりズームイン', '固定'],
    subjectMoves: ['コーヒーの湯気が立つ', '人が通り過ぎる', 'ページをめくる', '雨粒が窓を伝う', 'カーテンが揺れる'],
    styleTokens: 'documentary style, natural light, candid moment, film grain',
    oneLiner: (i) => `${stageOf(i)}の何気ない瞬間を集めて、${i.mood}の空気を切り取るMV`,
    aim: () => '共感できる日常の断片で、リスナー自身の記憶と曲を結びつける',
    world: (i) => `${stageOf(i)}のありふれた時間。劇的な出来事は起きないが、光と音だけが豊かな世界`,
    opening3s: () => '朝の窓辺、カーテン越しの光が揺れるカットから静かに始まる',
    chorus: () => 'サビで屋外へ出て、空や街の開けたカットを連ねて解放感を作る',
    ending: () => '夜、部屋の明かりを消すカットで一日が終わり、曲も静かに閉じる',
    storyFlow: () => [
      '朝: 部屋の中の小さな気配',
      '昼: 街へ出て流れる景色',
      'サビ: 空・光・開けた場所',
      '夜: 部屋へ戻り一日を閉じる',
    ],
  },
  loop: {
    label: 'ループ映像型',
    difficulty: 'easy',
    budgetTier: 'free',
    shotLen: 10,
    timeEstimate: '半日(1〜3シーンを丁寧に)',
    suitableMedia: ['YouTube(作業用BGM)', 'Shorts'],
    mainVisuals: ['完璧にループする1シーン', '環境の中の小さな動きの反復', '時間帯の緩やかな変化'],
    compositions: ['定点のワイド(舞台全体)', '窓越しの構図', '斜め俯瞰の部屋全景', '机上のミディアム', '外景のロングショット'],
    cameraMoves: ['固定', '極めてゆっくりのズームイン', '固定', '極めてゆっくりのズームアウト', '固定'],
    subjectMoves: ['一定リズムの小さな動作(頭を揺らす等)', '湯気・雨・雪の環境ループ', '画面内の明かりが明滅', '尻尾や振り子の反復', '文字盤や画面の点滅'],
    styleTokens: 'seamless loop animation, cozy scene, ambient mood',
    oneLiner: (i) => `${stageOf(i)}の1シーンを丁寧に作り込み、ずっと流していられるループMVにする`,
    aim: () => '制作範囲を1〜3シーンに絞って密度を上げ、長時間視聴・BGM需要を狙う',
    world: (i) => `${stageOf(i)}の時間がゆっくり流れる、小さな箱庭のような世界`,
    opening3s: (i) => `${stageOf(i)}の全景。環境音的な小さな動きがすでにループしている`,
    chorus: () => 'サビで時間帯(光の色)だけが緩やかに変化し、同じ構図の別の表情を見せる',
    ending: () => '冒頭と同じ状態に完全に戻り、どこで切ってもループできる形で終わる',
    storyFlow: () => [
      '基本ループ: 舞台のメインシーン',
      '変化1: 光・天気が緩やかに移ろう',
      'サビ: 時間帯が変わり色が転調',
      '回帰: 冒頭と同じ状態へ戻る',
    ],
  },
}

/** 企画モードごとの方向性プール(先頭から3つが基本。seedでローテーション) */
const MODE_POOLS: Record<MvPlanMode, MvApproach[]> = {
  'low-budget': ['still-anime', 'loop', 'lyric-graphic', 'abstract'],
  'ai-video': ['story', 'performance', 'abstract', 'loop'],
  'still-image': ['still-anime', 'slice-of-life', 'lyric-graphic', 'loop'],
  'lyric-video': ['lyric-graphic', 'still-anime', 'abstract', 'performance'],
  story: ['story', 'slice-of-life', 'loop', 'still-anime'],
  shorts: ['loop', 'performance', 'lyric-graphic', 'abstract'],
  youtube: ['story', 'performance', 'still-anime', 'slice-of-life'],
}

/** モードによる難易度・予算の補正 */
function adjustForMode(mode: MvPlanMode, meta: ApproachMeta): { difficulty: MvDifficulty; budgetTier: MvBudgetTier } {
  if (mode === 'low-budget') {
    return { difficulty: meta.difficulty === 'hard' ? 'normal' : meta.difficulty, budgetTier: 'free' }
  }
  if (mode === 'shorts') {
    return { difficulty: 'easy', budgetTier: meta.budgetTier === 'mid' ? 'low' : meta.budgetTier }
  }
  return { difficulty: meta.difficulty, budgetTier: meta.budgetTier }
}

/** 第1段階: 方向性の異なる3案を生成する */
export function generateConcepts(
  input: MvIdeaInput,
  _context: MvIdeaSongContext,
): { concepts: MvConcept[]; conversionNotes: string[] } {
  const style = neutralizeStyleText(input.visualStyle)
  const reference = neutralizeStyleText(input.referenceNote)
  const cleanInput: MvIdeaInput = { ...input, visualStyle: style.text, referenceNote: reference.text }

  const pool = MODE_POOLS[input.mode]
  const offset = input.seed % pool.length
  const approaches: MvApproach[] = [0, 1, 2].map((i) => pool[(i + offset) % pool.length])

  const concepts = approaches.map((approach) => {
    const meta = APPROACH_META[approach]
    const adjusted = adjustForMode(input.mode, meta)
    const isShorts = input.mode === 'shorts'
    const mainVisuals = [...meta.mainVisuals]
    if (cleanInput.visualStyle.trim()) mainVisuals.push(`希望の映像表現: ${cleanInput.visualStyle.trim()}`)
    if (isShorts) mainVisuals.push('縦型構図・冒頭1秒で目を引くフックカット')
    const concept: MvConcept = {
      id: newId(),
      approach,
      conceptTitle: `${meta.label}「${input.title}」${isShorts ? ' Shorts企画' : ''}`,
      oneLiner: meta.oneLiner(cleanInput),
      aim: meta.aim(cleanInput),
      world: meta.world(cleanInput),
      mainVisuals,
      opening3s: meta.opening3s(cleanInput),
      chorusHighlight: meta.chorus(cleanInput),
      ending: meta.ending(cleanInput),
      difficulty: adjusted.difficulty,
      budgetTier: adjusted.budgetTier,
      timeEstimate: isShorts ? '半日(60秒以内・カット数を絞る)' : meta.timeEstimate,
      suitableMedia: isShorts ? ['YouTube Shorts', 'TikTok', 'Instagram Reels'] : meta.suitableMedia,
    }
    return concept
  })

  return { concepts, conversionNotes: [...style.notes, ...reference.notes] }
}

// ---------------------------------------------------------------------------
// 第2段階: 詳細企画書への展開
// ---------------------------------------------------------------------------

/** 入力と方向性から一貫性設定を組み立てる */
export function buildConsistency(input: MvIdeaInput, approach: MvApproach): MvConsistency {
  const meta = APPROACH_META[approach]
  const noHuman = approach === 'abstract' || approach === 'lyric-graphic'
  return {
    characters: noHuman
      ? '(人物なし。抽象モチーフ/文字が主役)'
      : subjectOf(input),
    ageRange: noHuman ? '-' : '20代前後(実在人物に似せない)',
    hair: noHuman ? '-' : '毎ショット同じ髪型・髪色を指定(例: 黒のミディアムヘア)',
    outfit: noHuman ? '-' : '毎ショット同じ衣装を指定(例: シンプルな私服1着で通す)',
    expression: noHuman ? '-' : `${input.mood}に合わせた控えめな表情。カメラ目線は使わない`,
    stage: stageOf(input),
    era: input.era.trim() || '現代',
    colors: matchTokens(input.colorMood || input.mood, COLOR_TOKENS, 'muted cinematic palette'),
    light: matchTokens(input.mood, MOOD_TOKENS, 'soft ambient light'),
    lens: approach === 'story' ? '35mm相当・浅い被写界深度' : approach === 'still-anime' ? 'イラストのため指定なし(画角のみ統一)' : '標準〜広角・歪みの少ないレンズ感',
    texture: meta.styleTokens,
    forbidden: [
      '実在の人物・有名人の顔',
      '実在のロゴ・商標',
      '読めない崩れた文字',
      input.avoid.trim(),
    ]
      .filter(Boolean)
      .join('、'),
  }
}

/** 尺からタイムラインブロックを作る */
export function buildTimeline(
  durationSec: number,
  approach: MvApproach,
  input: MvIdeaInput,
): MvTimelineBlock[] {
  const flow = APPROACH_META[approach].storyFlow
  const short = durationSec <= 75
  // beat: storyFlow(起/承/転/結)のどれをこの区間の要約に使うか
  const parts: { label: string; ratio: number; beat: number; fixedSummary?: string }[] = short
    ? [
        { label: 'イントロ', ratio: 0.12, beat: 0 },
        { label: 'Aメロ', ratio: 0.3, beat: 1 },
        { label: 'サビ', ratio: 0.42, beat: 2 },
        { label: 'アウトロ', ratio: 0.16, beat: 3 },
      ]
    : [
        { label: 'イントロ', ratio: 0.06, beat: 0 },
        { label: 'Aメロ', ratio: 0.16, beat: 1 },
        { label: 'Bメロ', ratio: 0.12, beat: 1, fixedSummary: 'サビへ向けて緊張を高める。カットを少しずつ寄りにする' },
        { label: 'サビ', ratio: 0.18, beat: 2 },
        { label: '間奏', ratio: 0.08, beat: 1, fixedSummary: '場面転換。引きの画とディテールカットで息継ぎを作る' },
        { label: '2番', ratio: 0.14, beat: 1, fixedSummary: '1番の変奏。同じ構図を別の時間帯・角度で見せて変化を出す' },
        { label: 'ラスサビ', ratio: 0.18, beat: 2, fixedSummary: 'サビの発展形。カット数と光量を最大にする' },
        { label: 'アウトロ', ratio: 0.08, beat: 3 },
      ]
  const beats = flow(input)
  let cursor = 0
  return parts.map((p, i) => {
    const len = Math.round(durationSec * p.ratio)
    const start = cursor
    const end = i === parts.length - 1 ? durationSec : Math.min(durationSec, cursor + len)
    cursor = end
    const beat = beats[Math.min(p.beat, beats.length - 1)] ?? ''
    return {
      id: newId(),
      label: p.label,
      startSec: start,
      endSec: end,
      summary: p.fixedSummary ?? beat.replace(/^[^:]*: /, ''),
    }
  })
}

/** ブロック内の位置に応じた光の演出 */
function lightForBlock(label: string, consistency: MvConsistency): string {
  if (label.includes('サビ')) return `光量を一段上げてコントラスト強め(${consistency.light})`
  if (label === 'イントロ') return `控えめな光量で静かに(${consistency.light})`
  if (label === 'アウトロ') return `光を絞って余韻を残す(${consistency.light})`
  return consistency.light
}

/** 一貫性設定からプロンプト末尾の共通トークンを作る */
function consistencyTokens(c: MvConsistency): string {
  const parts = [c.colors, c.texture]
  if (c.characters && !c.characters.startsWith('(人物なし')) {
    parts.unshift(`consistent character: ${c.characters}, ${c.hair}, ${c.outfit}`)
  }
  if (c.era && c.era !== '現代') parts.push(`時代感: ${c.era}`)
  return parts.filter(Boolean).join(', ')
}

/** ショットの記述フィールドから画像/動画/ネガティブプロンプトを組み立てる */
export function buildShotPrompts(
  shot: Pick<MvShot, 'scene' | 'composition' | 'cameraMove' | 'subjectMove' | 'background' | 'light'>,
  consistency: MvConsistency,
): Pick<MvShot, 'imagePrompt' | 'videoPrompt' | 'negativePrompt'> {
  const common = consistencyTokens(consistency)
  const imagePrompt = [shot.composition, shot.scene, `背景: ${shot.background}`, `光: ${shot.light}`, common, 'high detail, best quality']
    .filter(Boolean)
    .join(', ')
  const videoPrompt = [
    shot.scene,
    `カメラ: ${shot.cameraMove}`,
    `動き: ${shot.subjectMove}`,
    `背景: ${shot.background}`,
    `光: ${shot.light}`,
    common,
    'smooth motion, stable',
  ]
    .filter(Boolean)
    .join(', ')
  const negativePrompt = [
    'low quality, blurry, distorted face, extra fingers, watermark, text artifacts',
    consistency.forbidden,
  ]
    .filter(Boolean)
    .join(', ')
  return { imagePrompt, videoPrompt, negativePrompt }
}

/** 既存ショットの記述を保ったまま、一貫性設定をプロンプトへ再反映する */
export function reapplyConsistency(shot: MvShot, consistency: MvConsistency): MvShot {
  return { ...shot, ...buildShotPrompts(shot, consistency) }
}

const MAX_SHOTS = 24

/** ブロック列からショットリストを生成する */
export function buildShots(
  timeline: MvTimelineBlock[],
  input: MvIdeaInput,
  approach: MvApproach,
  consistency: MvConsistency,
): MvShot[] {
  const meta = APPROACH_META[approach]
  const duration = timeline[timeline.length - 1]?.endSec ?? 0
  // 全体のショット数が上限を超えないよう基準秒数を伸ばす
  let shotLen = meta.shotLen
  while (duration / shotLen > MAX_SHOTS) shotLen += 1

  const shots: MvShot[] = []
  let index = 0
  for (const block of timeline) {
    const blockLen = block.endSec - block.startSec
    if (blockLen <= 0) continue
    const count = Math.max(1, Math.round(blockLen / shotLen))
    const each = blockLen / count
    for (let k = 0; k < count; k++) {
      const startSec = Math.round((block.startSec + each * k) * 10) / 10
      const endSec = Math.round((k === count - 1 ? block.endSec : block.startSec + each * (k + 1)) * 10) / 10
      const composition = pick(meta.compositions, index, input.seed)
      const cameraMove = pick(meta.cameraMoves, index, input.seed)
      const subjectMove = pick(meta.subjectMoves, index, input.seed)
      const isHighlight = block.label.includes('サビ')
      const scene = isHighlight && k === 0
        ? `【${block.label}の見せ場】${block.summary}`
        : `【${block.label}】${block.summary}(${composition}で見せる)`
      const light = lightForBlock(block.label, consistency)
      const base = {
        scene,
        composition,
        cameraMove,
        subjectMove,
        background: consistency.stage,
        light,
      }
      shots.push({
        id: newId(),
        no: shots.length + 1,
        startSec,
        endSec,
        ...base,
        ...buildShotPrompts(base, consistency),
        assets: approach === 'still-anime' ? 'このショット用のイラスト1枚' : approach === 'lyric-graphic' ? '背景画像+該当パートの歌詞テキスト' : '生成画像1枚(動画化の起点)',
        editMemo: isHighlight
          ? '拍の頭にカットを合わせる。前後ショットより明るく'
          : `${formatSec(startSec)}から。曲の展開に合わせてフェードは短めに`,
      })
      index++
    }
  }
  return shots
}

/** 必要素材(全体)を組み立てる */
function buildRequiredAssets(input: MvIdeaInput, approach: MvApproach, shotCount: number): string[] {
  const assets = [`音源(マスタリング済みのWAV/MP3): 「${input.title}」`]
  if (approach === 'still-anime') {
    assets.push(`場面イラスト 約${shotCount}枚(生成または手描き)`)
  } else if (approach === 'lyric-graphic') {
    assets.push('歌詞テキストデータ(表示タイミング分割済み)', '背景画像 3〜5枚(色違い)')
  } else if (approach === 'abstract') {
    assets.push('抽象モーション素材(生成ループ動画 3〜6本)')
  } else {
    assets.push(`起点画像 約${shotCount}枚(画像生成AI)`, `動画クリップ 約${shotCount}本(画像から動画化)`)
  }
  assets.push('タイトル・クレジット用の文字素材')
  if (input.lyrics.trim()) assets.push('字幕用の歌詞テキスト')
  if (input.availableAssets.trim()) assets.push(`手持ち素材: ${input.availableAssets.trim()}`)
  assets.push('※素材はすべて権利を確認できるもの(自作・生成・商用可ライセンス)だけを使う')
  return assets
}

/** 制作チェックリスト */
function buildChecklist(input: MvIdeaInput, approach: MvApproach, shotCount: number): string[] {
  const tool = input.videoAiTool.trim()
  const list = [
    '一貫性設定(登場人物・色・光)を確定する',
    approach === 'still-anime' || approach === 'lyric-graphic'
      ? `画像生成: ショットリスト順に${shotCount}枚を生成し、番号をつけて保存する`
      : `画像生成: 各ショットの起点画像${shotCount}枚を生成する(プロンプトはショットリスト参照)`,
  ]
  if (approach !== 'still-anime' && approach !== 'lyric-graphic') {
    list.push(`動画化: ${tool ? `${tool}で` : ''}各起点画像を動画生成プロンプトでクリップ化する`)
  }
  list.push(
    '編集: ショット番号順に並べ、開始/終了時間どおりに配置する',
    'ビート合わせ: サビ頭のカットを拍に合わせて微調整する',
    input.lyrics.trim() ? '字幕: 歌詞テキストを載せて誤字を確認する' : 'テロップ: タイトルとクレジットを載せる',
    '書き出し前チェック: 実在人物・ロゴ・権利未確認素材が映っていないか確認する',
    `書き出し: ${input.mode === 'shorts' ? '縦型(9:16)・60秒以内' : '横型(16:9)'}で書き出し、${input.media.trim() || '公開媒体'}へアップする`,
  )
  return list
}

/** サムネイル案 */
function buildThumbnailIdeas(input: MvIdeaInput, concept: MvConcept): string[] {
  return [
    `サビの見せ場カットを切り出し、曲名「${input.title}」を大きく載せる(視認性優先)`,
    `${concept.world.slice(0, 24)}…が伝わる引きの画+左上に小さくアーティスト名`,
    `${APPROACH_META[concept.approach].label}らしさが一目で分かるカット+感情ワード「${input.mood}」を短い惹句にする`,
  ]
}

/** Shorts転用案 */
function buildShortsIdeas(shots: MvShot[], input: MvIdeaInput): string[] {
  const chorus = shots.find((s) => s.scene.includes('サビ'))
  const first = shots[0]
  return [
    `サビの見せ場(${chorus ? `S${String(chorus.no).padStart(2, '0')} ${formatSec(chorus.startSec)}〜` : 'サビ区間'})を縦型9:16で切り出して30〜45秒にする`,
    `冒頭ショット(S${String(first?.no ?? 1).padStart(2, '0')})→サビ直行の構成にして、最初の1秒に一番強い画を置く`,
    `歌詞の一番強いフレーズを大きな字幕で載せる(${input.title}のフルMVへの誘導文を最後に入れる)`,
    'ループ再生に耐えるよう、最後のカットが冒頭に自然につながる形で切る',
  ]
}

/** 第2段階: 選んだ企画案を詳細企画書へ展開する */
export function expandConcept(
  input: MvIdeaInput,
  _context: MvIdeaSongContext,
  concept: MvConcept,
): MvPlanDetail {
  const style = neutralizeStyleText(input.visualStyle)
  const cleanInput: MvIdeaInput = { ...input, visualStyle: style.text }

  const parsed = parseDurationSec(cleanInput.durationText)
  let durationSec = parsed ?? 210
  if (cleanInput.mode === 'shorts') durationSec = Math.min(durationSec, 60)
  const orientation: MvOrientation =
    cleanInput.orientation || (cleanInput.mode === 'shorts' ? 'vertical' : 'horizontal')

  const consistency = buildConsistency(cleanInput, concept.approach)
  const timeline = buildTimeline(durationSec, concept.approach, cleanInput)
  const shots = buildShots(timeline, cleanInput, concept.approach, consistency)
  const meta = APPROACH_META[concept.approach]

  return {
    conceptTitle: concept.conceptTitle,
    overview: `${concept.oneLiner}。${concept.world}。全${shots.length}ショット・想定尺${formatSec(durationSec)}(${orientation === 'vertical' ? '縦型' : '横型'})。`,
    aim: concept.aim,
    audience: cleanInput.audience.trim() || `${cleanInput.genre}を好んで聴くリスナー`,
    world: concept.world,
    colorAndLight: `色: ${consistency.colors} / 光: ${consistency.light}`,
    characters: consistency.characters,
    stage: consistency.stage,
    storyFlow: meta.storyFlow(cleanInput),
    opening3s: concept.opening3s,
    chorusHighlight: concept.chorusHighlight,
    lastScene: concept.ending,
    orientation,
    durationSec,
    timeline,
    shots,
    requiredAssets: buildRequiredAssets(cleanInput, concept.approach, shots.length),
    difficulty: concept.difficulty,
    timeEstimate: concept.timeEstimate,
    budgetTier: concept.budgetTier,
    editNotes: [
      cleanInput.bpm.trim()
        ? `BPM ${cleanInput.bpm.trim()}: 1拍≈${Math.round((60 / Math.max(1, Number(cleanInput.bpm) || 60)) * 100) / 100}秒。カットは拍の頭に合わせる`
        : 'カットの切り替えは拍の頭に合わせる(BPMが分かるとより正確に組める)',
      'サビ前に0.2〜0.4秒の「溜め」(暗転または静止)を入れると見せ場が際立つ',
      `${meta.label}は${meta.shotLen}秒前後のショットが基準。間延びしたら分割する`,
      '色調補正は最後に全ショットへ同じLUT/フィルタをかけて統一する',
    ],
    thumbnailIdeas: buildThumbnailIdeas(cleanInput, concept),
    shortsIdeas: buildShortsIdeas(shots, cleanInput),
    checklist: buildChecklist(cleanInput, concept.approach, shots.length),
    consistency,
  }
}

/** ショット1件だけを再生成する(seedオフセットでバリエーションを変える) */
export function regenerateShot(
  shot: MvShot,
  approach: MvApproach,
  consistency: MvConsistency,
  seedOffset: number,
): MvShot {
  const meta = APPROACH_META[approach]
  const composition = pick(meta.compositions, shot.no + seedOffset, 1)
  const cameraMove = pick(meta.cameraMoves, shot.no + seedOffset, 2)
  const subjectMove = pick(meta.subjectMoves, shot.no + seedOffset, 3)
  const base = {
    ...shot,
    composition,
    cameraMove,
    subjectMove,
  }
  return { ...base, ...buildShotPrompts(base, consistency) }
}

/** 実行結果(第1段階)を組み立てる */
export function generateResult(input: MvIdeaInput, context: MvIdeaSongContext): MvIdeaResult {
  const { concepts, conversionNotes } = generateConcepts(input, context)
  return { schemaVersion: MV_IDEA_SCHEMA_VERSION, concepts, conversionNotes }
}
