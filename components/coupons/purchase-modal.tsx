"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { mockUser, type SlotDetail, type PricingTier } from "@/lib/mock-data"
import {
  Wallet,
  Minus,
  Plus,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
  Copy,
  Download,
  FileText,
  CheckCircle2,
  PartyPopper,
} from "lucide-react"

interface PurchaseModalProps {
  slot: SlotDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PurchaseResult = {
  order_id: string
  slot_name: string
  quantity: number
  total_amount: number
  unit_price: number
  purchased_at: string
  new_wallet_balance: number
  codes: string[]
}

function generateMockCodes(slotId: string, quantity: number): string[] {
  const prefixes: Record<string, string> = {
    "1": "FKG",
    "2": "AMZ",
    "3": "SWG",
    "4": "ZMT",
    "5": "BGB",
    "6": "MYN",
  }
  const prefix = prefixes[slotId] || "CODE"
  return Array.from({ length: quantity }, (_, i) => `${prefix}${String(i + 1).padStart(14, "0")}`)
}

export function PurchaseModal({ slot, open, onOpenChange }: PurchaseModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const walletBalance = user?.is_admin ? 0 : mockUser.wallet_balance

  // Calculate active tier and pricing
  const { activeTier, unitPrice, totalAmount, savings } = useMemo(() => {
    if (!slot) return { activeTier: null, unitPrice: 0, totalAmount: 0, savings: 0 }

    const tier = slot.pricing_tiers.find((t) => {
      if (t.max_quantity === null) return quantity >= t.min_quantity
      return quantity >= t.min_quantity && quantity <= t.max_quantity
    })

    const basePrice = slot.pricing_tiers[0].unit_price
    const currentPrice = tier?.unit_price ?? basePrice
    const total = quantity * currentPrice
    const savedAmount = quantity * (basePrice - currentPrice)

    return {
      activeTier: tier,
      unitPrice: currentPrice,
      totalAmount: total,
      savings: savedAmount,
    }
  }, [slot, quantity])

  const isInsufficientBalance = totalAmount > walletBalance
  const isQuantityInvalid = quantity < 1 || (slot && quantity > slot.available_stock)
  const canPurchase = !isInsufficientBalance && !isQuantityInvalid && slot && slot.available_stock > 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleQuantityChange = (value: number) => {
    setError(null)
    if (value < 1) {
      setQuantity(1)
      return
    }
    if (slot && value > slot.available_stock) {
      setQuantity(slot.available_stock)
      setError(`Maximum ${slot.available_stock} codes available`)
      return
    }
    setQuantity(value)
  }

  const handlePurchase = async () => {
    if (!canPurchase || !slot) return

    setIsProcessing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const codes = generateMockCodes(slot.id, quantity)
    const result: PurchaseResult = {
      order_id: `ORD${Date.now().toString().slice(-6)}`,
      slot_name: slot.name,
      quantity: quantity,
      total_amount: totalAmount,
      unit_price: unitPrice,
      purchased_at: new Date().toISOString(),
      new_wallet_balance: walletBalance - totalAmount,
      codes: codes,
    }

    setPurchaseResult(result)
    setIsProcessing(false)
  }

  const handleAddBalance = () => {
    onOpenChange(false)
    router.push("/add-balance")
  }

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually",
        variant: "destructive",
      })
    }
  }

  const handleDownloadCSV = () => {
    if (!purchaseResult) return

    const csvContent = ["Serial No,Coupon Code", ...purchaseResult.codes.map((code, i) => `${i + 1},${code}`)].join(
      "\n",
    )

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "")
    link.href = url
    link.download = `codecrate_coupons_${purchaseResult.order_id}_${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: "CSV file has been downloaded",
    })
  }

  const handleDownloadTXT = () => {
    if (!purchaseResult) return

    const txtContent = purchaseResult.codes.join("\n")

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "")
    link.href = url
    link.download = `codecrate_coupons_${purchaseResult.order_id}_${date}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: "TXT file has been downloaded",
    })
  }

  // Reset state when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuantity(1)
      setError(null)
      setIsProcessing(false)
      setPurchaseResult(null)
      setCopiedIndex(null)
    }
    onOpenChange(newOpen)
  }

  const handleCloseSuccess = () => {
    handleOpenChange(false)
  }

  const handleViewHistory = () => {
    handleOpenChange(false)
    router.push("/purchase-history")
  }

  if (!slot) return null

  if (purchaseResult) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-[700px] bg-card border-border p-0 gap-0 max-h-[90vh] overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Success Header */}
          <div className="p-6 pb-4 border-b border-border text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <PartyPopper className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground mb-2">Purchase Successful!</DialogTitle>
            <p className="text-muted-foreground">
              {purchaseResult.quantity} codes purchased for {formatCurrency(purchaseResult.total_amount)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              New Balance: {formatCurrency(purchaseResult.new_wallet_balance)}
            </p>
          </div>

          {/* Coupon Codes Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Your Coupon Codes</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Save these codes securely. You can re-download anytime from Purchase History.
                </p>
              </div>
            </div>

            {/* Scrollable Table */}
            <ScrollArea className="h-[300px] rounded-lg border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                  <TableRow className="hover:bg-secondary">
                    <TableHead className="w-16 text-foreground">#</TableHead>
                    <TableHead className="text-foreground">Coupon Code</TableHead>
                    <TableHead className="w-20 text-right text-foreground">Copy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseResult.codes.map((code, index) => (
                    <TableRow
                      key={index}
                      className={`${index % 2 === 0 ? "bg-card" : "bg-secondary/30"} hover:bg-secondary/50 transition-colors`}
                    >
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{code}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 transition-colors ${
                            copiedIndex === index
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => handleCopyCode(code, index)}
                          aria-label={`Copy code ${code}`}
                        >
                          {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                onClick={handleDownloadCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Download as CSV
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-full border-border h-11 bg-transparent"
                onClick={handleDownloadTXT}
              >
                <FileText className="h-4 w-4 mr-2" />
                Download as TXT
              </Button>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <Button variant="link" className="text-primary hover:text-primary/80" onClick={handleViewHistory}>
                View Purchase History
              </Button>
              <Button variant="secondary" className="w-full rounded-full h-11" onClick={handleCloseSuccess}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Original purchase form
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-foreground mb-2">{slot.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{slot.description}</p>
            </div>
            <Badge
              variant="secondary"
              className={`shrink-0 ${
                slot.available_stock === 0 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
              }`}
            >
              {slot.available_stock === 0 ? "Out of Stock" : `${slot.available_stock} available`}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Pricing Tiers */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Pricing Tiers</h3>
            <div className="space-y-2">
              {slot.pricing_tiers.map((tier, index) => (
                <PricingTierCard
                  key={index}
                  tier={tier}
                  isActive={activeTier === tier}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-border bg-transparent"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                className="w-24 text-center bg-secondary border-border rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min={1}
                max={slot.available_stock}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-border bg-transparent"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= slot.available_stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Price Calculation */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="text-foreground">{formatCurrency(unitPrice)} /code</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span className="text-foreground">{quantity} codes</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-primary">You save</span>
                <span className="text-primary font-medium">{formatCurrency(savings)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="text-foreground font-medium">Total Amount</span>
              <span className="text-xl font-bold text-foreground">{formatCurrency(totalAmount)}</span>
            </div>
            {activeTier && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                {activeTier.min_quantity}-{activeTier.max_quantity ?? "∞"} codes tier applied
              </p>
            )}
          </div>

          {/* Wallet Balance */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border ${
              isInsufficientBalance ? "bg-destructive/10 border-destructive/30" : "bg-secondary/50 border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              <Wallet className={`h-5 w-5 ${isInsufficientBalance ? "text-destructive" : "text-primary"}`} />
              <span className="text-sm text-foreground">Your Wallet</span>
            </div>
            <span className={`font-semibold ${isInsufficientBalance ? "text-destructive" : "text-foreground"}`}>
              {formatCurrency(walletBalance)}
            </span>
          </div>

          {isInsufficientBalance && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Insufficient balance. Add {formatCurrency(totalAmount - walletBalance)} more.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12"
              disabled={!canPurchase || isProcessing}
              onClick={handlePurchase}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Purchase Now"
              )}
            </Button>

            {isInsufficientBalance && (
              <Button
                variant="outline"
                className="w-full rounded-full border-border h-12 bg-transparent"
                onClick={handleAddBalance}
              >
                Add Balance First
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PricingTierCard({
  tier,
  isActive,
  formatCurrency,
}: {
  tier: PricingTier
  isActive: boolean
  formatCurrency: (amount: number) => string
}) {
  const rangeLabel = tier.max_quantity === null ? `${tier.min_quantity}+` : `${tier.min_quantity}-${tier.max_quantity}`

  return (
    <div
      className={`relative flex items-center justify-between p-3 rounded-lg border transition-all ${
        isActive ? "border-primary bg-primary/10" : "border-border bg-secondary/30"
      }`}
    >
      <div className="flex items-center gap-3">
        {tier.is_best_deal && (
          <div className="absolute -top-2 -left-2">
            <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
              <Sparkles className="h-3 w-3 mr-1" />
              Best Deal
            </Badge>
          </div>
        )}
        <div className={tier.is_best_deal ? "mt-2" : ""}>
          <p className="text-sm font-medium text-foreground">{rangeLabel} codes</p>
          <p className="text-xs text-muted-foreground">{tier.label}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
          {formatCurrency(tier.unit_price)}
        </p>
        <p className="text-xs text-muted-foreground">/code</p>
      </div>
    </div>
  )
}
