import { getProjectBySlug, getSessionUser, getUserRole } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { getBugs } from "@/app/actions/bugs"
import { HelpCenterClient } from "./help-center-client"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function ProjectHelpCenterPage({ params }: Props) {
  const { slug } = await params

  const project = await getProjectBySlug(slug)
  if (!project) redirect("/")

  const user = await getSessionUser()
  if (!user) redirect(`/sign-in?redirect=/project/${slug}`)

  const role = await getUserRole(project.id, user.id)
  if (!role) redirect("/")

  // Fetch real bugs from the database
  const bugs = await getBugs(project.id)

  return (
    <HelpCenterClient
      project={{ slug: project.slug, name: project.name, color: project.color ?? "#6366f1" }}
      bugs={bugs}
      projectId={project.id}
    />
  )
}