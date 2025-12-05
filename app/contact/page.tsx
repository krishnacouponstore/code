"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Send, Mail, Copy, Check, Clock, Wallet, HelpCircle, ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"

const contactInfo = {
  telegram: {
    username: "@Krishna_Arora_New",
    url: "https://t.me/Krishna_Arora_New",
    response_time: "Usually responds within 1 hour",
    availability: "24/7",
  },
  email: {
    address: "krishnacouponstore@gmail.com",
    response_time: "We respond within 24 hours",
    hours: "Monday - Saturday, 9 AM - 9 PM IST",
  },
  business: {
    name: "CodeCrate",
    min_topup: 100,
  },
}

const quickLinks = [
  { label: "How to add balance?", href: "/about#how-it-works" },
  { label: "How to download purchased codes?", href: "/purchase-history" },
  { label: "Refund policy", href: "/refund-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
]

const topUpSteps = [
  "Message us on Telegram (@Krishna_Arora_New)",
  "Provide your registered email address",
  "Specify the amount you want to add (minimum ₹100)",
  "Complete payment via UPI/Bank Transfer",
  "Your balance will be credited within 10 minutes",
]

export default function ContactPage() {
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const [copiedTelegram, setCopiedTelegram] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const copyToClipboard = async (text: string, type: "telegram" | "email") => {
    await navigator.clipboard.writeText(text)
    if (type === "telegram") {
      setCopiedTelegram(true)
      setTimeout(() => setCopiedTelegram(false), 2000)
    } else {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    }
    toast({
      title: "Copied to clipboard!",
      description: `${text} has been copied.`,
    })
  }

  const openTelegram = () => {
    const message = user
      ? `Hi, I need help with CodeCrate. My registered email: ${user.email}`
      : "Hi, I need help with CodeCrate."
    const encodedMessage = encodeURIComponent(message)
    window.open(`${contactInfo.telegram.url}?text=${encodedMessage}`, "_blank")
  }

  const openEmail = () => {
    const subject = encodeURIComponent("CodeCrate Support Request")
    window.open(`mailto:${contactInfo.email.address}?subject=${subject}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Contact Us</h1>
          <p className="text-muted-foreground text-lg">Have questions? We're here to help</p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Left Column - Contact Cards */}
          <div className="space-y-6">
            {/* Telegram Card - Primary */}
            <Card className="bg-card border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Telegram Support</CardTitle>
                    <CardDescription>For instant support and balance top-up requests</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                  <code className="text-lg font-mono text-primary">{contactInfo.telegram.username}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(contactInfo.telegram.username, "telegram")}
                    className="h-8 w-8"
                  >
                    {copiedTelegram ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={openTelegram}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Open Telegram
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {contactInfo.telegram.response_time}
                </p>
              </CardContent>
            </Card>

            {/* Email Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Email Support</CardTitle>
                    <CardDescription>For detailed inquiries and documentation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                  <code className="text-sm font-mono text-foreground">{contactInfo.email.address}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(contactInfo.email.address, "email")}
                    className="h-8 w-8"
                  >
                    {copiedEmail ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button variant="outline" onClick={openEmail} className="w-full rounded-full bg-transparent">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {contactInfo.email.response_time}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Links */}
          <div>
            <Card className="bg-card border-border h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <HelpCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Quick Help</CardTitle>
                    <CardDescription>Find answers to common questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {quickLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <span className="text-foreground group-hover:text-primary transition-colors">{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Hours */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Support Hours</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Telegram</p>
                    <p className="text-foreground font-medium">{contactInfo.telegram.availability}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground font-medium">{contactInfo.email.hours}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Top-Up Instructions */}
        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-foreground">Need to Add Balance?</CardTitle>
                <CardDescription>Follow these simple steps to top up your wallet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3">
              {topUpSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <Button
              onClick={openTelegram}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-full mt-4"
            >
              <Send className="h-4 w-4 mr-2" />
              Contact on Telegram
            </Button>
          </CardContent>
        </Card>

        {/* Business Information */}
        <div className="text-center text-muted-foreground text-sm space-y-1">
          <p className="font-medium text-foreground">{contactInfo.business.name}</p>
          <p>Email: {contactInfo.email.address}</p>
          <p>Telegram: {contactInfo.telegram.username}</p>
        </div>
      </main>
    </div>
  )
}
