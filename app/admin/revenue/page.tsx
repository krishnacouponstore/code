"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { TransactionDetailsModal } from "@/components/admin/transaction-details-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  useRevenueStats,
  useTransactions,
  useUpdateTransactionStatus,
  useRefundTransaction,
  type Transaction,
} from "@/hooks/use-admin-transactions"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  MoreVertical,
  Eye,
  Copy,
  Check,
  Download,
  CreditCard,
  Smartphone,
  Building,
  User,
  Settings,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function RevenuePage() {
  const { user, isLoading: authLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "failed" | "refunded">("all")
  const [methodFilter, setMethodFilter] = useState<"all" | "UPI" | "Card" | "NetBanking" | "Admin">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest")
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days" | "all">("all")

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: stats, isLoading: statsLoading } = useRevenueStats(dateRange)
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    method: methodFilter,
    sortBy,
    dateRange,
  })

  const updateStatusMutation = useUpdateTransactionStatus()
  const refundMutation = useRefundTransaction()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (isLoggingOut) return
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/login")
    }
  }, [user, authLoading, router, isLoggingOut])

  const transactions = transactionsData?.transactions || []
  const totalTransactions = transactionsData?.total || 0
  const totalPages = Math.ceil(totalTransactions / pageSize)

  if (authLoading || !user?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: "Copied!",
      description: "ID copied to clipboard",
    })
  }

  const handleViewDetails = (txn: Transaction) => {
    setSelectedTransaction(txn)
    setIsDetailsOpen(true)
  }

  const handleStatusChange = async (txnId: string, newStatus: "success" | "failed") => {
    const result = await updateStatusMutation.mutateAsync({ id: txnId, status: newStatus })
    if (result.success) {
      toast({
        title: "Status updated",
        description: `Transaction marked as ${newStatus}`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update status",
        variant: "destructive",
      })
    }
    setIsDetailsOpen(false)
  }

  const handleRefund = async (txnId: string, reason: string) => {
    const txn = transactions.find((t) => t.id === txnId)
    if (!txn) return

    const result = await refundMutation.mutateAsync({
      id: txnId,
      userId: txn.user.id,
      amount: txn.amount,
    })

    if (result.success) {
      toast({
        title: "Refund issued",
        description: `Transaction has been refunded`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to process refund",
        variant: "destructive",
      })
    }
    setIsDetailsOpen(false)
  }

  const exportToCSV = () => {
    const headers = ["Transaction ID", "Date", "User", "Email", "Amount", "Method", "Order ID", "Payment ID", "Status"]
    const rows = transactions.map((t) => [
      t.transaction_id || t.id,
      `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
      t.user.name,
      t.user.email,
      t.amount.toFixed(2),
      t.payment_method || "-",
      t.razorpay_order_id || "-",
      t.razorpay_payment_id || "-",
      t.status,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `${transactions.length} transactions exported to CSV`,
    })
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
            <CheckCircle className="h-3 w-3" />
            Success
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        )
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
            <RotateCcw className="h-3 w-3" />
            Refunded
          </span>
        )
    }
  }

  const getMethodIcon = (method: string | null) => {
    if (!method) return <CreditCard className="h-4 w-4" />
    const m = method.toLowerCase()
    if (m === "upi") return <Smartphone className="h-4 w-4" />
    if (m === "card") return <CreditCard className="h-4 w-4" />
    if (m === "netbanking") return <Building className="h-4 w-4" />
    if (m.includes("admin")) return <Settings className="h-4 w-4" />
    return <CreditCard className="h-4 w-4" />
  }

  const getMethodName = (method: string | null) => {
    if (!method) return "Unknown"
    const m = method.toLowerCase()
    if (m === "upi") return "UPI"
    if (m === "card") return "Card"
    if (m === "netbanking") return "NetBanking"
    if (m === "admin_credit") return "Admin Credit"
    if (m === "admin_debit") return "Admin Debit"
    if (m === "admin_adjustment") return "Admin"
    return method
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revenue & Transactions</h1>
            <p className="text-muted-foreground mt-1">Track all wallet top-ups and payment activity</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={dateRange}
              onValueChange={(v) => {
                setDateRange(v as typeof dateRange)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline" className="border-border bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-6">
                    <Skeleton className="h-10 w-10 rounded-xl mb-4" />
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xs text-emerald-400 mt-1">
                    ↗{" "}
                    {dateRange === "today"
                      ? "Today"
                      : dateRange === "7days"
                        ? "Last 7 days"
                        : dateRange === "30days"
                          ? "Last 30 days"
                          : "All time"}{" "}
                    earnings
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">
                    ₹{(stats?.pendingAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats?.successfulCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-xs text-emerald-400 mt-1">
                    ✓{" "}
                    {dateRange === "today"
                      ? "Today"
                      : dateRange === "7days"
                        ? "Last 7 days"
                        : dateRange === "30days"
                          ? "Last 30 days"
                          : "All time"}{" "}
                    completed
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats?.refundedFailedCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Failed/Refunded</p>
                  <p className="text-xs text-red-400 mt-1">
                    {dateRange === "today"
                      ? "Today"
                      : dateRange === "7days"
                        ? "Last 7 days"
                        : dateRange === "30days"
                          ? "Last 30 days"
                          : "All time"}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, transaction ID, or payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as typeof statusFilter)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[130px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={methodFilter}
              onValueChange={(v) => {
                setMethodFilter(v as typeof methodFilter)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="NetBanking">NetBanking</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v as typeof sortBy)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[160px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="amount_high">Amount High to Low</SelectItem>
                <SelectItem value="amount_low">Amount Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {totalTransactions} transaction{totalTransactions !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Transactions Table */}
        {transactionsLoading ? (
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" || methodFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Transactions will appear here once users add balance"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">TXN ID</TableHead>
                    <TableHead className="text-muted-foreground">Date & Time</TableHead>
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Method</TableHead>
                    <TableHead className="text-muted-foreground">Razorpay ID</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-mono text-sm text-foreground">
                        {txn.transaction_id || `#${txn.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-foreground">{formatDate(txn.created_at)}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(txn.created_at)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-foreground">{txn.user.name}</p>
                          <p className="text-xs text-muted-foreground">{txn.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className={`font-semibold ${txn.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {txn.amount >= 0 ? "+" : ""}
                        {formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-foreground">
                          {getMethodIcon(txn.payment_method)}
                          {getMethodName(txn.payment_method)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {txn.razorpay_order_id ? (
                          <div className="flex items-center gap-1">
                            <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded max-w-[100px] truncate">
                              {txn.razorpay_order_id}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(txn.razorpay_order_id!, txn.id)}
                            >
                              {copiedId === txn.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(txn.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => handleViewDetails(txn)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(txn.transaction_id || txn.id, `copy-${txn.id}`)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy TXN ID
                            </DropdownMenuItem>
                            {txn.status === "pending" && (
                              <>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem onClick={() => handleStatusChange(txn.id, "success")}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Mark Success
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(txn.id, "failed")}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Mark Failed
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {transactions.map((txn) => (
                <div key={txn.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm text-foreground">
                        {txn.transaction_id || `#${txn.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(txn.created_at)} at {formatTime(txn.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(txn.status)}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">{txn.user.name}</p>
                        <p className="text-xs text-muted-foreground">{txn.user.email}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${txn.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {txn.amount >= 0 ? "+" : ""}
                      {formatCurrency(txn.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getMethodIcon(txn.payment_method)}
                      {getMethodName(txn.payment_method)}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(txn)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="border-border"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="border-border"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onStatusChange={handleStatusChange}
        onRefund={handleRefund}
      />
    </div>
  )
}
