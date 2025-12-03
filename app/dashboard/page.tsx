"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentPurchases } from "@/components/dashboard/recent-purchases"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { useAuth } from "@/lib/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useRecentPurchases } from "@/hooks/use-user-stats"
import { Wallet, ShoppingBag, TrendingUp, Loader2, RefreshCw } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, isLoggingOut } = useAuth()
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile, error: profileError } = useUserProfile()
  const { data: purchases, isLoading: purchasesLoading } = useRecentPurchases()
  const router = useRouter()
  const pathname = usePathname()
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!authLoading && isAuthenticated && !profileLoading && !profile && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log("[v0] Profile not found, retrying fetch...", retryCount + 1)
        refetchProfile()
        setRetryCount((prev) => prev + 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, profileLoading, profile, retryCount, refetchProfile])

  useEffect(() => {
    if (isLoggingOut) return

    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
    // Redirect admin to admin dashboard
    if (!authLoading && profile?.is_admin) {
      router.replace("/admin/dashboard")
    }
  }, [authLoading, isAuthenticated, profile, router, pathname, isLoggingOut])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const isLoading = authLoading || profileLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile && retryCount < 3) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Setting up your profile...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Unable to load profile</h2>
          <p className="text-muted-foreground">
            {profileError ? `Error: ${profileError.message}` : "Your profile is being set up. Please try again."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setRetryCount(0)
                refetchProfile()
              }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => router.replace("/login")} variant="default">
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const transformedPurchases =
    purchases?.map((p) => ({
      id: p.id,
      order_id: p.order_number,
      coupon_name: p.slot?.name || "Unknown Coupon",
      quantity: p.quantity,
      amount: p.total_price,
      date: p.created_at,
    })) || []

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader walletBalance={profile.wallet_balance} userName={user.name} userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-1">Your dashboard overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={Wallet}
            label="Available Balance"
            value={formatCurrency(profile.wallet_balance)}
            actionLabel="Add Balance"
            actionHref="/add-balance"
          />
          <StatsCard
            icon={ShoppingBag}
            label="Coupons Purchased"
            value={profile.total_purchased.toString()}
            subtitle="Lifetime total"
          />
          <StatsCard
            icon={TrendingUp}
            label="Total Spent"
            value={formatCurrency(profile.total_spent)}
            subtitle="All time"
          />
        </div>

        {/* Recent Purchases */}
        <div className="mb-8">
          {purchasesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <RecentPurchases purchases={transformedPurchases} />
          )}
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </main>

      <Toaster />
    </div>
  )
}
