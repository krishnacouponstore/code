"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { TransactionDetailsModal } from "@/components/admin/transaction-details-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { mockTransactions, revenueStats, type Transaction } from "@/lib/mock-data"
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
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

export default function RevenuePage() {
  const { user, isLoading: authLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "failed" | "refunded">("all")
  const [methodFilter, setMethodFilter] = useState<"all" | "UPI" | "Card" | "NetBanking">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest")
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days" | "all">("all")

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoggingOut) return
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/login")
    }
  }, [user, authLoading, router, isLoggingOut])

  // Calculate stats
  const stats = useMemo(() => {
    const successTxns = transactions.filter((t) => t.status === "success")
    const pendingTxns = transactions.filter((t) => t.status === "pending")
    const refundedFailedTxns = transactions.filter((t) => t.status === "refunded" || t.status === "failed")

    return {
      totalRevenue: revenueStats.total_revenue,
      pendingAmount: pendingTxns.reduce((sum, t) => sum + t.amount, 0),
      successfulCount: revenueStats.successful_transactions,
      refundedFailedCount: refundedFailedTxns.length,
    }
  }, [transactions])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      let startDate: Date
      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }
      result = result.filter((t) => new Date(t.created_at) >= startDate)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(query) ||
          t.user_name.toLowerCase().includes(query) ||
          t.user_email.toLowerCase().includes(query) ||
          t.razorpay_order_id.toLowerCase().includes(query) ||
          t.razorpay_payment_id.toLowerCase().includes(query),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter)
    }

    // Method filter
    if (methodFilter !== "all") {
      result = result.filter((t) => t.method === methodFilter)
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "amount_high":
        result.sort((a, b) => b.amount - a.amount)
        break
      case "amount_low":
        result.sort((a, b) => a.amount - b.amount)
        break
    }

    return result
  }, [transactions, searchQuery, statusFilter, methodFilter, sortBy, dateRange])

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

  const handleStatusChange = (txnId: string, newStatus: Transaction["status"]) => {
    setTransactions(
      transactions.map((t) =>
        t.id === txnId
          ? {
              ...t,
              status: newStatus,
              verified_at: newStatus === "success" ? new Date().toISOString() : t.verified_at,
            }
          : t,
      ),
    )
    toast({
      title: "Status updated",
      description: `Transaction #${txnId} marked as ${newStatus}`,
    })
    setIsDetailsOpen(false)
  }

  const handleRefund = (txnId: string, reason: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === txnId
          ? {
              ...t,
              status: "refunded",
              refunded_at: new Date().toISOString(),
              refund_reason: reason,
            }
          : t,
      ),
    )
    toast({
      title: "Refund issued",
      description: `Transaction #${txnId} has been refunded`,
    })
    setIsDetailsOpen(false)
  }

  const exportToCSV = () => {
    const headers = ["Transaction ID", "Date", "User", "Email", "Amount", "Method", "Order ID", "Payment ID", "Status"]
    const rows = filteredTransactions.map((t) => [
      t.id,
      `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
      t.user_name,
      t.user_email,
      t.amount.toFixed(2),
      t.method,
      t.razorpay_order_id,
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
      description: `${filteredTransactions.length} transactions exported to CSV`,
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

  const getMethodIcon = (method: Transaction["method"]) => {
    switch (method) {
      case "UPI":
        return <Smartphone className="h-4 w-4" />
      case "Card":
        return <CreditCard className="h-4 w-4" />
      case "NetBanking":
        return <Building className="h-4 w-4" />
    }
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
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              All time earnings
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{formatCurrency(stats.pendingAmount)}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Awaiting verification</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.successfulCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Completed transactions
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.refundedFailedCount}</p>
                <p className="text-sm text-muted-foreground">Refunded/Failed</p>
              </div>
            </div>
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" />
              Requires attention
            </p>
          </div>
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
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
            <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as typeof methodFilter)}>
              <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="NetBanking">NetBanking</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
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
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
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
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-mono text-sm text-foreground">#{txn.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-foreground">{formatDate(txn.created_at)}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(txn.created_at)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-foreground">{txn.user_name}</p>
                          <p className="text-xs text-muted-foreground">{txn.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">{formatCurrency(txn.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-foreground">
                          {getMethodIcon(txn.method)}
                          {txn.method}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded max-w-[100px] truncate">
                            {txn.razorpay_order_id}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(txn.razorpay_order_id, txn.id)}
                          >
                            {copiedId === txn.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(txn.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border w-48">
                            <DropdownMenuItem onClick={() => handleViewDetails(txn)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(txn.razorpay_order_id, `order-${txn.id}`)}
                              className="cursor-pointer"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Order ID
                            </DropdownMenuItem>
                            {txn.razorpay_payment_id && (
                              <DropdownMenuItem
                                onClick={() => copyToClipboard(txn.razorpay_payment_id, `pay-${txn.id}`)}
                                className="cursor-pointer"
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Payment ID
                              </DropdownMenuItem>
                            )}
                            {txn.status === "pending" && (
                              <>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(txn.id, "success")}
                                  className="cursor-pointer text-green-500 focus:text-green-500"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Success
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(txn.id, "failed")}
                                  className="cursor-pointer text-red-500 focus:text-red-500"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Mark as Failed
                                </DropdownMenuItem>
                              </>
                            )}
                            {txn.status === "success" && (
                              <>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  onClick={() => handleViewDetails(txn)}
                                  className="cursor-pointer text-orange-500 focus:text-orange-500"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Issue Refund
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
              {filteredTransactions.map((txn) => (
                <div key={txn.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm text-foreground">#{txn.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(txn.created_at)} at {formatTime(txn.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(txn.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(txn)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(txn.razorpay_order_id, `mobile-${txn.id}`)}
                            className="cursor-pointer"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Order ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">{txn.user_name}</p>
                      <p className="text-xs text-muted-foreground">{txn.user_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="text-foreground font-semibold">{formatCurrency(txn.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Method</p>
                      <div className="flex items-center gap-1 text-foreground">
                        {getMethodIcon(txn.method)}
                        {txn.method}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
