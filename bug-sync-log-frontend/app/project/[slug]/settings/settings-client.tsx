"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bug, Save, Archive, Trash2, RotateCcw, Users, Tags, Settings as SettingsIcon } from "lucide-react"
import { updateProject, archiveProject, restoreProject, deleteProject } from "@/app/actions/projects"

type SettingsProject = {
  id: number
  slug: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  visibility: "private" | "public"
  archived: boolean
  createdAt: Date
}

type SettingsClientProps = {
  project: SettingsProject
}

type TabId = "general" | "members" | "labels" | "danger"

export function SettingsClient({ project }: SettingsClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>("general")
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? "")
  const [color, setColor] = useState(project.color ?? "#6366f1")
  const [visibility, setVisibility] = useState(project.visibility)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.set("name", name)
      formData.set("description", description)
      formData.set("color", color)
      formData.set("visibility", visibility)
      await updateProject(project.id, formData)
      setMessage("Settings saved")
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this project?")) return
    try {
      await archiveProject(project.id)
      router.refresh()
    } catch {
      // silently fail
    }
  }

  const handleRestore = async () => {
    try {
      await restoreProject(project.id)
      router.refresh()
    } catch {
      // silently fail
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) return
    if (!confirm("Really delete? All bugs, comments, and data will be lost forever.")) return
    try {
      await deleteProject(project.id)
      router.push("/")
    } catch {
      // silently fail
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof Bug }[] = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "members", label: "Members", icon: Users },
    { id: "labels", label: "Labels", icon: Tags },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage {project.name} configuration and members
        </p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* General tab */}
      {tab === "general" && (
        <div className="space-y-6">
          {message && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Theme color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-10 rounded-lg border border-input bg-background p-1"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "private" | "public")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="private">Private — only invited members can access</option>
              <option value="public">Public — anyone with the link can view</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            <span>Project URL:</span>
            <code className="rounded bg-secondary px-2 py-0.5 text-xs">
              /project/{project.slug}
            </code>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Member management will be implemented in a future phase. Use the server actions directly.
          </p>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">Quick actions:</p>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              <li>Invite: POST to /api/projects/:id/invite</li>
              <li>Remove: POST to /api/projects/:id/members/:memberId/remove</li>
              <li>Change role: POST to /api/projects/:id/members/:memberId/role</li>
            </ul>
          </div>
        </div>
      )}

      {/* Labels tab */}
      {tab === "labels" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Label management will be implemented in a future phase.
          </p>
        </div>
      )}

      {/* Danger zone tab */}
      {tab === "danger" && (
        <div className="space-y-6">
          {project.archived ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
                  <Archive className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Project is archived</h3>
                  <p className="text-sm text-muted-foreground">
                    This project is currently archived and not visible to members.
                  </p>
                </div>
              </div>
              <Button onClick={handleRestore} variant="outline" className="mt-4">
                <RotateCcw className="size-4" />
                Restore project
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <Archive className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Archive project</h3>
                  <p className="text-sm text-muted-foreground">
                    Archive this project to hide it from members. It can be restored later.
                  </p>
                </div>
              </div>
              <Button onClick={handleArchive} variant="outline" className="mt-4 border-destructive/50 text-destructive hover:bg-destructive/10">
                <Archive className="size-4" />
                Archive project
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Delete project</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this project and all its data. This action cannot be undone.
                </p>
              </div>
            </div>
            <Button onClick={handleDelete} variant="destructive" className="mt-4">
              <Trash2 className="size-4" />
              Delete project permanently
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}