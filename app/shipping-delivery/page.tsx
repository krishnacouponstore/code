"use client"

import { Navbar } from "@/components/navbar"
import { PublicNavbar } from "@/components/public-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Zap, Package, CheckCircle, Clock, CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"
import { SITE_CONTACTS } from "@/lib/site-config"
import { useAuth } from "@/lib/auth-context"

export default function ShippingDeliveryPage() {
  const { isAuthenticated } = useAuth()
  const lastUpdated = "December 8, 2025"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {isAuthenticated ? <Navbar /> : <PublicNavbar />}

      <main className="max-w-4xl mx-auto px-6 py-12 pt-32">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-lg bg-primary/10 mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Shipping & Delivery Policy</h1>
          <p className="text-muted-foreground">Digital Products - Instant Delivery</p>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {lastUpdated}</p>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-primary mb-1">Digital Products Only</p>
                <p className="text-sm text-muted-foreground">
                  CoupX provides digital coupon codes and vouchers only. We do not ship any physical products.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-8 space-y-8">
            {/* Delivery Method */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Delivery Method
              </h2>
              <p className="text-muted-foreground mb-4">
                All our products are delivered <strong className="text-foreground">digitally</strong> through your
                account dashboard immediately after successful payment.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-2">How to access your coupons:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Log in to your account</li>
                  <li>Navigate to "Purchase History"</li>
                  <li>Click on your order to view coupon codes</li>
                  <li>Copy and use the codes immediately</li>
                </ol>
              </div>
            </section>

            {/* Delivery Time */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Delivery Time
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-green-600">
                  <Zap className="h-3 w-3 mr-1" />
                  Instant Delivery
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Delivery is <strong className="text-green-500">instant</strong>. Coupon codes appear immediately in your
                purchase history as soon as payment is confirmed.
              </p>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-green-500">
                  Most orders are delivered within <strong>seconds</strong> of payment confirmation.
                </p>
              </div>
            </section>

            {/* Shipping Charges */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                Shipping Charges
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-purple-600 text-white">
                  ₹0 Shipping Fee
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">
                There are <strong className="text-foreground">no shipping or handling charges</strong>, as all products
                are digital and delivered electronically.
              </p>
              <p className="text-sm text-muted-foreground">
                You only pay the coupon price displayed on our platform. No hidden fees.
              </p>
            </section>

            {/* Order Confirmation */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Order Confirmation
              </h2>
              <p className="text-muted-foreground mb-4">Once payment is completed successfully, you will receive:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">On-screen confirmation</strong> with order details
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Purchase record</strong> stored in your account dashboard
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Immediate access</strong> to your coupon codes
                  </span>
                </li>
              </ul>
            </section>

            {/* Delivery Issues */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Delivery Issues?
              </h2>
              <p className="text-muted-foreground mb-4">
                If you did not receive your coupon code after successful payment, please contact us immediately:
              </p>

              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <a
                  href={`mailto:${SITE_CONTACTS.email}`}
                  className="p-4 rounded-lg bg-muted/50 border hover:border-primary/50 transition-colors"
                >
                  <p className="font-semibold mb-1">Email Support</p>
                  <p className="text-sm text-primary">{SITE_CONTACTS.email}</p>
                </a>
                <a
                  href={`https://t.me/${SITE_CONTACTS.telegram.support.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-lg bg-muted/50 border hover:border-primary/50 transition-colors"
                >
                  <p className="font-semibold mb-1">Telegram Support</p>
                  <p className="text-sm text-primary">{SITE_CONTACTS.telegram.support}</p>
                </a>
              </div>

              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-sm text-orange-500 font-medium mb-2">
                  When reporting a delivery issue, please include:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Your registered email address</li>
                  <li>Order ID or transaction reference</li>
                  <li>Payment confirmation screenshot</li>
                  <li>Date and time of purchase</li>
                </ul>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    No Physical Delivery
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Since all products are digital, there is no physical shipping address required. Your account email
                    is sufficient for delivery.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Permanent Access
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    All purchased coupons remain accessible in your account history, even after use.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    24/7 Access
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Access your purchased coupons anytime from your dashboard - no waiting, no delays.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    International Availability
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Digital delivery means our coupons are available globally, with no geographical restrictions on
                    delivery.
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/refund-policy" className="hover:text-foreground transition-colors">
            Refund Policy
          </Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact Us
          </Link>
        </div>
      </main>
    </div>
  )
}
