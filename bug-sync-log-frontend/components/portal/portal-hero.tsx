"use client"

import { Search, ShieldCheck } from "lucide-react"

export function PortalHero({
  query,
  onQueryChange,
  openCount,
  fixedCount,
}: {
  query: string
  onQueryChange: (q: string) => void
  openCount: number
  fixedCount: number
}) {
  return (
    <section className="border-b border-border/70 bg-card/30">
      <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-chart-4/40 bg-chart-4/10 px-3 py-1 text-xs font-semibold text-chart-4">
          <ShieldCheck className="size-3.5" />
          All systems operational
        </span>

        <h1 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          Found something broken? Let&apos;s fix it together.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          Search known issues before reporting, add your vote to problems that affect you, and
          follow every fix from report to release.
        </p>

        <div className="mx-auto mt-7 flex max-w-xl items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search issues, e.g. “checkout error” or “login”…"
              className="h-12 w-full rounded-full border border-input bg-background pl-12 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-semibold tabular-nums text-foreground">{openCount}</span> open
            issues
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full bg-chart-4" />
            <span className="font-semibold tabular-nums text-foreground">{fixedCount}</span> fixed
            recently
          </span>
        </div>
      </div>
    </section>
  )
}
