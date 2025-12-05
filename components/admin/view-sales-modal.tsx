"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { useSlotSales, type Slot } from "@/hooks/use-slots"
import {
  IndianRupee,
  ShoppingCart,
  Package,
  ExternalLink,
  BarChart3,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface ViewSalesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: Slot | null
  onViewAllOrders: () => void
}

export function ViewSalesModal({ open, onOpenChange, slot, onViewAllOrders }: ViewSalesModalProps) {
  const { data: salesData, isLoading } = useSlotSales(slot?.id || null)

  if (!slot) return null

  const stockPercentage = slot.total_uploaded > 0 ? Math.round((slot.available_stock / slot.total_uploaded) * 100) : 0

  const stockStatus = stockPercentage > 20 ? "healthy" : stockPercentage > 0 ? "low" : "out"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Sales Analytics - {slot.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{slot.description}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Total Sold</p>
                <p className="text-xl font-bold text-foreground">{slot.total_sold.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">codes sold</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Available Stock</p>
                <p className="text-xl font-bold text-foreground">{slot.available_stock.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">codes remaining</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Package className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Total Uploaded</p>
                <p className="text-xl font-bold text-foreground">{slot.total_uploaded.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Pricing Tiers</p>
                <p className="text-xl font-bold text-foreground">{slot.pricing_tiers?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">configured</p>
              </div>
            </div>

            {/* Pricing Tiers */}
            {slot.pricing_tiers && slot.pricing_tiers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Pricing Tiers</h3>
                <div className="bg-secondary/30 rounded-xl overflow-hidden border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Tier</TableHead>
                        <TableHead className="text-muted-foreground">Quantity Range</TableHead>
                        <TableHead className="text-muted-foreground text-right">Unit Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slot.pricing_tiers.map((tier, index) => (
                        <TableRow key={index} className="border-border">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">Tier {index + 1}</p>
                              {tier.label && <p className="text-xs text-muted-foreground">{tier.label}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {tier.min_quantity} - {tier.max_quantity ?? "∞"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {formatCurrency(tier.unit_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Recent Sales */}
            {salesData && salesData.sales.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Recent Sales</h3>
                  <Button variant="link" size="sm" className="text-primary h-auto p-0" onClick={onViewAllOrders}>
                    View All Orders
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <div className="bg-secondary/30 rounded-xl overflow-hidden border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Code</TableHead>
                        <TableHead className="text-muted-foreground">Customer</TableHead>
                        <TableHead className="text-muted-foreground text-right">Sold At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.sales.slice(0, 10).map((sale: any, index: number) => (
                        <TableRow key={index} className="border-border">
                          <TableCell className="font-mono text-foreground">{sale.code}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {sale.user?.user?.email || sale.user?.user?.displayName || "Unknown"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {sale.sold_at ? new Date(sale.sold_at).toLocaleDateString() : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Stock Status</h3>
              <div
                className={`rounded-xl border-2 p-4 ${
                  stockStatus === "healthy"
                    ? "border-green-500/30 bg-green-500/5"
                    : stockStatus === "low"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {stockStatus === "healthy" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : stockStatus === "low" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium text-foreground capitalize">
                      {stockStatus === "healthy"
                        ? "Healthy Stock"
                        : stockStatus === "low"
                          ? "Low Stock"
                          : "Out of Stock"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {slot.available_stock.toLocaleString()} / {slot.total_uploaded.toLocaleString()} codes
                  </span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                      stockStatus === "healthy"
                        ? "bg-green-500"
                        : stockStatus === "low"
                          ? "bg-yellow-500"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stockPercentage}% remaining</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={onViewAllOrders}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View All Orders
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
