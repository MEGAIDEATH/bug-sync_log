"use client"

import { useState } from "react"
import { ArrowBigUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function UpvoteButton({
  count,
  onUpvote,
  className,
}: {
  count: number
  onUpvote?: () => void
  className?: string
}) {
  const [bump, setBump] = useState(false)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onUpvote?.()
        setBump(true)
        window.setTimeout(() => setBump(false), 250)
      }}
      className={cn(
        "group inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary/60 hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      aria-label={`Upvote, currently ${count}`}
    >
      <ArrowBigUp
        className={cn(
          "size-4 transition-transform group-hover:text-primary",
          bump && "-translate-y-0.5 scale-125 text-primary",
        )}
      />
      <span className={cn("tabular-nums transition-transform", bump && "scale-110")}>
        +{count}
      </span>
    </button>
  )
}
