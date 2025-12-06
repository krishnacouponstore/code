"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function CTASection() {
  const { user } = useAuth()
  const isAdmin = user?.is_admin ?? false

  return (
    <section className="w-full pt-16 md:pt-32 pb-10 md:pb-20 px-5 relative flex flex-col justify-center items-center overflow-visible">
      {/* Background gradient */}
      <div className="absolute inset-0 top-[-90px]">
        <svg
          className="w-full h-full"
          viewBox="0 0 1388 825"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <mask
            id="mask_cta"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="269"
            y="27"
            width="850"
            height="493"
          >
            <rect x="269.215" y="27.4062" width="849.57" height="492.311" fill="url(#paint_cta_linear)" />
          </mask>
          <g mask="url(#mask_cta)">
            <g filter="url(#filter_cta)">
              <ellipse
                cx="694"
                cy="-93.0414"
                rx="670.109"
                ry="354.908"
                fill="url(#paint_cta_radial)"
                fillOpacity="0.8"
              />
            </g>
          </g>
          <defs>
            <filter
              id="filter_cta"
              x="-234.109"
              y="-705.949"
              width="1856.22"
              height="1225.82"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="129" result="effect1_foregroundBlur" />
            </filter>
            <linearGradient
              id="paint_cta_linear"
              x1="1118.79"
              y1="273.562"
              x2="269.215"
              y2="273.562"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--background))" stopOpacity="0" />
              <stop offset="0.2" stopColor="hsl(var(--background))" stopOpacity="0.8" />
              <stop offset="0.8" stopColor="hsl(var(--background))" stopOpacity="0.8" />
              <stop offset="1" stopColor="hsl(var(--background))" stopOpacity="0" />
            </linearGradient>
            <radialGradient
              id="paint_cta_radial"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(683.482 245.884) rotate(-3.78676) scale(469.009 248.4)"
            >
              <stop offset="0.1294" stopColor="hsl(var(--primary-dark))" />
              <stop offset="0.2347" stopColor="hsl(var(--primary))" />
              <stop offset="0.3" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col justify-start items-center gap-8 max-w-2xl mx-auto text-center">
        <h2 className="text-foreground text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight">
          Start Saving Today
        </h2>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
          Join thousands of smart shoppers who save money every day with CoupX's premium coupon codes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {user ? (
            isAdmin ? (
              // Admin logged in - show Admin Panel button
              <Link href="/admin/dashboard">
                <Button
                  className="px-8 py-3 bg-secondary text-secondary-foreground rounded-full shadow-[0px_0px_0px_4px_rgba(255,255,255,0.13)] hover:bg-secondary/90 flex items-center gap-2"
                  size="lg"
                >
                  <Settings className="w-4 h-4" />
                  Go to Admin Panel
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              // Regular user logged in - show "Start Saving Now" linking to coupons
              <Link href="/coupons">
                <Button
                  className="px-8 py-3 bg-secondary text-secondary-foreground rounded-full shadow-[0px_0px_0px_4px_rgba(255,255,255,0.13)] hover:bg-secondary/90 flex items-center gap-2"
                  size="lg"
                >
                  Start Saving Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )
          ) : (
            // Not logged in - show "Create Free Account"
            <Link href="/signup">
              <Button
                className="px-8 py-3 bg-secondary text-secondary-foreground rounded-full shadow-[0px_0px_0px_4px_rgba(255,255,255,0.13)] hover:bg-secondary/90 flex items-center gap-2"
                size="lg"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <Link href="/contact">
            <Button
              variant="ghost"
              className="px-8 py-3 text-muted-foreground hover:text-foreground rounded-full"
              size="lg"
            >
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
