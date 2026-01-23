import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Wallet } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Buy Coupons Card */}
      <Card
        className="rounded-2xl border border-border/50 transition-all duration-300 ease-out hover:-translate-y-1
        bg-gradient-to-br from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] 
        hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(16,185,129,0.12),0_4px_16px_rgba(16,185,129,0.08)]
        dark:bg-gradient-to-b dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] 
        dark:border-[hsl(200,15%,20%)] dark:hover:border-primary/40 
        dark:hover:shadow-[0_8px_32px_hsl(165,96%,71%,0.1),0_0_0_1px_hsl(165,96%,71%,0.1)]"
      >
        <CardContent className="p-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/5 w-fit transition-transform duration-300 hover:scale-110">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mt-4">Buy Coupons</h3>
          <p className="text-muted-foreground mt-2 mb-6">Browse available coupon slots and purchase codes instantly.</p>
          <Link href="/store">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              Browse Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Add Balance Card */}
      <Card
        className="rounded-2xl border border-border/50 transition-all duration-300 ease-out hover:-translate-y-1
        bg-gradient-to-br from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] 
        hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(16,185,129,0.12),0_4px_16px_rgba(16,185,129,0.08)]
        dark:bg-gradient-to-b dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] 
        dark:border-[hsl(200,15%,20%)] dark:hover:border-primary/40 
        dark:hover:shadow-[0_8px_32px_hsl(165,96%,71%,0.1),0_0_0_1px_hsl(165,96%,71%,0.1)]"
      >
        <CardContent className="p-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/5 w-fit transition-transform duration-300 hover:scale-110">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mt-4">Add Balance</h3>
          <p className="text-muted-foreground mt-2 mb-6">Top-up your wallet via UPI to make purchases.</p>
          <Link href="/add-balance">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              Add Money
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
