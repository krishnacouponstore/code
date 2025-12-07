"use client"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import Link from "next/link"
import Image from "next/image"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border/50 rounded-2xl shadow-xl p-8">
            {/* Logo and Branding */}
            <div className="text-center mb-8">
              <Link href="/home" className="inline-flex items-center justify-center">
                <Image
                  src="/images/coupx-logo-dark.png"
                  alt="CoupX"
                  width={320}
                  height={100}
                  className="h-24 md:h-28 w-auto dark:hidden scale-125"
                  priority
                />
                <Image
                  src="/images/coupx-logo-light.png"
                  alt="CoupX"
                  width={320}
                  height={100}
                  className="h-24 md:h-28 w-auto hidden dark:block"
                  priority
                />
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground text-center">Forgot Password?</h2>
            </div>

            <ForgotPasswordForm />

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link href="/login" className="text-primary font-medium hover:underline">
                Back to Login
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About Us
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
