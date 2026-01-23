"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function PublicNavbar() {
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) return null

  return (
    <div className={cn(
      "fixed top-6 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500",
      scrolled ? "top-4" : "top-6"
    )}>
      <nav className={cn(
        "w-full max-w-5xl rounded-full flex items-center justify-between px-2 py-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border border-white/40 dark:border-white/10",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
        scrolled && "bg-white/90 dark:bg-slate-950/90 shadow-2xl scale-[0.98]"
      )}>
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center pl-2 md:pl-6 py-2 group relative overflow-hidden">
          <div className="relative h-10 md:h-12 w-32 md:w-48 transition-transform duration-300 group-hover:scale-105">
             {/* Light Mode Logo */}
             <Image 
                src="/images/coupx-logo-dark.png" 
                alt="CoupX Logo" 
                fill
                className="object-contain block dark:hidden scale-110 origin-left"
                priority
             />
             {/* Dark Mode Logo */}
             <Image 
                src="/images/coupx-logo-light.png" 
                alt="CoupX Logo" 
                fill
                className="object-contain hidden dark:block scale-110 origin-left"
                priority
             />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        </Link>

        {/* Right Actions - Auth Buttons */}
        <div className="flex items-center gap-3 pr-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="group relative w-11 h-11 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 flex items-center justify-center transition-all duration-300 overflow-hidden"
            aria-label="Toggle Theme"
          >
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-transform duration-500 rotate-0 dark:rotate-180",
              theme === "dark" ? "opacity-0 scale-50" : "opacity-100 scale-100"
            )}>
               <i className="fas fa-sun text-yellow-500 text-lg group-hover:animate-spin-slow"></i>
            </div>
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-transform duration-500 -rotate-180 dark:rotate-0",
               theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}>
               <i className="fas fa-moon text-slate-200 text-lg group-hover:animate-pulse"></i>
            </div>
          </button>

          {/* Sign In Button */}
          <Link href="/login">
            <Button 
              variant="ghost" 
              className="hidden sm:flex rounded-full px-6 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Sign In
            </Button>
          </Link>

          {/* Sign Up Button */}
          <Link href="/signup">
            <Button 
              className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  )
}
