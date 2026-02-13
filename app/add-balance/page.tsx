"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUserTopups } from "@/hooks/use-user-topups"
import { Wallet, Loader2, Copy, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { hasAuthCookie } from "@/lib/check-auth-cookie"
import { validateAmount } from "@/lib/imb-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export default function AddBalancePage() {
  const { user, isLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { data: topups = [], isLoading: topupsLoading } = useUserTopups(10)

  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoggingOut) return

    if (!isLoading && !isAuthenticated && !hasAuthCookie()) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }

    if (!isLoading && user?.is_admin) {
      toast({
        title: "Access Restricted",
        description: "Admin users should use the admin dashboard",
        variant: "default",
        duration: 5000,
      })
      router.push("/admin/dashboard")
    }
  }, [isLoading, isAuthenticated, router, pathname, isLoggingOut, user, toast])

  if (!isLoading && user?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value)
  }

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
  }

  const handleProceedToPay = async () => {
    // Validate amount
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    const amountValidation = validateAmount(amountNum)
    if (!amountValidation.valid) {
      toast({
        title: "Invalid Amount",
        description: amountValidation.error,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Use user's phone from profile or default fallback
      const customerMobile = user.phone || "9876543210"
      
      // Call create-order API
      const response = await fetch("/api/imb/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: amountNum,
          customerMobile,
          customerEmail: user.email,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast({
          title: "Payment Failed",
          description: data.error || "Failed to create payment order",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      // Redirect to IMB payment page
      window.location.href = data.data.paymentUrl
    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            Success
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Failed</Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const copyTransactionId = (txnId: string) => {
    navigator.clipboard.writeText(txnId)
    setCopiedTxnId(txnId)
    setTimeout(() => setCopiedTxnId(null), 2000)
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-16 max-w-4xl">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
            Add Balance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Top up your wallet to purchase coupons</p>
        </div>

        {/* Current Balance */}
        <Card
          className={cn(
            "mb-8 border-none shadow-xl overflow-hidden",
            "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl",
            "hover:shadow-2xl transition-all duration-300"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          <CardContent className="relative flex items-center justify-center p-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Current Balance</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {formatCurrency(user.wallet_balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Balance Form */}
        <Card className={cn("mb-8 border-none shadow-xl", "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl")}>
          <CardHeader>
            <CardTitle className="text-2xl">Add Money to Wallet</CardTitle>
            <CardDescription>Enter amount and proceed to payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-semibold">
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-14 text-lg"
                  min="1"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    onClick={() => handleQuickAmount(quickAmount)}
                    className={cn(
                      "h-12",
                      amount === quickAmount.toString() && "border-primary bg-primary/10 text-primary"
                    )}
                  >
                    ₹{quickAmount.toLocaleString("en-IN")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Proceed Button */}
            <Button
              onClick={handleProceedToPay}
              disabled={isProcessing || !amount}
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Pay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className={cn("border-none shadow-xl", "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl")}>
          <CardHeader>
            <CardTitle className="text-2xl">Transaction History</CardTitle>
            <CardDescription>Your recent wallet topups</CardDescription>
          </CardHeader>
          <CardContent>
            {topupsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : topups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topups.map((topup, index) => (
                      <TableRow key={topup.id}>
                        <TableCell className="font-semibold">{formatCurrency(topup.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm truncate max-w-[150px]">
                              {topup.transaction_id || topup.id.slice(0, 12)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyTransactionId(topup.transaction_id || topup.id)}
                            >
                              {copiedTxnId === (topup.transaction_id || topup.id) ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{topup.payment_method || "UPI"}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(topup.status)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(topup.created_at).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
