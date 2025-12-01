"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Package } from "lucide-react"
import Link from "next/link"
import type { Purchase } from "@/lib/mock-data"
import { useToast } from "@/components/ui/use-toast"

interface RecentPurchasesProps {
  purchases: Purchase[]
}

export function RecentPurchases({ purchases }: RecentPurchasesProps) {
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDownload = (orderId: string) => {
    toast({
      title: "Download started",
      description: `Downloading coupon codes for order ${orderId}`,
    })
  }

  if (purchases.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-secondary mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No purchases yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start by browsing our available coupon slots and make your first purchase.
            </p>
            <Link href="/coupons">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                Browse Coupons
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Recent Purchases</CardTitle>
        <Link
          href="/purchase-history"
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Order ID</TableHead>
                <TableHead className="text-muted-foreground">Coupon Name</TableHead>
                <TableHead className="text-muted-foreground text-center">Quantity</TableHead>
                <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.slice(0, 5).map((purchase) => (
                <TableRow key={purchase.id} className="border-border">
                  <TableCell className="font-medium text-foreground">#{purchase.id}</TableCell>
                  <TableCell className="text-foreground">{purchase.slot_name}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{purchase.quantity} codes</TableCell>
                  <TableCell className="text-right text-foreground font-medium">
                    {formatCurrency(purchase.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(purchase.date)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(purchase.id)}
                      className="text-primary hover:text-primary/80 hover:bg-secondary"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
