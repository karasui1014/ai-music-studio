import { Upload } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AiProducerInput } from '@/lib/tools/ai-producer/types'

interface AiProducerFormProps {
  value: AiProducerInput
  onChange: (patch: Partial<AiProducerInput>) => void
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

export function AiProducerForm({ value, onChange }: AiProducerFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">曲の前提(必須)</h3>
        <div className="grid gap-4">
          <Field label="曲の狙い" required>
            <Textarea
              value={value.aim}
              onChange={(e) => onChange({ aim: e.target.value })}
              placeholder="例: 深夜にひとりで聴いて泣ける、切ないローファイバラードにしたい"
              rows={2}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="想定する聴き手" required>
              <Input
                value={value.audience}
                onChange={(e) => onChange({ audience: e.target.value })}
                placeholder="例: 20〜30代の作業用BGMリスナー"
              />
            </Field>
            <Field label="公開予定の媒体" required>
              <Input
                value={value.media}
                onChange={(e) => onChange({ media: e.target.value })}
                placeholder="例: YouTube / YouTube Shorts / TikTok"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          分析対象<span className="ml-2 text-xs font-normal text-muted-foreground">歌詞・Sunoプロンプト・説明のどれか1つ以上が必要です</span>
        </h3>
        <div className="grid gap-4">
          <Field label="歌詞">
            <Textarea
              value={value.lyrics}
              onChange={(e) => onChange({ lyrics: e.target.value })}
              placeholder="曲を選択すると自動入力されます"
              rows={8}
              className="font-mono text-xs"
            />
          </Field>
          <Field label="Sunoプロンプト(スタイル)">
            <Textarea
              value={value.sunoPrompt}
              onChange={(e) => onChange({ sunoPrompt: e.target.value })}
              placeholder="曲を選択すると最新のプロンプトが自動入力されます"
              rows={4}
              className="font-mono text-xs"
            />
          </Field>
          <Field label="制作者自身の説明">
            <Textarea
              value={value.selfDescription}
              onChange={(e) => onChange({ selfDescription: e.target.value })}
              placeholder="例: サビは気に入っているが、Aメロが平坦で退屈な気がしている"
              rows={3}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          補足情報<span className="ml-2 text-xs font-normal text-muted-foreground">任意。埋めるほど提案の精度が上がります</span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ジャンル">
            <Input
              value={value.genre}
              onChange={(e) => onChange({ genre: e.target.value })}
              placeholder="例: lo-fi hip hop"
            />
          </Field>
          <Field label="BPM">
            <Input
              value={value.bpm}
              onChange={(e) => onChange({ bpm: e.target.value })}
              placeholder="例: 85"
            />
          </Field>
          <Field label="曲の長さ">
            <Input
              value={value.duration}
              onChange={(e) => onChange({ duration: e.target.value })}
              placeholder="例: 3分前後"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="気になっている部分">
            <Textarea
              value={value.concern}
              onChange={(e) => onChange({ concern: e.target.value })}
              placeholder="例: サビの盛り上がりが足りない"
              rows={2}
            />
          </Field>
          <Field label="改善したい目的">
            <Textarea
              value={value.goal}
              onChange={(e) => onChange({ goal: e.target.value })}
              placeholder="例: 最後まで聴かれる曲にしたい"
              rows={2}
            />
          </Field>
          <Field label="残したい要素">
            <Textarea
              value={value.keep}
              onChange={(e) => onChange({ keep: e.target.value })}
              placeholder="例: サビのメロディと歌詞の世界観"
              rows={2}
            />
          </Field>
          <Field label="変更したくない要素">
            <Textarea
              value={value.doNotChange}
              onChange={(e) => onChange({ doNotChange: e.target.value })}
              placeholder="例: 曲名とテンポは変えない"
              rows={2}
            />
          </Field>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3">
        <Upload className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          音源アップロード分析は今後対応予定です。現在は歌詞・プロンプトなどテキストの分析のみ行います
          (音源はこのアプリの外に置いたまま、端末から出ることはありません)。
        </p>
      </div>
    </div>
  )
}
