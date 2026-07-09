import { ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ExternalTool } from '@/lib/constants'

export function ExternalToolLink({ tool, label }: { tool: ExternalTool; label?: string }) {
  return (
    <Button variant="outline" size="sm" className="gap-1.5" asChild>
      <a href={tool.url} target="_blank" rel="noopener noreferrer">
        <tool.icon className="h-3.5 w-3.5" />
        {label ?? tool.name}
        <ExternalLink className="h-3 w-3 opacity-50" />
      </a>
    </Button>
  )
}

export function ExternalToolCard({ tool }: { tool: ExternalTool }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <tool.icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-medium group-hover:text-primary">
          {tool.name}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{tool.description}</span>
      </span>
    </a>
  )
}
