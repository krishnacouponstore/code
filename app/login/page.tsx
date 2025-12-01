"use client"

import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Suspense } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border/50 rounded-2xl shadow-xl p-8">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-foreground text-2xl font-semibold">CodeCrate</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Your Trusted Coupon Marketplace</p>
        </div>

        {redirect && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Login Required</p>
                <p className="text-xs text-muted-foreground mt-1">Please login to access this feature</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground text-center">Welcome back</h2>
          <p className="text-muted-foreground text-sm text-center mt-1">Sign in to your account</p>
        </div>

        <LoginForm redirectTo={redirect || undefined} />

        <p className="text-center text-sm text-muted-foreground mt-6">
          {"Don't have an account? "}
          <Link
            href={redirect ? `/signup?redirect=${redirect}` : "/signup"}
            className="text-primary font-medium hover:underline"
          >
            Sign up
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
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse bg-card rounded-2xl" />}>
          <LoginContent />
        </Suspense>
      </main>
    </div>
  )
}
