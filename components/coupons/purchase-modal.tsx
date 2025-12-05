"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useSlotPricing } from "@/hooks/use-slot-pricing"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { processPurchase } from "@/app/actions/purchase"
import {
  Wallet,
  Minus,
  Plus,
  AlertCircle,
  Loader2,
  Check,
  Copy,
  Download,
  FileText,
  CheckCircle2,
  PartyPopper,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react"

interface PurchaseModalProps {
  slotId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PurchaseResult = {
  orderNumber: string
  slotName: string
  quantity: number
  totalAmount: number
  unitPrice: number
  newWalletBalance: number
  codes: Array<{ id: string; code: string }>
}

export function PurchaseModal({ slotId, open, onOpenChange }: PurchaseModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { data: slot, isLoading: slotLoading, error: slotError, refetch } = useSlotPricing(slotId)
  const { data: walletData } = useUserWallet(user?.id || null)

  const walletBalance = walletData?.wallet_balance ?? user?.wallet_balance ?? 0
  const isBlocked = walletData?.is_blocked ?? false

  // Calculate active tier and pricing
  const { activeTier, unitPrice, totalAmount, savings } = useMemo(() => {
    if (!slot?.pricing_tiers?.length) return { activeTier: null, unitPrice: 0, totalAmount: 0, savings: 0 }

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
  const canPurchase = !isInsufficientBalance && !isQuantityInvalid && !isBlocked && slot && slot.available_stock > 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const inputValue = e.target.value

    // Allow empty input
    if (inputValue === "") {
      setQuantity(0)
      return
    }

    // Parse as integer, removing leading zeros
    const value = Number.parseInt(inputValue, 10)

    if (isNaN(value) || value < 0) {
      setQuantity(0)
      return
    }

    if (slot && value > slot.available_stock) {
      setQuantity(slot.available_stock)
      setError(`Maximum ${slot.available_stock} codes available`)
      return
    }

    setQuantity(value)
  }

  const handlePurchaseClick = () => {
    if (!canPurchase) return
    setShowConfirmDialog(true)
  }

  const handleConfirmPurchase = async () => {
    setShowConfirmDialog(false)
    if (!canPurchase || !slot || !user?.id) return

    setIsProcessing(true)
    setError(null)

    const result = await processPurchase({
      userId: user.id,
      slotId: slot.id,
      quantity,
      unitPrice,
      totalPrice: totalAmount,
    })

    if (!result.success) {
      setError(result.error || "Purchase failed")
      setIsProcessing(false)
      toast({
        title: "Purchase Failed",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    // Success
    setPurchaseResult({
      orderNumber: result.data!.orderNumber,
      slotName: slot.name,
      quantity,
      totalAmount,
      unitPrice,
      newWalletBalance: result.data!.newWalletBalance,
      codes: result.data!.codes,
    })

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["available-coupons"] })
    queryClient.invalidateQueries({ queryKey: ["user-wallet"] })
    queryClient.invalidateQueries({ queryKey: ["user-profile"] })

    setIsProcessing(false)
    toast({
      title: "Purchase Successful!",
      description: `${quantity} codes purchased successfully`,
    })
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

    const csvContent = ["Serial No,Coupon Code", ...purchaseResult.codes.map((c, i) => `${i + 1},${c.code}`)].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "")
    link.href = url
    link.download = `codecrate_coupons_${purchaseResult.orderNumber}_${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({ title: "Downloaded!", description: "CSV file has been downloaded" })
  }

  const handleDownloadTXT = () => {
    if (!purchaseResult) return

    const txtContent = purchaseResult.codes.map((c) => c.code).join("\n")

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "")
    link.href = url
    link.download = `codecrate_coupons_${purchaseResult.orderNumber}_${date}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({ title: "Downloaded!", description: "TXT file has been downloaded" })
  }

  // Reset state when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuantity(0)
      setError(null)
      setIsProcessing(false)
      setPurchaseResult(null)
      setCopiedIndex(null)
      setShowConfirmDialog(false)
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

  // Loading state
  if (slotLoading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading pricing...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Error state with retry option
  if (slotError || !slot) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load pricing information</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!slot) return null

  // Success view
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
              {purchaseResult.quantity} codes purchased for {formatCurrency(purchaseResult.totalAmount)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              New Balance: {formatCurrency(purchaseResult.newWalletBalance)}
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
                  {purchaseResult.codes.map((codeObj, index) => (
                    <TableRow
                      key={codeObj.id}
                      className={`${index % 2 === 0 ? "bg-card" : "bg-secondary/30"} hover:bg-secondary/50 transition-colors`}
                    >
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{codeObj.code}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 transition-colors ${
                            copiedIndex === index
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => handleCopyCode(codeObj.code, index)}
                          aria-label={`Copy code ${codeObj.code}`}
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
    <>
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
            {/* Blocked User Warning */}
            {isBlocked && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">Your account is blocked. Contact support.</p>
              </div>
            )}

            {/* Pricing Tiers */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Pricing Tiers</h3>
              <div className="space-y-2">
                {slot.pricing_tiers.map((tier, index) => (
                  <PricingTierCard
                    key={tier.id}
                    tier={tier}
                    isActive={activeTier?.id === tier.id}
                    isBestDeal={index === slot.pricing_tiers.length - 1 && slot.pricing_tiers.length > 1}
                    formatCurrency={formatCurrency}
                    tierIndex={index}
                    totalTiers={slot.pricing_tiers.length}
                    basePrice={slot.pricing_tiers[0].unit_price}
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
                  onClick={() => handleQuantityInputChange({ target: { value: (quantity - 1).toString() } })}
                  disabled={quantity <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantity === 0 ? "" : quantity}
                  onChange={handleQuantityInputChange}
                  placeholder="0"
                  className="w-24 text-center bg-secondary border-border rounded-lg"
                  min={0}
                  max={slot.available_stock}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-border bg-transparent"
                  onClick={() => handleQuantityInputChange({ target: { value: (quantity + 1).toString() } })}
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
                  {activeTier.min_quantity}-{activeTier.max_quantity ?? `${activeTier.min_quantity}+`} codes tier
                  applied
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
                onClick={handlePurchaseClick}
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Confirm Purchase
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-muted-foreground">
                <div className="space-y-3 mt-2">
                  <p>Are you sure you want to purchase?</p>
                  <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Product</span>
                      <span className="text-foreground font-medium">{slot.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Quantity</span>
                      <span className="text-foreground font-medium">{quantity} codes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unit Price</span>
                      <span className="text-foreground font-medium">{formatCurrency(unitPrice)}</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2 flex justify-between">
                      <span className="font-medium">Total Amount</span>
                      <span className="text-primary font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                  <p className="text-xs">This amount will be deducted from your wallet balance.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-transparent border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleConfirmPurchase}
            >
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface PricingTier {
  id: string
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

function PricingTierCard({
  tier,
  isActive,
  isBestDeal,
  formatCurrency,
  tierIndex,
  totalTiers,
  basePrice,
}: {
  tier: PricingTier
  isActive: boolean
  isBestDeal: boolean
  formatCurrency: (amount: number) => string
  tierIndex: number
  totalTiers: number
  basePrice: number
}) {
  const getDynamicLabel = () => {
    if (tierIndex === totalTiers - 1 && totalTiers > 1) {
      const savings = basePrice - tier.unit_price
      return `Best value - Save ${formatCurrency(savings)} per code`
    }
    if (tierIndex > 0) {
      const savings = basePrice - tier.unit_price
      return `Save ${formatCurrency(savings)} per code`
    }
    return null
  }

  const dynamicLabel = getDynamicLabel()

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isActive ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:bg-secondary/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {tier.max_quantity === null ? `${tier.min_quantity}+` : `${tier.min_quantity}-${tier.max_quantity}`} codes
          </span>
          {isBestDeal && <Badge className="bg-primary/20 text-primary text-xs">Best Deal</Badge>}
        </div>
        <span className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
          {formatCurrency(tier.unit_price)}/code
        </span>
      </div>
      {dynamicLabel && <p className="text-xs text-muted-foreground mt-1">{dynamicLabel}</p>}
    </div>
  )
}
