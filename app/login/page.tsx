"use client"

import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, ArrowLeft, Sun, Moon } from "lucide-react"
import { Suspense } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

function LoginContent() {
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
        <div className="text-center mb-8">
          <Link href="/home" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-foreground text-2xl font-semibold">CodeCrate</span>
          </Link>
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
