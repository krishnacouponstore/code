"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { SlotFormModal } from "@/components/admin/slot-form-modal"
import { DeleteSlotDialog } from "@/components/admin/delete-slot-dialog"
import { UploadCodesModal } from "@/components/admin/upload-codes-modal"
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
import { mockAdminSlots, type AdminSlot } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import {
  Plus,
  MoreVertical,
  Pencil,
  DollarSign,
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
} from "lucide-react"

export default function ManageCouponsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [slots, setSlots] = useState<AdminSlot[]>(mockAdminSlots)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AdminSlot | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  if (authLoading || !user?.is_admin) {
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

  const getPriceRange = (slot: AdminSlot) => {
    if (slot.pricing_tiers.length === 0) return "No pricing"
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

  const handleEditSlot = (slot: AdminSlot) => {
    setSelectedSlot(slot)
    setIsFormModalOpen(true)
  }

  const handleDeleteSlot = (slot: AdminSlot) => {
    setSelectedSlot(slot)
    setIsDeleteDialogOpen(true)
  }

  const handleUploadCodes = (slot: AdminSlot) => {
    setSelectedSlot(slot)
    setIsUploadModalOpen(true)
  }

  const handleTogglePublish = (slot: AdminSlot) => {
    setSlots(slots.map((s) => (s.id === slot.id ? { ...s, is_published: !s.is_published } : s)))
    toast({
      title: slot.is_published ? "Coupon unpublished" : "Coupon published",
      description: `"${slot.name}" is now ${slot.is_published ? "hidden from" : "visible to"} customers.`,
    })
  }

  const handleFormSubmit = (data: {
    name: string
    description: string
    image_url: string
    is_published: boolean
    pricing_tiers: AdminSlot["pricing_tiers"]
    codes_to_upload: string[]
  }) => {
    if (selectedSlot) {
      // Edit existing slot
      setSlots(
        slots.map((s) =>
          s.id === selectedSlot.id
            ? {
                ...s,
                name: data.name,
                description: data.description,
                image_url: data.image_url || null,
                is_published: data.is_published,
                pricing_tiers: data.pricing_tiers,
              }
            : s,
        ),
      )
      toast({
        title: "Coupon updated",
        description: `"${data.name}" has been updated successfully.`,
      })
    } else {
      // Create new slot
      const codesCount = data.codes_to_upload?.length || 0
      const newSlot: AdminSlot = {
        id: String(Date.now()),
        name: data.name,
        description: data.description,
        image_url: data.image_url || null,
        is_published: data.is_published,
        available_stock: codesCount,
        total_uploaded: codesCount,
        total_sold: 0,
        created_at: new Date().toISOString().split("T")[0],
        pricing_tiers: data.pricing_tiers,
      }
      setSlots([...slots, newSlot])
      toast({
        title: "Coupon created",
        description:
          codesCount > 0
            ? `"${data.name}" created with ${codesCount} codes uploaded.`
            : `"${data.name}" has been created. You can upload codes later.`,
      })
    }
  }

  const handleConfirmDelete = () => {
    if (selectedSlot) {
      setSlots(slots.filter((s) => s.id !== selectedSlot.id))
      toast({
        title: "Coupon deleted",
        description: `"${selectedSlot.name}" has been permanently deleted.`,
        variant: "destructive",
      })
      setSelectedSlot(null)
    }
  }

  const handleUploadSuccess = (slotId: string, codesCount: number) => {
    setSlots(
      slots.map((s) =>
        s.id === slotId
          ? { ...s, available_stock: s.available_stock + codesCount, total_uploaded: s.total_uploaded + codesCount }
          : s,
      ),
    )
    toast({
      title: "Codes uploaded successfully",
      description: `${codesCount} codes have been added to "${selectedSlot?.name}".`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header - Updated to use "Coupon" terminology */}
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

        {/* Stats Summary - Updated labels to use "Coupon" terminology */}
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

        {/* Coupons Table */}
        {slots.length === 0 ? (
          // Empty State - Updated to use "Coupon" terminology
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
            {/* Desktop Table - Updated header to use "Coupon Name" */}
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
                            {slot.available_stock === 0 && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleUploadCodes(slot)}
                                className="text-primary h-auto p-0 text-xs"
                              >
                                Upload Codes
                              </Button>
                            )}
                            {slot.available_stock > 0 && (
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
                            <DropdownMenuItem className="cursor-pointer">
                              <DollarSign className="mr-2 h-4 w-4" />
                              Manage Pricing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUploadCodes(slot)} className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Codes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Sales
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards - Updated to use "Coupon" terminology */}
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

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock</p>
                      <p className="text-foreground font-medium">
                        {slot.available_stock.toLocaleString()} / {slot.total_uploaded.toLocaleString()}
                      </p>
                      {getStockBadge(slot.available_stock)}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price Range</p>
                      <p className="text-foreground font-medium">{getPriceRange(slot)}</p>
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
                    <span className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(slot.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
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
        onSubmit={handleFormSubmit}
      />

      <DeleteSlotDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        slot={selectedSlot}
        onConfirm={handleConfirmDelete}
      />

      <UploadCodesModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        slot={selectedSlot}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
