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
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { usePurchaseStats, usePurchases } from "@/hooks/use-purchases"
import { getGraphQLClient } from "@/lib/graphql-client"
import { GET_PURCHASE_CODES } from "@/lib/graphql/purchases"
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
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"

const ITEMS_PER_PAGE = 10

export default function PurchaseHistoryPage() {
  const { user, isLoading: authLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: stats, isLoading: statsLoading } = usePurchaseStats()
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases({
    searchQuery,
    dateFilter,
    sortBy,
  })

  const isLoading = authLoading || statsLoading || purchasesLoading

  useEffect(() => {
    if (isLoggingOut) return

    if (!authLoading && !isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)
    }
    if (!authLoading && user?.is_admin) {
      router.push("/admin/dashboard")
    }
  }, [user, authLoading, isAuthenticated, router, pathname, isLoggingOut])

  // Pagination
  const totalPages = Math.ceil(purchases.length / ITEMS_PER_PAGE)
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return purchases.slice(start, start + ITEMS_PER_PAGE)
  }, [purchases, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFilter, sortBy])

  const handleViewCodes = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId)
    setIsModalOpen(true)
  }

  const handleDownload = async (purchaseId: string, orderNumber: string, format: "csv" | "txt") => {
    try {
      const client = getGraphQLClient()
      const result: any = await client.request(GET_PURCHASE_CODES, { purchaseId })
      const purchaseData = result.purchases_by_pk

      if (!purchaseData || !purchaseData.coupons.length) {
        toast({
          title: "No codes found",
          description: "This purchase has no codes available",
          variant: "destructive",
        })
        return
      }

      const date = new Date(purchaseData.created_at).toISOString().split("T")[0].replace(/-/g, "")
      const filename = `codecrate_${orderNumber.replace("#", "")}_${date}`

      if (format === "csv") {
        const csvContent = [
          "Serial No,Coupon Code",
          ...purchaseData.coupons.map((c: any, i: number) => `${i + 1},${c.code}`),
        ].join("\n")

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
        const txtContent = purchaseData.coupons.map((c: any) => c.code).join("\n")
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
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download codes. Please try again.",
        variant: "destructive",
      })
    }
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader walletBalance={user.wallet_balance || 0} userName={user.name} userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Purchase History</h1>
          <p className="text-muted-foreground">View and download your past coupon purchases</p>
        </div>

        {/* Stats Summary - Now uses real stats from GraphQL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.totalOrders || 0}</p>
                )}
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
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.totalCoupons || 0}</p>
                )}
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
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.totalSpent || 0)}</p>
                )}
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
        {purchasesLoading ? (
          /* Loading State */
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : purchases.length === 0 ? (
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
                        <TableCell className="font-medium text-foreground">#{purchase.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{formatDate(purchase.created_at)}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(purchase.created_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{purchase.slot.name}</TableCell>
                        <TableCell className="text-center text-foreground">{purchase.quantity} codes</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(purchase.total_price)}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full border-border bg-transparent"
                              onClick={() => handleViewCodes(purchase.id)}
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
                                  onClick={() => handleDownload(purchase.id, purchase.order_number, "csv")}
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownload(purchase.id, purchase.order_number, "txt")}
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
                      <p className="font-semibold text-foreground">#{purchase.order_number}</p>
                      {getStatusBadge(purchase.status)}
                    </div>
                    <p className="text-foreground font-medium mb-1">{purchase.slot.name}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {purchase.quantity} codes &bull; {formatCurrency(purchase.total_price)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {formatDate(purchase.created_at)} at {formatTime(purchase.created_at)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-border bg-transparent"
                        onClick={() => handleViewCodes(purchase.id)}
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
                          <DropdownMenuItem
                            onClick={() => handleDownload(purchase.id, purchase.order_number, "csv")}
                            className="cursor-pointer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(purchase.id, purchase.order_number, "txt")}
                            className="cursor-pointer"
                          >
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

      {/* View Codes Modal - Now uses purchase ID */}
      <ViewCodesModal
        purchaseId={selectedPurchaseId}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setSelectedPurchaseId(null)
        }}
      />
    </div>
  )
}
