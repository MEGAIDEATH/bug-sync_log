"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Urgency } from "@/lib/bugsync-data"
import { Button } from "@/components/ui/button"
import { CheckCircle2, PenLine, Sparkles } from "lucide-react"

const IMPACT_OPTIONS: { value: Urgency; label: string; hint: string; className: string }[] = [
  {
    value: "minor",
    label: "Minor",
    hint: "Annoying, but I can work around it",
    className: "peer-checked:border-muted-foreground peer-checked:bg-secondary",
  },
  {
    value: "critical",
    label: "High",
    hint: "A feature is hard to use or broken",
    className: "peer-checked:border-chart-2 peer-checked:bg-chart-2/10",
  },
  {
    value: "blocker",
    label: "Critical",
    hint: "I can't use the product at all",
    className: "peer-checked:border-destructive peer-checked:bg-destructive/10",
  },
]

const AREAS = ["Checkout & Billing", "Login & Account", "Dashboard", "Search", "Profile", "Other"]

export function ReportForm({
  onSubmit,
}: {
  onSubmit: (data: { title: string; description: string; area: string; impact: Urgency; email: string }) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [area, setArea] = useState(AREAS[0])
  const [impact, setImpact] = useState<Urgency>("critical")
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const canSubmit = title.trim().length > 4 && description.trim().length > 4

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ title: title.trim(), description: description.trim(), area, impact, email: email.trim() })
    setSubmitted(true)
  }

  const reset = () => {
    setTitle("")
    setDescription("")
    setArea(AREAS[0])
    setImpact("critical")
    setEmail("")
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-chart-4/40 bg-chart-4/5 px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-chart-4/15 text-chart-4">
            <CheckCircle2 className="size-8" />
          </span>
          <h2 className="mt-5 text-xl font-bold text-foreground">Thanks — we&apos;re on it!</h2>
          <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
            Your report is now in our queue and visible under{" "}
            <span className="font-semibold text-foreground">My Reports</span>. We&apos;ll keep the
            status updated as our team investigates.
          </p>
          <Button onClick={reset} variant="secondary" className="mt-6 gap-1.5">
            <PenLine className="size-4" />
            Report another bug
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Every report helps us improve
        </span>
        <h2 className="mt-3 text-2xl font-bold text-foreground">Report a bug</h2>
        <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
          Give us enough detail to reproduce it and we&apos;ll get to work.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            What went wrong? <span className="text-destructive">*</span>
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Checkout fails when I apply a promo code"
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Tell us more <span className="text-destructive">*</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What were you doing? What did you expect to happen, and what happened instead?"
            className="resize-none rounded-lg border border-input bg-background p-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Which area?</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          >
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">How much does it affect you?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {IMPACT_OPTIONS.map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="impact"
                  value={opt.value}
                  checked={impact === opt.value}
                  onChange={() => setImpact(opt.value)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex h-full flex-col gap-0.5 rounded-lg border border-border bg-background p-3 transition-colors",
                    opt.className,
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                  <span className="text-xs leading-snug text-muted-foreground">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Email <span className="text-muted-foreground">(optional — for updates)</span>
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </label>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Please search existing issues first to avoid duplicates.
          </p>
          <Button type="submit" disabled={!canSubmit} className="gap-1.5">
            <PenLine className="size-4" />
            Submit report
          </Button>
        </div>
      </form>
    </section>
  )
}
