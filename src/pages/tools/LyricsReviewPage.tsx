import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FlaskConical, ListMusic, Lock, NotebookPen, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { LyricsReviewForm } from '@/components/tools/lyrics-review/LyricsReviewForm'
import { LyricsReviewResultView } from '@/components/tools/lyrics-review/LyricsReviewResultView'
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
import { regenerateLineSuggestion, reviewLyrics } from '@/lib/tools/lyrics-review/analyze'
import { setDecision } from '@/lib/tools/lyrics-review/apply'
import { createSampleInput } from '@/lib/tools/lyrics-review/sample'
import {
  createEmptyInput,
  validateInput,
  validateResult,
  type LyricsReviewInput,
  type LyricsReviewSongContext,
} from '@/lib/tools/lyrics-review/types'
import { DEFAULT_PROVIDER_ID, getProviderMeta } from '@/lib/tools/provider'
import { useSongStore } from '@/store/useSongStore'
import { useToolRunStore } from '@/store/useToolRunStore'
import type { LyricsReviewRunRecord } from '@/lib/tools/types'
import type { Song } from '@/lib/types'

const NO_SONG = 'none'

function buildContext(song: Song | undefined): LyricsReviewSongContext {
  return {
    songId: song?.id,
    songTitle: song?.title ?? '(曲未選択)',
    status: song?.status,
    sunoPrompt: song?.sunoPrompts[0]?.stylePrompt ?? '',
    mvPrompt: song?.mvPrompts[0]?.prompt ?? '',
    historyCount: song?.history.length ?? 0,
    completed: !!song?.completedAt,
  }
}

export function LyricsReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const songs = useSongStore((s) => s.songs)
  const updateLyrics = useSongStore((s) => s.updateLyrics)
  const addToolHistory = useSongStore((s) => s.addToolHistory)
  const runs = useToolRunStore((s) => s.runs)
  const addRun = useToolRunStore((s) => s.addRun)
  const updateRun = useToolRunStore((s) => s.updateRun)

  const songId = searchParams.get('song') ?? ''
  const song = songs.find((s) => s.id === songId)
  const songKey = song?.id

  const [form, setForm] = useState<LyricsReviewInput>(createEmptyInput)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // 曲を選択(または読込完了)したら、曲データから自動入力する
  useEffect(() => {
    if (!song) return
    setForm((prev) => ({
      ...prev,
      lyrics: song.lyrics,
      genre: song.genre ?? '',
    }))
    setActiveRunId(null)
    // 曲の編集のたびに入力欄を上書きしないよう、songそのものには依存させない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songKey])

  // 過去の添削(曲を選んでいる時はその曲の分、未選択時は曲なし実行の分)
  const pastRuns = useMemo(
    () =>
      runs.filter(
        (r): r is LyricsReviewRunRecord =>
          r.toolId === 'lyrics-review' && (songId ? r.songId === songId : !r.songId),
      ),
    [runs, songId],
  )

  const activeRun = useMemo(
    () =>
      runs.find(
        (r): r is LyricsReviewRunRecord => r.id === activeRunId && r.toolId === 'lyrics-review',
      ),
    [runs, activeRunId],
  )

  const errors = validateInput(form)
  const provider = getProviderMeta(DEFAULT_PROVIDER_ID)

  const handleSelectSong = (value: string) => {
    if (value === NO_SONG) {
      setSearchParams({}, { replace: true })
      setActiveRunId(null)
    } else {
      setSearchParams({ song: value }, { replace: true })
    }
  }

  const handleLoadSample = () => {
    setForm(createSampleInput())
    setActiveRunId(null)
    toast.success('サンプル歌詞を読み込みました(モック結果の確認用です)')
  }

  const handleReview = () => {
    const validationErrors = validateInput(form)
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }
    const result = reviewLyrics(form, buildContext(song), DEFAULT_PROVIDER_ID)
    const schemaErrors = validateResult(result)
    if (schemaErrors.length > 0) {
      toast.error(`結果の検証に失敗しました: ${schemaErrors[0]}`)
      return
    }
    const record = addRun({
      toolId: 'lyrics-review',
      songId: song?.id,
      songTitle: song?.title ?? '(曲未選択)',
      provider: DEFAULT_PROVIDER_ID,
      input: form,
      result,
      decisions: [],
    })
    setActiveRunId(record.id)
    toast.success('添削が完了しました(結果は自動保存されます)')
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // --- 採用/却下まわり(実行履歴に永続化する) ---
  // 連続操作でも取りこぼさないよう、レンダー時のスナップショットではなく
  // 必ずストアの最新状態を読んでから更新する。
  const readActiveRun = (): LyricsReviewRunRecord | undefined =>
    useToolRunStore
      .getState()
      .runs.find(
        (r): r is LyricsReviewRunRecord => r.id === activeRunId && r.toolId === 'lyrics-review',
      )

  const handleDecide = (
    suggestionId: string,
    status: 'adopted' | 'rejected',
    chosenText?: string,
  ) => {
    const run = readActiveRun()
    if (!run) return
    const next = setDecision(run.decisions, { suggestionId, status, chosenText })
    updateRun(run.id, { decisions: next })
  }

  const handleResetDecision = (suggestionId: string) => {
    const run = readActiveRun()
    if (!run) return
    updateRun(run.id, {
      decisions: run.decisions.filter((d) => d.suggestionId !== suggestionId),
    })
  }

  const handleAdoptAll = () => {
    const run = readActiveRun()
    if (!run) return
    const next = run.result.lineSuggestions.map((s) => {
      const existing = run.decisions.find((d) => d.suggestionId === s.id)
      return existing?.status === 'adopted'
        ? existing
        : { suggestionId: s.id, status: 'adopted' as const }
    })
    updateRun(run.id, { decisions: next })
  }

  const handleRejectAll = () => {
    const run = readActiveRun()
    if (!run) return
    updateRun(run.id, {
      decisions: run.result.lineSuggestions.map((s) => ({
        suggestionId: s.id,
        status: 'rejected' as const,
      })),
    })
  }

  const handleRegenerateLine = (suggestionId: string) => {
    const run = readActiveRun()
    if (!run) return
    const result = regenerateLineSuggestion(run.result, suggestionId, run.input)
    updateRun(run.id, {
      result,
      // 再生成した行の採用状態はリセットする(中身が変わったため)
      decisions: run.decisions.filter((d) => d.suggestionId !== suggestionId),
    })
    toast.success('この行の候補を作り直しました')
  }

  const handleRestoreOriginal = () => {
    const run = readActiveRun()
    if (!run || !song) return
    updateLyrics(song.id, run.input.lyrics)
    addToolHistory(song.id, '歌詞添削AI: 歌詞を添削前の原文に戻しました')
    toast.success('歌詞を添削前の原文に戻しました')
  }

  const statusMeta = song ? STATUS_META[song.status] : null

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
            <NotebookPen className="h-5 w-5" />
          </span>
          歌詞添削AI
          <Badge
            variant="outline"
            className="border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400"
          >
            ベータ
          </Badge>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          保存済みの歌詞を読み込み、作者の意図を残したまま「歌いやすさ・リズム・サビ・情景・独自性」を行単位で添削します。
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p>
          添削エンジン: <strong className="font-medium text-foreground">{provider.name}</strong> —{' '}
          {provider.description} 特定の存命アーティストの作風の再現には対応していません。
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ListMusic className="h-4 w-4 text-primary" />
          添削する曲
        </h2>
        <Select value={songId || NO_SONG} onValueChange={handleSelectSong}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="曲を選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SONG}>曲を選ばずに歌詞だけ添削</SelectItem>
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
            <span>歌詞 {song.lyrics.trim() ? `${song.lyrics.length}文字` : '未入力'}</span>
            <span>・Sunoプロンプト {song.sunoPrompts.length}件</span>
            <span>・MVプロンプト {song.mvPrompts.length}件</span>
            <span>・制作履歴 {song.history.length}件</span>
            <span className="basis-full sm:basis-auto">(歌詞とジャンルを自動入力しました)</span>
          </div>
        )}
        {!song && songs.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            まだ曲がありません。曲を作らなくても、下のフォームに歌詞を直接貼れば添削できます。
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">添削の入力</h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={handleLoadSample}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            サンプル歌詞で試す
          </Button>
        </div>
        <LyricsReviewForm value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        <div className="mt-6 flex flex-col items-start gap-2">
          <Button size="lg" className="gap-2" onClick={handleReview} disabled={errors.length > 0}>
            <Sparkles className="h-4 w-4" />
            {activeRun ? 'もう一度添削する' : '添削する'}
          </Button>
          {errors.length > 0 && <p className="text-xs text-muted-foreground">{errors[0]}</p>}
        </div>
      </section>

      {pastRuns.length > 0 && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium">
            {song ? 'この曲の過去の添削' : '過去の添削(曲なし)'}: {pastRuns.length}件
          </p>
          <Select
            value={activeRun && pastRuns.some((r) => r.id === activeRun.id) ? activeRun.id : ''}
            onValueChange={(id) => setActiveRunId(id)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="過去の結果を表示" />
            </SelectTrigger>
            <SelectContent>
              {pastRuns.map((r, i) => (
                <SelectItem key={r.id} value={r.id}>
                  {formatDate(r.createdAt, 'yyyy/M/d HH:mm')}
                  {i === 0 ? '(最新)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      <div ref={resultRef} className="scroll-mt-6">
        {activeRun && (
          <LyricsReviewResultView
            run={activeRun}
            song={song && activeRun.songId === song.id ? song : undefined}
            onDecide={handleDecide}
            onResetDecision={handleResetDecision}
            onAdoptAll={handleAdoptAll}
            onRejectAll={handleRejectAll}
            onRegenerateLine={handleRegenerateLine}
            onRestoreOriginal={handleRestoreOriginal}
          />
        )}
      </div>
    </div>
  )
}
