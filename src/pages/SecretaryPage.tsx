import { useMemo, useRef } from 'react'
import { ImageUp, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { SecretaryAvatar } from '@/components/secretary/SecretaryAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  buildSecretaryMessage,
  calcStreak,
  CHEER_STYLE_LABEL,
  SPEAKING_STYLE_LABEL,
  type CheerStyle,
  type SpeakingStyle,
} from '@/lib/secretary'
import { useSecretaryStore } from '@/store/useSecretaryStore'
import { useSongStore } from '@/store/useSongStore'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 8

export function SecretaryPage() {
  const settings = useSecretaryStore((s) => s.settings)
  const updateSettings = useSecretaryStore((s) => s.updateSettings)
  const setAvatar = useSecretaryStore((s) => s.setAvatar)
  const removeAvatar = useSecretaryStore((s) => s.removeAvatar)
  const avatarUrl = useSecretaryStore((s) => s.avatarUrl)
  const activeDays = useSecretaryStore((s) => s.activeDays)
  const celebratedMilestones = useSecretaryStore((s) => s.celebratedMilestones)
  const songs = useSongStore((s) => s.songs)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const preview = useMemo(
    () =>
      buildSecretaryMessage({
        songs,
        settings,
        streak: calcStreak(activeDays),
        celebratedMilestones,
      }),
    [songs, settings, activeDays, celebratedMilestones],
  )

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('PNG / JPG / WebP / GIF の画像を選んでください')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`画像は${MAX_SIZE_MB}MB以下にしてください`)
      return
    }
    try {
      await setAvatar(file)
      toast.success('秘書の画像を設定しました')
    } catch {
      toast.error('画像の保存に失敗しました')
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI秘書</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          あなた専属の秘書をカスタマイズできます。
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p>
          画像や設定はすべて<strong className="font-medium text-foreground">このブラウザの中だけ</strong>
          に保存されます。外部サーバーには一切送信されません。
        </p>
      </div>

      {/* preview */}
      <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <SecretaryAvatar className="h-14 w-14 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{settings.name || 'アシスタント'}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{preview.text}</p>
        </div>
      </div>

      {/* avatar */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">見た目</h2>
        <div className="flex items-center gap-4">
          <SecretaryAvatar className="h-20 w-20" />
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp className="h-4 w-4" />
              画像をアップロード
            </Button>
            {avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void removeAvatar()}
              >
                <Trash2 className="h-4 w-4" />
                画像を削除
              </Button>
            )}
            <p className="text-xs text-muted-foreground">PNG / JPG / WebP / GIF(最大{MAX_SIZE_MB}MB)</p>
          </div>
        </div>
      </section>

      {/* profile */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">プロフィール</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="sec-name">名前</Label>
            <Input
              id="sec-name"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              placeholder="例: チロル"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sec-first-person">一人称</Label>
            <Input
              id="sec-first-person"
              value={settings.firstPerson}
              onChange={(e) => updateSettings({ firstPerson: e.target.value })}
              placeholder="例: 私、ボク、わたし"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>話し方</Label>
            <Select
              value={settings.speakingStyle}
              onValueChange={(v) => updateSettings({ speakingStyle: v as SpeakingStyle })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SPEAKING_STYLE_LABEL) as SpeakingStyle[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SPEAKING_STYLE_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>応援スタイル</Label>
            <Select
              value={settings.cheerStyle}
              onValueChange={(v) => updateSettings({ cheerStyle: v as CheerStyle })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CHEER_STYLE_LABEL) as CheerStyle[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {CHEER_STYLE_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="sec-catchphrase">口癖(任意)</Label>
            <Input
              id="sec-catchphrase"
              value={settings.catchphrase}
              onChange={(e) => updateSettings({ catchphrase: e.target.value })}
              placeholder="例: 今日もマイペースにいきましょう🎵"
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="sec-personality">性格メモ(任意)</Label>
            <Textarea
              id="sec-personality"
              value={settings.personality}
              onChange={(e) => updateSettings({ personality: e.target.value })}
              placeholder="例: 元気でフレンドリー。落ち込んでいる時はそっと寄り添ってくれる。"
              className="min-h-[70px]"
            />
            <p className="text-xs text-muted-foreground">
              あなたの中のキャラクター設定として自由に書いておけます。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
