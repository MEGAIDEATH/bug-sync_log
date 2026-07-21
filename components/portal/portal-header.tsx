"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bug, PenLine, LayoutGrid, ListChecks } from "lucide-react"

export type PortalTab = "issues" | "report" | "mine"

const TABS: { id: PortalTab; label: string; icon: typeof Bug }[] = [
  { id: "issues", label: "Known Issues", icon: LayoutGrid },
  { id: "report", label: "Report a Bug", icon: PenLine },
  { id: "mine", label: "My Reports", icon: ListChecks },
]

export function PortalHeader({
  active,
  onSelect,
  myCount,
}: {
  active: PortalTab
  onSelect: (t: PortalTab) => void
  myCount: number
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onSelect("issues")}
          className="flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bug className="size-5" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-bold leading-tight text-foreground">BugSync</span>
            <span className="block text-xs text-muted-foreground">Help Center</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/60 p-1 sm:flex">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = active === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t.label}
                {t.id === "mine" && myCount > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                      isActive ? "bg-primary-foreground/20" : "bg-secondary text-foreground",
                    )}
                  >
                    {myCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button onClick={() => onSelect("report")} className="gap-1.5">
            <PenLine className="size-4" />
            <span className="hidden sm:inline">Report a Bug</span>
            <span className="sm:hidden">Report</span>
          </Button>
          <Link
            href="/"
            className="hidden rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Team view →
          </Link>
        </div>
      </div>

      {/* Mobile tab bar */}
      <nav className="flex items-center gap-1 border-t border-border/70 px-2 py-1.5 sm:hidden">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
