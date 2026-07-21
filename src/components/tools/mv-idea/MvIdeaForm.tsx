import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MV_PLAN_MODES } from '@/lib/tools/mv-idea/types'
import type { MvIdeaInput, MvOrientation } from '@/lib/tools/mv-idea/types'
import { cn } from '@/lib/utils'

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-xs">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

const ORIENTATION_AUTO = 'auto'

export function MvIdeaForm({
  value,
  onChange,
}: {
  value: MvIdeaInput
  onChange: (patch: Partial<MvIdeaInput>) => void
}) {
  const [showOptional, setShowOptional] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold">企画モード</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {MV_PLAN_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange({ mode: mode.id })}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                value.mode === mode.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-accent/60',
              )}
            >
              <span className="block text-sm font-medium">{mode.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{mode.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">必須項目</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="曲名" required>
            <Input
              value={value.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="例: 雨上がりの探偵"
            />
          </Field>
          <Field label="ジャンル" required>
            <Input
              value={value.genre}
              onChange={(e) => onChange({ genre: e.target.value })}
              placeholder="例: lofi hip hop"
            />
          </Field>
          <Field label="曲の感情" required>
            <Input
              value={value.mood}
              onChange={(e) => onChange({ mood: e.target.value })}
              placeholder="例: 切ない、落ち着いた"
            />
          </Field>
          <Field label="曲の長さ" required>
            <Input
              value={value.durationText}
              onChange={(e) => onChange({ durationText: e.target.value })}
              placeholder="例: 3:30 / 210秒 / 3分30秒"
            />
          </Field>
          <Field label="公開予定の媒体" required>
            <Input
              value={value.media}
              onChange={(e) => onChange({ media: e.target.value })}
              placeholder="例: YouTube、Shorts"
            />
          </Field>
          <Field label="曲の説明" required className="sm:col-span-2">
            <Textarea
              value={value.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="どんな曲か、どんな場面を思い浮かべて作ったかを1〜3行で"
              rows={2}
            />
          </Field>
        </div>
      </div>

      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 px-0 text-muted-foreground"
          onClick={() => setShowOptional((v) => !v)}
        >
          {showOptional ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          任意項目(あるほど企画が具体的になります)
        </Button>
        {showOptional && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="歌詞" className="sm:col-span-2">
              <Textarea
                value={value.lyrics}
                onChange={(e) => onChange({ lyrics: e.target.value })}
                placeholder="歌詞があると字幕・歌詞動画の計画に使われます"
                rows={4}
              />
            </Field>
            <Field label="BPM">
              <Input
                value={value.bpm}
                onChange={(e) => onChange({ bpm: e.target.value })}
                placeholder="例: 82"
              />
            </Field>
            <Field label="想定する視聴者">
              <Input
                value={value.audience}
                onChange={(e) => onChange({ audience: e.target.value })}
                placeholder="例: 作業用BGMを探す社会人"
              />
            </Field>
            <Field label="希望する映像表現">
              <Input
                value={value.visualStyle}
                onChange={(e) => onChange({ visualStyle: e.target.value })}
                placeholder="例: 手描き風、フィルムっぽい質感"
              />
            </Field>
            <Field label="登場人物">
              <Input
                value={value.characters}
                onChange={(e) => onChange({ characters: e.target.value })}
                placeholder="例: トレンチコートの探偵と黒猫"
              />
            </Field>
            <Field label="舞台">
              <Input
                value={value.stage}
                onChange={(e) => onChange({ stage: e.target.value })}
                placeholder="例: 夜の探偵事務所"
              />
            </Field>
            <Field label="時代">
              <Input
                value={value.era}
                onChange={(e) => onChange({ era: e.target.value })}
                placeholder="例: 現代 / 1980年代"
              />
            </Field>
            <Field label="色の雰囲気">
              <Input
                value={value.colorMood}
                onChange={(e) => onChange({ colorMood: e.target.value })}
                placeholder="例: 青とオレンジ、セピア"
              />
            </Field>
            <Field label="縦型または横型">
              <Select
                value={value.orientation || ORIENTATION_AUTO}
                onValueChange={(v) =>
                  onChange({ orientation: v === ORIENTATION_AUTO ? '' : (v as MvOrientation) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ORIENTATION_AUTO}>モードから自動</SelectItem>
                  <SelectItem value="horizontal">横型(16:9)</SelectItem>
                  <SelectItem value="vertical">縦型(9:16)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="制作予算">
              <Input
                value={value.budget}
                onChange={(e) => onChange({ budget: e.target.value })}
                placeholder="例: 無料枠のみ / 月3000円まで"
              />
            </Field>
            <Field label="使用予定の動画生成AI">
              <Input
                value={value.videoAiTool}
                onChange={(e) => onChange({ videoAiTool: e.target.value })}
                placeholder="例: 手持ちの動画生成AIの名前"
              />
            </Field>
            <Field label="避けたい表現">
              <Input
                value={value.avoid}
                onChange={(e) => onChange({ avoid: e.target.value })}
                placeholder="例: ホラー表現、実写風の顔"
              />
            </Field>
            <Field label="使用できる素材" className="sm:col-span-2">
              <Textarea
                value={value.availableAssets}
                onChange={(e) => onChange({ availableAssets: e.target.value })}
                placeholder="例: 過去に生成した探偵の立ち絵、事務所の背景画像"
                rows={2}
              />
            </Field>
            <Field label="参考画像の説明" className="sm:col-span-2">
              <Textarea
                value={value.referenceNote}
                onChange={(e) => onChange({ referenceNote: e.target.value })}
                placeholder="参考にしたい画像の内容を言葉で(作家名は色・光などの要素に変換されます)"
                rows={2}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}
