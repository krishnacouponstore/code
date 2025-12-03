"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentPurchases } from "@/components/dashboard/recent-purchases"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { mockPurchases } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { Wallet, ShoppingBag, TrendingUp, Loader2 } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoggingOut) return

    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)
    }
    // Redirect admin to admin dashboard
    if (!isLoading && user?.is_admin) {
      router.push("/admin/dashboard")
    }
  }, [isLoading, isAuthenticated, user, router, pathname, isLoggingOut])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader walletBalance={user.wallet_balance} userName={user.name} userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-1">Your dashboard overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={Wallet}
            label="Available Balance"
            value={formatCurrency(user.wallet_balance)}
            actionLabel="Add Balance"
            actionHref="/add-balance"
          />
          <StatsCard
            icon={ShoppingBag}
            label="Coupons Purchased"
            value={user.total_purchased.toString()}
            subtitle="Lifetime total"
          />
          <StatsCard
            icon={TrendingUp}
            label="Total Spent"
            value={formatCurrency(user.total_spent)}
            subtitle="All time"
          />
        </div>

        {/* Recent Purchases */}
        <div className="mb-8">
          <RecentPurchases purchases={mockPurchases} />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </main>

      <Toaster />
    </div>
  )
}
