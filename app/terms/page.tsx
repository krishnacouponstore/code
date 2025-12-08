import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { SITE_CONFIG } from "@/lib/site-config"

export const metadata = {
  title: "Terms & Conditions | CoupX",
  description: "Terms and Conditions for CoupX - Your Trusted Coupon Marketplace",
}

export default function TermsPage() {
  const lastUpdated = "December 8, 2025"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using CoupX, you agree to be bound by these Terms and Conditions. If you do not agree to
                these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground">
                CoupX is a platform that allows users to purchase genuine coupon codes for various e-commerce and food
                delivery platforms. We act as an intermediary between coupon code suppliers and end users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>To use our services, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create an account with accurate information</li>
                  <li>Be at least 18 years old</li>
                  <li>Keep your login credentials secure</li>
                  <li>Not share your account with others</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Wallet and Payments</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users must add balance to their wallet before purchasing coupon codes</li>
                  <li>Minimum top-up amount is ₹{SITE_CONFIG.minTopup}</li>
                  <li>
                    Wallet balance is non-refundable except in specific circumstances outlined in our Refund Policy
                  </li>
                  <li>All payments are processed securely through UPI</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Coupon Codes</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc pl-6 space-y-2">
                  <li>All coupon codes are verified before being made available</li>
                  <li>Codes are delivered instantly upon successful purchase</li>
                  <li>Each code can only be used once unless otherwise specified</li>
                  <li>We are not responsible for codes that expire or become invalid after purchase</li>
                  <li>Codes cannot be exchanged or returned once purchased</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Prohibited Activities</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Resell purchased coupon codes without authorization</li>
                  <li>Use automated systems to access our platform</li>
                  <li>Attempt to circumvent our security measures</li>
                  <li>Engage in fraudulent activities</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content on CoupX, including logos, designs, and text, is our property and protected by intellectual
                property laws. You may not use our content without express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                CoupX is provided "as is" without warranties of any kind. We are not liable for any indirect,
                incidental, or consequential damages arising from your use of our services. Our total liability shall
                not exceed the amount you paid for the specific service in question.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time for violation of these terms or
                for any other reason at our discretion. Upon termination, your right to use our services will
                immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may modify these terms at any time. Continued use of our services after changes constitutes
                acceptance of the new terms. We encourage you to review these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These terms are governed by the laws of India. Any disputes shall be resolved in the courts of competent
                jurisdiction in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground">
                For any questions regarding these Terms & Conditions, please contact us at{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  our contact page
                </Link>
                .
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
          <Link href="/refund-policy" className="hover:text-foreground transition-colors">
            Refund Policy
          </Link>
          <span>•</span>
          <Link href="/shipping-delivery" className="hover:text-foreground transition-colors">
            Shipping & Delivery
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
