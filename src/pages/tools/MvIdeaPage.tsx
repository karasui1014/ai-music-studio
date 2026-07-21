import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Clapperboard, Info, ListMusic, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { ConceptCards } from '@/components/tools/mv-idea/ConceptCards'
import { MvIdeaForm } from '@/components/tools/mv-idea/MvIdeaForm'
import { PlanDetailView } from '@/components/tools/mv-idea/PlanDetailView'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_META } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import {
  expandConcept,
  generateResult,
  reapplyConsistency,
  regenerateShot,
} from '@/lib/tools/mv-idea/generate'
import {
  duplicateShot,
  moveShot,
  removeShot,
  updateShot,
} from '@/lib/tools/mv-idea/shots'
import {
  createEmptyInput,
  validateConcepts,
  validateInput,
  validatePlanDetail,
} from '@/lib/tools/mv-idea/types'
import type {
  MvConcept,
  MvIdeaInput,
  MvIdeaResult,
  MvIdeaSongContext,
  MvPlanDetail,
} from '@/lib/tools/mv-idea/types'
import { DEFAULT_PROVIDER_ID, getProviderMeta } from '@/lib/tools/provider'
import { useSongStore } from '@/store/useSongStore'
import { useToolRunStore } from '@/store/useToolRunStore'
import type { MvIdeaRunRecord } from '@/lib/tools/types'
import type { Song } from '@/lib/types'

const NO_SONG = 'none'

function buildContext(song: Song | undefined): MvIdeaSongContext {
  return {
    songId: song?.id,
    songTitle: song?.title ?? '(曲未選択)',
    status: song?.status,
    sunoPrompt: song?.sunoPrompts[0]?.stylePrompt ?? '',
    latestMvPrompt: song?.mvPrompts[0]?.prompt ?? '',
    existingMvPromptCount: song?.mvPrompts.length ?? 0,
    youtubeTitle: song?.youtube.title ?? '',
    youtubeDescription: song?.youtube.description ?? '',
    youtubeTags: song?.youtube.tags ?? '',
    youtubeUrl: song?.youtube.url ?? '',
    historyCount: song?.history.length ?? 0,
  }
}

export function MvIdeaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const songs = useSongStore((s) => s.songs)
  const addToolHistory = useSongStore((s) => s.addToolHistory)
  const runs = useToolRunStore((s) => s.runs)
  const addRun = useToolRunStore((s) => s.addRun)
  const updateRun = useToolRunStore((s) => s.updateRun)

  const songId = searchParams.get('song') ?? ''
  const song = songs.find((s) => s.id === songId)
  const songKey = song?.id

  const [form, setForm] = useState<MvIdeaInput>(createEmptyInput)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const conceptsRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  /** ショットの「一部再生成」で毎回違うバリエーションを出すためのカウンター */
  const regenSeedRef = useRef(1)

  // 曲を選択(または切替)したら、存在する情報を自動入力する
  useEffect(() => {
    if (!song) return
    setForm((prev) => ({
      ...prev,
      title: song.title,
      genre: song.genre ?? prev.genre,
      lyrics: song.lyrics,
      description:
        prev.description ||
        (song.youtube.description ?? '').split('\n').slice(0, 2).join(' ').slice(0, 200),
      media: prev.media || (song.youtube.url || song.youtube.title ? 'YouTube' : ''),
    }))
    setActiveRunId(null)
    // 曲の切替時だけ自動入力する(編集のたびに上書きしない)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songKey])

  const songRuns = useMemo(
    () =>
      runs.filter(
        (r): r is MvIdeaRunRecord => r.toolId === 'mv-idea' && !!songId && r.songId === songId,
      ),
    [runs, songId],
  )

  const activeRun = useMemo(
    () => runs.find((r): r is MvIdeaRunRecord => r.id === activeRunId && r.toolId === 'mv-idea'),
    [runs, activeRunId],
  )

  const errors = validateInput(form)
  const provider = getProviderMeta(DEFAULT_PROVIDER_ID)

  const exportMeta = useMemo(
    () => ({
      songTitle: activeRun?.songTitle ?? song?.title ?? '(曲未選択)',
      createdAt: activeRun ? formatDate(activeRun.createdAt, 'yyyy/M/d HH:mm') : '',
      providerName: provider.name,
    }),
    [activeRun, song, provider.name],
  )

  const handleSelectSong = (value: string) => {
    if (value === NO_SONG) {
      setSearchParams({}, { replace: true })
      setActiveRunId(null)
    } else {
      setSearchParams({ song: value }, { replace: true })
    }
  }

  const handleGenerate = () => {
    const validationErrors = validateInput(form)
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }
    // 2回目以降はseedをずらして別の組み合わせを出す
    const input: MvIdeaInput = activeRun ? { ...form, seed: form.seed + 1 } : form
    if (activeRun) setForm(input)

    const context = buildContext(song)
    const result = generateResult(input, context)
    const schemaErrors = validateConcepts(result.concepts)
    if (schemaErrors.length > 0) {
      toast.error(`生成結果が検証を通りませんでした: ${schemaErrors[0]}`)
      return
    }
    const record = addRun({
      toolId: 'mv-idea',
      songId: song?.id,
      songTitle: song?.title ?? '(曲未選択)',
      provider: DEFAULT_PROVIDER_ID,
      input,
      result,
    })
    setActiveRunId(record.id)
    toast.success('企画案を3件生成しました(結果は自動保存されます)')
    requestAnimationFrame(() => {
      conceptsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleSelectConcept = (concept: MvConcept) => {
    if (!activeRun) return
    const context = buildContext(song)
    const detail = expandConcept(activeRun.input, context, concept)
    const schemaErrors = validatePlanDetail(detail)
    if (schemaErrors.length > 0) {
      toast.error(`企画書が検証を通りませんでした: ${schemaErrors[0]}`)
      return
    }
    const nextResult: MvIdeaResult = {
      ...activeRun.result,
      selectedConceptId: concept.id,
      detail,
    }
    updateRun(activeRun.id, { result: nextResult })
    toast.success(`「${concept.conceptTitle}」を詳細企画書へ展開しました`)
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  /** 詳細企画書を部分更新して実行履歴へ保存し直す */
  const patchDetail = (updater: (detail: MvPlanDetail) => MvPlanDetail) => {
    if (!activeRun?.result.detail) return
    const nextResult: MvIdeaResult = {
      ...activeRun.result,
      detail: updater(activeRun.result.detail),
    }
    updateRun(activeRun.id, { result: nextResult })
  }

  const selectedApproach = useMemo(() => {
    if (!activeRun?.result.selectedConceptId) return 'story' as const
    return (
      activeRun.result.concepts.find((c) => c.id === activeRun.result.selectedConceptId)
        ?.approach ?? ('story' as const)
    )
  }, [activeRun])

  const handleRecordHistory = () => {
    if (!song || !activeRun?.result.detail) return
    addToolHistory(
      song.id,
      `MVアイデア生成AIで企画「${activeRun.result.detail.conceptTitle}」を作成しました(全${activeRun.result.detail.shots.length}ショット)`,
    )
    toast.success('制作履歴へ記録しました')
  }

  const statusMeta = song ? STATUS_META[song.status] : null
  const detail = activeRun?.result.detail

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 w-fit gap-1.5 px-0 text-muted-foreground"
          asChild
        >
          <Link to="/tools">
            <ArrowLeft className="h-4 w-4" />
            制作ツール一覧に戻る
          </Link>
        </Button>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clapperboard className="h-5 w-5" />
          </span>
          MVアイデア生成AI
          <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
            ベータ
          </Badge>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          曲の情報から方向性の異なる3案を出し、選んだ案をショットリストつきのMV企画書へ展開します。
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p>
          生成エンジン: <strong className="font-medium text-foreground">{provider.name}</strong>—{' '}
          {provider.description}
          特定の作家・スタジオの作風は再現せず、固有名詞は色・光・構図などの一般要素へ変換します。
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ListMusic className="h-4 w-4 text-primary" />
          企画する曲
        </h2>
        <Select value={songId || NO_SONG} onValueChange={handleSelectSong}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="曲を選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SONG}>曲を選ばずに手入力で企画</SelectItem>
            {songs.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {song && statusMeta && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={`border-transparent ${statusMeta.badge}`}>
              {statusMeta.label}
            </Badge>
            <span>歌詞 {song.lyrics.trim() ? 'あり' : 'なし'}</span>
            <span>・Sunoプロンプト {song.sunoPrompts.length}件</span>
            <span>・MVプロンプト {song.mvPrompts.length}件</span>
            <span>・YouTube情報 {song.youtube.url || song.youtube.title ? '登録済み' : '未登録'}</span>
            <span>・制作履歴 {song.history.length}件</span>
            <span className="basis-full sm:basis-auto">
              (曲名・ジャンル・歌詞などを自動入力しました。不足分だけ入力してください)
            </span>
          </div>
        )}
        {!song && songs.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            まだ曲がありません。曲を作らなくても、下のフォームに直接入力すれば企画を作れます。
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <MvIdeaForm value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        <div className="mt-6 flex flex-col items-start gap-2">
          <Button size="lg" className="gap-2" onClick={handleGenerate} disabled={errors.length > 0}>
            <Sparkles className="h-4 w-4" />
            {activeRun ? '別の方向性で3案を作り直す' : '企画案を3件生成する'}
          </Button>
          {errors.length > 0 && <p className="text-xs text-muted-foreground">{errors[0]}</p>}
        </div>
      </section>

      {songRuns.length > 0 && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium">この曲の過去の企画: {songRuns.length}件</p>
          <Select
            value={activeRun && activeRun.songId === songId ? activeRun.id : ''}
            onValueChange={(id) => setActiveRunId(id)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="過去の企画を表示" />
            </SelectTrigger>
            <SelectContent>
              {songRuns.map((r, i) => (
                <SelectItem key={r.id} value={r.id}>
                  {formatDate(r.createdAt, 'yyyy/M/d HH:mm')}
                  {i === 0 ? '(最新)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      <div ref={conceptsRef} className="scroll-mt-6">
        {activeRun && (
          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              企画案(方向性の異なる3案)
            </h2>
            {activeRun.result.conversionNotes.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium">固有名詞を一般要素へ変換しました</p>
                  <ul className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
                    {activeRun.result.conversionNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <ConceptCards
              concepts={activeRun.result.concepts}
              selectedId={activeRun.result.selectedConceptId}
              onSelect={handleSelectConcept}
            />
          </div>
        )}
      </div>

      <div ref={detailRef} className="scroll-mt-6">
        {activeRun && detail && (
          <PlanDetailView
            input={activeRun.input}
            result={activeRun.result}
            detail={detail}
            song={song && activeRun.songId === song.id ? song : undefined}
            exportMeta={exportMeta}
            onShotMove={(id, dir) => patchDetail((d) => ({ ...d, shots: moveShot(d.shots, id, dir) }))}
            onShotDuplicate={(id) => {
              patchDetail((d) => ({ ...d, shots: duplicateShot(d.shots, id) }))
              toast.success('ショットを複製しました')
            }}
            onShotRemove={(id) => {
              patchDetail((d) => ({ ...d, shots: removeShot(d.shots, id) }))
              toast.success('ショットを削除しました')
            }}
            onShotRegenerate={(id) => {
              patchDetail((d) => ({
                ...d,
                shots: d.shots.map((s) =>
                  s.id === id
                    ? regenerateShot(s, selectedApproach, d.consistency, regenSeedRef.current++)
                    : s,
                ),
              }))
              toast.success('ショットを再生成しました')
            }}
            onShotReapplyConsistency={(id) => {
              patchDetail((d) => ({
                ...d,
                shots: d.shots.map((s) => (s.id === id ? reapplyConsistency(s, d.consistency) : s)),
              }))
              toast.success('一貫性設定を再反映しました')
            }}
            onShotUpdate={(id, patch, durationSec) =>
              patchDetail((d) => ({ ...d, shots: updateShot(d.shots, id, patch, durationSec) }))
            }
            onConsistencyChange={(patch) =>
              patchDetail((d) => ({ ...d, consistency: { ...d.consistency, ...patch } }))
            }
            onReapplyAllConsistency={() => {
              patchDetail((d) => ({
                ...d,
                shots: d.shots.map((s) => reapplyConsistency(s, d.consistency)),
              }))
              toast.success('全ショットへ一貫性設定を再反映しました')
            }}
            onRecordHistory={handleRecordHistory}
          />
        )}
      </div>
    </div>
  )
}
