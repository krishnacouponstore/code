"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { mockUser, mockAdmin, mockCredentials } from "./mock-data"

export type User = {
  name: string
  email: string
  wallet_balance: number
  total_purchased: number
  total_spent: number
  is_admin: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isLoggingOut: boolean // Added flag to track logout state
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false) // Track logout state
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("codecrate_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("codecrate_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; isAdmin?: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email === mockCredentials.user.email && password === mockCredentials.user.password) {
      setUser(mockUser)
      localStorage.setItem("codecrate_user", JSON.stringify(mockUser))
      return { success: true, isAdmin: false }
    }

    if (email === mockCredentials.admin.email && password === mockCredentials.admin.password) {
      setUser(mockAdmin)
      localStorage.setItem("codecrate_user", JSON.stringify(mockAdmin))
      return { success: true, isAdmin: true }
    }

    return { success: false, error: "Invalid email or password. Please try again." }
  }

  const logout = () => {
    setIsLoggingOut(true)
    setUser(null)
    localStorage.removeItem("codecrate_user")
    router.push("/home")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggingOut,
        login,
        logout,
        isAuthenticated: !!user,
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
