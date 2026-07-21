import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Library, Lock, Plus, SearchX } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/EmptyState'
import { ImportExportButtons } from '@/components/tools/prompt-dex/ImportExportButtons'
import { PromptCard } from '@/components/tools/prompt-dex/PromptCard'
import { PromptDetailDialog } from '@/components/tools/prompt-dex/PromptDetailDialog'
import { PromptEditDialog } from '@/components/tools/prompt-dex/PromptEditDialog'
import { PromptFilters } from '@/components/tools/prompt-dex/PromptFilters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BUILTIN_PROMPTS } from '@/lib/tools/prompt-dex/data'
import {
  collectOptions,
  filterAndSort,
  relatedEntries,
} from '@/lib/tools/prompt-dex/search'
import {
  createEmptyFilters,
  type PromptEntry,
  type PromptEntryInput,
  type PromptFilters as Filters,
  type SortKey,
} from '@/lib/tools/prompt-dex/types'
import { usePromptDexStore } from '@/store/usePromptDexStore'
import { useSongStore } from '@/store/useSongStore'

/** URLクエリに載せる絞り込みキー(検索条件を画面状態として保持する) */
const FILTER_KEYS: (keyof Filters)[] = [
  'keyword',
  'genre',
  'subgenre',
  'emotion',
  'use',
  'vocal',
  'bpm',
  'service',
  'tag',
]

function filtersFromParams(params: URLSearchParams): Filters {
  const f = createEmptyFilters()
  for (const key of FILTER_KEYS) {
    const v = params.get(key)
    if (v) (f[key] as string) = v
  }
  f.favoritesOnly = params.get('fav') === '1'
  return f
}

export function PromptDexPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const songs = useSongStore((s) => s.songs)
  const userEntries = usePromptDexStore((s) => s.userEntries)
  const favorites = usePromptDexStore((s) => s.favorites)
  const toggleFavorite = usePromptDexStore((s) => s.toggleFavorite)
  const addEntry = usePromptDexStore((s) => s.addEntry)
  const updateEntry = usePromptDexStore((s) => s.updateEntry)
  const removeEntry = usePromptDexStore((s) => s.removeEntry)

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams])
  const sort = (searchParams.get('sort') as SortKey) || 'recommended'
  const detailId = searchParams.get('id') ?? ''
  const activeSongId = searchParams.get('song') ?? undefined

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<PromptEntry | undefined>(undefined)

  const allEntries = useMemo(() => [...userEntries, ...BUILTIN_PROMPTS], [userEntries])
  const options = useMemo(() => collectOptions(allEntries), [allEntries])
  // favorites は依存に入れて、お気に入り切替時に再評価されるようにする
  const visible = useMemo(
    () => filterAndSort(allEntries, filters, sort, (id) => favorites.includes(id)),
    [allEntries, filters, sort, favorites],
  )

  const detailEntry = useMemo(
    () => allEntries.find((e) => e.id === detailId) ?? null,
    [allEntries, detailId],
  )
  const related = useMemo(
    () => (detailEntry ? relatedEntries(detailEntry, allEntries) : []),
    [detailEntry, allEntries],
  )

  /** searchParams を部分更新するヘルパー(他のキーは維持) */
  const patchParams = useCallback(
    (updater: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams)
      updater(next)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const handleFilterChange = (patch: Partial<Filters>) => {
    patchParams((p) => {
      for (const [key, value] of Object.entries(patch)) {
        if (key === 'favoritesOnly') {
          if (value) p.set('fav', '1')
          else p.delete('fav')
        } else if (value) {
          p.set(key, String(value))
        } else {
          p.delete(key)
        }
      }
    })
  }

  const handleReset = () =>
    patchParams((p) => {
      for (const key of FILTER_KEYS) p.delete(key)
      p.delete('fav')
    })

  const openDetail = (id: string) => patchParams((p) => p.set('id', id))
  const closeDetail = () => patchParams((p) => p.delete('id'))

  const handleAddNew = () => {
    setEditing(undefined)
    setEditOpen(true)
  }
  const handleEdit = (entry: PromptEntry) => {
    setEditing(entry)
    setEditOpen(true)
  }
  const handleSubmit = (input: PromptEntryInput) => {
    if (editing) {
      updateEntry(editing.id, input)
      toast.success('自分用プロンプトを更新しました')
    } else {
      const created = addEntry(input, 'user')
      toast.success('自分用プロンプトを追加しました')
      patchParams((p) => p.set('id', created.id))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 w-fit gap-1.5 px-0 text-muted-foreground" asChild>
          <Link to="/tools">
            <ArrowLeft className="h-4 w-4" />
            制作ツール一覧に戻る
          </Link>
        </Button>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Library className="h-5 w-5" />
          </span>
          プロンプト図鑑
          <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
            ベータ
          </Badge>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ジャンル・感情・用途から使えるプロンプトを探し、条件・成功のコツごと既存曲へ反映できます。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p>
            初期収録{BUILTIN_PROMPTS.length}件 + 自分用{userEntries.length}件。すべて端末内に保存され、外部へ送信されません。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ImportExportButtons />
          <Button size="sm" className="gap-1.5" onClick={handleAddNew}>
            <Plus className="h-3.5 w-3.5" />
            自分用を追加
          </Button>
        </div>
      </div>

      <PromptFilters
        filters={filters}
        options={options}
        sort={sort}
        resultCount={visible.length}
        onFilterChange={handleFilterChange}
        onSortChange={(s) => patchParams((p) => p.set('sort', s))}
        onReset={handleReset}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="条件に合うプロンプトがありません"
          description="絞り込みを緩めるか、自分用プロンプトを追加してみましょう。"
          action={
            <Button variant="outline" onClick={handleReset}>
              絞り込みをリセット
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((entry) => (
            <PromptCard
              key={entry.id}
              entry={entry}
              favorite={favorites.includes(entry.id)}
              onToggleFavorite={() => toggleFavorite(entry.id)}
              onOpenDetail={() => openDetail(entry.id)}
            />
          ))}
        </div>
      )}

      <PromptDetailDialog
        entry={detailEntry}
        songs={songs}
        related={related}
        activeSongId={activeSongId}
        isFavorite={(id) => favorites.includes(id)}
        onOpenChange={(open) => !open && closeDetail()}
        onToggleFavorite={toggleFavorite}
        onOpenRelated={openDetail}
        onEdit={handleEdit}
        onDelete={removeEntry}
      />

      <PromptEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        entry={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
