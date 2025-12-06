"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuthenticated, useUserData, useSignOut } from "@nhost/nextjs"
import { useUserProfile, type UserProfile } from "@/hooks/use-user-profile"
import { useUserRoles } from "@/hooks/use-user-roles"
import { useQueryClient } from "@tanstack/react-query"
import { mutate } from "swr"

export type User = {
  id: string
  name: string
  email: string
  phone: string | null
  wallet_balance: number
  total_purchased: number
  total_spent: number
  is_admin: boolean
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isLoggingOut: boolean
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function ensureUserProfile(userId: string) {
  try {
    const response = await fetch("/api/ensure-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    return response.ok
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthenticated()
  const nhostUser = useUserData()
  const { signOut } = useSignOut()
  const { data: profile, isLoading: isProfileLoading, refetch } = useUserProfile()
  const { data: rolesData, isLoading: isRolesLoading, isFetching: isRolesFetching } = useUserRoles()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    async function checkAndCreateProfile() {
      if (isAuthenticated && nhostUser && !isProfileLoading && !profile && !profileChecked) {
        setProfileChecked(true)
        const success = await ensureUserProfile(nhostUser.id)
        if (success) {
          await refetch()
        }
      }
    }
    checkAndCreateProfile()
  }, [isAuthenticated, nhostUser, profile, isProfileLoading, profileChecked, refetch])

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileChecked(false)
    }
  }, [isAuthenticated])

  const user: User | null =
    profile && nhostUser
      ? {
          id: profile.id,
          name: nhostUser.displayName || "User",
          email: nhostUser.email || "",
          phone: nhostUser.phoneNumber || null,
          wallet_balance: profile.wallet_balance,
          total_purchased: profile.total_purchased,
          total_spent: profile.total_spent,
          is_admin: rolesData?.isAdmin ?? false,
        }
      : null

  const logout = async () => {
    setIsLoggingOut(true)

    // Clear React Query cache
    queryClient.clear()

    // Clear SWR cache
    await mutate(() => true, undefined, { revalidate: false })

    // Clear any localStorage items related to auth/user
    if (typeof window !== "undefined") {
      localStorage.removeItem("codecrate_password_reset_email")
    }

    // Sign out from Nhost
    await signOut()

    await new Promise((resolve) => setTimeout(resolve, 300))

    window.location.href = "/home"
  }

  const isLoading =
    isAuthenticated === undefined || (isAuthenticated && (isProfileLoading || isRolesLoading || isRolesFetching))

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isLoggingOut,
        logout,
        isAuthenticated: isAuthenticated && !!nhostUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
