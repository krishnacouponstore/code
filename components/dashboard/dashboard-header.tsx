"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Plus, User, LogOut, Wallet, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PublicHeader } from "@/components/shared/public-header"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardHeaderProps {
  walletBalance?: number
  userName?: string
  userEmail?: string
}

export function DashboardHeader({ walletBalance = 0, userName = "", userEmail = "" }: DashboardHeaderProps) {
  const { logout, isAuthenticated, user } = useAuth()
  const router = useRouter()

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
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-t border-border">
              <SheetHeader>
                <SheetTitle className="text-left text-foreground">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                  <span className="text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>

                {/* Mobile Wallet */}
                <Link href="/add-balance" className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">Wallet Balance</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(displayBalance)}</span>
                </Link>

                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground py-3 px-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide px-2 mb-2">More</p>
                  <nav className="flex flex-col gap-2">
                    {moreItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground py-3 px-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Mobile Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <Link href="/add-balance">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium gap-2">
                      <Plus className="h-4 w-4" />
                      Add Balance
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full rounded-full border-border text-destructive bg-transparent"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
