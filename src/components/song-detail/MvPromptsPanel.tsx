import { Clapperboard, Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyButton } from '@/components/CopyButton'
import { EmptyState } from '@/components/EmptyState'
import { ExternalToolLink } from '@/components/ExternalToolLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EXTERNAL_TOOLS } from '@/lib/constants'
import { relativeTime } from '@/lib/format'
import { useSongStore } from '@/store/useSongStore'
import { MvPromptDialog } from './MvPromptDialog'
import type { Song } from '@/lib/types'

const STORYBOARD_TOOL = EXTERNAL_TOOLS.find((t) => t.key === 'storyboard')!
const SUBTITLE_TOOL = EXTERNAL_TOOLS.find((t) => t.key === 'subtitle')!

export function MvPromptsPanel({ song }: { song: Song }) {
  const removeMvPrompt = useSongStore((s) => s.removeMvPrompt)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          MV生成AIに渡す映像プロンプトを保存しておけます
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <ExternalToolLink tool={STORYBOARD_TOOL} label="絵コンテ" />
          <ExternalToolLink tool={SUBTITLE_TOOL} label="字幕" />
          <MvPromptDialog
            songId={song.id}
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                追加
              </Button>
            }
          />
        </div>
      </div>

      {song.mvPrompts.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="MVプロンプトがまだありません"
          description="使用ツールや映像イメージのプロンプトを保存して、制作の一貫性を保ちましょう。"
          action={
            <MvPromptDialog
              songId={song.id}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  最初のプロンプトを追加
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid gap-3">
          {song.mvPrompts.map((prompt) => (
            <div key={prompt.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{prompt.title}</p>
                  {prompt.tool && <Badge variant="mv">{prompt.tool}</Badge>}
                </div>
                <div className="flex items-center gap-1.5">
                  <CopyButton text={prompt.prompt} label="プロンプトをコピー" />
                  <MvPromptDialog
                    songId={song.id}
                    prompt={prompt}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="編集">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                    title={`「${prompt.title}」を削除しますか?`}
                    onConfirm={() => removeMvPrompt(song.id, prompt.id)}
                  />
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-sm">
                {prompt.prompt || '(プロンプト未入力)'}
              </p>

              {prompt.memo && <p className="mt-2 text-sm text-muted-foreground">{prompt.memo}</p>}

              <p className="mt-3 text-xs text-muted-foreground">{relativeTime(prompt.updatedAt)}に更新</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
