"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProject } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.set("name", name)
      formData.set("description", description)
      const slug = await createProject(formData)
      router.push(`/project/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Project
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create a new project</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="project-name" className="text-sm font-medium">
                  Project name
                </label>
                <input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Safari, Chrome, Mobile App"
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="project-desc" className="text-sm font-medium">
                  Description (optional)
                </label>
                <textarea
                  id="project-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim()}>
                  {loading ? "Creating..." : "Create project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}