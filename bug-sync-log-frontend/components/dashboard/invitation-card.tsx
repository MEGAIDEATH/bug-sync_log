"use client"

import { acceptInvitation, declineInvitation } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { Mail, Check, X } from "lucide-react"

type InvitationCardProps = {
  id: number
  projectName: string
  projectSlug: string
  role: string
}

export function InvitationCard({ id, projectName, projectSlug, role }: InvitationCardProps) {
  const handleAccept = async () => {
    try {
      await acceptInvitation(id)
    } catch {
      // handled by UI feedback in production
    }
  }

  const handleDecline = async () => {
    try {
      await declineInvitation(id)
    } catch {
      // handled by UI feedback in production
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Invitation to <span className="font-semibold">{projectName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Role: <span className="capitalize">{role}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <form action={handleAccept}>
          <Button type="submit" size="sm" variant="default">
            <Check className="size-4" />
            Accept
          </Button>
        </form>
        <form action={handleDecline}>
          <Button type="submit" size="sm" variant="ghost">
            <X className="size-4" />
            Decline
          </Button>
        </form>
      </div>
    </div>
  )
}