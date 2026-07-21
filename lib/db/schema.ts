import { pgTable, text, timestamp, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------
// No foreign keys (per stack guidance); scoping is enforced in server actions.

// A project is a workspace with a unique URL slug.
export const project = pgTable("project", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("Bug"), // lucide icon name
  color: text("color").default("#6366f1"), // hex color for theme
  visibility: text("visibility").notNull().default("private"), // private | public
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archivedAt"),
  ownerId: text("ownerId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Membership links a user to a project with a role.
// Role is freeform text to support future roles without schema changes.
export const member = pgTable("member", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: text("userId").notNull(),
  role: text("role").notNull().default("user"), // admin | developer | user | (future: reporter, viewer, qa_tester, project_manager)
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Pending invitations by email. Accepted in-app when the invitee signs in.
export const invitation = pgTable("invitation", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("developer"),
  status: text("status").notNull().default("pending"), // pending | accepted | declined
  invitedById: text("invitedById").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// A bug/issue belongs to a project.
// Status is freeform text to support configurable workflows without schema changes.
export const bug = pgTable("bug", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  ref: text("ref").notNull(), // human-facing id like BUG-412
  title: text("title").notNull(),
  urgency: text("urgency").notNull().default("minor"), // blocker | critical | minor
  priority: text("priority").notNull().default("medium"), // low | medium | high | critical
  status: text("status").notNull().default("open"), // open | confirmed | in-progress | needs-review | fixed | closed | rejected | duplicate
  environment: text("environment").notNull().default("Production"),
  filePath: text("filePath"),
  stepsToReproduce: text("stepsToReproduce"),
  expected: text("expected"),
  actual: text("actual"),
  codeSnippet: text("codeSnippet"),
  language: text("language").default("text"),
  reporterId: text("reporterId").notNull(),
  reporterName: text("reporterName").notNull(),
  assigneeId: text("assigneeId"),
  assigneeName: text("assigneeName"),
  location: text("location").notNull().default("triage"), // triage | sprint
  upvotes: integer("upvotes").notNull().default(0),
  fixedAt: timestamp("fixedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// One vote per user per bug.
export const vote = pgTable("vote", {
  id: serial("id").primaryKey(),
  bugId: integer("bugId").notNull(),
  userId: text("userId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Comments on a bug. isInternal notes are only visible to developers/admins.
export const comment = pgTable("comment", {
  id: serial("id").primaryKey(),
  bugId: integer("bugId").notNull(),
  userId: text("userId").notNull(),
  userName: text("userName").notNull(),
  body: text("body").notNull(),
  isInternal: boolean("isInternal").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Labels/tags for bugs. Flexible and project-scoped.
export const label = pgTable("label", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Junction table linking bugs to labels.
export const bugLabel = pgTable("bug_label", {
  id: serial("id").primaryKey(),
  bugId: integer("bugId").notNull(),
  labelId: integer("labelId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// File attachments on bugs. Designed for future cloud storage integration.
export const attachment = pgTable("attachment", {
  id: serial("id").primaryKey(),
  bugId: integer("bugId").notNull(),
  fileName: text("fileName").notNull(),
  fileSize: integer("fileSize"),
  mimeType: text("mimeType"),
  url: text("url").notNull(), // local path now; future cloud storage URL
  uploadedById: text("uploadedById").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Chronological activity history for every bug and project event.
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  bugId: integer("bugId"), // nullable for project-level events
  userId: text("userId").notNull(),
  userName: text("userName").notNull(),
  action: text("action").notNull(), // e.g. "bug.created", "status.changed", "bug.assigned", "label.added"
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  metadata: jsonb("metadata"), // extensible context for any future action type
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Notifications for users. Designed for future real-time delivery.
export const notification = pgTable("notification", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  projectId: integer("projectId"),
  bugId: integer("bugId"),
  type: text("type").notNull(), // bug.assigned | bug.commented | bug.status_changed | invitation.received | bug.fixed
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"), // URL to navigate to when clicked
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})