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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Menu, LogOut, ChevronDown, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import { useTheme } from "next-themes"

export function AdminHeader() {
  const { logout, user, isLoggingOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [moreExpanded, setMoreExpanded] = useState(false)
  const { resolvedTheme } = useTheme()

  const handleLogout = () => {
    logout()
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Orders", href: "/admin/orders" },
    { name: "Manage Coupons", href: "/admin/slots" },
    { name: "Users", href: "/admin/users" },
    { name: "Revenue", href: "/admin/revenue" },
  ]

  const moreItems = [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Refund Policy", href: "/refund-policy" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <header className="w-full py-4 px-6 border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Nav */}
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2">
            <Image
              src="/images/coupx-logo-dark.png"
              alt="CoupX"
              width={280}
              height={80}
              className="h-14 md:h-16 w-auto dark:hidden scale-125"
            />
            <Image
              src="/images/coupx-logo-light.png"
              alt="CoupX"
              width={280}
              height={80}
              className="h-14 md:h-16 w-auto hidden dark:block"
            />
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  isActive(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
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
                {moreItems.slice(0, 2).map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-border" />
                {moreItems.slice(2).map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Right Side - Theme Toggle, User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Desktop Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground rounded-full h-10 w-10 bg-secondary hover:bg-secondary/80"
              >
                <Shield className="h-5 w-5 text-primary" />
                <span className="sr-only">Admin menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary font-medium">Administrator</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive"
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] bg-gradient-to-b from-background via-background to-muted/30 border-l border-border/50 p-0"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/coupx-icon-dark.png"
                    alt="CoupX"
                    width={40}
                    height={40}
                    className="rounded-xl shadow-lg dark:hidden"
                  />
                  <Image
                    src="/images/coupx-icon-light.png"
                    alt="CoupX"
                    width={40}
                    height={40}
                    className="rounded-xl shadow-lg hidden dark:block"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">CoupX</h2>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                        Admin
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{user?.name}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-sm">Theme</span>
                  <ThemeToggle />
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Nav Items */}
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Collapsible More Section */}
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

                {/* Logout Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false)
                      handleLogout()
                    }}
                    disabled={isLoggingOut}
                    className="w-full rounded-xl h-12 border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-muted/20">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-3 w-3 text-primary" />
                  <p className="text-xs text-center text-muted-foreground">Administrator Access</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
