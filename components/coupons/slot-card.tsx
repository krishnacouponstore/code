"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"
import type { Slot } from "@/lib/mock-data"

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

  return (
    <Card
      className={`group relative bg-card border-border overflow-hidden transition-all duration-300 ${
        isOutOfStock
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      }`}
    >
      {/* Stock Badge */}
      <div className="absolute top-4 right-4 z-10">
        {isOutOfStock ? (
          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
            Out of Stock
          </Badge>
        ) : isLowStock ? (
          <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">Low Stock</Badge>
        ) : (
          <Badge variant="secondary" className="bg-secondary text-muted-foreground">
            {slot.available_stock} available
          </Badge>
        )}
      </div>

      <CardContent className="p-6">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
            isOutOfStock ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20"
          }`}
        >
          <ShoppingBag className={`h-7 w-7 ${isOutOfStock ? "text-muted-foreground" : "text-primary"}`} />
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

        {/* CTA Button */}
        {isOutOfStock ? (
          <Button disabled className="w-full rounded-full bg-muted text-muted-foreground cursor-not-allowed">
            Out of Stock
          </Button>
        ) : (
          <Button
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={onCheckPricing}
          >
            Check Pricing
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
