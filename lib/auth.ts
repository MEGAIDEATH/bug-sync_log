import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"
import { nextCookies } from "better-auth/next-js"

const isProduction = process.env.NODE_ENV === "production"

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    "http://localhost:3000",
    ...(process.env.BETTER_AUTH_URL
      ? [process.env.BETTER_AUTH_URL]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    useSecureCookies: isProduction,
    cookies: {
      session_token: {
        attributes: {
          sameSite: "lax",
          secure: isProduction,
        },
      },
    },
  },
  plugins: [nextCookies()],
})
