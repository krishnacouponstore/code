"use client"

import { Navbar } from "@/components/navbar"
import { PublicNavbar } from "@/components/public-navbar"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { SITE_CONTACTS } from "@/lib/site-config"
import { useAuth } from "@/lib/auth-context"

export default function PrivacyPage() {
  const { isAuthenticated } = useAuth()
  const lastUpdated = "December 8, 2025"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {isAuthenticated ? <Navbar /> : <PublicNavbar />}

      <main className="max-w-4xl mx-auto px-6 py-12 pt-32">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We collect information you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name and email address when you create an account</li>
                  <li>Phone number (optional) for account recovery</li>
                  <li>Payment information when you add balance to your wallet</li>
                  <li>Transaction history and purchase records</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Protect against fraudulent or illegal activity</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Information Sharing</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties. We may share
                  information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>With your consent or at your direction</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With service providers who assist in our operations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. All data is encrypted using
                industry-standard 256-bit encryption.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide you
                services. You may request deletion of your account and associated data by contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Data portability</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to maintain your session, remember your preferences, and improve
                your experience. You can control cookie settings through your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the
                new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  our contact page
                </Link>{" "}
                or email us at{" "}
                <a href={`mailto:${SITE_CONTACTS.email}`} className="text-primary hover:underline">
                  {SITE_CONTACTS.email}
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms & Conditions
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
