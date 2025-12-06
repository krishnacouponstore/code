"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Wallet, Clock, Send, Copy, Mail, Info, ExternalLink } from "lucide-react"

const contactInfo = {
  telegram: "@Krishna_Arora_New",
  telegram_url: "https://t.me/Krishna_Arora_New",
  email: "krishnacouponstore@gmail.com",
  min_topup: 100,
}

export default function AddBalancePage() {
  const { user, isLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    if (isLoggingOut) return

    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)
    }
    if (!isLoading && user?.is_admin) {
      router.push("/admin/dashboard")
    }
  }, [isLoading, isAuthenticated, router, pathname, isLoggingOut, user])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const openTelegram = () => {
    const message = encodeURIComponent(`Hi, I want to add balance to my CoupX account.\nEmail: ${user.email}`)
    window.open(`${contactInfo.telegram_url}?text=${message}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader walletBalance={user.wallet_balance} userName={user.name} userEmail={user.email} />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-foreground mb-3">Add Balance Feature Coming Soon</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            We're setting up secure UPI payment integration. In the meantime, contact our admin to add balance to your
            wallet.
          </p>

          {/* Current Balance Card */}
          <Card className="w-full max-w-sm mb-8 bg-card border-border">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Your Current Balance</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{formatCurrency(user.wallet_balance)}</span>
            </CardContent>
          </Card>

          {/* Contact Admin Card */}
          <Card className="w-full bg-card border-border">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-foreground flex items-center justify-center gap-2">
                <Send className="h-5 w-5 text-[#0088cc]" />
                Contact Admin for Balance Top-Up
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Reach out via Telegram for instant support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Telegram Username */}
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-secondary">
                <span className="text-xl font-mono font-semibold text-foreground">{contactInfo.telegram}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(contactInfo.telegram, "Username")}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy username</span>
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-left space-y-3 p-4 rounded-xl bg-secondary/50">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">1.</span> Message on Telegram with your registered email
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">2.</span> Specify amount to add (minimum{" "}
                  {formatCurrency(contactInfo.min_topup)})
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">3.</span> Complete payment via UPI/Bank transfer
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">4.</span> Balance will be credited within 10 minutes
                </p>
              </div>

              {/* Open Telegram Button */}
              <Button
                onClick={openTelegram}
                className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-full font-medium gap-2"
              >
                <Send className="h-4 w-4" />
                Open Telegram
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>

              {/* Alternative Contact */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Or reach us via email:</p>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{contactInfo.email}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(contactInfo.email, "Email")}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy email</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="w-full mt-6 bg-secondary/30 border-border">
            <CardContent className="flex items-start gap-3 p-4">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground text-left">
                Automatic UPI payments will be available soon. We're working on Razorpay integration for instant
                top-ups.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
