import { redirect } from "next/navigation"
import { getProjectBySlug, getSessionUser, getUserRole } from "@/lib/rbac"
import { ProjectNav } from "./project-nav"
import { Bug } from "lucide-react"

type ProjectLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { slug } = await params

  // 1. Look up the project
  const project = await getProjectBySlug(slug)
  if (!project) {
    redirect("/")
  }

  // 2. Check authentication
  const user = await getSessionUser()
  if (!user) {
    redirect(`/sign-in?redirect=/project/${slug}`)
  }

  // 3. Check membership
  const role = await getUserRole(project.id, user.id)
  if (!role) {
    redirect("/")
  }

  return (
    <div className="min-h-dvh bg-background">
      <ProjectNav
        project={{ slug: project.slug, name: project.name, color: project.color ?? "#6366f1" }}
        user={{ name: user.name, email: user.email }}
        role={role}
      />
      <main>{children}</main>
    </div>
  )
}