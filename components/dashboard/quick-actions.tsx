import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Wallet } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Buy Coupons Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="p-3 rounded-lg bg-secondary w-fit">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mt-4">Buy Coupons</h3>
          <p className="text-muted-foreground mt-2 mb-6">Browse available coupon slots and purchase codes instantly.</p>
          <Link href="/coupons">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium">
              Browse Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Add Balance Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="p-3 rounded-lg bg-secondary w-fit">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mt-4">Add Balance</h3>
          <p className="text-muted-foreground mt-2 mb-6">Top-up your wallet via UPI to make purchases.</p>
          <Link href="/add-balance">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium">
              Add Money
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
