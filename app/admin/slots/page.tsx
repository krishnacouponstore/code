"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { SlotFormModal } from "@/components/admin/slot-form-modal"
import { DeleteSlotDialog } from "@/components/admin/delete-slot-dialog"
import { UploadCodesModal } from "@/components/admin/upload-codes-modal"
import { ViewSalesModal } from "@/components/admin/view-sales-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useSlots, useDeleteSlot, useToggleSlotPublish, useUploadCodes, type Slot } from "@/hooks/use-slots"
import { formatCurrency } from "@/lib/utils"
import {
  Plus,
  MoreVertical,
  Pencil,
  Upload,
  BarChart3,
  Eye,
  EyeOff,
  Trash2,
  Package,
  CheckCircle,
  FileText,
  AlertTriangle,
  PackageX,
  Loader2,
} from "lucide-react"

export default function ManageCouponsPage() {
  const { user, isLoading: authLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const { data: slots = [], isLoading: slotsLoading, error: slotsError, refetch } = useSlots()

  const deleteSlotMutation = useDeleteSlot()
  const togglePublishMutation = useToggleSlotPublish()
  const uploadCodesMutation = useUploadCodes()

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isViewSalesModalOpen, setIsViewSalesModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  useEffect(() => {
    if (isLoggingOut) return
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/login")
    }
  }, [user, authLoading, router, isLoggingOut])

  if (authLoading || !user?.is_admin || isLoggingOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Calculate stats
  const totalSlots = slots.length
  const publishedSlots = slots.filter((s) => s.is_published).length
  const unpublishedSlots = totalSlots - publishedSlots
  const totalStock = slots.reduce((acc, s) => acc + s.available_stock, 0)

  const getPriceRange = (slot: Slot) => {
    if (!slot.pricing_tiers || slot.pricing_tiers.length === 0) return "No pricing"
    const prices = slot.pricing_tiers.map((t) => t.unit_price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    if (min === max) return formatCurrency(min)
    return `${formatCurrency(min)} - ${formatCurrency(max)}`
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
          <PackageX className="h-3 w-3" />
          Out of Stock
        </span>
      )
    }
    if (stock <= 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </span>
      )
    }
    return null
  }

  const handleCreateSlot = () => {
    setSelectedSlot(null)
    setIsFormModalOpen(true)
  }

  const handleEditSlot = (slot: Slot) => {
    setSelectedSlot(slot)
    setIsFormModalOpen(true)
  }

  const handleDeleteSlot = (slot: Slot) => {
    setSelectedSlot(slot)
    setIsDeleteDialogOpen(true)
  }

  const handleUploadCodes = (slot: Slot) => {
    setSelectedSlot(slot)
    setIsUploadModalOpen(true)
  }

  const handleTogglePublish = async (slot: Slot) => {
    const result = await togglePublishMutation.mutateAsync({
      id: slot.id,
      is_published: !slot.is_published,
    })

    if (result.success) {
      toast({
        title: slot.is_published ? "Coupon unpublished" : "Coupon published",
        description: `"${slot.name}" is now ${slot.is_published ? "hidden from" : "visible to"} customers.`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update coupon",
        variant: "destructive",
      })
    }
  }

  const handleFormSuccess = () => {
    refetch()
  }

  const handleConfirmDelete = async () => {
    if (selectedSlot) {
      const result = await deleteSlotMutation.mutateAsync(selectedSlot.id)

      if (result.success) {
        toast({
          title: "Coupon deleted",
          description: `"${selectedSlot.name}" has been permanently deleted.`,
          variant: "destructive",
        })
        setSelectedSlot(null)
        setIsDeleteDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete coupon",
          variant: "destructive",
        })
      }
    }
  }

  const handleUploadSuccess = (slotId: string, codesCount: number) => {
    refetch()
    toast({
      title: "Codes uploaded successfully",
      description: `${codesCount} codes have been added to "${selectedSlot?.name}".`,
    })
  }

  const handleViewSales = (slot: Slot) => {
    setSelectedSlot(slot)
    setIsViewSalesModalOpen(true)
  }

  const handleViewAllOrders = () => {
    setIsViewSalesModalOpen(false)
    router.push("/admin/orders")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Coupons</h1>
            <p className="text-muted-foreground mt-1">Create and manage coupon categories and upload codes</p>
          </div>
          <Button
            onClick={handleCreateSlot}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Coupon
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSlots}</p>
                <p className="text-sm text-muted-foreground">Total Coupons</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{publishedSlots}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalStock.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Stock</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{unpublishedSlots}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {slotsLoading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading coupons...</p>
          </div>
        ) : slots.length === 0 ? (
          // Empty State
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Coupons Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first coupon category to start selling</p>
            <Button
              onClick={handleCreateSlot}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Coupon
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Coupon Name</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground">Stock</TableHead>
                    <TableHead className="text-muted-foreground">Price Range</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((slot) => (
                    <TableRow key={slot.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-medium text-foreground">{slot.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{slot.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">
                              {slot.available_stock.toLocaleString()} / {slot.total_uploaded.toLocaleString()}
                            </span>
                            {slot.available_stock === 0 && slot.total_uploaded === 0 && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleUploadCodes(slot)}
                                className="text-primary h-auto p-0 text-xs"
                              >
                                Upload Codes
                              </Button>
                            )}
                            {slot.total_uploaded > 0 && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleUploadCodes(slot)}
                                className="text-muted-foreground hover:text-primary h-auto p-0 text-xs"
                              >
                                + Upload more
                              </Button>
                            )}
                          </div>
                          {getStockBadge(slot.available_stock)}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{getPriceRange(slot)}</TableCell>
                      <TableCell>
                        {slot.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            <Eye className="h-3 w-3" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            <EyeOff className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border w-48">
                            <DropdownMenuItem onClick={() => handleEditSlot(slot)} className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Coupon
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUploadCodes(slot)} className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Codes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewSales(slot)} className="cursor-pointer">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Sales
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => handleTogglePublish(slot)}
                              className="cursor-pointer"
                              disabled={togglePublishMutation.isPending}
                            >
                              {slot.is_published ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => handleDeleteSlot(slot)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Coupon
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {slots.map((slot) => (
                <div key={slot.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{slot.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{slot.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border w-48">
                        <DropdownMenuItem onClick={() => handleEditSlot(slot)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Coupon
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUploadCodes(slot)} className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Codes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewSales(slot)} className="cursor-pointer">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Sales
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(slot)} className="cursor-pointer">
                          {slot.is_published ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                          onClick={() => handleDeleteSlot(slot)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Coupon
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock</p>
                      <p className="font-medium text-foreground">
                        {slot.available_stock.toLocaleString()} / {slot.total_uploaded.toLocaleString()}
                      </p>
                      {getStockBadge(slot.available_stock)}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium text-foreground">{getPriceRange(slot)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    {slot.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        <Eye className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                    {slot.total_uploaded === 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleUploadCodes(slot)}
                        className="text-primary h-auto p-0 text-xs"
                      >
                        Upload Codes
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <SlotFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        slot={selectedSlot}
        onSuccess={handleFormSuccess}
      />

      <DeleteSlotDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        slotName={selectedSlot?.name || ""}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteSlotMutation.isPending}
      />

      <UploadCodesModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        slot={selectedSlot}
        onSuccess={handleUploadSuccess}
      />

      <ViewSalesModal
        open={isViewSalesModalOpen}
        onOpenChange={setIsViewSalesModalOpen}
        slot={selectedSlot}
        onViewAllOrders={handleViewAllOrders}
      />
    </div>
  )
}
