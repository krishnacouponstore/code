"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Shield, Sparkles } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"

export function LandingHeader() {
  const { user, isAuthenticated } = useAuth()
  const isAdmin = user?.is_admin ?? false
  const [isOpen, setIsOpen] = useState(false)

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

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground relative">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] bg-gradient-to-b from-background via-background to-muted/30 border-l border-border/50 p-0"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-primary-foreground font-bold text-xl">C</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">CodeCrate</h2>
                    <p className="text-xs text-muted-foreground">Premium Coupons</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 space-y-3">
                {isAuthenticated ? (
                  isAdmin ? (
                    <Link href="/admin/dashboard" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-primary text-primary-foreground rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200">
                        <Shield className="w-5 h-5" />
                        Admin Panel
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-primary text-primary-foreground rounded-xl h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200">
                        Go to Dashboard
                      </Button>
                    </Link>
                  )
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl h-12 bg-transparent border-border/50 hover:bg-muted/50 transition-all duration-200"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-primary text-primary-foreground rounded-xl h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Get Started Free
                      </Button>
                    </Link>
                  </>
                )}
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
