"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (isLoading) return

    // Check authentication first
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (!user?.is_admin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access admin pages.",
        variant: "destructive",
        duration: 5000,
      })
      router.replace("/dashboard")
      return
    }
  }, [isLoading, isAuthenticated, user?.is_admin, router, toast])

  // Show loading while checking auth or loading roles
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render anything if not admin
  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Only render children if user is authenticated AND is admin
  return <>{children}</>
}
