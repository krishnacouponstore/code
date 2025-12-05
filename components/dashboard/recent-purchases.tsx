"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package } from "lucide-react"
import Link from "next/link"
import type { Purchase } from "@/lib/mock-data"

interface RecentPurchasesProps {
  purchases: Purchase[]
}

export function RecentPurchases({ purchases }: RecentPurchasesProps) {
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

  if (purchases.length === 0) {
    return (
      <Card
        className="rounded-2xl border border-border/50 transition-all duration-300
        bg-gradient-to-br from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] 
        dark:bg-gradient-to-b dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] 
        dark:border-[hsl(200,15%,20%)]"
      >
        <CardHeader>
          <CardTitle className="text-foreground">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/5 mb-4 transition-transform duration-300 hover:scale-110">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No purchases yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start by browsing our available coupon slots and make your first purchase.
            </p>
            <Link href="/coupons">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Browse Coupons
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="rounded-2xl border border-border/50 transition-all duration-300
      bg-gradient-to-br from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] 
      dark:bg-gradient-to-b dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] 
      dark:border-[hsl(200,15%,20%)]"
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Recent Purchases</CardTitle>
        <Link
          href="/purchase-history"
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 dark:border-[hsl(200,15%,20%)] hover:bg-transparent">
                <TableHead className="text-muted-foreground">Order ID</TableHead>
                <TableHead className="text-muted-foreground">Coupon Name</TableHead>
                <TableHead className="text-muted-foreground text-center">Quantity</TableHead>
                <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.slice(0, 5).map((purchase) => (
                <TableRow
                  key={purchase.id}
                  className="border-border/30 dark:border-[hsl(200,15%,20%)] transition-colors duration-200
                    hover:bg-primary/5 dark:hover:bg-primary/5"
                >
                  <TableCell className="font-medium text-foreground">#{purchase.order_id}</TableCell>
                  <TableCell className="text-primary font-medium">{purchase.slot_name}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{purchase.quantity} codes</TableCell>
                  <TableCell className="text-right text-foreground font-medium">
                    {formatCurrency(purchase.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(purchase.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
