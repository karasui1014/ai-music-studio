import { Link } from 'react-router-dom'
import { Library, Music2, Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyButton } from '@/components/CopyButton'
import { EmptyState } from '@/components/EmptyState'
import { ExternalToolLink } from '@/components/ExternalToolLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EXTERNAL_TOOLS } from '@/lib/constants'
import { relativeTime } from '@/lib/format'
import { useSongStore } from '@/store/useSongStore'
import { SunoPromptDialog } from './SunoPromptDialog'
import type { Song } from '@/lib/types'

const STYLE_PROMPT_TOOL = EXTERNAL_TOOLS.find((t) => t.key === 'stylePrompt')!
const MASTERING_TOOL = EXTERNAL_TOOLS.find((t) => t.key === 'mastering')!

export function SunoPromptsPanel({ song }: { song: Song }) {
  const removeSunoPrompt = useSongStore((s) => s.removeSunoPrompt)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sunoに貼り付けるスタイルプロンプトをバージョン管理できます
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link to={`/tools/prompt-dex?song=${song.id}`}>
              <Library className="h-3.5 w-3.5" />
              プロンプト図鑑
            </Link>
          </Button>
          <ExternalToolLink tool={STYLE_PROMPT_TOOL} label="プロンプト工房" />
          <ExternalToolLink tool={MASTERING_TOOL} label="マスタリング" />
          <SunoPromptDialog
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

      {song.sunoPrompts.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="Sunoプロンプトがまだありません"
          description="スタイルプロンプトや除外スタイルを保存して、次回の生成にすぐ使えるようにしましょう。"
          action={
            <SunoPromptDialog
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
          {song.sunoPrompts.map((prompt) => (
            <div key={prompt.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{prompt.title}</p>
                  {prompt.version && <Badge variant="suno">{prompt.version}</Badge>}
                </div>
                <div className="flex items-center gap-1.5">
                  <CopyButton text={prompt.stylePrompt} label="プロンプトをコピー" />
                  <SunoPromptDialog
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
                    onConfirm={() => removeSunoPrompt(song.id, prompt.id)}
                  />
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-sm">
                {prompt.stylePrompt || '(スタイルプロンプト未入力)'}
              </p>

              {prompt.excludeStyles && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground">除外スタイル</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
                    {prompt.excludeStyles}
                  </p>
                </div>
              )}

              {prompt.memo && <p className="mt-2 text-sm text-muted-foreground">{prompt.memo}</p>}

              <p className="mt-3 text-xs text-muted-foreground">{relativeTime(prompt.updatedAt)}に更新</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
