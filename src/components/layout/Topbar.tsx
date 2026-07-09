import { Menu, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="メニューを開く">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold">AI Music Studio</p>
      </div>
    </header>
  )
}
