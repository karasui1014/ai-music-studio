import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ListMusic, Lock, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { AiProducerForm } from '@/components/tools/ai-producer/AiProducerForm'
import { AiProducerResultView } from '@/components/tools/ai-producer/AiProducerResultView'
import { RunComparisonView } from '@/components/tools/ai-producer/RunComparisonView'
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
  analyzeWithMock,
  regenerateSection,
  type RegenerableSection,
} from '@/lib/tools/ai-producer/analyze'
import { compareRuns } from '@/lib/tools/ai-producer/compare'
import {
  createEmptyInput,
  validateInput,
  type AiProducerInput,
  type AiProducerSongContext,
} from '@/lib/tools/ai-producer/types'
import { DEFAULT_PROVIDER_ID, getProviderMeta } from '@/lib/tools/provider'
import { useSongStore } from '@/store/useSongStore'
import { useToolRunStore } from '@/store/useToolRunStore'
import type { AiProducerRunRecord } from '@/lib/tools/types'
import type { Song } from '@/lib/types'

const NO_SONG = 'none'

function buildContext(song: Song | undefined): AiProducerSongContext {
  return {
    songId: song?.id,
    songTitle: song?.title ?? '無題の曲',
    status: song?.status,
    mvPrompt: song?.mvPrompts[0]?.prompt ?? '',
    mvPromptCount: song?.mvPrompts.length ?? 0,
    youtubeUrl: song?.youtube.url ?? '',
    youtubeTitle: song?.youtube.title ?? '',
    historyCount: song?.history.length ?? 0,
    sunoPromptCount: song?.sunoPrompts.length ?? 0,
    completed: !!song?.completedAt,
  }
}

export function AiProducerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const songs = useSongStore((s) => s.songs)
  const runs = useToolRunStore((s) => s.runs)
  const addRun = useToolRunStore((s) => s.addRun)
  const updateRun = useToolRunStore((s) => s.updateRun)

  const songId = searchParams.get('song') ?? ''
  const song = songs.find((s) => s.id === songId)
  const songKey = song?.id

  const [form, setForm] = useState<AiProducerInput>(createEmptyInput)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // 曲を選択(または読込完了)したら、曲データから自動入力する
  useEffect(() => {
    if (!song) return
    setForm((prev) => ({
      ...prev,
      lyrics: song.lyrics,
      sunoPrompt: song.sunoPrompts[0]?.stylePrompt ?? '',
      genre: song.genre ?? '',
    }))
    setActiveRunId(null)
    // songKeyの変化(未選択→選択、曲の切替)だけで自動入力する。
    // 曲の編集のたびに入力欄を上書きしないよう、songそのものには依存させない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songKey])

  const songRuns = useMemo(
    () =>
      runs.filter(
        (r): r is AiProducerRunRecord =>
          r.toolId === 'ai-producer' && !!songId && r.songId === songId,
      ),
    [runs, songId],
  )

  const activeRun = useMemo(
    () =>
      runs.find((r): r is AiProducerRunRecord => r.id === activeRunId && r.toolId === 'ai-producer'),
    [runs, activeRunId],
  )

  // 表示中の実行に「同じ曲の1つ前の実行」があれば比較を出す
  const comparison = useMemo(() => {
    if (!activeRun || !activeRun.songId) return null
    const index = songRuns.findIndex((r) => r.id === activeRun.id)
    if (index === -1 || index + 1 >= songRuns.length) return null
    return compareRuns(songRuns[index + 1], activeRun)
  }, [activeRun, songRuns])

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

  const handleAnalyze = () => {
    const validationErrors = validateInput(form)
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }
    const context = buildContext(song)
    const result = analyzeWithMock(form, context)
    const record = addRun({
      toolId: 'ai-producer',
      songId: song?.id,
      songTitle: song?.title ?? '(曲未選択)',
      provider: DEFAULT_PROVIDER_ID,
      input: form,
      result,
    })
    setActiveRunId(record.id)
    toast.success('分析が完了しました(結果は自動保存されます)')
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleRegenerate = (section: RegenerableSection) => {
    if (!activeRun) return
    const { result, input } = regenerateSection(
      activeRun.result,
      section,
      activeRun.input,
      buildContext(song),
    )
    updateRun(activeRun.id, { result, input })
    toast.success('選択した部分を再生成しました')
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
            <Wand2 className="h-5 w-5" />
          </span>
          AIプロデューサー
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          曲、歌詞、生成プロンプトを分析し、次に直すべきポイントを提案します。
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p>
          分析エンジン: <strong className="font-medium text-foreground">{provider.name}</strong>
          — {provider.description}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ListMusic className="h-4 w-4 text-primary" />
          分析する曲
        </h2>
        <Select value={songId || NO_SONG} onValueChange={handleSelectSong}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="曲を選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SONG}>曲を選ばずに手入力で分析</SelectItem>
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
            <span>Sunoプロンプト {song.sunoPrompts.length}件</span>
            <span>・MVプロンプト {song.mvPrompts.length}件</span>
            <span>・YouTube情報 {song.youtube.url || song.youtube.title ? '登録済み' : '未登録'}</span>
            <span>・制作履歴 {song.history.length}件</span>
            <span className="basis-full sm:basis-auto">
              (歌詞・最新Sunoプロンプト・ジャンルを自動入力しました)
            </span>
          </div>
        )}
        {!song && songs.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            まだ曲がありません。曲を作らなくても、下のフォームに直接入力すれば分析できます。
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <AiProducerForm value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        <div className="mt-6 flex flex-col items-start gap-2">
          <Button size="lg" className="gap-2" onClick={handleAnalyze} disabled={errors.length > 0}>
            <Wand2 className="h-4 w-4" />
            {activeRun ? '再分析する' : '分析する'}
          </Button>
          {errors.length > 0 && (
            <p className="text-xs text-muted-foreground">{errors[0]}</p>
          )}
        </div>
      </section>

      {songRuns.length > 0 && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium">この曲の過去の分析: {songRuns.length}件</p>
          <Select
            value={activeRun && activeRun.songId === songId ? activeRun.id : ''}
            onValueChange={(id) => setActiveRunId(id)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="過去の結果を表示" />
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

      <div ref={resultRef} className="scroll-mt-6">
        {activeRun && (
          <div className="flex flex-col gap-4">
            {comparison && <RunComparisonView comparison={comparison} />}
            <AiProducerResultView
              run={activeRun}
              song={song && activeRun.songId === song.id ? song : undefined}
              onReanalyze={handleAnalyze}
              onRegenerate={handleRegenerate}
            />
          </div>
        )}
      </div>
    </div>
  )
}
