import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/rbac"
import { getMyProjects } from "@/app/actions/projects"

export default async function PortalPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  // Redirect to the user's first project's help center, or the dashboard
  const projects = await getMyProjects()
  if (projects.length > 0) {
    redirect(`/project/${projects[0].slug}`)
  }
  redirect("/")
}