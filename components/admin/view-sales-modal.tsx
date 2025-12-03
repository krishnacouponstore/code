"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import type { SalesData } from "@/lib/mock-data"
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Calculator,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Upload,
  ExternalLink,
  TrendingUp,
  BarChart3,
} from "lucide-react"

interface ViewSalesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salesData: SalesData | null
  onUploadCodes: () => void
  onViewAllOrders: () => void
}

export function ViewSalesModal({ open, onOpenChange, salesData, onUploadCodes, onViewAllOrders }: ViewSalesModalProps) {
  if (!salesData) return null

  const { overview, tier_breakdown, recent_sales, stock_status, sales_trend } = salesData

  const getStockStatusIcon = () => {
    switch (stock_status.status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "low":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "out":
        return <XCircle className="h-5 w-5 text-destructive" />
    }
  }

  const getProgressColor = () => {
    switch (stock_status.status) {
      case "healthy":
        return "bg-green-500"
      case "low":
        return "bg-yellow-500"
      case "out":
        return "bg-destructive"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Sales Analytics - {salesData.coupon_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{salesData.description}</p>
        </DialogHeader>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(overview.total_revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Coupons Sold</p>
            <p className="text-xl font-bold text-foreground">{overview.units_sold.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{overview.remaining_stock.toLocaleString()} remaining</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-xl font-bold text-foreground">{overview.total_orders.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg {overview.avg_order_size} per order</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Avg. Unit Price</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(overview.avg_unit_price)}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on pricing tiers</p>
          </div>
        </div>

        {/* Sales Trend Summary */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Sales Trend
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-foreground">{formatCurrency(sales_trend.last_7_days.revenue)}</p>
              <p className="text-xs text-muted-foreground">Last 7 days ({sales_trend.last_7_days.orders} orders)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-foreground">{formatCurrency(sales_trend.last_30_days.revenue)}</p>
              <p className="text-xs text-muted-foreground">Last 30 days ({sales_trend.last_30_days.orders} orders)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-foreground">{formatCurrency(sales_trend.all_time.revenue)}</p>
              <p className="text-xs text-muted-foreground">All time ({sales_trend.all_time.orders} orders)</p>
            </div>
          </div>
        </div>

        {/* Sales by Pricing Tier */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Sales by Pricing Tier</h3>
          <div className="bg-secondary/30 rounded-xl overflow-hidden border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Pricing Tier</TableHead>
                  <TableHead className="text-muted-foreground text-right">Quantity</TableHead>
                  <TableHead className="text-muted-foreground text-right">Orders</TableHead>
                  <TableHead className="text-muted-foreground text-right">Unit Price</TableHead>
                  <TableHead className="text-muted-foreground text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tier_breakdown.map((tier, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{tier.tier_label}</p>
                        <p className="text-xs text-muted-foreground">{tier.tier_description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-foreground">{tier.quantity_sold.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-foreground">{tier.orders_count}</TableCell>
                    <TableCell className="text-right text-foreground">{formatCurrency(tier.unit_price)}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatCurrency(tier.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Sales */}
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
                  <TableHead className="text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-muted-foreground text-right">Quantity</TableHead>
                  <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                  <TableHead className="text-muted-foreground text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_sales.map((sale, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell className="font-mono text-foreground">#{sale.order_number}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.customer_email}</TableCell>
                    <TableCell className="text-right text-foreground">{sale.quantity}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatCurrency(sale.amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{sale.created_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Stock Status */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Stock Status</h3>
          <div
            className={`rounded-xl border-2 p-4 ${stock_status.status === "healthy" ? "border-green-500/30 bg-green-500/5" : stock_status.status === "low" ? "border-yellow-500/30 bg-yellow-500/5" : "border-destructive/30 bg-destructive/5"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {stock_status.status === "healthy" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : stock_status.status === "low" ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium text-foreground capitalize">
                  {stock_status.status === "healthy"
                    ? "Healthy Stock"
                    : stock_status.status === "low"
                      ? "Low Stock"
                      : "Out of Stock"}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stock_status.available.toLocaleString()} / {stock_status.total_uploaded.toLocaleString()} codes
              </span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-500 ${stock_status.status === "healthy" ? "bg-green-500" : stock_status.status === "low" ? "bg-yellow-500" : "bg-destructive"}`}
                style={{ width: `${stock_status.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stock_status.percentage}% remaining</p>
            {stock_status.status !== "healthy" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-primary border-primary hover:bg-primary/10 bg-transparent"
                onClick={() => {
                  onOpenChange(false)
                  onUploadCodes()
                }}
              >
                <Upload className="h-3 w-3 mr-1" />
                {stock_status.status === "out" ? "Upload codes immediately" : "Upload more codes"}
              </Button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-border">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
            onClick={() => {
              onOpenChange(false)
              onUploadCodes()
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Codes
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent" onClick={onViewAllOrders}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View All Orders
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
