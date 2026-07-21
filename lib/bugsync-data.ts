export type Urgency = "blocker" | "critical" | "minor"

// Status is now freeform text to support configurable workflows.
// These are the recommended statuses but not a hard constraint.
export type Status = string

export type Location = "triage" | "sprint"

export type User = {
  id: string
  name: string
  initials: string
}

export type Bug = {
  id: string
  title: string
  urgency: Urgency
  priority: string
  upvotes: number
  environment: string
  filePath: string
  reportedAt: string
  creator: User
  assignee: string | null
  status: Status
  location: Location
  stepsToReproduce: string
  expected: string
  actual: string
  codeSnippet: string
  language: string
}

export const TEAM: User[] = [
  { id: "u1", name: "Ava Chen", initials: "AC" },
  { id: "u2", name: "Marcus Reed", initials: "MR" },
  { id: "u3", name: "Priya Nair", initials: "PN" },
  { id: "u4", name: "Diego Santos", initials: "DS" },
  { id: "u5", name: "Lena Ford", initials: "LF" },
]

export const ASSIGNEES = ["Unassigned", ...TEAM.map((u) => u.name)]

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  confirmed: "Confirmed",
  "in-progress": "In Progress",
  "needs-review": "Needs Review",
  fixed: "Fixed",
  closed: "Closed",
  rejected: "Rejected",
  duplicate: "Duplicate",
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export const URGENCY_LABELS: Record<string, string> = {
  blocker: "Blocker",
  critical: "Critical",
  minor: "Minor",
}

export const BUGS: Bug[] = [
  {
    id: "BUG-412",
    title: "Checkout fails with 500 when applying expired promo code",
    urgency: "blocker",
    priority: "critical",
    upvotes: 47,
    environment: "Production",
    filePath: "src/routes/api/checkout.ts",
    reportedAt: "Jun 14",
    creator: TEAM[0],
    assignee: null,
    status: "open",
    location: "triage",
    stepsToReproduce:
      "1. Add any item to the cart.\n2. Proceed to checkout.\n3. Enter the promo code `SUMMER20` (expired yesterday).\n4. Click \"Apply\".",
    expected: "A friendly inline message: \"This code has expired.\" The checkout should remain usable.",
    actual: "The server throws a 500 and the entire checkout view unmounts, losing the cart contents.",
    codeSnippet:
      "export async function applyPromo(code: string) {\n  const promo = await db.promo.find(code)\n  // 🐛 no null check — promo is null for expired codes\n  if (promo.expiresAt < Date.now()) {\n    throw new Error('expired')\n  }\n  return promo.discount\n}",
    language: "typescript",
  },
  {
    id: "BUG-398",
    title: "Session token not refreshed, users randomly logged out",
    urgency: "blocker",
    priority: "critical",
    upvotes: 38,
    environment: "Production",
    filePath: "src/lib/auth/session.ts",
    reportedAt: "Jun 13",
    creator: TEAM[1],
    assignee: null,
    status: "open",
    location: "triage",
    stepsToReproduce:
      "1. Log in and stay idle for ~15 minutes.\n2. Perform any authenticated action.",
    expected: "The token silently refreshes and the action succeeds.",
    actual: "A 401 is returned and the user is bounced to the login screen.",
    codeSnippet:
      "function getSession() {\n  const token = cookies.get('sid')\n  // missing: refresh when token is near expiry\n  return decode(token)\n}",
    language: "typescript",
  },
  {
    id: "BUG-401",
    title: "Dashboard charts overflow container on tablet breakpoints",
    urgency: "critical",
    priority: "high",
    upvotes: 21,
    environment: "Staging",
    filePath: "src/components/dashboard/charts.tsx",
    reportedAt: "Jun 12",
    creator: TEAM[2],
    assignee: null,
    status: "open",
    location: "triage",
    stepsToReproduce: "1. Open the dashboard.\n2. Resize the viewport to ~820px wide.",
    expected: "Charts should scale down and stay within the card boundary.",
    actual: "The SVG overflows horizontally, creating a page-level scrollbar.",
    codeSnippet:
      "<div className=\"w-[960px]\"> {/* 🐛 fixed width */}\n  <LineChart data={data} />\n</div>",
    language: "tsx",
  },
  {
    id: "BUG-377",
    title: "Search returns stale results after rapid typing",
    urgency: "critical",
    priority: "high",
    upvotes: 19,
    environment: "Production",
    filePath: "src/hooks/use-search.ts",
    reportedAt: "Jun 10",
    creator: TEAM[3],
    assignee: null,
    status: "open",
    location: "triage",
    stepsToReproduce: "1. Type a query quickly.\n2. Delete it and type a new query.",
    expected: "Only the latest query's results are shown.",
    actual: "An earlier in-flight request resolves last and overwrites the correct results.",
    codeSnippet:
      "useEffect(() => {\n  fetch(`/api/search?q=${q}`)\n    .then(r => r.json())\n    .then(setResults) // 🐛 no request cancellation\n}, [q])",
    language: "typescript",
  },
  {
    id: "BUG-355",
    title: "Avatar upload accepts files over 10MB without warning",
    urgency: "minor",
    priority: "medium",
    upvotes: 6,
    environment: "Staging",
    filePath: "src/components/profile/avatar-upload.tsx",
    reportedAt: "Jun 8",
    creator: TEAM[4],
    assignee: null,
    status: "open",
    location: "triage",
    stepsToReproduce: "1. Open profile settings.\n2. Upload a 15MB image.",
    expected: "Reject the file with a clear size-limit message.",
    actual: "The upload silently hangs and eventually times out.",
    codeSnippet:
      "const onDrop = (file: File) => {\n  // 🐛 no size validation\n  upload(file)\n}",
    language: "typescript",
  },
  {
    id: "BUG-340",
    title: "Tooltip clips behind modal overlay on first open",
    urgency: "minor",
    priority: "low",
    upvotes: 3,
    environment: "Local",
    filePath: "src/components/ui/tooltip.tsx",
    reportedAt: "Jun 6",
    creator: TEAM[0],
    assignee: null,
    status: "open",
    location: "triage",
    stepsToReproduce: "1. Open a modal.\n2. Hover a tooltip trigger inside it.",
    expected: "Tooltip floats above the modal.",
    actual: "Tooltip renders behind the overlay until the next re-render.",
    codeSnippet: "z-index: 40; /* 🐛 below modal overlay (50) */",
    language: "css",
  },
  {
    id: "BUG-419",
    title: "Webhook retries duplicate orders under high load",
    urgency: "critical",
    priority: "high",
    upvotes: 27,
    environment: "Production",
    filePath: "src/routes/api/webhooks/stripe.ts",
    reportedAt: "Jun 15",
    creator: TEAM[1],
    assignee: null,
    status: "open",
    location: "triage",
    stepsToReproduce: "1. Trigger a Stripe webhook.\n2. Force a timeout so Stripe retries.",
    expected: "Idempotency key prevents a duplicate order.",
    actual: "Each retry creates a brand new order row.",
    codeSnippet:
      "export async function POST(req: Request) {\n  const event = await req.json()\n  // 🐛 no idempotency check\n  await createOrder(event.data)\n}",
    language: "typescript",
  },
]