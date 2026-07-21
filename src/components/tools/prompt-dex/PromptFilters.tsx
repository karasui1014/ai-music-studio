import { RotateCcw, Search, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { FilterOptions } from '@/lib/tools/prompt-dex/search'
import {
  BPM_BANDS,
  SORT_LABELS,
  VOCAL_OPTIONS,
  type PromptFilters as Filters,
  type SortKey,
} from '@/lib/tools/prompt-dex/types'

const ALL = '__all__'

/** 「すべて」を含む単一選択のドロップダウン */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>すべて</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PromptFilters({
  filters,
  options,
  sort,
  resultCount,
  onFilterChange,
  onSortChange,
  onReset,
}: {
  filters: Filters
  options: FilterOptions
  sort: SortKey
  resultCount: number
  onFilterChange: (patch: Partial<Filters>) => void
  onSortChange: (sort: SortKey) => void
  onReset: () => void
}) {
  const toOpts = (values: string[]) => values.map((v) => ({ value: v, label: v }))

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.keyword}
            onChange={(e) => onFilterChange({ keyword: e.target.value })}
            placeholder="キーワードで探す(タイトル・プロンプト・タグなど)"
            className="pl-9"
          />
        </div>
        <Button
          variant={filters.favoritesOnly ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => onFilterChange({ favoritesOnly: !filters.favoritesOnly })}
        >
          <Star className={cn('h-4 w-4', filters.favoritesOnly && 'fill-current')} />
          お気に入り
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <FilterSelect
          label="ジャンル"
          value={filters.genre}
          options={toOpts(options.genres)}
          onChange={(v) => onFilterChange({ genre: v })}
        />
        <FilterSelect
          label="サブジャンル"
          value={filters.subgenre}
          options={toOpts(options.subgenres)}
          onChange={(v) => onFilterChange({ subgenre: v })}
        />
        <FilterSelect
          label="感情"
          value={filters.emotion}
          options={toOpts(options.emotions)}
          onChange={(v) => onFilterChange({ emotion: v })}
        />
        <FilterSelect
          label="用途"
          value={filters.use}
          options={toOpts(options.uses)}
          onChange={(v) => onFilterChange({ use: v })}
        />
        <FilterSelect
          label="ボーカル"
          value={filters.vocal}
          options={VOCAL_OPTIONS.map((v) => ({ value: v.value, label: v.label }))}
          onChange={(v) => onFilterChange({ vocal: v })}
        />
        <FilterSelect
          label="BPM帯"
          value={filters.bpm}
          options={BPM_BANDS.map((b) => ({ value: b.value, label: b.label }))}
          onChange={(v) => onFilterChange({ bpm: v })}
        />
        <FilterSelect
          label="対応サービス"
          value={filters.service}
          options={toOpts(options.services)}
          onChange={(v) => onFilterChange({ service: v })}
        />
        <FilterSelect
          label="タグ"
          value={filters.tag}
          options={toOpts(options.tags)}
          onChange={(v) => onFilterChange({ tag: v })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{resultCount}件</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">並び替え</span>
            <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SORT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            リセット
          </Button>
        </div>
      </div>
    </div>
  )
}
