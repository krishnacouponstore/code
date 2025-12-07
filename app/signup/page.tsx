"use client"

import { SignupForm } from "@/components/auth/signup-form"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, ArrowLeft, Sun, Moon } from "lucide-react"
import { Suspense } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

function SignupContent() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")
  const { theme, setTheme } = useTheme()

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <Link href="/home">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-xl p-8">
        {/* Logo and Branding */}
        <div className="text-center mb-6">
          <Link href="/home" className="inline-flex items-center justify-center mb-4">
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

        {redirect && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Account Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please sign up or login to access coupons and start saving!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground text-center">Create an account</h2>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href={redirect ? `/login?redirect=${redirect}` : "/login"}
            className="text-primary font-medium hover:underline"
          >
            Login
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

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse bg-card rounded-2xl" />}>
          <SignupContent />
        </Suspense>
      </main>
    </div>
  )
}
