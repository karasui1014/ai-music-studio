import { NavLink } from 'react-router-dom'
import { Bot, Database, ExternalLink, LayoutDashboard, ListMusic, Sparkles, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { NewSongDialog } from '@/components/songs/NewSongDialog'
import { Button } from '@/components/ui/button'
import { EXTERNAL_TOOLS } from '@/lib/constants'

const NAV_ITEMS = [
  { to: '/', label: 'ダッシュボード', icon: LayoutDashboard, end: true },
  { to: '/songs', label: '曲一覧', icon: ListMusic, end: false },
  { to: '/secretary', label: 'AI秘書', icon: Bot, end: false },
  { to: '/data', label: 'データ管理', icon: Database, end: false },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">AI Music Studio</p>
              <p className="text-[11px] text-muted-foreground">制作OS</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="メニューを閉じる"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-3">
          <NewSongDialog />
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-3 scrollbar-thin">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          <p className="mt-6 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
            制作ツール
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {EXTERNAL_TOOLS.map((tool) => (
              <a
                key={tool.key}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <tool.icon className="h-4 w-4" />
                <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
              </a>
            ))}
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <ThemeToggle />
          <p className="mt-2 px-2.5 text-[10.5px] leading-snug text-muted-foreground/70">
            制作データは端末内のみに保存。第三者への無断譲渡・再配布は禁止します。
          </p>
        </div>
      </aside>
    </>
  )
}
