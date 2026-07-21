import { getProjectBySlug, getSessionUser, getUserRole } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { getProjectPeople } from "@/app/actions/projects"
import { SettingsClient } from "./settings-client"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { slug } = await params

  const project = await getProjectBySlug(slug)
  if (!project) redirect("/")

  const user = await getSessionUser()
  if (!user) redirect(`/sign-in?redirect=/project/${slug}/settings`)

  const role = await getUserRole(project.id, user.id)
  if (!role || role !== "admin") redirect(`/project/${slug}`)

  const { people, invites } = await getProjectPeople(project.id)

  return (
    <SettingsClient
      project={{
        id: project.id,
        slug: project.slug,
        name: project.name,
        description: project.description,
        icon: project.icon,
        color: project.color,
        visibility: project.visibility as "private" | "public",
        archived: project.archived,
        createdAt: project.createdAt,
      }}
      people={people}
      invites={invites}
    />
  )
}
