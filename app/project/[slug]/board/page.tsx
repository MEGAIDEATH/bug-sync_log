import { getProjectBySlug, getSessionUser, getUserRole } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { getBugs } from "@/app/actions/bugs"
import { BoardClient } from "./board-client"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BoardPage({ params }: Props) {
  const { slug } = await params

  const project = await getProjectBySlug(slug)
  if (!project) redirect("/")

  const user = await getSessionUser()
  if (!user) redirect(`/sign-in?redirect=/project/${slug}/board`)

  const role = await getUserRole(project.id, user.id)
  if (!role) redirect("/")

  // Developers and admins can view the board; plain users cannot
  if (role === "user") redirect(`/project/${slug}`)

  const bugs = await getBugs(project.id)

  return (
    <BoardClient
      project={{ slug: project.slug, name: project.name, color: project.color ?? "#6366f1", id: project.id }}
      bugs={bugs}
      projectId={project.id}
      currentUserId={user.id}
      role={role}
    />
  )
}