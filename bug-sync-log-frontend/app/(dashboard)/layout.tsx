import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/rbac"
import { DashboardHeader } from "./dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader user={{ name: user.name, email: user.email }} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}