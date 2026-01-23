"use client"

import { useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { ProfileForm } from "@/components/profile/profile-form"
import { ChangePasswordForm } from "@/components/profile/change-password-form"
import { AccountStats } from "@/components/profile/account-stats"
import { AccountActions } from "@/components/profile/account-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import { hasAuthCookie } from "@/lib/check-auth-cookie"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const justVerified = searchParams.get("verified") === "true"

  useEffect(() => {
    if (isLoggingOut) return

    // Don't redirect if auth cookie exists (session is being restored)
    if (!isLoading && !isAuthenticated && !hasAuthCookie()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }

    // Redirect admin to admin dashboard with toast
    if (!isLoading && user?.is_admin) {
      toast({
        title: "Access Restricted",
        description: "Admin users should use the admin dashboard",
        variant: "default",
        duration: 5000,
      })
      router.replace("/admin/dashboard")
    }
  }, [isLoading, isAuthenticated, router, pathname, isLoggingOut, user, toast])

  // Block rendering if admin (before showing user content)
  if (!isLoading && user?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-32">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account information and preferences</p>
        </div>

        {/* Just Verified Success Message */}
        {justVerified && (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Email verified successfully! Your account is now fully activated.
            </AlertDescription>
          </Alert>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - 60% */}
          <div className="lg:col-span-3 space-y-6">
            <ProfileForm />
            <ChangePasswordForm />
          </div>

          {/* Right Column - 40% */}
          <div className="lg:col-span-2 space-y-6">
            <AccountStats />
            <AccountActions />
          </div>
        </div>
      </main>
    </div>
  )
}
