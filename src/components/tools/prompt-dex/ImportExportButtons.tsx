import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { buildExport, parseImport } from '@/lib/tools/prompt-dex/repository'
import { usePromptDexStore } from '@/store/usePromptDexStore'

function download(text: string, filename: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 自分用プロンプトのJSON書き出し / 読み込み */
export function ImportExportButtons() {
  const userEntries = usePromptDexStore((s) => s.userEntries)
  const favorites = usePromptDexStore((s) => s.favorites)
  const importEntries = usePromptDexStore((s) => s.importEntries)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    if (userEntries.length === 0) {
      toast.error('書き出せる自分用プロンプトがありません')
      return
    }
    const data = buildExport(userEntries, favorites)
    download(JSON.stringify(data, null, 2), `prompt-dex-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('JSONを書き出しました')
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const entries = parseImport(text)
      const added = importEntries(entries)
      if (added === 0) {
        toast.info('新しく取り込めるプロンプトはありませんでした(重複を除外)')
      } else {
        toast.success(`${added}件のプロンプトを取り込みました`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '読み込みに失敗しました')
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
        <Download className="h-3.5 w-3.5" />
        JSON書き出し
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" />
        JSON読み込み
      </Button>
    </div>
  )
}
