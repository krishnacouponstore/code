"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Shield } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"

export function LandingHeader() {
  const { user, isAuthenticated } = useAuth()
  const isAdmin = user?.is_admin ?? false

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Testimonials", href: "#testimonials" },
  ]

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.substring(1)
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header className="w-full py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-foreground text-xl font-semibold">CodeCrate</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            isAdmin ? (
              <Link href="/admin/dashboard" className="hidden md:block">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard" className="hidden md:block">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium">
                  Dashboard
                </Button>
              </Link>
            )
          ) : (
            <>
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" className="hidden md:block">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-full font-medium shadow-sm ring-1 ring-white/10">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-t border-border">
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-semibold text-foreground">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)}
                    className="text-muted-foreground hover:text-foreground text-lg py-2"
                  >
                    {item.name}
                  </a>
                ))}
                <div className="flex flex-col gap-3 mt-4">
                  {isAuthenticated ? (
                    isAdmin ? (
                      <Link href="/admin/dashboard">
                        <Button className="w-full bg-primary text-primary-foreground rounded-full flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard">
                        <Button className="w-full bg-primary text-primary-foreground rounded-full">Dashboard</Button>
                      </Link>
                    )
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full rounded-full bg-transparent">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button className="w-full bg-primary text-primary-foreground rounded-full">Get Started</Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
