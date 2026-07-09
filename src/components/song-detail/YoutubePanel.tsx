import { useEffect, useState } from 'react'
import { ExternalLink, Save } from 'lucide-react'

import { ExternalToolLink } from '@/components/ExternalToolLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EXTERNAL_TOOLS } from '@/lib/constants'
import { relativeTime } from '@/lib/format'
import { useSongStore } from '@/store/useSongStore'
import type { Song, YoutubePost } from '@/lib/types'

const REVIEW_TOOL = EXTERNAL_TOOLS.find((t) => t.key === 'review')!

function toFormState(youtube: YoutubePost) {
  return {
    url: youtube.url ?? '',
    publishedAt: youtube.publishedAt ?? '',
    title: youtube.title ?? '',
    description: youtube.description ?? '',
    tags: youtube.tags ?? '',
    memo: youtube.memo ?? '',
  }
}

export function YoutubePanel({ song }: { song: Song }) {
  const updateYoutube = useSongStore((s) => s.updateYoutube)
  const [form, setForm] = useState(() => toFormState(song.youtube))
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setForm(toFormState(song.youtube))
    setDirty(false)
  }, [song.id, song.youtube])

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleSave = () => {
    updateYoutube(song.id, {
      url: form.url.trim() || undefined,
      publishedAt: form.publishedAt || undefined,
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      tags: form.tags.trim() || undefined,
      memo: form.memo.trim() || undefined,
    })
    setDirty(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">投稿する動画の情報を下書きしておけます</p>
        <ExternalToolLink tool={REVIEW_TOOL} label="公開前に批評してもらう" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>動画URL</Label>
          <div className="flex gap-1.5">
            <Input
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            {form.url && (
              <Button variant="outline" size="icon" asChild>
                <a href={form.url} target="_blank" rel="noopener noreferrer" aria-label="YouTubeで開く">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>公開日</Label>
          <Input
            type="date"
            value={form.publishedAt}
            onChange={(e) => set('publishedAt', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>動画タイトル</Label>
        <Input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="投稿するYouTube動画のタイトル"
        />
      </div>

      <div className="grid gap-1.5">
        <Label>概要欄</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="動画の説明文..."
          className="min-h-[120px]"
        />
      </div>

      <div className="grid gap-1.5">
        <Label>タグ</Label>
        <Input
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="lofi, AI music, 作業用BGM"
        />
      </div>

      <div className="grid gap-1.5">
        <Label>メモ</Label>
        <Textarea
          value={form.memo}
          onChange={(e) => set('memo', e.target.value)}
          placeholder="サムネイル案、投稿時間の予定など"
          className="min-h-[80px]"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {song.youtube.updatedAt ? `${relativeTime(song.youtube.updatedAt)}に更新` : '未保存'}
        </p>
        <Button onClick={handleSave} disabled={!dirty} className="gap-1.5">
          <Save className="h-4 w-4" />
          変更を保存
        </Button>
      </div>
    </div>
  )
}
