"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
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
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check user credentials
    if (email === mockCredentials.user.email && password === mockCredentials.user.password) {
      setUser(mockUser)
      localStorage.setItem("codecrate_user", JSON.stringify(mockUser))
      return { success: true, isAdmin: false }
    }

    // Check admin credentials
    if (email === mockCredentials.admin.email && password === mockCredentials.admin.password) {
      setUser(mockAdmin)
      localStorage.setItem("codecrate_user", JSON.stringify(mockAdmin))
      return { success: true, isAdmin: true }
    }

    return { success: false, error: "Invalid email or password. Please try again." }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("codecrate_user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
