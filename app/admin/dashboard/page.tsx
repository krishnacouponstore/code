"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Loader2,
  TrendingUp,
  Users,
  Package,
  IndianRupee,
  ShoppingCart,
  Ticket,
  AlertTriangle,
  Plus,
  Upload,
  BarChart3,
  ExternalLink,
  Calendar,
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
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import type { DateRange } from "@/app/actions/dashboard"

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange>("today")
  const queryClient = useQueryClient()

  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<Slot | null>(null)
  const [selectedSlotForUpload, setSelectedSlotForUpload] = useState<Slot | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const { data: topStats, isLoading: topStatsLoading } = useDashboardTopStats(dateRange)
  const { data: middleStats, isLoading: middleStatsLoading } = useDashboardMiddleStats(dateRange)
  const { data: recentOrders, isLoading: recentOrdersLoading } = useRecentOrders()
  const { data: slotPerformance, isLoading: slotPerformanceLoading } = useSlotPerformance(dateRange)
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

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "today":
        return "Today"
      case "7days":
        return "Last 7 days"
      case "30days":
        return "Last 30 days"
      case "all":
        return "All time"
      default:
        return "Today"
    }
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
          {/* Revenue Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {topStatsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IndianRupee className="h-6 w-6 text-primary" />
                    </div>
                    {topStats?.revenueChange !== 0 && (
                      <span
                        className={`text-sm font-medium ${topStats?.revenueChange && topStats.revenueChange > 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {topStats?.revenueChange && topStats.revenueChange > 0 ? "+" : ""}
                        {topStats?.revenueChange}%
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    ₹{(topStats?.revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-muted-foreground">Revenue {getDateRangeLabel()}</p>
                  <p className="text-xs text-primary mt-1">{topStats?.orders || 0} orders</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue Card - Always All Time */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {topStatsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    ₹{(topStats?.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xs text-primary mt-1">All time</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Users Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {topStatsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    {topStats?.newUsersInRange ? (
                      <span className="text-sm font-medium text-green-500">
                        +{topStats.newUsersInRange} {getDateRangeLabel().toLowerCase()}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-2xl font-bold text-foreground">{topStats?.totalUsers || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-xs text-primary mt-1">{topStats?.blockedUsers || 0} blocked</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Stock Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {topStatsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {(topStats?.totalStock || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                  <p className="text-xs text-primary mt-1">Across {topStats?.totalSlots || 0} slots</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Orders Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {middleStatsLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{middleStats?.orders || 0}</div>
                    <p className="text-sm text-muted-foreground">Orders {getDateRangeLabel()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coupons Sold Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {middleStatsLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{middleStats?.couponsSold || 0}</div>
                    <p className="text-sm text-muted-foreground">Coupons Sold {getDateRangeLabel()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avg Order Value Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {middleStatsLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      ₹{(middleStats?.avgOrderValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
          <h2 className="text-xl font-semibold text-foreground mb-4">Slot Performance</h2>
          {slotPerformanceLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {slotPerformance?.map((slot) => (
                <Card key={slot.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground mb-2">{slot.name}</h3>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Available</span>
                      <span>
                        {slot.available} / {slot.total}
                      </span>
                    </div>
                    <Progress value={(slot.available / (slot.total || 1)) * 100} className="h-2 mb-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sold {getDateRangeLabel()}</span>
                      <span className="text-foreground">{slot.soldToday}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="text-primary">
                        ₹{slot.revenueToday.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleManageSlot(slot.id)}
                      >
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleUploadSlot(slot.id)}
                      >
                        Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
