"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { getSlotCoupons, deleteCoupon } from "@/app/actions/slots"

interface Coupon {
  id: string
  code: string
  is_sold: boolean
  sold_at: string | null
  created_at: string
  user_profile?: {
    user: {
      email: string
      displayName: string
    }
  } | null
}

interface ViewCouponsDialogProps {
  slotId: string
  slotName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewCouponsDialog({ slotId, slotName, open, onOpenChange }: ViewCouponsDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [page, setPage] = useState(0)
  const [pageSize] = useState(50)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "sold" | "unsold">("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string; is_sold: boolean } | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch coupons
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["slot-coupons", slotId, page, pageSize, debouncedSearch, filterStatus],
    queryFn: async () => {
      const result = await getSlotCoupons(slotId, {
        limit: pageSize,
        offset: page * pageSize,
        search: debouncedSearch || undefined,
        filterStatus,
      })
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    enabled: open,
  })

  // Delete mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const result = await deleteCoupon(couponId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slot-coupons", slotId] })
      queryClient.invalidateQueries({ queryKey: ["slots"] })
      queryClient.invalidateQueries({ queryKey: ["slot-performance"] })
      toast({
        title: "Coupon deleted",
        description: `Code "${data.deletedCoupon?.code}" has been removed.`,
      })
      setDeleteDialogOpen(false)
      setCouponToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      })
    },
  })

  const coupons: Coupon[] = data?.coupons || []
  const totalCoupons = data?.totalCount || 0
  const totalPages = Math.ceil(totalCoupons / pageSize)

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete({ id: coupon.id, code: coupon.code, is_sold: coupon.is_sold })
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (couponToDelete) {
      deleteCouponMutation.mutate(couponToDelete.id)
    }
  }

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPage(0)
      setSearch("")
      setDebouncedSearch("")
      setFilterStatus("all")
    }
  }, [open])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">Coupon Codes - {slotName}</DialogTitle>
            <DialogDescription>View, search, and manage all uploaded coupon codes</DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-border">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by coupon code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus("all")
                  setPage(0)
                }}
                className={filterStatus === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "unsold" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus("unsold")
                  setPage(0)
                }}
                className={`gap-1 ${filterStatus === "unsold" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
              >
                <CheckCircle className="h-3 w-3" />
                Available
              </Button>
              <Button
                variant={filterStatus === "sold" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus("sold")
                  setPage(0)
                }}
                className={`gap-1 ${filterStatus === "sold" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
              >
                <XCircle className="h-3 w-3" />
                Sold
              </Button>
            </div>
          </div>

          {/* Coupon List */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">Failed to load coupons</div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {search || filterStatus !== "all" ? "No coupons match your search" : "No coupons uploaded yet"}
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    {/* Left: Code & Status */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Coupon Code */}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-medium text-sm text-foreground truncate">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {format(new Date(coupon.created_at), "dd MMM yyyy")}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {coupon.is_sold ? (
                          <Badge variant="secondary" className="bg-red-600/20 text-red-400 border-red-600/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Sold
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>

                      {/* Sold Info */}
                      {coupon.is_sold && coupon.user_profile && (
                        <div className="hidden md:block text-right">
                          <p className="text-xs text-muted-foreground">Sold to: {coupon.user_profile.user.email}</p>
                          {coupon.sold_at && (
                            <p className="text-xs text-muted-foreground">
                              on {format(new Date(coupon.sold_at), "dd MMM yyyy")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-400 hover:bg-red-950/20 ml-2"
                      onClick={() => handleDeleteClick(coupon)}
                      disabled={deleteCouponMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalCoupons)} of {totalCoupons}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Coupon?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {couponToDelete?.is_sold ? (
                  <>
                    <span className="text-red-500 font-bold block mb-2">
                      Warning: This coupon has been SOLD to a customer!
                    </span>
                    <p className="text-muted-foreground mb-2">Deleting this coupon will:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-400 text-sm mb-4">
                      <li>Remove it from the customer&apos;s purchased coupons</li>
                      <li>Customer will lose access to this code</li>
                      <li>This may cause customer complaints</li>
                    </ul>
                  </>
                ) : (
                  <p className="mb-4">Are you sure you want to delete this coupon code?</p>
                )}
                <p className="font-mono text-foreground bg-secondary/50 p-2 rounded">{couponToDelete?.code}</p>
                <p className="text-red-500 text-sm mt-4">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCouponMutation.isPending} className="bg-secondary border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteCouponMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCouponMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Coupon"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
