import { Wand2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { MvConsistency } from '@/lib/tools/mv-idea/types'

const FIELDS: { key: keyof MvConsistency; label: string }[] = [
  { key: 'characters', label: '登場人物' },
  { key: 'ageRange', label: '年齢層' },
  { key: 'hair', label: '髪型' },
  { key: 'outfit', label: '衣装' },
  { key: 'expression', label: '表情' },
  { key: 'stage', label: '舞台' },
  { key: 'era', label: '時代' },
  { key: 'colors', label: '色' },
  { key: 'light', label: '光' },
  { key: 'lens', label: 'レンズ感' },
  { key: 'texture', label: '映像の質感' },
]

/** 一貫性設定の編集パネル。全ショットへの再反映もここから行う */
export function ConsistencyPanel({
  consistency,
  onChange,
  onReapplyAll,
}: {
  consistency: MvConsistency
  onChange: (patch: Partial<MvConsistency>) => void
  onReapplyAll: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        全ショット共通の設定です。変更したら「全ショットへ再反映」で各ショットの画像・動画プロンプトへ反映できます(各ショット側のボタンで1件ずつも可能)。
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label className="text-xs">{field.label}</Label>
            <Input
              value={consistency[field.key]}
              onChange={(e) => onChange({ [field.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
          <Label className="text-xs">禁止事項(ネガティブプロンプトへ入ります)</Label>
          <Textarea
            value={consistency.forbidden}
            onChange={(e) => onChange({ forbidden: e.target.value })}
            rows={2}
          />
        </div>
      </div>
      <div>
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Wand2 className="h-4 w-4" />
              全ショットへ再反映
            </Button>
          }
          title="一貫性設定を全ショットへ再反映しますか?"
          description="全ショットの画像・動画・ネガティブプロンプトを、場面説明と現在の一貫性設定から作り直します。手で編集したプロンプトは上書きされます。"
          confirmLabel="再反映する"
          onConfirm={onReapplyAll}
        />
      </div>
    </div>
  )
}
