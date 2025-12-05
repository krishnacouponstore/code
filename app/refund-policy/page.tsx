import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export const metadata = {
  title: "Refund Policy | CodeCrate",
  description: "Refund Policy for CodeCrate - Your Trusted Coupon Marketplace",
}

export default function RefundPolicyPage() {
  const lastUpdated = "December 1, 2024"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Important Notice */}
        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Important Notice</h3>
                <p className="text-muted-foreground">
                  Please read this refund policy carefully before making any purchase. By using our services, you agree
                  to this policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. General Policy</h2>
              <p className="text-muted-foreground">
                All purchases on CodeCrate are final. Once coupon codes are delivered to your account, they cannot be
                returned or exchanged. This is due to the digital nature of our products and the inability to verify if
                codes have been used after delivery.
              </p>
            </section>

            {/* Refund Eligible */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                Eligible for Refund
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You may be eligible for a refund in the following cases:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Invalid Codes:</strong> If you receive a code that was already used or invalid at the time
                      of delivery (verified within 24 hours of purchase)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Technical Issues:</strong> If a system error resulted in duplicate charges or incorrect
                      deductions
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Non-Delivery:</strong> If codes were not delivered due to a system failure (must be
                      reported within 1 hour)
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Not Eligible */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-destructive" />
                Not Eligible for Refund
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Used Codes:</strong> Codes that have already been redeemed by the user
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Expired Codes:</strong> Codes that expired after the purchase date
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Change of Mind:</strong> Refunds for simply not wanting the codes anymore
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Delayed Reports:</strong> Issues reported more than 24 hours after purchase
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Wallet Balance:</strong> Money added to wallet is non-refundable
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How to Request a Refund</h2>
              <div className="space-y-4 text-muted-foreground">
                <ol className="list-decimal pl-6 space-y-3">
                  <li>Contact us via Telegram (@Krishna_Arora_New) within 24 hours of purchase</li>
                  <li>Provide your order ID and registered email address</li>
                  <li>Describe the issue with specific details</li>
                  <li>Provide screenshot proof if applicable (e.g., showing code is invalid)</li>
                  <li>Wait for our team to verify and process your request</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Refund Processing</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Approved refunds will be credited to your CodeCrate wallet within 24-48 hours</li>
                  <li>
                    In exceptional cases, refunds may be processed to the original payment method (processing time: 5-7
                    business days)
                  </li>
                  <li>We reserve the right to offer replacement codes instead of refunds</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Dispute Resolution</h2>
              <p className="text-muted-foreground">
                If you disagree with our refund decision, you may escalate the issue by emailing
                krishnacouponstore@gmail.com with "Refund Dispute" in the subject line. Our team will review your case
                within 3-5 business days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Contact Us</h2>
              <p className="text-muted-foreground">
                For refund requests or questions about this policy, please visit our{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>{" "}
                or message us on Telegram at @Krishna_Arora_New.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms & Conditions
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
