"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ViewCodesModal } from "@/components/purchases/view-codes-modal"
import Image from "next/image"
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
import { useSystemSettings } from "@/hooks/use-system-settings"
import { getGraphQLClient } from "@/lib/graphql-client"
import { GET_PURCHASE_CODES } from "@/lib/graphql/purchases"
import { hasAuthCookie } from "@/lib/check-auth-cookie"
import {
  Search,
  ShoppingBag,
  Ticket,
  Eye,
  Download,
  ChevronDown,
  FileText,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { formatDate, formatTime } from "@/lib/utils"

const ITEMS_PER_PAGE = 10

export default function PurchaseHistoryPage() {
  const { user, isLoading: authLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { formatPrice, CurrencyIcon } = useSystemSettings()

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

    // Don't redirect if auth cookie exists (session is being restored)
    if (!authLoading && !isAuthenticated && !hasAuthCookie()) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }

    // Redirect admin to admin dashboard with toast
    if (!authLoading && user?.is_admin) {
      toast({
        title: "Access Restricted",
        description: "Admin users should use the admin dashboard",
        variant: "default",
        duration: 5000,
      })
      router.push("/admin/dashboard")
    }
  }, [user, authLoading, isAuthenticated, router, pathname, isLoggingOut, toast])

  // Block rendering if admin (before showing user content)
  if (!authLoading && user?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

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
      const filename = `coupx_${orderNumber.replace("#", "")}_${date}`

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-32">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Purchase History</h1>
          <p className="text-gray-500 dark:text-gray-400">View and download your past coupon purchases</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-slate-700" />
                ) : (
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{stats?.totalOrders || 0}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-500/20 group-hover:scale-110 transition-transform">
                <Ticket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Coupons</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-slate-700" />
                ) : (
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{stats?.totalCoupons || 0}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-500/20 group-hover:scale-110 transition-transform">
                <CurrencyIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20 bg-gray-200 dark:bg-slate-700" />
                ) : (
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{formatPrice(stats?.totalSpent || 0)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by order ID or coupon name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 backdrop-blur-xl"
            />
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-2xl backdrop-blur-xl">
              <SelectValue placeholder="Date filter" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-2xl backdrop-blur-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="amount">Amount High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {purchasesLoading ? (
          /* Loading State */
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-100/50 dark:hover:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Order ID</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Store</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Date & Time</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Coupon Name</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-center">Quantity</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Amount</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-center">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24 bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : purchases.length === 0 ? (
          /* Empty State */
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="p-6 rounded-3xl bg-gray-100 dark:bg-slate-700/50 mb-6">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Purchases Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                Start buying coupons to see your purchase history
              </p>
              <Link href="/store">
                <Button className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">
                  Browse Store
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-100/50 dark:hover:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Order ID</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Store</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Date & Time</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Coupon Name</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-center">Quantity</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Amount</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-center">Status</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 border-b border-gray-200 dark:border-slate-700 transition-colors">
                        <TableCell className="font-semibold text-gray-900 dark:text-white">#{purchase.order_number}</TableCell>
                        <TableCell>
                          {purchase.slot.store ? (
                            <Link href={`/store/${purchase.slot.store.slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                              {purchase.slot.store.logo_url && (
                                <Image
                                  src={purchase.slot.store.logo_url}
                                  alt={purchase.slot.store.name}
                                  width={32}
                                  height={32}
                                  className="rounded-lg object-cover"
                                />
                              )}
                              <span className="text-gray-900 dark:text-white font-medium">{purchase.slot.store.name}</span>
                            </Link>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-gray-900 dark:text-white">{formatDate(purchase.created_at)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(purchase.created_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">{purchase.slot.name}</TableCell>
                        <TableCell className="text-center text-gray-900 dark:text-white">{purchase.quantity} codes</TableCell>
                        <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                          {formatPrice(purchase.total_price)}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                              onClick={() => handleViewCodes(purchase.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl">
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
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {paginatedPurchases.map((purchase) => (
                <div key={purchase.id} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-3xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-semibold text-gray-900 dark:text-white">#{purchase.order_number}</p>
                    {getStatusBadge(purchase.status)}
                  </div>

                  {/* Store Info */}
                  {purchase.slot.store && (
                    <Link href={`/store/${purchase.slot.store.slug}`} className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                      {purchase.slot.store.logo_url && (
                        <Image
                          src={purchase.slot.store.logo_url}
                          alt={purchase.slot.store.name}
                          width={40}
                          height={40}
                          className="rounded-xl object-cover"
                        />
                      )}
                      <span className="text-gray-900 dark:text-white font-medium">{purchase.slot.store.name}</span>
                    </Link>
                  )}

                  <p className="text-gray-900 dark:text-white font-medium mb-2">{purchase.slot.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {purchase.quantity} codes &bull; {formatPrice(purchase.total_price)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {formatDate(purchase.created_at)} at {formatTime(purchase.created_at)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                      onClick={() => handleViewCodes(purchase.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Codes
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <Download className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl">
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
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
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
