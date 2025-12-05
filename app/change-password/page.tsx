"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthenticated, useChangePassword, useUserData } from "@nhost/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ChangePasswordPage() {
  const router = useRouter()
  const isAuthenticated = useAuthenticated()
  const user = useUserData()
  const { changePassword, isLoading, isSuccess, error } = useChangePassword()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [strength, setStrength] = useState(0)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/login?error=not-authenticated")
    }
  }, [isAuthenticated, router])

  // Redirect to dashboard after successful password change
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    }
  }, [isSuccess, router])

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setStrength(0)
      return
    }

    let score = 0
    if (newPassword.length >= 8) score++
    if (newPassword.length >= 12) score++
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++
    if (/\d/.test(newPassword)) score++
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++

    setStrength(score)
  }, [newPassword])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError("")

    // Validation
    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match")
      return
    }

    if (strength < 2) {
      setValidationError("Password is too weak. Use a mix of letters, numbers, and symbols.")
      return
    }

    // Change password
    await changePassword(newPassword)
  }

  // Loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border/50 rounded-2xl shadow-xl p-8">
            {/* Logo and Branding */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <span className="text-foreground text-2xl font-semibold">CodeCrate</span>
              </Link>
              <p className="text-sm text-muted-foreground mt-1">Your Trusted Coupon Marketplace</p>
            </div>

            {/* Success State */}
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Password Changed!</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your password has been updated successfully.</p>
                  <p className="text-sm text-muted-foreground mt-2">Redirecting to dashboard...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground text-center">Change Password</h2>
                  <p className="text-muted-foreground text-sm text-center mt-1">
                    Welcome back, {user?.displayName || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-muted-foreground text-xs text-center mt-1">
                    Set a new secure password for your account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error Alert */}
                  {(validationError || error) && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{validationError || error?.message}</span>
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={8}
                        className="pl-10 pr-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors",
                                strength >= level
                                  ? strength <= 2
                                    ? "bg-destructive"
                                    : strength === 3
                                      ? "bg-yellow-500"
                                      : "bg-primary"
                                  : "bg-muted",
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {strength <= 2 && "Weak password"}
                          {strength === 3 && "Good password"}
                          {strength >= 4 && "Strong password"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={8}
                        className="pl-10 pr-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>

                    {/* Match Indicator */}
                    {confirmPassword && (
                      <p
                        className={cn(
                          "text-xs mt-1",
                          confirmPassword === newPassword ? "text-primary" : "text-destructive",
                        )}
                      >
                        {confirmPassword === newPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium shadow-sm"
                    disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>

                {/* Password Requirements */}
                <div className="mt-6 p-4 border border-border rounded-lg bg-secondary/50">
                  <p className="text-xs font-medium text-foreground mb-2">Password Requirements:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className={newPassword.length >= 8 ? "text-primary" : ""}>• At least 8 characters</li>
                    <li className={/[A-Z]/.test(newPassword) ? "text-primary" : ""}>• At least one uppercase letter</li>
                    <li className={/[a-z]/.test(newPassword) ? "text-primary" : ""}>• At least one lowercase letter</li>
                    <li className={/\d/.test(newPassword) ? "text-primary" : ""}>• At least one number</li>
                    <li className={/[^a-zA-Z0-9]/.test(newPassword) ? "text-primary" : ""}>
                      • At least one special character (recommended)
                    </li>
                  </ul>
                </div>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link href="/dashboard" className="text-primary font-medium hover:underline">
                Skip and go to Dashboard
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About Us
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
