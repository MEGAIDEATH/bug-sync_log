"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bug, ArrowLeft, LayoutGrid, Settings, LogOut } from "lucide-react"
import { hasPermission } from "@/lib/permissions/config"

type ProjectNavProps = {
  project: { slug: string; name: string; color: string }
  user: { name: string; email: string }
  role: string
}

export function ProjectNav({ project, user, role }: ProjectNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isHelpCenter = pathname === `/project/${project.slug}`
  const isBoard = pathname === `/project/${project.slug}/board`
  const isSettings = pathname === `/project/${project.slug}/settings`
  const canViewBoard = hasPermission(role, "bug.view")
  const canViewSettings = hasPermission(role, "project.settings.view")

  const handleSignOut = async () => {
    await signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: project.color, color: "#fff" }}
          >
            <Bug className="size-4" />
          </div>
          <span className="text-sm font-bold">{project.name}</span>
        </div>

        <nav className="flex items-center gap-1">
          {/* Help Center link — visible to all members */}
          <Link
            href={`/project/${project.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              isHelpCenter
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-4" />
            <span className="hidden sm:inline">Help Center</span>
          </Link>

          {/* Board link — developers and admins */}
          {canViewBoard && (
            <Link
              href={`/project/${project.slug}/board`}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isBoard
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Board</span>
            </Link>
          )}

          {/* Settings link — admins only */}
          {canViewSettings && (
            <Link
              href={`/project/${project.slug}/settings`}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isSettings
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="size-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          )}

          <div className="ml-2 flex items-center gap-2 border-l border-border pl-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.name}</span>
            <Button variant="ghost" size="xs" onClick={handleSignOut}>
              <LogOut className="size-3" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}