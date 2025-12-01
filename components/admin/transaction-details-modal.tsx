"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "@/lib/mock-data"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"
import { Copy, Check, User, Mail, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, RotateCcw } from "lucide-react"

interface TransactionDetailsModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (txnId: string, newStatus: Transaction["status"]) => void
  onRefund: (txnId: string, reason: string) => void
}

export function TransactionDetailsModal({
  transaction,
  open,
  onOpenChange,
  onStatusChange,
  onRefund,
}: TransactionDetailsModalProps) {
  const { toast } = useToast()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [refundReason, setRefundReason] = useState("")
  const [newStatus, setNewStatus] = useState<Transaction["status"] | "">("")

  if (!transaction) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    })
  }

  const handleStatusChange = () => {
    if (newStatus && newStatus !== transaction.status) {
      onStatusChange(transaction.id, newStatus)
      setNewStatus("")
    }
  }

  const handleRefund = () => {
    if (refundReason.trim()) {
      onRefund(transaction.id, refundReason)
      setRefundReason("")
      setShowRefundForm(false)
    }
  }

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "refunded":
        return <RotateCcw className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500"
      case "pending":
        return "bg-orange-500/10 text-orange-500"
      case "failed":
        return "bg-red-500/10 text-red-500"
      case "refunded":
        return "bg-gray-500/10 text-gray-400"
    }
  }

  const canRefund = transaction.status === "success"
  const canChangeStatus = transaction.status === "pending"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            Transaction Details
            <span className="text-sm font-normal text-muted-foreground">#{transaction.id}</span>
          </DialogTitle>
          <DialogDescription>View and manage transaction information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium capitalize ${getStatusColor(transaction.status)}`}
            >
              {getStatusIcon(transaction.status)}
              {transaction.status}
            </span>
          </div>

          {/* Amount */}
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(transaction.amount)}</p>
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">User Information</h4>
            <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{transaction.user_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{transaction.user_email}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Payment Information</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Method</span>
                </div>
                <span className="text-sm text-foreground font-medium">{transaction.method}</span>
              </div>

              <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Order ID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-foreground bg-background px-2 py-1 rounded">
                      {transaction.razorpay_order_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(transaction.razorpay_order_id, "Order ID")}
                    >
                      {copiedField === "Order ID" ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                {transaction.razorpay_payment_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-foreground bg-background px-2 py-1 rounded">
                        {transaction.razorpay_payment_id}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(transaction.razorpay_payment_id, "Payment ID")}
                      >
                        {copiedField === "Payment ID" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Timeline</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">
                  {formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}
                </span>
              </div>
              {transaction.verified_at && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Verified:</span>
                  <span className="text-foreground">
                    {formatDate(transaction.verified_at)} at {formatTime(transaction.verified_at)}
                  </span>
                </div>
              )}
              {transaction.refunded_at && (
                <div className="flex items-center gap-3 text-sm">
                  <RotateCcw className="h-4 w-4 text-gray-500" />
                  <span className="text-muted-foreground">Refunded:</span>
                  <span className="text-foreground">
                    {formatDate(transaction.refunded_at)} at {formatTime(transaction.refunded_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Reason */}
          {transaction.refund_reason && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Refund Reason</h4>
              <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                {transaction.refund_reason}
              </p>
            </div>
          )}

          {/* Change Status (for pending) */}
          {canChangeStatus && (
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-medium text-foreground">Change Status</h4>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Transaction["status"])}>
                  <SelectTrigger className="flex-1 bg-secondary border-border">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="success">Mark as Success</SelectItem>
                    <SelectItem value="failed">Mark as Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusChange}
                  disabled={!newStatus}
                  className="bg-primary text-primary-foreground"
                >
                  Update
                </Button>
              </div>
            </div>
          )}

          {/* Refund Form */}
          {canRefund && !showRefundForm && (
            <Button
              variant="outline"
              className="w-full border-orange-500/50 text-orange-500 hover:bg-orange-500/10 bg-transparent"
              onClick={() => setShowRefundForm(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Issue Refund
            </Button>
          )}

          {showRefundForm && (
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-medium text-foreground">Issue Refund</h4>
              <div className="space-y-2">
                <Label htmlFor="refund-reason" className="text-sm text-muted-foreground">
                  Reason for refund
                </Label>
                <Textarea
                  id="refund-reason"
                  placeholder="Enter reason for refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="bg-secondary border-border text-foreground min-h-[80px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-border bg-transparent"
                  onClick={() => setShowRefundForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleRefund}
                  disabled={!refundReason.trim()}
                >
                  Confirm Refund
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
