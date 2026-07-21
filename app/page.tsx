import { getSessionUser } from "@/lib/rbac"
import { getMyProjects, getMyInvitations } from "@/app/actions/projects"
import { db } from "@/lib/db"
import { bug } from "@/lib/db/schema"
import { eq, desc, and, inArray, sql } from "drizzle-orm"
import { ProjectCard } from "@/components/dashboard/project-card"
import { InvitationCard } from "@/components/dashboard/invitation-card"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { Bug, FolderOpen, Inbox, Activity, BarChart3 } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  const projects = await getMyProjects()
  const invitations = await getMyInvitations()

  let totalBugs = 0
  let assignedBugs: { id: number; ref: string; title: string; status: string; priority: string; projectSlug: string; projectName: string }[] = []
  let recentBugs: { id: number; ref: string; title: string; status: string; projectSlug: string; projectName: string; createdAt: Date }[] = []

  if (projects.length > 0) {
    const projectIds = projects.map((p) => p.id)

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bug)
      .where(inArray(bug.projectId, projectIds))
    totalBugs = countResult?.count ?? 0

    const assigned = await db
      .select({
        id: bug.id,
        ref: bug.ref,
        title: bug.title,
        status: bug.status,
        priority: bug.priority,
        projectId: bug.projectId,
        createdAt: bug.createdAt,
      })
      .from(bug)
      .where(
        and(
          inArray(bug.projectId, projectIds),
          eq(bug.assigneeId, user.id),
        ),
      )
      .orderBy(desc(bug.createdAt))
      .limit(10)

    const projectById = new Map(projects.map((p) => [p.id, p]))
    assignedBugs = assigned.map((b) => ({
      ...b,
      projectSlug: projectById.get(b.projectId)?.slug ?? "",
      projectName: projectById.get(b.projectId)?.name ?? "",
    }))

    const recent = await db
      .select({
        id: bug.id,
        ref: bug.ref,
        title: bug.title,
        status: bug.status,
        projectId: bug.projectId,
        createdAt: bug.createdAt,
      })
      .from(bug)
      .where(inArray(bug.projectId, projectIds))
      .orderBy(desc(bug.updatedAt))
      .limit(5)

    recentBugs = recent.map((b) => ({
      ...b,
      projectSlug: projectById.get(b.projectId)?.slug ?? "",
      projectName: projectById.get(b.projectId)?.name ?? "",
    }))
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bug className="size-4" />
            </div>
            <span className="text-sm font-bold">BugSync</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome{user ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your projects and track bugs across your workspace.
              </p>
            </div>
            <CreateProjectDialog />
          </div>

          {projects.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FolderOpen className="size-4" />
                  Projects
                </div>
                <p className="mt-1 text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bug className="size-4" />
                  Total Bugs
                </div>
                <p className="mt-1 text-2xl font-bold">{totalBugs}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="size-4" />
                  Assigned to Me
                </div>
                <p className="mt-1 text-2xl font-bold">{assignedBugs.length}</p>
              </div>
            </div>
          )}

          {invitations.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Inbox className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending Invitations</h2>
              </div>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <InvitationCard
                    key={inv.id}
                    id={inv.id}
                    projectName={inv.projectName}
                    projectSlug={inv.projectSlug}
                    role={inv.role}
                  />
                ))}
              </div>
            </section>
          )}

          {assignedBugs.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Activity className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assigned to Me</h2>
              </div>
              <div className="space-y-2">
                {assignedBugs.map((b) => (
                  <Link
                    key={b.id}
                    href={`/project/${b.projectSlug}/board`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">{b.ref}</span>
                      <span className="truncate text-sm font-medium">{b.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{b.status}</span>
                      <span className="text-xs text-muted-foreground">{b.projectName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {projects.length > 0 ? "Your Projects" : "No projects yet"}
              </h2>
            </div>

            {projects.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    slug={p.slug}
                    name={p.name}
                    description={p.description}
                    role={p.role}
                    icon={p.icon}
                    color={p.color}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary">
                  <Bug className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Create your first project</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Projects are isolated workspaces with their own bugs, members, and settings.
                </p>
                <div className="mt-4">
                  <CreateProjectDialog />
                </div>
              </div>
            )}
          </section>

          {recentBugs.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Activity className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recently Updated</h2>
              </div>
              <div className="space-y-2">
                {recentBugs.map((b) => (
                  <Link
                    key={b.id}
                    href={`/project/${b.projectSlug}/board`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">{b.ref}</span>
                      <span className="truncate text-sm font-medium">{b.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{b.status}</span>
                      <span className="text-xs text-muted-foreground">{b.projectName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}