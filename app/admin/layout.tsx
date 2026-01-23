"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { hasAuthCookie } from "@/lib/check-auth-cookie"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (isLoading) return

    // Check authentication first - don't redirect if cookie exists (restoring session)
    if (!isAuthenticated || !user) {
      if (!hasAuthCookie()) {
        router.replace("/login")
      }
      return
    }

    // Check admin role - redirect non-admins immediately
    if (!user.is_admin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access admin pages.",
        variant: "destructive",
        duration: 5000,
      })
      router.replace("/dashboard")
      return
    }
  }, [isLoading, isAuthenticated, user, router, toast])

  // Block rendering IMMEDIATELY if not admin - prevents any flash of content
  // This happens BEFORE useEffect runs on subsequent renders
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not authenticated yet - show loading
  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // User is authenticated but NOT admin - show loading while redirecting (no flash)
  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
