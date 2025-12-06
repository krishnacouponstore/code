"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"

export function PublicHeader() {
  const { isAuthenticated } = useAuth()
  const { resolvedTheme } = useTheme()

  const navItems = [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Refund Policy", href: "/refund-policy" },
  ]

  return (
    <header className="w-full py-4 px-6 border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Nav */}
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center">
            <Image
              src={resolvedTheme === "dark" ? "/images/coupx-logo-light.png" : "/images/coupx-logo-dark.png"}
              alt="CoupX"
              width={280}
              height={80}
              className="h-14 md:h-16 w-auto"
            />
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
          </nav>
        </div>

        {/* Right Side - Theme Toggle, Sign In / Sign Up */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {isAuthenticated ? (
            <Link href="/dashboard" className="hidden md:block">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium">
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="rounded-full font-medium text-foreground hover:bg-secondary">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

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
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                  <span className="text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>

                {/* Mobile Nav */}
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

                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full rounded-full border-border bg-transparent">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium">
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
