"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Info } from "lucide-react"
import { CouponDetailsModal } from "./coupon-details-modal"
import type { RedemptionStep } from "@/lib/graphql/coupons"

interface Slot {
  id: string
  name: string
  description: string | null
  thumbnail_url?: string | null
  expiry_date?: string | null
  available_stock: number
  starting_price: number
  is_published?: boolean
  redemption_steps?: RedemptionStep[]
}

interface SlotCardProps {
  slot: Slot
  onCheckPricing: () => void
}

export function SlotCard({ slot, onCheckPricing }: SlotCardProps) {
  const [showDetails, setShowDetails] = useState(false)
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

  const formatExpiryDate = (dateString: string | null | undefined) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return null
    }
  }

  function getStockBadge() {
    if (isOutOfStock) {
      return { text: "Out of Stock", className: "bg-destructive/20 text-destructive border-destructive/30", show: true }
    } else if (isLowStock) {
      return { text: "Low Stock", className: "bg-chart-4/20 text-chart-4 border-chart-4/30", show: true }
    } else {
      return { text: "", className: "", show: false }
    }
  }

  const badge = getStockBadge()
  const expiryDate = formatExpiryDate(slot.expiry_date)

  return (
    <>
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
        {badge.show && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="secondary" className={badge.className}>
              {badge.text}
            </Badge>
          </div>
        )}

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
          <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-1">{slot.name}</h3>

          {/* Thumbnail/Condition and Expiry Date */}
          <div className="flex items-center gap-2 mb-4 min-h-[20px]">
            {slot.thumbnail_url && (
              <>
                <span className="text-sm text-muted-foreground line-clamp-1">{slot.thumbnail_url}</span>
                {expiryDate && (
                  <>
                    <span className="text-2xl text-muted-foreground/40 leading-none">•</span>
                    <span className="text-sm text-muted-foreground flex-shrink-0">{expiryDate}</span>
                  </>
                )}
              </>
            )}
            {!slot.thumbnail_url && expiryDate && (
              <span className="text-sm text-muted-foreground">{expiryDate}</span>
            )}
          </div>

          {/* Pricing */}
          <div className="mb-4">
            <span className="text-xs text-muted-foreground">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{formatCurrency(slot.starting_price)}</span>
              <span className="text-sm text-muted-foreground">/code</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isOutOfStock ? (
              <Button disabled className="flex-1 rounded-full bg-muted text-muted-foreground cursor-not-allowed">
                Out of Stock
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium"
                onClick={onCheckPricing}
              >
                Check Pricing
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full flex-shrink-0"
              onClick={() => setShowDetails(true)}
              title="View Details"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <CouponDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        couponName={slot.name}
        termsAndConditions={slot.description}
        redemptionSteps={slot.redemption_steps || []}
      />
    </>
  )
}
