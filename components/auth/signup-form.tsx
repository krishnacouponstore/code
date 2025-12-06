"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Check, Sparkles, PartyPopper, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSignUpEmailPassword } from "@nhost/nextjs"
import { createUserProfile } from "@/app/actions/create-user-profile"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"

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

export function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { signUpEmailPassword, isLoading, error: nhostError } = useSignUpEmailPassword()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (formData.phone && !/^(\+91[\s-]?)?[0-9]{10}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid Indian phone number"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!agreeTerms) {
      newErrors.terms = "Please accept the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    if (isAuthenticated && user) {
      router.replace("/dashboard")
      return
    }

    try {
      const result = await signUpEmailPassword(formData.email, formData.password, {
        displayName: formData.fullName,
        metadata: {
          phone: formData.phone || null,
        },
      })

      if (result.isSuccess && result.user) {
        try {
          const profileResult = await createUserProfile(result.user.id)

          if (!profileResult.success) {
            console.error("[v0] Profile creation failed:", profileResult.error)
            setIsSuccess(true)
            setTimeout(() => {
              router.replace("/dashboard")
            }, 1500)
            return
          }

          queryClient.invalidateQueries({ queryKey: ["userProfile"] })
          setIsSuccess(true)
          setTimeout(() => {
            router.replace("/dashboard")
          }, 1500)
        } catch (profileError) {
          console.error("[v0] Profile creation error:", profileError)
          setIsSuccess(true)
          setTimeout(() => {
            router.replace("/dashboard")
          }, 1500)
        }
      } else if (result.needsEmailVerification && result.user) {
        try {
          await createUserProfile(result.user.id)
        } catch (profileError) {
          console.error("[v0] Profile creation error during email verification flow:", profileError)
        }

        setIsSuccess(true)
        setTimeout(() => {
          router.replace("/login?message=Please check your email to verify your account")
        }, 1500)
      } else if (result.isError) {
        const errorMsg = result.error?.message || "Something went wrong. Please try again."
        if (errorMsg.toLowerCase().includes("already") || errorMsg.toLowerCase().includes("exists")) {
          setErrors({ general: "An account with this email already exists. Please sign in instead." })
        } else {
          setErrors({ general: errorMsg })
        }
      } else {
        setErrors({ general: result.error?.message || "Something went wrong. Please try again." })
      }
    } catch (err) {
      console.error("[v0] Signup error:", err)
      if (err instanceof Error && err.message.toLowerCase().includes("already signed in")) {
        router.replace("/dashboard")
        return
      }
      setErrors({ general: err instanceof Error ? err.message : "Something went wrong. Please try again." })
    }
  }

  const displayError = errors.general || nhostError?.message

  const inputClass =
    "h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {displayError}
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            className={`pl-10 ${inputClass} ${errors.fullName ? "border-destructive" : ""}`}
            required
            disabled={isLoading}
          />
        </div>
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className={`pl-10 ${inputClass} ${errors.email ? "border-destructive" : ""}`}
            required
            disabled={isLoading}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter phone number (optional)"
            value={formData.phone}
            onChange={handleChange}
            className={`pl-10 ${inputClass} ${errors.phone ? "border-destructive" : ""}`}
            disabled={isLoading}
          />
        </div>
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            className={`pl-10 pr-10 ${inputClass} ${errors.password ? "border-destructive" : ""}`}
            required
            disabled={isLoading}
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
        {formData.password && (
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
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`pl-10 pr-10 ${inputClass} ${errors.confirmPassword ? "border-destructive" : ""}`}
            required
            disabled={isLoading}
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

      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreeTerms}
            onCheckedChange={(checked) => {
              setAgreeTerms(checked as boolean)
              if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }))
            }}
            disabled={isLoading}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
      </div>

      <Button
        type="submit"
        className={`w-full h-11 rounded-full font-medium transition-all duration-500 ease-out overflow-hidden relative ${
          isSuccess
            ? "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(52,211,153,0.4)] scale-[1.02]"
            : isLoading
              ? "bg-primary/80 text-primary-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        }`}
        disabled={isLoading || isSuccess}
      >
        {isLoading ? (
          <>
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
            <span className="absolute inset-0 bg-primary/20 animate-pulse" />
            <span className="relative flex items-center justify-center gap-3">
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
                <Loader2 className="relative w-5 h-5 animate-spin text-white" />
              </span>
              <span className="font-medium tracking-wide">Creating account...</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-[bounce_1s_ease-in-out_infinite]" />
                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-[bounce_1s_ease-in-out_0.4s_infinite]" />
              </span>
            </span>
          </>
        ) : isSuccess ? (
          <>
            {/* Animated background gradient */}
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />

            {/* Confetti-like particles */}
            <span className="absolute top-1 left-6 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-[ping_1s_ease-in-out_infinite]" />
            <span className="absolute top-3 right-8 w-1 h-1 bg-white rounded-full animate-[ping_1.2s_ease-in-out_0.2s_infinite]" />
            <span className="absolute bottom-2 left-10 w-1 h-1 bg-cyan-300 rounded-full animate-[ping_1.3s_ease-in-out_0.4s_infinite]" />
            <span className="absolute bottom-1 right-12 w-1.5 h-1.5 bg-white rounded-full animate-[ping_1.1s_ease-in-out_0.5s_infinite]" />

            {/* Content */}
            <span className="relative flex items-center justify-center gap-2">
              <PartyPopper className="w-4 h-4 animate-in zoom-in-50 spin-in-12 duration-500 text-yellow-200" />
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm animate-in zoom-in-50 duration-500">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </span>
              <span className="animate-in fade-in slide-in-from-bottom-2 duration-500 font-semibold">
                Account Created!
              </span>
              <Sparkles className="w-4 h-4 animate-in spin-in-180 duration-700 text-white/80" />
            </span>
          </>
        ) : (
          <span className="relative flex items-center justify-center gap-2 group">
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </form>
  )
}
