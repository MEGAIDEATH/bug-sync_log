import { cn } from "@/lib/utils"

const COLORS = [
  "bg-chart-1/25 text-chart-1",
  "bg-chart-2/25 text-chart-2",
  "bg-chart-3/25 text-chart-3",
  "bg-chart-4/25 text-chart-4",
  "bg-primary/25 text-primary",
]

function hashIndex(seed: string, mod: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h) % mod
}

export function Avatar({
  initials,
  name,
  size = "md",
  className,
}: {
  initials: string
  name?: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizes = {
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
  }
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        COLORS[hashIndex(initials, COLORS.length)],
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
    </span>
  )
}
