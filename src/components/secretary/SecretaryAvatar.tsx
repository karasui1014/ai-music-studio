import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useSecretaryStore } from '@/store/useSecretaryStore'

export function SecretaryAvatar({ className }: { className?: string }) {
  const avatarUrl = useSecretaryStore((s) => s.avatarUrl)
  const name = useSecretaryStore((s) => s.settings.name)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-2xl object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-suno/80 text-primary-foreground',
        className,
      )}
      aria-label={name}
    >
      <Sparkles className="h-1/2 w-1/2" />
    </div>
  )
}
