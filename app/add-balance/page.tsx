"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Wallet, QrCode, Copy, Check, Mail, MessageCircle, AlertTriangle, ExternalLink, Download } from "lucide-react"
import Image from "next/image"
import { SITE_CONTACTS } from "@/lib/site-config"
import { useTheme } from "next-themes"

export default function AddBalancePage() {
  const { user, isLoading, isAuthenticated, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()

  const [copiedUpi, setCopiedUpi] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value)
  }

  const handleCopyUpi = async () => {
    await navigator.clipboard.writeText(SITE_CONTACTS.upiId)
    setCopiedUpi(true)
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    })
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(SITE_CONTACTS.email)
    setCopiedEmail(true)
    toast({
      title: "Copied!",
      description: "Email copied to clipboard",
    })
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleDownloadQR = async () => {
    try {
      const qrCodeUrl = resolvedTheme === "dark" ? "/images/blackqr.jpg" : "/images/lightqr.jpg"

      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()

      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = "coupx-upi-qrcode.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup blob URL
      URL.revokeObjectURL(blobUrl)

      toast({
        title: "Downloaded!",
        description: "QR code saved to your device",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again or screenshot the QR code",
        variant: "destructive",
      })
    }
  }

  const handleOpenTelegram = () => {
    const message = encodeURIComponent(`Hi, I want to add balance to my CoupX account.\n\nEmail: ${user.email}`)
    window.open(`https://t.me/${SITE_CONTACTS.telegram.support.replace("@", "")}?text=${message}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader walletBalance={user.wallet_balance} userName={user.name} userEmail={user.email} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Balance</h1>
          <p className="text-muted-foreground">Top up your wallet to purchase coupons</p>
        </div>

        {/* Current Balance */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(user.wallet_balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scan & Pay
            </CardTitle>
            <CardDescription>Scan QR code with any UPI app to pay</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* QR Code Image - Theme Based */}
            <div className="relative w-full max-w-[280px] aspect-square rounded-xl p-4 mb-4 shadow-lg bg-white dark:bg-zinc-900">
              <Image
                src="/images/lightqr.jpg"
                alt="UPI QR Code"
                fill
                className="object-contain p-2 dark:hidden"
                priority
              />
              <Image
                src="/images/blackqr.jpg"
                alt="UPI QR Code"
                fill
                className="object-contain p-2 hidden dark:block"
                priority
              />
            </div>

            {/* Download QR Button */}
            <Button variant="outline" size="sm" onClick={handleDownloadQR} className="mb-6 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>

            {/* UPI ID with Copy */}
            <div className="w-full max-w-sm space-y-2">
              <Label className="text-center block text-muted-foreground">Or pay using UPI ID</Label>
              <div className="flex gap-2">
                <Input value={SITE_CONTACTS.upiId} readOnly className="font-mono bg-muted text-center" />
                <Button variant="outline" size="icon" onClick={handleCopyUpi}>
                  {copiedUpi ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Minimum Amount Warning */}
            <Alert className="mt-6 border-yellow-500/50 bg-yellow-500/10 max-w-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Minimum amount: ₹100</strong>
                <br />
                Payments below ₹100 will not be processed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Send Payment Proof */}
        <Card className="border-primary/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-primary">
              <MessageCircle className="h-5 w-5" />
              Send Payment Screenshot
            </CardTitle>
            <CardDescription>After payment, send screenshot with your email to add balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Telegram */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Telegram (Recommended - Fastest)
              </Label>
              <div className="flex gap-2">
                <Input value={SITE_CONTACTS.telegram.support} readOnly className="font-mono bg-muted" />
                <Button onClick={handleOpenTelegram} className="shrink-0">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email (Alternative)
              </Label>
              <div className="flex gap-2">
                <Input value={SITE_CONTACTS.email} readOnly className="font-mono bg-muted text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopyEmail}>
                  {copiedEmail ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Balance Update Notice */}
            <p className="text-center text-sm text-muted-foreground pt-2">
              Balance will be added within <strong className="text-primary">5-10 minutes</strong> after verification
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
