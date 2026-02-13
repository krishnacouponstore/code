"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { checkPaymentStatus, getTopupByTransactionId } from "@/app/actions/imb-payments"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function PaymentProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<"checking" | "success" | "failed" | "timeout">("checking")
  const [message, setMessage] = useState("Processing your payment...")
  const [attempts, setAttempts] = useState(0)
  const [transactionDetails, setTransactionDetails] = useState<any>(null)

  const orderId = searchParams.get("order_id")

  useEffect(() => {
    if (!orderId) {
      router.push("/add-balance")
      return
    }

    let interval: NodeJS.Timeout
    let timeoutId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        setAttempts((prev) => prev + 1)

        // Check payment status
        const result = await checkPaymentStatus(orderId)

        if (result.success && result.status) {
          if (result.status === "success") {
            // Get transaction details
            const detailsResult = await getTopupByTransactionId(orderId)
            if (detailsResult.success) {
              setTransactionDetails(detailsResult.data)
            }
            setStatus("success")
            clearInterval(interval)
            clearTimeout(timeoutId)
            // Redirect to success page after 2 seconds
            setTimeout(() => {
              router.push(`/payment/success?order_id=${orderId}`)
            }, 2000)
          } else if (result.status === "failed") {
            setStatus("failed")
            clearInterval(interval)
            clearTimeout(timeoutId)
            // Redirect to failed page after 2 seconds
            setTimeout(() => {
              router.push(`/payment/failed?order_id=${orderId}`)
            }, 2000)
          }
          // If still pending, continue checking
        }
      } catch (error) {
        console.error("Error checking status:", error)
      }
    }

    // Start checking immediately
    checkStatus()

    // Then check every 3 seconds
    interval = setInterval(checkStatus, 3000)

    // Timeout after 2 minutes
    timeoutId = setTimeout(() => {
      clearInterval(interval)
      setStatus("timeout")
      setMessage("Payment verification is taking longer than expected")
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [orderId, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="p-8 text-center">
          {status === "checking" && (
            <>
              <div className="mb-6">
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">
                Order ID: <span className="font-mono">{orderId}</span>
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Please do not close this window or press back
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">Redirecting to confirmation page...</p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Payment Failed</h1>
              <p className="text-muted-foreground">Redirecting...</p>
            </>
          )}

          {status === "timeout" && (
            <>
              <div className="mb-6">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verification Pending</h1>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground mb-6">
                Your payment may still be processing. Please check your transaction history in a few minutes.
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push("/add-balance")} className="w-full">
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentProcessingContent />
    </Suspense>
  )
}
