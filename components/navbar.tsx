"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DialogTitle } from "@/components/ui/dialog"

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: profile, isLoading } = useUserProfile()
  const { logout, user } = useAuth()

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll effect for glassmorphism intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true
    if (path === "/store" && pathname.startsWith("/store")) return true
    return false
  }

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
        <Link href="/store" className="flex items-center pl-2 md:pl-6 py-2 group relative overflow-hidden">
          <div className="relative h-10 md:h-12 w-32 md:w-48 transition-transform duration-300 group-hover:scale-105">
             {/* Light Mode Logo (Dark Image) - Match dark mode scaling */}
             <Image 
                src="/images/coupx-logo-dark.png" 
                alt="CoupX Logo" 
                fill
                className="object-contain block dark:hidden scale-110 origin-left"
                priority
             />
             {/* Dark Mode Logo (Light Image) */}
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

        {/* Center Navigation Pills */}
        <div className="hidden md:flex items-center p-1.5 gap-1 bg-gray-100/50 dark:bg-slate-900/50 rounded-full border border-gray-200/50 dark:border-white/5 backdrop-blur-md shadow-inner">
          <NavItem href="/dashboard" label="Dashboard" isActive={isActive("/dashboard")} />
          <NavItem href="/store" label="Store" isActive={isActive("/store")} />
          <NavItem href="/history" label="History" isActive={pathname.startsWith("/history")} />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 pr-2">
          
          {/* Wallet Widget */}
          <Link href="/add-balance" className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md hover:border-primary/30 group cursor-pointer">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform">
              <i className="fas fa-wallet text-xs"></i>
            </div>
            <span className="font-display font-bold text-gray-700 dark:text-gray-200 text-sm tracking-wide">
              ₹{profile?.wallet_balance?.toFixed(2) || "0.00"}
            </span>
          </Link>

          {/* Theme Toggle (Animated) */}
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

          {/* Mobile Menu - shown on small screens */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <div className="relative w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                <i className="fas fa-bars text-gray-700 dark:text-gray-200 text-sm"></i>
              </div>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-white dark:bg-slate-900 p-0 border-l border-gray-200 dark:border-slate-700">
              <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {profile?.full_name || user?.email?.split("@")[0] || "User"}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
                
                {/* Wallet Balance */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <i className="fas fa-wallet text-emerald-600 dark:text-emerald-400"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Wallet Balance</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">₹{profile?.wallet_balance?.toFixed(2) || "0.00"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="p-4 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <i className="fas fa-columns w-5 text-center text-gray-400"></i>
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/store" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <i className="fas fa-store w-5 text-center text-gray-400"></i>
                  <span className="font-medium">Store</span>
                </Link>
                <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <i className="fas fa-history w-5 text-center text-gray-400"></i>
                  <span className="font-medium">History</span>
                </Link>
                
                <div className="h-px bg-gray-200 dark:bg-slate-700 my-3"></div>
                
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-4">My Account</p>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <i className="fas fa-user w-5 text-center text-gray-400"></i>
                  <span className="font-medium">Profile</span>
                </Link>
                <Link href="/add-balance" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <i className="fas fa-plus-circle w-5 text-center text-gray-400"></i>
                  <span className="font-medium">Add Balance</span>
                </Link>
                
                <MobileMoreSection />
              </div>
              
              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Log Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* User Profile - hidden on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-gray-800 to-black dark:from-slate-700 dark:to-slate-900 border-2 border-white/20 dark:border-slate-600 flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform shadow-lg group overflow-hidden">
                <i className="fas fa-user text-sm z-10"></i>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-white/20 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-700" />
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800">
                <Link href="/profile" className="flex items-center gap-2">
                  <i className="fas fa-user w-4 text-center"></i>
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <i className="fas fa-ellipsis-h w-4 text-center text-gray-600 dark:text-gray-400"></i>
                  <span className="text-sm">More</span>
                  <i className="fas fa-chevron-right ml-auto text-xs text-gray-400"></i>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left" align="start" className="w-56 rounded-xl border-white/20 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
                  <DropdownMenuLabel>Quick Links</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800">
                    <Link href="/about" className="flex items-center gap-2">
                      <i className="fas fa-info-circle w-4 text-center"></i>
                      <span>About Us</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800">
                    <Link href="/contact" className="flex items-center gap-2">
                      <i className="fas fa-headset w-4 text-center"></i>
                      <span>Contact Us</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-700" />
                  <DropdownMenuLabel>Legal</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800">
                    <Link href="/privacy" className="flex items-center gap-2">
                      <i className="fas fa-shield-alt w-4 text-center"></i>
                      <span>Privacy Policy</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800">
                    <Link href="/terms" className="flex items-center gap-2">
                      <i className="fas fa-file-contract w-4 text-center"></i>
                      <span>Terms & Conditions</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800">
                    <Link href="/refund-policy" className="flex items-center gap-2">
                      <i className="fas fa-undo w-4 text-center"></i>
                      <span>Refund Policy</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800">
                    <Link href="/shipping-delivery" className="flex items-center gap-2">
                      <i className="fas fa-shipping-fast w-4 text-center"></i>
                      <span>Shipping & Delivery</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-700" />
              <DropdownMenuItem 
                className="text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20"
                onClick={() => logout()}
              >
                <div className="flex items-center gap-2">
                  <i className="fas fa-sign-out-alt w-4 text-center"></i>
                  <span>Log out</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  )
}

function NavItem({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 z-0 overflow-hidden",
        isActive 
          ? "text-black dark:text-black shadow-lg scale-105" 
          : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-primary z-[-1] animate-in fade-in zoom-in-95 duration-200" />
      )}
      {label}
    </Link>
  )
}

function MobileMoreSection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <div className="h-px bg-gray-200 dark:bg-slate-700 my-3"></div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <i className="fas fa-ellipsis-h w-5 text-center text-gray-400"></i>
          <span className="font-medium">More</span>
        </div>
        <i className={cn(
          "fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200",
          isExpanded && "rotate-180"
        )}></i>
      </button>
      
      {isExpanded && (
        <div className="pl-8 space-y-1 animate-in slide-in-from-top-2 duration-200">
          <Link href="/about" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <i className="fas fa-info-circle w-4 text-center"></i>
            <span>About Us</span>
          </Link>
          <Link href="/contact" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <i className="fas fa-headset w-4 text-center"></i>
            <span>Contact Us</span>
          </Link>
          <Link href="/privacy" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <i className="fas fa-shield-alt w-4 text-center"></i>
            <span>Privacy Policy</span>
          </Link>
          <Link href="/terms" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <i className="fas fa-file-contract w-4 text-center"></i>
            <span>Terms & Conditions</span>
          </Link>
          <Link href="/refund-policy" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <i className="fas fa-undo w-4 text-center"></i>
            <span>Refund Policy</span>
          </Link>
          <Link href="/shipping-delivery" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <i className="fas fa-shipping-fast w-4 text-center"></i>
            <span>Shipping & Delivery</span>
          </Link>
        </div>
      )}
    </>
  )
}
