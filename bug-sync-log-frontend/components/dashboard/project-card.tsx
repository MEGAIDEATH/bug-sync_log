"use client"

import Link from "next/link"
import { Bug, Users, ArrowRight } from "lucide-react"

type ProjectCardProps = {
  slug: string
  name: string
  description: string | null
  role: string
  icon: string | null
  color: string | null
}

export function ProjectCard({ slug, name, description, role, icon: _icon, color }: ProjectCardProps) {
  return (
    <Link
      href={`/project/${slug}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: color ?? "#6366f1", color: "#fff" }}
          >
            <Bug className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            {description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2 py-0.5 capitalize">
          {role}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3" />
          {slug}
        </span>
      </div>
    </Link>
  )
}