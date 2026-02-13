"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getTopupByTransactionId } from "@/app/actions/imb-payments"
import { CheckCircle2, Copy, Check, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const orderId = searchParams.get("order_id")

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    if (!orderId) {
      router.push("/add-balance")
      return
    }

    // Fetch transaction details
    const fetchDetails = async () => {
      const result = await getTopupByTransactionId(orderId)
      if (result.success) {
        setTransaction(result.data)
      }
      setLoading(false)
    }

    fetchDetails()
  }, [orderId, router])

  const handleCopy = () => {
    if (transaction?.transaction_id) {
      navigator.clipboard.writeText(transaction.transaction_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center">
          <div className="mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-white/90 text-lg">Your wallet has been credited</p>
        </div>

        <CardContent className="p-8 space-y-6">
          {/* Amount Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-6 text-center border border-green-200 dark:border-green-900">
            <p className="text-sm text-muted-foreground mb-1">Amount Credited</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {transaction ? formatCurrency(transaction.amount) : "---"}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="font-medium">{transaction?.payment_method || "UPI"}</span>
            </div>

            {transaction?.razorpay_payment_id && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">UTR Number</span>
                <span className="font-mono text-sm">{transaction.razorpay_payment_id}</span>
              </div>
            )}

            <div className="flex justify-between items-start py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-right break-all max-w-[200px]">
                  {transaction?.transaction_id || orderId}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8 shrink-0", copied && "text-green-600")}
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {transaction?.verified_at && (
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted-foreground">Date & Time</span>
                <span className="text-sm">
                  {new Date(transaction.verified_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* New Balance Info */}
          {user && (
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">New Wallet Balance</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(user.wallet_balance)}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button onClick={() => router.push("/dashboard")} className="w-full h-12 text-base" size="lg">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/store")}
              className="w-full h-12 text-base"
              size="lg"
            >
              Browse Coupons
            </Button>
          </div>

          {/* Success Message */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Thank you for your payment! You can now purchase coupons from our store.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
