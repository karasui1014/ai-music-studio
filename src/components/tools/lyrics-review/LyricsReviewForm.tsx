import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  REVIEW_INTENSITIES,
  REVIEW_MODES,
  type LyricsReviewInput,
  type ReviewIntensity,
  type ReviewMode,
} from '@/lib/tools/lyrics-review/types'

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        {label}
        {required && (
          <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
            必須
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function LyricsReviewForm({
  value,
  onChange,
}: {
  value: LyricsReviewInput
  onChange: (patch: Partial<LyricsReviewInput>) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Field
        label="歌詞本文"
        required
        hint="あなた自身の歌詞を貼ってください。既存アーティスト曲の歌詞や、その続きを作る用途には使えません。"
      >
        <Textarea
          value={value.lyrics}
          onChange={(e) => onChange({ lyrics: e.target.value })}
          placeholder={'[Verse]\n歌詞を貼り付けてください\n\n[Chorus]\n...(構造タグが無くてもAIが推定します)'}
          className="min-h-[260px] resize-y font-mono text-sm leading-relaxed"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="曲のジャンル" required>
          <Input
            value={value.genre}
            onChange={(e) => onChange({ genre: e.target.value })}
            placeholder="例: ローファイ・ヒップホップ"
          />
        </Field>
        <Field label="表現したい感情" required>
          <Input
            value={value.emotion}
            onChange={(e) => onChange({ emotion: e.target.value })}
            placeholder="例: 夜更けの安心感と少しの寂しさ"
          />
        </Field>
        <Field label="想定する聴き手" required>
          <Input
            value={value.audience}
            onChange={(e) => onChange({ audience: e.target.value })}
            placeholder="例: 深夜に作業する20〜30代"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="添削モード">
          <Select value={value.mode} onValueChange={(v) => onChange({ mode: v as ReviewMode })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REVIEW_MODES.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  {mode.label} — {mode.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="添削の強さ">
          <Select
            value={value.intensity}
            onValueChange={(v) => onChange({ intensity: v as ReviewIntensity })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REVIEW_INTENSITIES.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  {it.label} — {it.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <details className="group rounded-xl border border-border bg-muted/30 p-4 open:bg-muted/10">
        <summary className="cursor-pointer select-none text-sm font-medium text-muted-foreground group-open:mb-4">
          任意項目(書くほど提案の的が絞れます)
        </summary>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="曲のテーマ">
            <Input
              value={value.theme}
              onChange={(e) => onChange({ theme: e.target.value })}
              placeholder="例: 眠れない夜のコンビニ帰り道"
            />
          </Field>
          <Field label="ボーカルの性別・声質">
            <Input
              value={value.vocal}
              onChange={(e) => onChange({ vocal: e.target.value })}
              placeholder="例: 女性・ウィスパー系"
            />
          </Field>
          <Field label="BPM">
            <Input
              value={value.bpm}
              onChange={(e) => onChange({ bpm: e.target.value })}
              placeholder="例: 80"
            />
          </Field>
          <Field label="曲の長さ">
            <Input
              value={value.duration}
              onChange={(e) => onChange({ duration: e.target.value })}
              placeholder="例: 3分前後"
            />
          </Field>
          <Field
            label="参考にしたい時代"
            hint="アーティスト名を書いた場合は、模倣を避けるためジャンル・時代感などの一般要素に自動変換されます。"
          >
            <Input
              value={value.era}
              onChange={(e) => onChange({ era: e.target.value })}
              placeholder="例: 2000年代のJ-POP"
            />
          </Field>
          <Field label="使用予定のAI音楽サービス">
            <Input
              value={value.service}
              onChange={(e) => onChange({ service: e.target.value })}
              placeholder="例: Suno"
            />
          </Field>
          <Field label="残したい表現" hint="読点・改行区切り。この表現を含む行には提案を出しません。">
            <Textarea
              value={value.keepPhrases}
              onChange={(e) => onChange({ keepPhrases: e.target.value })}
              placeholder={'例: ぬるいコーヒー、終電の窓'}
              className="min-h-[60px] resize-y text-sm"
            />
          </Field>
          <Field label="使用したくない表現" hint="読点・改行区切り。見つけた場合は置き換えを提案します。">
            <Textarea
              value={value.avoidWords}
              onChange={(e) => onChange({ avoidWords: e.target.value })}
              placeholder={'例: 絆、奇跡'}
              className="min-h-[60px] resize-y text-sm"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="自分で気になっている部分">
              <Textarea
                value={value.concern}
                onChange={(e) => onChange({ concern: e.target.value })}
                placeholder="例: サビが弱い気がする / 2番の歌詞が説明っぽい"
                className="min-h-[60px] resize-y text-sm"
              />
            </Field>
          </div>
        </div>
      </details>
    </div>
  )
}
