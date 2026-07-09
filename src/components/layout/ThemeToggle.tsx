import { Moon, Sun, Monitor } from 'lucide-react'

import { useTheme } from '@/hooks/useTheme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const OPTIONS = [
  { value: 'light' as const, label: 'ライト', icon: Sun },
  { value: 'dark' as const, label: 'ダーク', icon: Moon },
  { value: 'system' as const, label: 'システム', icon: Monitor },
]

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="表示テーマを切り替え"
          size={collapsed ? 'icon' : 'default'}
          className={collapsed ? '' : 'w-full justify-start gap-2 px-2.5'}
        >
          <CurrentIcon className="h-4 w-4" />
          {!collapsed && <span className="text-sm">表示テーマ</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={theme === option.value ? 'bg-accent' : ''}
          >
            <option.icon className="h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
