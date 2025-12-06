"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"
import type { AdminUser } from "@/hooks/use-admin-users"
import { Wallet, ShoppingBag, Receipt, Package, Download, Copy, Check, FileText } from "lucide-react"

export interface PurchaseHistoryItem {
  id: string
  order_id: string
  slot_name: string
  quantity: number
  amount: number
  date: string
  codes: string[]
}

interface UserPurchaseHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  purchases?: PurchaseHistoryItem[]
  isLoading?: boolean
}

export function UserPurchaseHistoryModal({
  open,
  onOpenChange,
  user,
  purchases = [],
  isLoading = false,
}: UserPurchaseHistoryModalProps) {
  const { toast } = useToast()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!user) return null

  const handleCopyCodes = (purchase: PurchaseHistoryItem) => {
    navigator.clipboard.writeText(purchase.codes.join("\n"))
    setCopiedId(purchase.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: "Codes copied",
      description: `${purchase.codes.length} codes copied to clipboard.`,
    })
  }

  const handleDownloadCodes = (purchase: PurchaseHistoryItem, format: "csv" | "txt") => {
    const content = format === "csv" ? `Code\n${purchase.codes.join("\n")}` : purchase.codes.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${user.full_name.replace(/\s+/g, "_")}_${purchase.order_id}_codes.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Download started",
      description: `Codes downloaded as ${format.toUpperCase()}.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Purchase History - {user.full_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </DialogHeader>

        {/* User Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Wallet Balance</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(user.wallet_balance)}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs">Total Spent</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(user.total_spent)}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Total Coupons</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{user.total_purchased}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Receipt className="h-4 w-4" />
              <span className="text-xs">Total Orders</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{user.total_orders}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Orders</h3>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 bg-secondary/30 rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No purchases yet</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Order ID</TableHead>
                    <TableHead className="text-muted-foreground">Coupon Name</TableHead>
                    <TableHead className="text-muted-foreground">Quantity</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id} className="border-border">
                      <TableCell className="font-mono text-sm text-foreground">{purchase.order_id}</TableCell>
                      <TableCell className="text-foreground">{purchase.slot_name}</TableCell>
                      <TableCell className="text-foreground">{purchase.quantity} codes</TableCell>
                      <TableCell className="text-foreground">{formatCurrency(purchase.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div>{formatDate(purchase.date)}</div>
                        <div className="text-xs">{formatTime(purchase.date)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCodes(purchase)}
                            className="h-8 px-2"
                          >
                            {copiedId === purchase.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadCodes(purchase, "csv")}
                            className="h-8 px-2"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-border">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
