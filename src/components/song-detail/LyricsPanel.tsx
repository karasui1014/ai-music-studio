import { useEffect, useRef, useState } from 'react'

import { ExternalToolLink } from '@/components/ExternalToolLink'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EXTERNAL_TOOLS } from '@/lib/constants'
import { useSongStore } from '@/store/useSongStore'
import type { Song } from '@/lib/types'

const SUBTITLE_TOOL = EXTERNAL_TOOLS.find((t) => t.key === 'subtitle')!

const TAGS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro']

export function LyricsPanel({ song }: { song: Song }) {
  const updateLyrics = useSongStore((s) => s.updateLyrics)
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
    </div>
  )
}
