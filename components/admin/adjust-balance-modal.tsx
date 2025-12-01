"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatCurrency } from "@/lib/utils"
import type { AdminUser } from "@/lib/mock-data"
import { Plus, Minus, ArrowRight, Loader2 } from "lucide-react"

interface AdjustBalanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  onConfirm: (userId: string, amount: number, type: "add" | "deduct", reason: string) => void
}

export function AdjustBalanceModal({ open, onOpenChange, user, onConfirm }: AdjustBalanceModalProps) {
  const [actionType, setActionType] = useState<"add" | "deduct">("add")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setActionType("add")
      setAmount("")
      setReason("")
    }
  }, [open])

  if (!user) return null

  const amountNum = Number.parseFloat(amount) || 0
  const newBalance =
    actionType === "add" ? user.wallet_balance + amountNum : Math.max(0, user.wallet_balance - amountNum)

  const canSubmit = amountNum > 0 && (actionType === "add" || amountNum <= user.wallet_balance)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onConfirm(user.id, amountNum, actionType, reason)
    setIsSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Adjust Balance - {user.full_name}</DialogTitle>
        </DialogHeader>

        {/* Current Balance */}
        <div className="bg-secondary/50 rounded-lg p-4 text-center mt-2">
          <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(user.wallet_balance)}</p>
        </div>

        {/* Action Type */}
        <div className="mt-4">
          <Label className="text-foreground mb-3 block">Action Type</Label>
          <RadioGroup
            value={actionType}
            onValueChange={(v) => setActionType(v as "add" | "deduct")}
            className="flex gap-4"
          >
            <div className="flex-1">
              <RadioGroupItem value="add" id="add" className="peer sr-only" />
              <Label
                htmlFor="add"
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-border p-3 cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
              >
                <Plus className="h-4 w-4 text-green-500" />
                <span className="text-foreground">Add Balance</span>
              </Label>
            </div>
            <div className="flex-1">
              <RadioGroupItem value="deduct" id="deduct" className="peer sr-only" />
              <Label
                htmlFor="deduct"
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-border p-3 cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
              >
                <Minus className="h-4 w-4 text-red-500" />
                <span className="text-foreground">Deduct Balance</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Amount Input */}
        <div className="mt-4">
          <Label htmlFor="amount" className="text-foreground">
            Amount
          </Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 bg-secondary border-border text-foreground"
            />
          </div>
          {actionType === "deduct" && amountNum > user.wallet_balance && (
            <p className="text-sm text-destructive mt-1">Cannot deduct more than current balance</p>
          )}
        </div>

        {/* Reason */}
        <div className="mt-4">
          <Label htmlFor="reason" className="text-foreground">
            Reason <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Reason for adjustment (for records)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            className="mt-1.5 bg-secondary border-border text-foreground resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{reason.length}/200</p>
        </div>

        {/* Preview */}
        {amountNum > 0 && canSubmit && (
          <div className="bg-secondary/30 rounded-lg p-4 mt-4">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center justify-between gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(user.wallet_balance)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${actionType === "add" ? "text-green-500" : "text-red-500"}`}>
                  {actionType === "add" ? "+" : "-"}
                  {formatCurrency(amountNum)}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">New</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(newBalance)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full border-border"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Adjustment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
