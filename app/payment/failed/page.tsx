"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getTopupByTransactionId } from "@/app/actions/imb-payments"
import { XCircle, RefreshCw, Mail, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SITE_CONTACTS } from "@/lib/site-config"

function PaymentFailedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const orderId = searchParams.get("order_id")

  useEffect(() => {
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
        {/* Failed Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-500 p-8 text-center">
          <div className="mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Failed</h1>
          <p className="text-white/90 text-lg">We couldn't process your payment</p>
        </div>

        <CardContent className="p-8 space-y-6">
          {/* Failure Reason */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6 border border-red-200 dark:border-red-900">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">What happened?</h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              Your payment transaction could not be completed. This might be due to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-red-800 dark:text-red-200">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Insufficient balance in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Payment cancelled by you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Bank server issues or network problems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Daily transaction limit exceeded</span>
              </li>
            </ul>
          </div>

          {/* Transaction Details */}
          {transaction && (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm">{transaction.transaction_id || orderId}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(transaction.amount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  Failed
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button onClick={() => router.push("/add-balance")} className="w-full h-12 text-base" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 text-base"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Support Section */}
          <div className="bg-muted/50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-3 text-sm">Need Help?</h3>
            <div className="space-y-2">
              <a
                href={`https://t.me/${SITE_CONTACTS.telegram.support.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Contact on Telegram</p>
                  <p className="text-xs text-muted-foreground">{SITE_CONTACTS.telegram.support}</p>
                </div>
              </a>
              <a
                href={`mailto:${SITE_CONTACTS.email}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-muted-foreground">{SITE_CONTACTS.email}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Note */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              If money was debited from your account, it will be refunded within 5-7 business days.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  )
}
