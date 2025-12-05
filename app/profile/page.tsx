"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProfileForm } from "@/components/profile/profile-form"
import { ChangePasswordForm } from "@/components/profile/change-password-form"
import { AccountStats } from "@/components/profile/account-stats"
import { AccountActions } from "@/components/profile/account-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import { ChangePasswordModal } from "@/components/auth/change-password-modal"

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const justVerified = searchParams.get("verified") === "true"

  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)

  useEffect(() => {
    if (isLoggingOut) return

    if (!isLoading && !isAuthenticated) {
      router.replace(`/signup?redirect=${encodeURIComponent(pathname)}`)
    }
    if (!isLoading && user?.is_admin) {
      router.replace("/admin/dashboard")
    }
  }, [isLoading, isAuthenticated, router, pathname, isLoggingOut, user])

  useEffect(() => {
    console.log("[v0] Profile page - checking password reset flag")
    console.log("[v0] isLoading:", isLoading)
    console.log("[v0] isAuthenticated:", isAuthenticated)
    console.log("[v0] user:", user?.email)

    const pendingReset = localStorage.getItem("codecrate_password_reset_pending")
    console.log("[v0] localStorage codecrate_password_reset_pending:", pendingReset)

    if (!isLoading && isAuthenticated && user) {
      console.log("[v0] Conditions met, pendingReset value:", pendingReset)
      if (pendingReset === "true") {
        console.log("[v0] Showing password reset modal!")
        setShowPasswordResetModal(true)
      }
    }
  }, [isLoading, isAuthenticated, user])

  const handlePasswordModalClose = () => {
    localStorage.removeItem("codecrate_password_reset_pending")
    setShowPasswordResetModal(false)
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
    <div className="min-h-screen bg-background">
      <DashboardHeader walletBalance={user.wallet_balance} userName={user.name} userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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

      <ChangePasswordModal open={showPasswordResetModal} onClose={handlePasswordModalClose} />
    </div>
  )
}
