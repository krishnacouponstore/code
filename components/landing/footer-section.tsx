"use client"

import { Mail, Send } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export function FooterSection() {
  const { user, isAuthenticated } = useAuth()
  const isAdmin = isAuthenticated && user?.is_admin

  const getProductLink = (path: string) => {
    if (!isAuthenticated) {
      return `/login?redirect=${path}`
    }
    return path
  }

  return (
    <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0 py-10 md:py-16 border-t border-border">
      {/* Left Section */}
      <div className="flex flex-col justify-start items-start gap-6 p-4 md:p-8">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="text-foreground text-xl font-semibold">CodeCrate</span>
        </Link>
        <p className="text-muted-foreground text-sm max-w-xs">
          Your trusted destination for premium coupon codes. Save more, spend less.
        </p>
        <div className="flex justify-start items-start gap-4">
          <a
            href="https://t.me/rohanphogatt"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Send className="w-full h-full" />
          </a>
          <a
            href="mailto:contact@codecrate.com"
            aria-label="Email"
            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="w-full h-full" />
          </a>
        </div>
      </div>

      {/* Right Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 p-4 md:p-8 w-full md:w-auto">
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium">{isAdmin ? "Admin" : "Product"}</h3>
          <div className="flex flex-col justify-end items-start gap-2">
            {isAdmin ? (
              <>
                <Link href="/admin/slots" className="text-foreground text-sm hover:text-primary transition-colors">
                  Manage Coupons
                </Link>
                <Link href="/admin/revenue" className="text-foreground text-sm hover:text-primary transition-colors">
                  Revenue
                </Link>
                <Link href="/admin/orders" className="text-foreground text-sm hover:text-primary transition-colors">
                  Orders
                </Link>
                <Link href="/admin/users" className="text-foreground text-sm hover:text-primary transition-colors">
                  Users
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={getProductLink("/coupons")}
                  className="text-foreground text-sm hover:text-primary transition-colors"
                >
                  Browse Coupons
                </Link>
                <Link
                  href={getProductLink("/add-balance")}
                  className="text-foreground text-sm hover:text-primary transition-colors"
                >
                  Add Balance
                </Link>
                <Link
                  href={getProductLink("/purchase-history")}
                  className="text-foreground text-sm hover:text-primary transition-colors"
                >
                  Purchase History
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium">Company</h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <Link href="/about" className="text-foreground text-sm hover:text-primary transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="text-foreground text-sm hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium">Legal</h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <Link href="/privacy" className="text-foreground text-sm hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-foreground text-sm hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="text-foreground text-sm hover:text-primary transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
