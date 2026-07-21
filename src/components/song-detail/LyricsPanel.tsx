import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { NotebookPen } from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ExternalToolLink } from '@/components/ExternalToolLink'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EXTERNAL_TOOLS } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import { useSongStore } from '@/store/useSongStore'
import type { Song } from '@/lib/types'

const SUBTITLE_TOOL = EXTERNAL_TOOLS.find((t) => t.key === 'subtitle')!

const TAGS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro']

export function LyricsPanel({ song }: { song: Song }) {
  const updateLyrics = useSongStore((s) => s.updateLyrics)
  const restoreLyricsVersion = useSongStore((s) => s.restoreLyricsVersion)
  const removeLyricsVersion = useSongStore((s) => s.removeLyricsVersion)
  const [text, setText] = useState(song.lyrics)
  const textRef = useRef(text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  textRef.current = text

  useEffect(() => {
    setText(song.lyrics)
  }, [song.id, song.lyrics])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (textRef.current !== song.lyrics) {
        updateLyrics(song.id, textRef.current)
      }
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, song.id])

  const flush = () => {
    if (textRef.current !== song.lyrics) {
      updateLyrics(song.id, textRef.current)
    }
  }

  const insertTag = (tag: string) => {
    const el = textareaRef.current
    const current = textRef.current
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const prefix = start > 0 && current[start - 1] !== '\n' ? '\n' : ''
    const insertion = `${prefix}[${tag}]\n`
    const next = current.slice(0, start) + insertion + current.slice(end)
    setText(next)
    updateLyrics(song.id, next)
    requestAnimationFrame(() => {
      el?.focus()
      const pos = start + insertion.length
      el?.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Sunoで使えるセクションタグを挿入
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertTag(tag)}
            >
              [{tag}]
            </Button>
          ))}
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={flush}
        placeholder={'[Verse]\n歌詞をここに書いていきましょう...\n\n[Chorus]\n...'}
        className="min-h-[420px] resize-y font-mono text-sm leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {text.length}文字 ・ {text.split('\n').length}行
        </p>
        <ExternalToolLink tool={SUBTITLE_TOOL} label="字幕を作る" />
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">この歌詞をAIで添削する</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              歌詞添削AI(ベータ)が歌いやすさ・サビ・情景を行単位で提案します。歌詞は自動で読み込まれます。
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-1.5">
            <Link to={`/tools/lyrics-review?song=${song.id}`}>
              <NotebookPen className="h-4 w-4" />
              歌詞添削AIを開く
            </Link>
          </Button>
        </div>
      </div>

      {(song.lyricsVersions?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            歌詞バージョン(候補) {song.lyricsVersions!.length}件
          </p>
          <div className="flex flex-col gap-2">
            {song.lyricsVersions!.map((version) => (
              <div
                key={version.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 sm:flex-nowrap sm:gap-3"
              >
                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <p className="text-sm font-medium">{version.label}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatDate(version.createdAt, 'yyyy/M/d HH:mm')} ・ {version.lyrics.length}文字 ・{' '}
                    {version.lyrics.split('\n').find((l) => l.trim()) ?? '(空)'}
                  </p>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline" className="shrink-0">
                      この版に戻す
                    </Button>
                  }
                  title={`歌詞を「${version.label}」に戻しますか?`}
                  description="今の歌詞は「復元前の歌詞」として候補に退避されるので、いつでも戻せます。"
                  confirmLabel="この版に戻す"
                  onConfirm={() => restoreLyricsVersion(song.id, version.id)}
                />
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground">
                      削除
                    </Button>
                  }
                  title={`バージョン「${version.label}」を削除しますか?`}
                  description="この歌詞候補を削除します(今の歌詞には影響しません)。"
                  onConfirm={() => removeLyricsVersion(song.id, version.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
