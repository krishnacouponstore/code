"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"

interface Slot {
  id: string
  name: string
  description: string
  image_url?: string | null
  available_stock: number
  starting_price: number
  is_published?: boolean
}

interface SlotCardProps {
  slot: Slot
  onCheckPricing: () => void
}

export function SlotCard({ slot, onCheckPricing }: SlotCardProps) {
  const isOutOfStock = slot.available_stock === 0
  const isLowStock = slot.available_stock > 0 && slot.available_stock < 50

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function getStockBadge() {
    if (isOutOfStock) {
      return { text: "Out of Stock", className: "bg-destructive/20 text-destructive border-destructive/30" }
    } else if (isLowStock) {
      return { text: "Low Stock", className: "bg-chart-4/20 text-chart-4 border-chart-4/30" }
    } else {
      return {
        text: `${slot.available_stock} available`,
        className: "bg-secondary/80 text-muted-foreground border-border/50 backdrop-blur-sm",
      }
    }
  }

  const badge = getStockBadge()

  return (
    <Card
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-1 ${
        isOutOfStock
          ? "opacity-60 cursor-not-allowed bg-muted/50 border-border"
          : `border-border/50
             bg-gradient-to-br from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] 
             hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(16,185,129,0.12),0_4px_16px_rgba(16,185,129,0.08)]
             dark:bg-gradient-to-b dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] 
             dark:border-[hsl(200,15%,20%)] dark:hover:border-primary/40 
             dark:hover:shadow-[0_8px_32px_hsl(165,96%,71%,0.1),0_0_0_1px_hsl(165,96%,71%,0.1)]`
      }`}
    >
      {/* Stock Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="secondary" className={badge.className}>
          {badge.text}
        </Badge>
      </div>

      <CardContent className="p-6">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
            isOutOfStock
              ? "bg-muted"
              : "bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/5"
          }`}
        >
          <ShoppingBag
            className={`h-7 w-7 transition-colors ${isOutOfStock ? "text-muted-foreground" : "text-primary"}`}
          />
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">{slot.name}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">{slot.description}</p>

        {/* Pricing */}
        <div className="mb-4">
          <span className="text-xs text-muted-foreground">Starting from</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{formatCurrency(slot.starting_price)}</span>
            <span className="text-sm text-muted-foreground">/code</span>
          </div>
        </div>

        {isOutOfStock ? (
          <Button disabled className="w-full rounded-full bg-muted text-muted-foreground cursor-not-allowed">
            Out of Stock
          </Button>
        ) : (
          <Button
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium"
            onClick={onCheckPricing}
          >
            Check Pricing
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
