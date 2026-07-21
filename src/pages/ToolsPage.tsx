import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'

import { EXTERNAL_TOOLS } from '@/lib/constants'
import { STUDIO_TOOLS } from '@/lib/tools/registry'

export function ToolsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">制作ツール</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          スタジオ内蔵のツールと、姉妹サイトの外部ツールをここから開けます。
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">スタジオ内蔵ツール</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {STUDIO_TOOLS.map((tool) =>
            tool.available ? (
              <Link
                key={tool.id}
                to={tool.route}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <tool.icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-medium group-hover:text-primary">
                    {tool.name}
                    {tool.badge && (
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        {tool.badge}
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{tool.description}</span>
                </span>
              </Link>
            ) : (
              <div
                key={tool.id}
                className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-4 opacity-70"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <tool.icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="font-medium">{tool.name}(準備中)</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{tool.description}</span>
                </span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">外部ツール(別タブで開きます)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {EXTERNAL_TOOLS.map((tool) => (
            <a
              key={tool.key}
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
          ))}
        </div>
      </section>
    </div>
  )
}
