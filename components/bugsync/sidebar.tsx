"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Bug, KanbanSquare, SplitSquareHorizontal, Inbox, LifeBuoy, ArrowUpRight } from "lucide-react"

export type ScreenId = "triage" | "planning" | "kanban"

const NAV: { id: ScreenId; label: string; sub: string; icon: typeof Bug }[] = [
  { id: "triage", label: "Bug Triage", sub: "Main dashboard", icon: Inbox },
  { id: "planning", label: "Sprint Planning", sub: "Split-screen", icon: SplitSquareHorizontal },
  { id: "kanban", label: "Active Sprint Kanban", sub: "Execution board", icon: KanbanSquare },
]

export function Sidebar({
  active,
  onSelect,
  triageCount,
  sprintCount,
}: {
  active: ScreenId
  onSelect: (id: ScreenId) => void
  triageCount: number
  sprintCount: number
}) {
  const counts: Record<ScreenId, number> = {
    triage: triageCount,
    planning: triageCount,
    kanban: sprintCount,
  }

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:w-64">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bug className="size-5" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-bold leading-tight text-sidebar-foreground">BugSync Log</p>
          <p className="text-xs text-muted-foreground">Bug-first workspace</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md md:size-8",
                  isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                )}
              >
                <Icon className="size-4.5 md:size-4" />
              </span>
              <span className="hidden flex-1 md:block">
                <span className="block text-sm font-medium leading-tight">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.sub}</span>
              </span>
              <span
                className={cn(
                  "hidden min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold md:inline-block",
                  isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
                )}
              >
                {counts[item.id]}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2 md:p-3">
        <Link
          href="/portal"
          className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground md:size-8">
            <LifeBuoy className="size-4.5 md:size-4" />
          </span>
          <span className="hidden flex-1 md:block">
            <span className="block text-sm font-medium leading-tight">Customer Portal</span>
            <span className="block text-xs text-muted-foreground">Public help center</span>
          </span>
          <ArrowUpRight className="hidden size-4 text-muted-foreground md:block" />
        </Link>
        <p className="mt-2 hidden text-pretty px-1 text-xs leading-relaxed text-muted-foreground md:block">
          Triage fast, commit deliberately, ship calmly.
        </p>
      </div>
    </aside>
  )
}
