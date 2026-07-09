import { useRef, useState } from 'react'
import { FileArchive, FileDown, FileJson, FileText, FileUp, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  exportAsJson,
  exportAsMarkdown,
  exportAsZip,
  parseBackupFile,
  resetAllData,
  restoreBackup,
  type BackupData,
} from '@/lib/backup'
import { formatDate } from '@/lib/format'
import { useSongStore } from '@/store/useSongStore'

const EXPORTS = [
  {
    icon: FileJson,
    title: 'JSONバックアップ',
    description: '全データを1ファイルに。復元にはこれを使います。',
    action: exportAsJson,
  },
  {
    icon: FileArchive,
    title: 'ZIPバックアップ',
    description: 'JSON + 曲ごとのMarkdown + 秘書画像をまとめて保存。',
    action: exportAsZip,
  },
  {
    icon: FileText,
    title: 'Markdown書き出し',
    description: '全曲の歌詞・プロンプトを読みやすい1つのMarkdownに。',
    action: exportAsMarkdown,
  },
]

export function DataPage() {
  const songCount = useSongStore((s) => s.songs.length)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupData | null>(null)
  const [restoring, setRestoring] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const backup = await parseBackupFile(file)
      setPending(backup)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '読み込みに失敗しました')
    }
  }

  const handleRestore = async () => {
    if (!pending) return
    setRestoring(true)
    try {
      await restoreBackup(pending)
    } catch {
      setRestoring(false)
      toast.error('復元に失敗しました')
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">データ管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          バックアップと復元。あなたのデータはいつでも持ち出せます。
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p>
          制作データはすべて<strong className="font-medium text-foreground">このブラウザの中だけ</strong>
          に保存されています。ブラウザの変更やPCの買い替えの前に、バックアップを保存しておきましょう。
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">エクスポート</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {EXPORTS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                void item.action().then(
                  () => toast.success('ダウンロードを開始しました'),
                  () => toast.error('エクスポートに失敗しました'),
                )
              }}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-4.5 w-4.5" />
              </span>
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FileUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">インポート(復元)</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            JSONまたはZIPのバックアップファイルから復元できます
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.zip,application/json,application/zip"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <Button
            variant="outline"
            className="mt-4 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            ファイルを選択
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">危険な操作</h2>
        </div>
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            曲・AI秘書の設定・画像などすべてのローカルデータを削除し、初めて開いた時の状態に戻します。
          </p>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" className="shrink-0 gap-1.5">
                <Trash2 className="h-4 w-4" />
                全データを削除してリセット
              </Button>
            }
            title="すべてのデータを削除しますか?"
            description={`${songCount}曲を含む、このブラウザに保存された制作データ・AI秘書の設定・画像がすべて削除されます。事前にバックアップを取っていない場合、復元できません。`}
            confirmLabel="削除してリセットする"
            onConfirm={() => {
              void resetAllData()
            }}
          />
        </div>
      </section>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>バックアップから復元しますか?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {pending?.exportedAt
                    ? `${formatDate(pending.exportedAt, 'yyyy年M月d日 HH:mm')}に作成されたバックアップ`
                    : 'バックアップ'}
                  (曲数: {pending?.songs.length ?? 0})を読み込みます。
                </p>
                <p className="font-medium text-destructive">
                  現在の全データ({songCount}曲・秘書設定を含む)は上書きされ、元に戻せません。
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={restoring}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={() => void handleRestore()} disabled={restoring}>
              {restoring ? '復元中...' : '上書きして復元する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
