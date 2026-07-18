"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSession } from "@/lib/auth-client"
import type { Session } from "better-auth"

type SessionContextValue = {
  session: Session | null
  isPending: boolean
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isPending: true,
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()

  return (
    <SessionContext.Provider value={{ session: session ?? null, isPending }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useCurrentSession() {
  return useContext(SessionContext)
}