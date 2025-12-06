"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Loader2,
  TrendingUp,
  Users,
  Package,
  IndianRupee,
  ShoppingCart,
  Ticket,
  Calculator,
  AlertTriangle,
  Plus,
  Upload,
  BarChart3,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  useDashboardTopStats,
  useDashboardMiddleStats,
  useRecentOrders,
  useSlotPerformance,
  useLowStockAlerts,
} from "@/hooks/use-dashboard"
import { SlotFormModal } from "@/components/admin/slot-form-modal"
import { UploadCodesModal } from "@/components/admin/upload-codes-modal"
import { useSlots, type Slot } from "@/hooks/use-slots"
import { useQueryClient } from "@tanstack/react-query"

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const [dateRange, setDateRange] = useState("today")
  const queryClient = useQueryClient()

  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<Slot | null>(null)
  const [selectedSlotForUpload, setSelectedSlotForUpload] = useState<Slot | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const { data: topStats, isLoading: topStatsLoading } = useDashboardTopStats()
  const { data: middleStats, isLoading: middleStatsLoading } = useDashboardMiddleStats()
  const { data: recentOrders, isLoading: recentOrdersLoading } = useRecentOrders()
  const { data: slotPerformance, isLoading: slotPerformanceLoading } = useSlotPerformance()
  const { data: lowStockAlerts, isLoading: lowStockLoading } = useLowStockAlerts()

  const { data: allSlots } = useSlots()

  useEffect(() => {
    if (isLoggingOut) return
    if (!authLoading && !isAuthenticated) {
      router.replace("/login")
    }
    if (!authLoading && user && !user.is_admin) {
      router.replace("/dashboard")
    }
  }, [authLoading, isAuthenticated, user, router, isLoggingOut])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleManageSlot = (slotId: string) => {
    const slot = allSlots?.find((s) => s.id === slotId)
    if (slot) {
      setSelectedSlotForEdit(slot)
      setShowEditModal(true)
    }
  }

  const handleUploadSlot = (slotId: string) => {
    const slot = allSlots?.find((s) => s.id === slotId)
    if (slot) {
      setSelectedSlotForUpload(slot)
      setShowUploadModal(true)
    }
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-slot-performance"] })
    queryClient.invalidateQueries({ queryKey: ["admin-slots"] })
  }

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-slot-performance"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard-low-stock-alerts"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard-top-stats"] })
    queryClient.invalidateQueries({ queryKey: ["admin-slots"] })
  }

  if (authLoading || !user || isLoggingOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Business overview and key metrics</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-secondary border-border">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Revenue */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              {topStatsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    (topStats?.revenueChange || 0) >= 0
                      ? "text-green-500 bg-green-500/10"
                      : "text-red-500 bg-red-500/10"
                  }`}
                >
                  {(topStats?.revenueChange || 0) >= 0 ? "+" : ""}
                  {topStats?.revenueChange || 0}%
                </span>
              )}
            </div>
            {topStatsLoading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatCurrency(topStats?.revenueToday || 0)}</p>
            )}
            <p className="text-sm text-muted-foreground">Revenue Today</p>
            {topStatsLoading ? (
              <Skeleton className="h-4 w-20 mt-1" />
            ) : (
              <p className="text-xs text-muted-foreground mt-1">{topStats?.ordersToday || 0} orders</p>
            )}
          </div>

          {/* Total Revenue */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            {topStatsLoading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatCurrency(topStats?.totalRevenue || 0)}</p>
            )}
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          {/* Active Users */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              {topStatsLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                  +{topStats?.newUsersThisWeek || 0} this week
                </span>
              )}
            </div>
            {topStatsLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{topStats?.totalUsers || 0}</p>
            )}
            <p className="text-sm text-muted-foreground">Total Users</p>
            {topStatsLoading ? (
              <Skeleton className="h-4 w-20 mt-1" />
            ) : (
              <p className="text-xs text-muted-foreground mt-1">{topStats?.blockedUsers || 0} blocked</p>
            )}
          </div>

          {/* Available Stock */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              {!topStatsLoading && (topStats?.totalStock || 0) < 1000 && (
                <Badge variant="destructive" className="text-xs">
                  Low Stock
                </Badge>
              )}
            </div>
            {topStatsLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{(topStats?.totalStock || 0).toLocaleString()}</p>
            )}
            <p className="text-sm text-muted-foreground">Total Stock</p>
            {topStatsLoading ? (
              <Skeleton className="h-4 w-24 mt-1" />
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Across {topStats?.totalSlots || 0} slots</p>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              {middleStatsLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{middleStats?.ordersToday || 0}</p>
              )}
              <p className="text-sm text-muted-foreground">Orders Today</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              {middleStatsLoading ? (
                <Skeleton className="h-8 w-20 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {(middleStats?.couponsSoldToday || 0).toLocaleString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">Coupons Sold Today</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              {middleStatsLoading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{formatCurrency(middleStats?.avgOrderValue || 0)}</p>
              )}
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
            </div>
          </div>
        </div>

        {/* Recent Orders & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                View All
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {recentOrdersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (recentOrders?.length || 0) === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Order ID</TableHead>
                      <TableHead className="text-muted-foreground">User</TableHead>
                      <TableHead className="text-muted-foreground">Coupon</TableHead>
                      <TableHead className="text-muted-foreground text-right">Qty</TableHead>
                      <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                      <TableHead className="text-muted-foreground">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders?.map((order) => (
                      <TableRow key={order.id} className="border-border">
                        <TableCell className="font-medium text-foreground">#{order.orderNumber}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                          {order.userEmail}
                        </TableCell>
                        <TableCell className="text-foreground max-w-[180px] truncate">{order.slotName}</TableCell>
                        <TableCell className="text-right text-foreground">{order.quantity}</TableCell>
                        <TableCell className="text-right text-foreground">{formatCurrency(order.amount)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-foreground">Low Stock Alerts</h2>
            </div>
            {lowStockLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (lowStockAlerts?.length || 0) > 0 ? (
              <div className="space-y-4">
                {lowStockAlerts?.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg ${
                      alert.stock === 0
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-yellow-500/10 border border-yellow-500/20"
                    }`}
                  >
                    <p className="font-medium text-foreground">{alert.slotName}</p>
                    <p className={`text-sm ${alert.stock === 0 ? "text-destructive" : "text-yellow-500"}`}>
                      {alert.stock === 0 ? "Out of stock!" : `${alert.stock} left`}
                    </p>
                  </div>
                ))}
                <Link href="/admin/slots">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full mt-2">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Coupons
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No stock alerts at the moment.</p>
            )}
          </div>
        </div>

        {/* Slot Performance */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Slot Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {slotPerformanceLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6">
                  <Skeleton className="h-6 w-32 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </div>
              ))
            ) : (slotPerformance?.length || 0) === 0 ? (
              <p className="text-muted-foreground col-span-4 text-center py-8">No slots available</p>
            ) : (
              slotPerformance?.map((slot) => (
                <div key={slot.id} className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-3 truncate">{slot.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available</span>
                      <span className="text-foreground">
                        {slot.available} / {slot.total}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${slot.total > 0 ? (slot.available / slot.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sold Today</span>
                      <span className="text-foreground">{slot.soldToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="text-primary font-medium">{formatCurrency(slot.revenueToday)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full border-border bg-transparent text-sm"
                      onClick={() => handleManageSlot(slot.id)}
                    >
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-full bg-primary text-primary-foreground text-sm"
                      onClick={() => handleUploadSlot(slot.id)}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions - No changes needed, just links */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/slots?action=create">
              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Create New Coupon</h3>
                <p className="text-sm text-muted-foreground">Add a new coupon category</p>
              </div>
            </Link>

            <Link href="/admin/slots?action=upload">
              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Upload Codes</h3>
                <p className="text-sm text-muted-foreground">Add codes to existing coupons</p>
              </div>
            </Link>

            <Link href="/admin/users">
              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View and manage user accounts</p>
              </div>
            </Link>

            <Link href="/admin/revenue">
              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">View Analytics</h3>
                <p className="text-sm text-muted-foreground">Detailed reports and insights</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Slot Modals */}
        <SlotFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          slot={selectedSlotForEdit}
          onSuccess={handleEditSuccess}
        />

        <UploadCodesModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          slot={selectedSlotForUpload}
          onSuccess={handleUploadSuccess}
        />
      </main>
    </div>
  )
}
