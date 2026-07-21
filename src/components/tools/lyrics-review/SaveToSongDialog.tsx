import { useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useSongStore } from '@/store/useSongStore'
import type { Song } from '@/lib/types'

type SaveChoice = 'candidate' | 'replace'

/**
 * 修正版を曲へ保存する前の確認画面。
 * 現在の歌詞と反映後を必ず見比べてから保存する(自動上書きしない)。
 */
export function SaveToSongDialog({ song, finalLyrics }: { song: Song; finalLyrics: string }) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<SaveChoice>('candidate')
  const addLyricsVersion = useSongStore((s) => s.addLyricsVersion)
  const updateLyrics = useSongStore((s) => s.updateLyrics)
  const addToolHistory = useSongStore((s) => s.addToolHistory)

  const handleSave = () => {
    if (choice === 'candidate') {
      addLyricsVersion(song.id, {
        label: '歌詞添削AI 修正版',
        lyrics: finalLyrics,
        source: 'lyrics-review',
      })
      addToolHistory(song.id, '歌詞添削AI: 修正版を歌詞候補として保存しました')
      toast.success('修正版を歌詞候補として保存しました(今の歌詞はそのままです)')
    } else {
      addLyricsVersion(song.id, {
        label: '添削前の歌詞(原文)',
        lyrics: song.lyrics,
        source: 'lyrics-review',
      })
      updateLyrics(song.id, finalLyrics)
      addToolHistory(song.id, '歌詞添削AI: 修正版で歌詞を置き換えました(添削前の歌詞は候補に保存)')
      toast.success('歌詞を置き換えました(添削前の歌詞は候補に残っています)')
    }
    setOpen(false)
  }

  const unchanged = song.lyrics === finalLyrics

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Save className="h-4 w-4" />
          曲「{song.title}」へ保存...
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>最終版を曲へ保存</DialogTitle>
          <DialogDescription>
            保存方法を選び、下の比較を確認してから保存してください。どちらの方法でも既存の歌詞が失われることはありません。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setChoice('candidate')}
            className={cn(
              'rounded-xl border p-3 text-left transition-colors',
              choice === 'candidate' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/40',
            )}
          >
            <p className="text-sm font-medium">歌詞候補として保存</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              今の歌詞はそのまま。修正版を「歌詞バージョン」に追加します。
            </p>
          </button>
          <button
            type="button"
            onClick={() => setChoice('replace')}
            className={cn(
              'rounded-xl border p-3 text-left transition-colors',
              choice === 'replace' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/40',
            )}
          >
            <p className="text-sm font-medium">現在の歌詞と置き換える</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              歌詞を修正版にします。添削前の歌詞は自動で候補に退避され、いつでも戻せます。
            </p>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">現在の歌詞</p>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
              {song.lyrics || '(歌詞は未入力です)'}
            </pre>
          </div>
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              {choice === 'replace' ? '置き換え後の歌詞' : '候補として追加される修正版'}
            </p>
            <pre
              className={cn(
                'max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border p-3 font-mono text-xs leading-relaxed',
                choice === 'replace'
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-border bg-muted/40',
              )}
            >
              {finalLyrics}
            </pre>
          </div>
        </div>

        {unchanged && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            最終版が現在の歌詞と同じ内容です。行を採用してから保存すると変更が反映されます。
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            {choice === 'candidate' ? '候補として保存する' : '置き換えて保存する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
