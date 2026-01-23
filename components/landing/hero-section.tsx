"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "./landing-header"
import Link from "next/link"
import { ArrowRight, Shield, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function HeroSection() {
  const { user } = useAuth()
  const isAdmin = user?.is_admin ?? false

  return (
    <section className="flex flex-col items-center text-center relative mx-auto rounded-2xl overflow-hidden py-0 px-4 w-full max-w-full min-h-screen">
      {/* SVG Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <g clipPath="url(#clip0_hero)">
            <mask
              id="mask0_hero"
              style={{ maskType: "alpha" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1440"
              height="900"
            >
              <rect x="0" y="0" width="1440" height="900" fill="url(#paint0_linear_hero)" />
            </mask>
            <g mask="url(#mask0_hero)">
              {/* Grid - reduced for mobile performance */}
              {[...Array(42)].map((_, i) => (
                <React.Fragment key={`row-${i}`}>
                  {[...Array(26)].map((_, j) => (
                    <rect
                      key={`cell-${i}-${j}`}
                      x={i * 36}
                      y={j * 36}
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                  ))}
                </React.Fragment>
              ))}
              {/* Accent squares */}
              <rect x="699.711" y="81" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.08" />
              <rect x="195.711" y="153" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
              <rect x="1023.71" y="153" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
              <rect x="123.711" y="225" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
              <rect x="951.711" y="297" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
              <rect x="519.711" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.08" />
            </g>

            {/* Gradient blobs */}
            <g filter="url(#filter0_hero)">
              <path
                d="M1447.45 -87.0203V-149.03H1770V1248.85H466.158V894.269C1008.11 894.269 1447.45 454.931 1447.45 -87.0203Z"
                fill="url(#paint1_linear_hero)"
              />
            </g>
            <g filter="url(#filter1_hero)">
              <path
                d="M1383.45 -151.02V-213.03H1706V1184.85H402.158V830.269C944.109 830.269 1383.45 390.931 1383.45 -151.02Z"
                fill="url(#paint2_linear_hero)"
                fillOpacity="0.69"
              />
            </g>
          </g>

          <rect
            x="0.5"
            y="0.5"
            width="100%"
            height="100%"
            rx="15.5"
            stroke="hsl(var(--foreground))"
            strokeOpacity="0.06"
          />

          <defs>
            <filter
              id="filter0_hero"
              x="147.369"
              y="-467.818"
              width="1941.42"
              height="2035.46"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="159.394" result="effect1_foregroundBlur" />
            </filter>
            <filter
              id="filter1_hero"
              x="-554.207"
              y="-1169.39"
              width="3216.57"
              height="3310.61"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="478.182" result="effect1_foregroundBlur" />
            </filter>
            <linearGradient
              id="paint0_linear_hero"
              x1="35.0676"
              y1="23.6807"
              x2="1100"
              y2="700"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground))" stopOpacity="0" />
              <stop offset="1" stopColor="hsl(var(--muted-foreground))" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_hero"
              x1="1118.08"
              y1="-149.03"
              x2="1118.08"
              y2="1248.85"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground))" />
              <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
              <stop offset="1" stopColor="hsl(var(--primary))" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_hero"
              x1="1054.08"
              y1="-213.03"
              x2="1054.08"
              y2="1184.85"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground))" />
              <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
              <stop offset="1" stopColor="hsl(var(--primary))" />
            </linearGradient>
            <clipPath id="clip0_hero">
              <rect width="1440" height="900" rx="16" fill="hsl(var(--foreground))" />
            </clipPath>
          </defs>
        </svg>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <LandingHeader />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 pt-20 md:pt-24 pb-12 px-4 w-full max-w-full">
        {/* Hero Content */}
        <div className="space-y-4 md:space-y-5 lg:space-y-6 mb-8 max-w-md md:max-w-[550px] lg:max-w-[650px] w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">100% Verified Codes</span>
          </div>
          <h1 className="text-foreground text-3xl md:text-4xl lg:text-6xl font-semibold leading-tight text-balance">
            Premium Coupons at Unbeatable Prices
          </h1>
          <p className="text-muted-foreground text-base md:text-base lg:text-lg font-medium leading-relaxed max-w-lg mx-auto">
            Get instant access to verified coupon codes for your favorite brands. Save more, spend less with CoupX.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
          {user ? (
            isAdmin ? (
              // Admin logged in - show Admin Panel button
              <Link href="/admin/dashboard">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Go to Admin Panel
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              // Regular user logged in - show Start Saving Now linking to coupons
              <Link href="/store">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10 flex items-center gap-2">
                  Start Saving Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )
          ) : (
            // Not logged in - show signup and signin buttons
            <>
              <Link href="/signup">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10 flex items-center gap-2">
                  Start Saving Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground px-6 py-3 rounded-full font-medium"
                >
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Stats - Reduced gap on mobile and added flex-wrap */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-12 flex-wrap">
          <div className="text-center">
            <p className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">20+</p>
            <p className="text-muted-foreground text-xs sm:text-sm">Brands Available</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-border" />
          <div className="text-center">
            <p className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">24/7</p>
            <p className="text-muted-foreground text-xs sm:text-sm">Instant Delivery</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-border" />
          <div className="text-center">
            <p className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">99%</p>
            <p className="text-muted-foreground text-xs sm:text-sm">Success Rate</p>
          </div>
        </div>
      </div>
    </section>
  )
}
