"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
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
import { cn } from "@/lib/utils"

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
        <Card className={cn(
          "mb-8 border-none shadow-xl overflow-hidden",
          "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl",
          "hover:shadow-2xl transition-all duration-300"
        )}>
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

        {/* QR Code Card */}
        <Card className={cn(
          "mb-8 border-none shadow-xl",
          "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl"
        )}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <QrCode className="h-6 w-6 text-primary" />
              Scan & Pay
            </CardTitle>
            <CardDescription className="text-base">Scan QR code with any UPI app to pay</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* QR Code Image - Theme Based */}
            <div className="relative w-full max-w-[300px] aspect-square rounded-2xl p-6 mb-6 shadow-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <Image
                src="/images/lightqr.jpg"
                alt="UPI QR Code"
                fill
                className="object-contain p-2 dark:hidden rounded-xl"
                priority
              />
              <Image
                src="/images/blackqr.jpg"
                alt="UPI QR Code"
                fill
                className="object-contain p-2 hidden dark:block rounded-xl"
                priority
              />
            </div>

            {/* Download QR Button */}
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleDownloadQR} 
              className="mb-8 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>

            {/* UPI ID with Copy */}
            <div className="w-full max-w-md space-y-3">
              <Label className="text-center block text-gray-600 dark:text-gray-400 font-medium">Or pay using UPI ID</Label>
              <div className="flex gap-2">
                <Input 
                  value={SITE_CONTACTS.upiId} 
                  readOnly 
                  className="font-mono bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-center text-lg h-12" 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleCopyUpi}
                  className="h-12 w-12 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
                >
                  {copiedUpi ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Minimum Amount Warning */}
            <Alert className="mt-8 border-yellow-500/50 bg-yellow-500/10 max-w-md backdrop-blur-sm">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <AlertDescription className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                <strong>Minimum amount: ₹100</strong>
                <br />
                Payments below ₹100 will not be processed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Send Payment Proof */}
        <Card className={cn(
          "border-none shadow-xl",
          "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none rounded-xl" />
          <CardHeader className="text-center relative">
            <CardTitle className="flex items-center justify-center gap-2 text-primary text-2xl">
              <MessageCircle className="h-6 w-6" />
              Send Payment Screenshot
            </CardTitle>
            <CardDescription className="text-base">After payment, send screenshot with your email to add balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            {/* Telegram */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <MessageCircle className="h-5 w-5 text-primary" />
                Telegram (Recommended - Fastest)
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={SITE_CONTACTS.telegram.support} 
                  readOnly 
                  className="font-mono bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 h-12" 
                />
                <Button 
                  onClick={handleOpenTelegram} 
                  className="shrink-0 h-12 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Mail className="h-5 w-5 text-primary" />
                Email (Alternative)
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={SITE_CONTACTS.email} 
                  readOnly 
                  className="font-mono bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-sm h-12" 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleCopyEmail}
                  className="h-12 w-12 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
                >
                  {copiedEmail ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Balance Update Notice */}
            <div className="pt-4 pb-2">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Balance will be added within <strong className="text-primary">5-10 minutes</strong> after verification
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
