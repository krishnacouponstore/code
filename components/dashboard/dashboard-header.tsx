"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Plus, User, LogOut, Wallet, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PublicHeader } from "@/components/shared/public-header"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface DashboardHeaderProps {
  walletBalance?: number
  userName?: string
  userEmail?: string
}

export function DashboardHeader({ walletBalance = 0, userName = "", userEmail = "" }: DashboardHeaderProps) {
  const { logout, isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [moreExpanded, setMoreExpanded] = useState(false)

  if (!isAuthenticated || !user) {
    return <PublicHeader />
  }

  const handleLogout = () => {
    logout()
    router.push("/home")
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Coupons", href: "/coupons" },
    { name: "Purchase History", href: "/purchase-history" },
  ]

  const moreItems = [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Refund Policy", href: "/refund-policy" },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const displayBalance = walletBalance || user.wallet_balance
  const displayName = userName || user.name
  const displayEmail = userEmail || user.email

  return (
    <header className="w-full py-4 px-6 border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Nav */}
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-foreground text-xl font-semibold">CodeCrate</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors gap-1"
                >
                  More
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-card border-border">
                <DropdownMenuItem asChild>
                  <Link href="/about" className="cursor-pointer">
                    About Us
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact" className="cursor-pointer">
                    Contact
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild>
                  <Link href="/privacy" className="cursor-pointer">
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/terms" className="cursor-pointer">
                    Terms & Conditions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/refund-policy" className="cursor-pointer">
                    Refund Policy
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Right Side - Theme Toggle, Wallet, Add Balance, User Menu */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Wallet Balance */}
          <Link
            href="/add-balance"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <Wallet className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{formatCurrency(displayBalance)}</span>
          </Link>

          {/* Add Balance Button */}
          <Link href="/add-balance" className="hidden sm:block">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium gap-2">
              <Plus className="h-4 w-4" />
              Add Balance
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground rounded-full h-10 w-10 bg-secondary hover:bg-secondary/80"
              >
                <User className="h-5 w-5 text-foreground" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] bg-gradient-to-b from-background via-background to-muted/30 border-l border-border/50 p-0"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-primary-foreground font-bold text-xl">C</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">CodeCrate</h2>
                    <p className="text-xs text-muted-foreground">{displayName}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-sm">Theme</span>
                  <ThemeToggle />
                </div>

                {/* Mobile Wallet */}
                <Link
                  href="/add-balance"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground text-sm">Wallet</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(displayBalance)}</span>
                </Link>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Nav Items */}
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                    >
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Profile</span>
                    </div>
                  </Link>
                </nav>

                <Collapsible open={moreExpanded} onOpenChange={setMoreExpanded}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
                      <span className="font-medium">More</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${moreExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                    <div className="pl-4 mt-1 space-y-1 border-l-2 border-primary/30 ml-3">
                      {moreItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block p-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Mobile Actions */}
                <div className="space-y-3 pt-2">
                  <Link href="/add-balance" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 font-medium gap-2 shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" />
                      Add Balance
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false)
                      handleLogout()
                    }}
                    className="w-full rounded-xl h-12 border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-muted/20">
                <p className="text-xs text-center text-muted-foreground">100% Verified Codes</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
