import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  BPM_BANDS,
  createEmptyEntryInput,
  validateEntryInput,
  VOCAL_OPTIONS,
  type PromptEntry,
  type PromptEntryInput,
} from '@/lib/tools/prompt-dex/types'

/** 「a, b、c」→ ['a','b','c'] / 逆変換 */
function splitList(text: string): string[] {
  return text
    .split(/[,、\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}
function joinList(items: string[]): string {
  return items.join(', ')
}
function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

/** 自分用プロンプトの追加/編集。entry があれば編集、なければ新規。 */
export function PromptEditDialog({
  open,
  onOpenChange,
  entry,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry?: PromptEntry
  onSubmit: (input: PromptEntryInput) => void
}) {
  const [form, setForm] = useState<PromptEntryInput>(createEmptyEntryInput)
  // リスト系はカンマ/改行区切りの文字列で編集する
  const [emotions, setEmotions] = useState('')
  const [instruments, setInstruments] = useState('')
  const [uses, setUses] = useState('')
  const [services, setServices] = useState('')
  const [tags, setTags] = useState('')
  const [successPoints, setSuccessPoints] = useState('')
  const [failurePoints, setFailurePoints] = useState('')
  const [adjustments, setAdjustments] = useState('')

  useEffect(() => {
    if (!open) return
    const base: PromptEntryInput = entry
      ? {
          title: entry.title,
          prompt: entry.prompt,
          description: entry.description,
          genre: entry.genre,
          subgenre: entry.subgenre,
          emotions: entry.emotions,
          bpm: entry.bpm,
          vocal: entry.vocal,
          instruments: entry.instruments,
          era: entry.era,
          uses: entry.uses,
          services: entry.services,
          beginnerFriendly: entry.beginnerFriendly,
          successPoints: entry.successPoints,
          failurePoints: entry.failurePoints,
          adjustments: entry.adjustments,
          tags: entry.tags,
          version: entry.version,
        }
      : createEmptyEntryInput()
    setForm(base)
    setEmotions(joinList(base.emotions))
    setInstruments(joinList(base.instruments))
    setUses(joinList(base.uses))
    setServices(joinList(base.services))
    setTags(joinList(base.tags))
    setSuccessPoints(base.successPoints.join('\n'))
    setFailurePoints(base.failurePoints.join('\n'))
    setAdjustments(base.adjustments.join('\n'))
  }, [open, entry])

  const patch = (p: Partial<PromptEntryInput>) => setForm((f) => ({ ...f, ...p }))

  const handleSubmit = () => {
    const input: PromptEntryInput = {
      ...form,
      emotions: splitList(emotions),
      instruments: splitList(instruments),
      uses: splitList(uses),
      services: splitList(services),
      tags: splitList(tags),
      successPoints: splitLines(successPoints),
      failurePoints: splitLines(failurePoints),
      adjustments: splitLines(adjustments),
    }
    const errors = validateEntryInput(input)
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }
    onSubmit(input)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? '自分用プロンプトを編集' : '自分用プロンプトを追加'}</DialogTitle>
          <DialogDescription>
            端末内にだけ保存されます。JSON書き出しで持ち出し・バックアップできます。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label="タイトル *">
            <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="例: 夜に沁みるチルなR&B" />
          </Field>
          <Field label="プロンプト本文 *">
            <Textarea
              value={form.prompt}
              onChange={(e) => patch({ prompt: e.target.value })}
              rows={3}
              className="font-mono text-xs"
              placeholder="Sunoなどに貼るスタイル指定"
            />
          </Field>
          <Field label="日本語説明">
            <Textarea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={2}
              placeholder="どんな曲になるか・いつ使うか"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ジャンル *">
              <Input value={form.genre} onChange={(e) => patch({ genre: e.target.value })} placeholder="例: R&B" />
            </Field>
            <Field label="サブジャンル">
              <Input value={form.subgenre} onChange={(e) => patch({ subgenre: e.target.value })} placeholder="例: ソウル" />
            </Field>
            <Field label="BPM帯">
              <Select value={form.bpm} onValueChange={(v) => patch({ bpm: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BPM_BANDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="ボーカル">
              <Select value={form.vocal} onValueChange={(v) => patch({ vocal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOCAL_OPTIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="時代感">
              <Input value={form.era} onChange={(e) => patch({ era: e.target.value })} placeholder="例: 80s / 2020s / timeless" />
            </Field>
            <Field label="バージョン">
              <Input value={form.version} onChange={(e) => patch({ version: e.target.value })} placeholder="例: v1" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="感情(カンマ区切り)">
              <Input value={emotions} onChange={(e) => setEmotions(e.target.value)} placeholder="切ない, 大人っぽい" />
            </Field>
            <Field label="用途(カンマ区切り)">
              <Input value={uses} onChange={(e) => setUses(e.target.value)} placeholder="MV, 作業用BGM" />
            </Field>
            <Field label="楽器(カンマ区切り)">
              <Input value={instruments} onChange={(e) => setInstruments(e.target.value)} placeholder="ピアノ, ベース" />
            </Field>
            <Field label="対応サービス(カンマ区切り)">
              <Input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Suno, Udio" />
            </Field>
          </div>

          <Field label="タグ(カンマ区切り)">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="大人, しっとり" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="成功しやすい点(1行に1つ)">
              <Textarea value={successPoints} onChange={(e) => setSuccessPoints(e.target.value)} rows={3} />
            </Field>
            <Field label="失敗しやすい点(1行に1つ)">
              <Textarea value={failurePoints} onChange={(e) => setFailurePoints(e.target.value)} rows={3} />
            </Field>
          </div>
          <Field label="調整方法(1行に1つ)">
            <Textarea value={adjustments} onChange={(e) => setAdjustments(e.target.value)} rows={3} />
          </Field>

          <label className="flex items-center gap-2.5 rounded-xl border border-border p-3">
            <Switch checked={form.beginnerFriendly} onCheckedChange={(v) => patch({ beginnerFriendly: v })} />
            <span className="text-sm">初心者向け(扱いやすいプロンプト)</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit}>{entry ? '保存する' : '追加する'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
