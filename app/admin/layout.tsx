"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setHasChecked(false)
      return
    }

    if (hasChecked) return
    setHasChecked(true)

    // Check authentication first
    if (!isAuthenticated || !user) {
      router.replace("/login")
      return
    }

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
  }, [isLoading, isAuthenticated, user, router, toast, hasChecked])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || !user.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
