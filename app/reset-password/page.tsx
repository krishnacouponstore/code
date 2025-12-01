import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import Link from "next/link"

export const metadata = {
  title: "Reset Password | CodeCrate",
  description: "Create a new password for your CodeCrate account",
}

export default function ResetPasswordPage() {
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
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <span className="text-foreground text-2xl font-semibold">CodeCrate</span>
              </Link>
              <p className="text-sm text-muted-foreground mt-1">Your Trusted Coupon Marketplace</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground text-center">Create New Password</h2>
              <p className="text-muted-foreground text-sm text-center mt-1">Enter your new password below</p>
            </div>

            <ResetPasswordForm />
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
