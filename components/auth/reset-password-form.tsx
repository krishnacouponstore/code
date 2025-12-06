"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, Loader2, CheckCircle2 } from "lucide-react"
import { nhost } from "@/lib/nhost"

// Password strength calculation
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: "Weak", color: "bg-destructive" }
  if (score <= 3) return { score, label: "Medium", color: "bg-chart-4" }
  return { score, label: "Strong", color: "bg-primary" }
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [redirectCount, setRedirectCount] = useState(3)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = nhost.auth.getSession()
        if (session) {
          setIsAuthenticated(true)
        } else {
          // User might not be authenticated - could be an invalid/expired link
          setErrors({ general: "Invalid or expired password reset link. Please request a new one." })
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (isSuccess && redirectCount > 0) {
      const timer = setTimeout(() => setRedirectCount(redirectCount - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isSuccess && redirectCount === 0) {
      router.push("/login")
    }
  }, [isSuccess, redirectCount, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const { error } = await nhost.auth.changePassword({ newPassword: password })

      if (error) {
        throw new Error(error.message)
      }

      // Sign out after password change so user can log in with new password
      await nhost.auth.signOut()

      setIsSuccess(true)
    } catch (error: any) {
      setErrors({ general: error.message || "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    "h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Password Updated!</h3>
          <p className="text-sm text-muted-foreground mt-1">Your password has been successfully reset.</p>
        </div>
        <p className="text-sm text-muted-foreground">Redirecting to login in {redirectCount}s...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {errors.general}
        </div>
      )}

      {!isAuthenticated && !errors.general && (
        <div className="p-3 text-sm text-chart-4 bg-chart-4/10 border border-chart-4/20 rounded-lg">
          Please use the password reset link sent to your email.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }))
            }}
            className={`pl-10 pr-10 ${inputClass} ${errors.password ? "border-destructive" : ""}`}
            required
            disabled={isLoading || !isAuthenticated}
            minLength={8}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {/* Password strength indicator */}
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-xs ${
                passwordStrength.label === "Weak"
                  ? "text-destructive"
                  : passwordStrength.label === "Medium"
                    ? "text-chart-4"
                    : "text-primary"
              }`}
            >
              Password strength: {passwordStrength.label}
            </p>
          </div>
        )}
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }))
            }}
            className={`pl-10 pr-10 ${inputClass} ${errors.confirmPassword ? "border-destructive" : ""}`}
            required
            disabled={isLoading || !isAuthenticated}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium shadow-sm"
        disabled={isLoading || !isAuthenticated}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Resetting...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  )
}
