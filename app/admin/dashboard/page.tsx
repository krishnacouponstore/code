"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { adminStats, adminRecentOrders, lowStockAlerts, topSlots } from "@/lib/mock-data"

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [dateRange, setDateRange] = useState("today")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
    if (!isLoading && user && !user.is_admin) {
      router.push("/dashboard")
    }
  }, [isLoading, isAuthenticated, user, router])

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
              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                +{adminStats.today.revenue_change}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(adminStats.today.revenue)}</p>
            <p className="text-sm text-muted-foreground">Revenue Today</p>
            <p className="text-xs text-muted-foreground mt-1">{adminStats.today.orders} orders</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(adminStats.total.revenue)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          {/* Active Users */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                +{adminStats.total.new_users_this_week} this week
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{adminStats.total.users}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-xs text-muted-foreground mt-1">{adminStats.total.blocked_users} blocked</p>
          </div>

          {/* Available Stock */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              {adminStats.total.available_stock < 1000 && (
                <Badge variant="destructive" className="text-xs">
                  Low Stock
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{adminStats.total.available_stock.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Stock</p>
            <p className="text-xs text-muted-foreground mt-1">Across {adminStats.total.total_slots} slots</p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{adminStats.today.orders}</p>
              <p className="text-sm text-muted-foreground">Orders Today</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{adminStats.today.coupons_sold.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Coupons Sold Today</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(adminStats.average_order_value)}</p>
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
                  {adminRecentOrders.map((order) => (
                    <TableRow key={order.id} className="border-border">
                      <TableCell className="font-medium text-foreground">#{order.id}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.user_email}</TableCell>
                      <TableCell className="text-foreground">{order.slot_name}</TableCell>
                      <TableCell className="text-right text-foreground">{order.quantity}</TableCell>
                      <TableCell className="text-right text-foreground">{formatCurrency(order.amount)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-foreground">Low Stock Alerts</h2>
            </div>
            {lowStockAlerts.length > 0 ? (
              <div className="space-y-4">
                {lowStockAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      alert.stock === 0
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-yellow-500/10 border border-yellow-500/20"
                    }`}
                  >
                    <p className="font-medium text-foreground">{alert.slot_name}</p>
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
            {topSlots.map((slot) => (
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
                      style={{ width: `${(slot.available / slot.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sold Today</span>
                    <span className="text-foreground">{slot.sold_today}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="text-primary font-medium">{formatCurrency(slot.revenue_today)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/admin/slots?edit=${slot.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full border-border bg-transparent text-sm"
                    >
                      Manage
                    </Button>
                  </Link>
                  <Link href={`/admin/slots?upload=${slot.id}`} className="flex-1">
                    <Button size="sm" className="w-full rounded-full bg-primary text-primary-foreground text-sm">
                      Upload
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
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
      </main>
    </div>
  )
}
