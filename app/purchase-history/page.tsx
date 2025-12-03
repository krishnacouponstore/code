"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ViewCodesModal } from "@/components/purchases/view-codes-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { mockUser, mockPurchaseHistory, mockPurchaseStats, type PurchaseHistoryItem } from "@/lib/mock-data"
import {
  Search,
  ShoppingBag,
  Ticket,
  IndianRupee,
  Eye,
  Download,
  ChevronDown,
  FileText,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils" // Import formatCurrency, formatDate, formatTime

const ITEMS_PER_PAGE = 10

export default function PurchaseHistoryPage() {
  const { user, isLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseHistoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (isLoggingOut) return

    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)
    }
    if (!isLoading && user?.is_admin) {
      router.push("/admin/dashboard")
    }
  }, [user, isLoading, isAuthenticated, router, pathname, isLoggingOut])

  // Filter and sort purchases
  const filteredPurchases = useMemo(() => {
    let result = [...mockPurchaseHistory]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) => p.order_id.toLowerCase().includes(query) || p.slot_name.toLowerCase().includes(query),
      )
    }

    // Date filter
    const now = new Date()
    if (dateFilter === "7days") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter((p) => new Date(p.date) >= weekAgo)
    } else if (dateFilter === "30days") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      result = result.filter((p) => new Date(p.date) >= monthAgo)
    } else if (dateFilter === "3months") {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      result = result.filter((p) => new Date(p.date) >= threeMonthsAgo)
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortBy === "amount") {
      result.sort((a, b) => b.amount - a.amount)
    }

    return result
  }, [searchQuery, dateFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE)
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPurchases.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPurchases, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFilter, sortBy])

  const handleViewCodes = (purchase: PurchaseHistoryItem) => {
    setSelectedPurchase(purchase)
    setIsModalOpen(true)
  }

  const handleDownload = (purchase: PurchaseHistoryItem, format: "csv" | "txt") => {
    const date = new Date(purchase.date).toISOString().split("T")[0].replace(/-/g, "")
    const filename = `codecrate_${purchase.order_id.replace("#", "")}_${date}`

    if (format === "csv") {
      const csvContent = ["Serial No,Coupon Code", ...purchase.codes.map((code, i) => `${i + 1},${code}`)].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${filename}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      const txtContent = purchase.codes.join("\n")
      const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${filename}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    toast({
      title: "Downloaded!",
      description: `${format.toUpperCase()} file has been downloaded`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-primary/20 text-primary border-0">Completed</Badge>
      case "failed":
        return <Badge className="bg-destructive/20 text-destructive border-0">Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-0">Pending</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  const walletBalance = user.is_admin ? 0 : mockUser.wallet_balance

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader walletBalance={walletBalance} userName={user.name} userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Purchase History</h1>
          <p className="text-muted-foreground">View and download your past coupon purchases</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{mockPurchaseStats.total_orders}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Coupons</p>
                <p className="text-2xl font-bold text-foreground">{mockPurchaseStats.total_coupons}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(mockPurchaseStats.total_spent)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or coupon name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border rounded-lg"
            />
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border rounded-lg">
              <SelectValue placeholder="Date filter" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border rounded-lg">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="amount">Amount High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {filteredPurchases.length === 0 ? (
          /* Empty State */
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-secondary mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Purchases Yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start buying coupons to see your purchase history
              </p>
              <Link href="/coupons">
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Browse Coupons
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="bg-card border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-secondary/50 border-border">
                      <TableHead className="text-foreground">Order ID</TableHead>
                      <TableHead className="text-foreground">Date & Time</TableHead>
                      <TableHead className="text-foreground">Coupon Name</TableHead>
                      <TableHead className="text-foreground text-center">Quantity</TableHead>
                      <TableHead className="text-foreground text-right">Amount</TableHead>
                      <TableHead className="text-foreground text-center">Status</TableHead>
                      <TableHead className="text-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-secondary/30 border-border transition-colors">
                        <TableCell className="font-medium text-foreground">{purchase.order_id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{formatDate(purchase.date)}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(purchase.date)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{purchase.slot_name}</TableCell>
                        <TableCell className="text-center text-foreground">{purchase.quantity} codes</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(purchase.amount)}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full border-border bg-transparent"
                              onClick={() => handleViewCodes(purchase)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Codes
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-border bg-transparent"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuItem
                                  onClick={() => handleDownload(purchase, "csv")}
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownload(purchase, "txt")}
                                  className="cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download TXT
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {paginatedPurchases.map((purchase) => (
                <Card key={purchase.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-foreground">{purchase.order_id}</p>
                      {getStatusBadge(purchase.status)}
                    </div>
                    <p className="text-foreground font-medium mb-1">{purchase.slot_name}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {purchase.quantity} codes &bull; {formatCurrency(purchase.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {formatDate(purchase.date)} at {formatTime(purchase.date)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-border bg-transparent"
                        onClick={() => handleViewCodes(purchase)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Codes
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-full border-border bg-transparent">
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => handleDownload(purchase, "csv")} className="cursor-pointer">
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(purchase, "txt")} className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2" />
                            Download TXT
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-border bg-transparent"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-border bg-transparent"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* View Codes Modal */}
      <ViewCodesModal purchase={selectedPurchase} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
