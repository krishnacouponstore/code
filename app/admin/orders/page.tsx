"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { OrderDetailsModal } from "@/components/admin/order-details-modal"
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
import {
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  ExternalLink,
  Copy,
  ShoppingBag,
  IndianRupee,
  Ticket,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockAdminOrders, mockOrderStats, type AdminOrder } from "@/lib/mock-data"

export default function AdminOrdersPage() {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [couponFilter, setCouponFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [dateRange, setDateRange] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  const ordersPerPage = 25

  useEffect(() => {
    if (isLoggingOut) return
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
    if (!isLoading && user && !user.is_admin) {
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, user, router, isLoggingOut])

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

  // Filter and sort orders
  const filteredOrders = mockAdminOrders
    .filter((order) => {
      const matchesSearch =
        order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.slot_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      const matchesCoupon = couponFilter === "all" || order.slot_name === couponFilter
      return matchesSearch && matchesStatus && matchesCoupon
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "amount_high":
          return b.total_price - a.total_price
        case "amount_low":
          return a.total_price - b.total_price
        default:
          return 0
      }
    })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
      case "refunded":
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const copyOrderId = async (orderId: string) => {
    await navigator.clipboard.writeText(orderId)
    toast({
      title: "Copied",
      description: `Order ID ${orderId} copied to clipboard`,
    })
  }

  const downloadOrderCodes = (order: AdminOrder, format: "csv" | "txt") => {
    if (order.codes.length === 0) {
      toast({
        title: "No Codes",
        description: "This order has no codes to download",
        variant: "destructive",
      })
      return
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === "csv") {
      content = "Serial,Code\n" + order.codes.map((code, i) => `${i + 1},${code}`).join("\n")
      filename = `codecrate_${order.order_id.replace("#", "")}_codes.csv`
      mimeType = "text/csv"
    } else {
      content = order.codes.join("\n")
      filename = `codecrate_${order.order_id.replace("#", "")}_codes.txt`
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
      title: "Download Started",
      description: `${order.codes.length} codes exported as ${format.toUpperCase()}`,
    })
  }

  const exportAllOrders = () => {
    const csvContent = [
      "Order ID,Date,User Email,Coupon,Quantity,Unit Price,Total,Status",
      ...filteredOrders.map(
        (order) =>
          `${order.order_id},${formatDate(order.created_at)},${order.user.email},${order.slot_name},${order.quantity},${order.unit_price},${order.total_price},${order.status}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `codecrate_orders_export_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `${filteredOrders.length} orders exported to CSV`,
    })
  }

  const uniqueCoupons = [...new Set(mockAdminOrders.map((o) => o.slot_name))]

  if (isLoading || !user || isLoggingOut) {
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
            <h1 className="text-3xl font-bold text-foreground">All Orders</h1>
            <p className="text-muted-foreground mt-1">View and manage customer purchases</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px] bg-secondary border-border">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={exportAllOrders}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                +{mockOrderStats.orders_today} today
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{mockOrderStats.total_orders.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(mockOrderStats.revenue_today)}</p>
            <p className="text-sm text-muted-foreground">Revenue Today</p>
            <p className="text-xs text-muted-foreground mt-1">{mockOrderStats.orders_today} orders</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{mockOrderStats.total_codes_sold.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Codes Sold</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(mockOrderStats.average_order_value)}</p>
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, user email, or coupon name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-secondary border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={couponFilter} onValueChange={setCouponFilter}>
                <SelectTrigger className="w-[180px] bg-secondary border-border">
                  <SelectValue placeholder="Coupon Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Coupons</SelectItem>
                  {uniqueCoupons.map((coupon) => (
                    <SelectItem key={coupon} value={coupon}>
                      {coupon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] bg-secondary border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount_high">Amount: High to Low</SelectItem>
                  <SelectItem value="amount_low">Amount: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Orders Table - Desktop */}
        <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Order ID</TableHead>
                <TableHead className="text-muted-foreground">Date & Time</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Coupon Name</TableHead>
                <TableHead className="text-muted-foreground text-right">Qty</TableHead>
                <TableHead className="text-muted-foreground text-right">Unit</TableHead>
                <TableHead className="text-muted-foreground text-right">Total</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{order.order_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground">{formatDate(order.created_at)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(order.created_at)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{order.user.email}</TableCell>
                  <TableCell className="text-foreground">{order.slot_name}</TableCell>
                  <TableCell className="text-right text-foreground">{order.quantity}</TableCell>
                  <TableCell className="text-right text-foreground">{formatCurrency(order.unit_price)}</TableCell>
                  <TableCell className="text-right text-foreground font-medium">
                    {formatCurrency(order.total_price)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
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
                          onClick={() => router.push(`/admin/users?highlight=${order.user.id}`)}
                          className="cursor-pointer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
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
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Orders Cards - Mobile */}
        <div className="lg:hidden space-y-4 mb-6">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{order.order_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)} at {formatTime(order.created_at)}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="text-foreground">{order.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coupon</span>
                  <span className="text-foreground">{order.slot_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="text-foreground">{order.quantity} codes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-primary font-medium">{formatCurrency(order.total_price)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-full border-border bg-transparent"
                  onClick={() => {
                    setSelectedOrder(order)
                    setShowOrderDetails(true)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full border-border bg-transparent">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <DropdownMenuItem
                      onClick={() => downloadOrderCodes(order, "csv")}
                      className="cursor-pointer"
                      disabled={order.codes.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadOrderCodes(order, "txt")}
                      className="cursor-pointer"
                      disabled={order.codes.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download TXT
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => copyOrderId(order.order_id)} className="cursor-pointer">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Order ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Orders Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" || couponFilter !== "all"
                ? "Try adjusting your filters to find more orders."
                : "Orders will appear here once customers start purchasing."}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ordersPerPage + 1}-
              {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-full border-border bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 p-0 rounded-full ${
                        currentPage === pageNum ? "bg-primary text-primary-foreground" : "border-border bg-transparent"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border-border bg-transparent"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      <OrderDetailsModal order={selectedOrder} open={showOrderDetails} onOpenChange={setShowOrderDetails} />
    </div>
  )
}
