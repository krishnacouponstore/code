"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { OrderDetailsModal } from "@/components/admin/order-details-modal"
import { UserProfilePopup } from "@/components/admin/user-profile-popup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  User,
  Copy,
  ShoppingBag,
  IndianRupee,
  Ticket,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Filter,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOrderStats, useOrderSlots, type AdminOrder } from "@/hooks/use-admin-orders"
import { exportOrders } from "@/app/actions/orders"
import { useOrders, type OrderFilters } from "@/hooks/use-orders"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange as DateRangeType } from "react-day-picker"
import { format } from "date-fns" // Import format from date-fns

export default function AdminOrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all")
  const [couponFilter, setCouponFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>(undefined)
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<AdminOrder["user"] | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)

  const ordersPerPage = 20

  const filters: OrderFilters = {
    page: currentPage,
    limit: ordersPerPage,
    status: statusFilter === "all" ? undefined : statusFilter,
    slotId: couponFilter === "all" ? undefined : couponFilter,
    dateRange: dateRange
      ? {
          from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        }
      : undefined,
    sortBy,
    search: searchQuery || undefined,
  }

  const { data: ordersData, isLoading: ordersLoading } = useOrders(filters)

  const { data: stats, isLoading: statsLoading } = useOrderStats()
  const { data: slots } = useOrderSlots()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, couponFilter, dateRange, sortBy])

  // Auth check
  useEffect(() => {
    if (!authLoading && !isLoggingOut) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user && !user.is_admin) {
        router.push("/")
      }
    }
  }, [isAuthenticated, user, authLoading, router, isLoggingOut])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const orders = ordersData?.orders || []
  const totalOrders = ordersData?.total || 0
  const totalPages = Math.ceil(totalOrders / ordersPerPage)

  const downloadOrderCodes = (order: AdminOrder, format: "csv" | "txt") => {
    if (order.codes.length === 0) {
      toast({
        title: "No codes available",
        description: "This order has no codes to download",
        variant: "destructive",
      })
      return
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === "csv") {
      content = "Code\n" + order.codes.join("\n")
      filename = `order-${order.order_id}-codes.csv`
      mimeType = "text/csv"
    } else {
      content = order.codes.join("\n")
      filename = `order-${order.order_id}-codes.txt`
      mimeType = "text/plain"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `Downloading ${order.codes.length} codes as ${format.toUpperCase()}`,
    })
  }

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId)
    toast({
      title: "Copied",
      description: "Order ID copied to clipboard",
    })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const allOrders = await exportOrders({
        search: debouncedSearch,
        status: statusFilter,
        slotId: couponFilter,
        dateRange,
      })

      // Generate CSV content
      const headers = [
        "Order ID",
        "Customer",
        "Email",
        "Phone",
        "Product",
        "Quantity",
        "Total",
        "Status",
        "Date",
        "Codes",
      ]
      const rows = allOrders.map((order) => [
        order.order_id,
        order.user.name,
        order.user.email,
        order.user.phone || "",
        order.slot_name,
        order.quantity.toString(),
        order.total_price.toFixed(2),
        order.status,
        new Date(order.created_at).toLocaleDateString(),
        order.codes.join("; "),
      ])

      const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export complete",
        description: `Exported ${allOrders.length} orders`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export orders",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleViewUserProfile = (user: AdminOrder["user"]) => {
    setSelectedUserForProfile(user)
    setShowUserProfile(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
      case "refunded":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (authLoading || !user?.is_admin || isLoggingOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground mt-1">View and manage all customer orders</p>
          </div>
          <Button onClick={handleExport} disabled={isExporting} variant="outline" className="gap-2 bg-transparent">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Export Orders
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-sm">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_orders || 0}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <IndianRupee className="h-4 w-4" />
                  <span className="text-sm">Revenue Today</span>
                </div>
                <p className="text-2xl font-bold text-foreground">₹{(stats?.revenue_today || 0).toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Ticket className="h-4 w-4" />
                  <span className="text-sm">Codes Sold</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_codes_sold || 0}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calculator className="h-4 w-4" />
                  <span className="text-sm">Avg. Order Value</span>
                </div>
                <p className="text-2xl font-bold text-foreground">₹{(stats?.average_order_value || 0).toFixed(2)}</p>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={couponFilter} onValueChange={setCouponFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {(slots || []).map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Sort by</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="amount_high">Amount (High to Low)</SelectItem>
                    <SelectItem value="amount_low">Amount (Low to High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <TableHead className="text-muted-foreground text-center">Qty</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-mono text-sm text-foreground">{order.order_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{order.user.name}</p>
                          <p className="text-xs text-muted-foreground">{order.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{order.slot_name}</TableCell>
                      <TableCell className="text-center text-foreground">{order.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        ₹{order.total_price.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowOrderDetails(true)
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Order Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => downloadOrderCodes(order, "csv")}
                              className="cursor-pointer"
                              disabled={order.codes.length === 0}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Codes (CSV)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => downloadOrderCodes(order, "txt")}
                              className="cursor-pointer"
                              disabled={order.codes.length === 0}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Codes (TXT)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => handleViewUserProfile(order.user)}
                              className="cursor-pointer"
                            >
                              <User className="mr-2 h-4 w-4" />
                              View User Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyOrderId(order.order_id)} className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Order ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, totalOrders)}{" "}
                of {totalOrders} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      <OrderDetailsModal order={selectedOrder} open={showOrderDetails} onOpenChange={setShowOrderDetails} />

      {/* User Profile Popup */}
      <UserProfilePopup user={selectedUserForProfile} open={showUserProfile} onOpenChange={setShowUserProfile} />
    </div>
  )
}
