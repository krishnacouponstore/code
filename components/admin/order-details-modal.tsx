"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Copy, Download, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AdminOrder } from "@/hooks/use-admin-orders"

type OrderDetailsModalProps = {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  const { toast } = useToast()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  if (!order) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const copyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const downloadCodes = (format: "csv" | "txt") => {
    let content: string
    let filename: string
    let mimeType: string

    if (format === "csv") {
      content = "Serial,Code\n" + order.codes.map((code, i) => `${i + 1},${code}`).join("\n")
      filename = `coupx_${order.order_id.replace("#", "")}_codes.csv`
      mimeType = "text/csv"
    } else {
      content = order.codes.join("\n")
      filename = `coupx_${order.order_id.replace("#", "")}_codes.txt`
      mimeType = "text/plain"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Started",
      description: `${order.codes.length} codes exported as ${format.toUpperCase()}`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
      case "refunded":
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Order Details - {order.order_id}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{formatDateTime(order.created_at)}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Customer Details</h3>
              <div className="space-y-2">
                <p className="text-foreground font-medium">{order.user.name}</p>
                <p className="text-sm text-muted-foreground">{order.user.email}</p>
                {order.user.phone && <p className="text-sm text-muted-foreground">{order.user.phone}</p>}
              </div>
            </div>

            {/* Purchase Details */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Purchase Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coupon</span>
                  <span className="text-foreground font-medium">{order.slot_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="text-foreground">{order.quantity} codes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="text-foreground">{formatCurrency(order.unit_price)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-foreground font-medium">Total Amount</span>
                  <span className="text-primary font-bold">{formatCurrency(order.total_price)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coupon Codes Section */}
          {order.codes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Coupon Codes ({order.codes.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCodes("csv")}
                    className="rounded-full border-border bg-transparent text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCodes("txt")}
                    className="rounded-full border-border bg-transparent text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    TXT
                  </Button>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground w-16">#</TableHead>
                      <TableHead className="text-muted-foreground">Code</TableHead>
                      <TableHead className="text-muted-foreground w-20 text-right">Copy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.codes.map((code, index) => (
                      <TableRow key={index} className="border-border">
                        <TableCell className="text-muted-foreground font-mono text-sm">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm text-foreground">{code}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(code, index)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {order.codes.length === 0 && order.status === "failed" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 font-medium">Order Failed</p>
              <p className="text-sm text-muted-foreground mt-1">No codes were generated for this order.</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full border-border bg-transparent"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
