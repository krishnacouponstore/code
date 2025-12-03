"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { useSignUpEmailPassword } from "@nhost/nextjs"
import { createUserProfile } from "@/app/actions/create-user-profile"
import { useQueryClient } from "@tanstack/react-query"

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

    try {
      const result = await signUpEmailPassword(formData.email, formData.password, {
        displayName: formData.fullName,
        metadata: {
          phone: formData.phone || null,
        },
      })

      if (result.isSuccess && result.user) {
        const profileResult = await createUserProfile(result.user.id)

        if (!profileResult.success) {
          setErrors({
            general: `Account created but profile setup failed: ${profileResult.error}. Please contact support.`,
          })
          return
        }

        queryClient.invalidateQueries({ queryKey: ["userProfile"] })
        setIsSuccess(true)
        setTimeout(() => {
          router.replace("/dashboard")
        }, 1500)
      } else if (result.needsEmailVerification && result.user) {
        await createUserProfile(result.user.id)

        setIsSuccess(true)
        setTimeout(() => {
          router.replace("/login?message=Please check your email to verify your account")
        }, 1500)
      } else {
        setErrors({ general: result.error?.message || "Something went wrong. Please try again." })
      }
    } catch (err) {
      setErrors({ general: "Something went wrong. Please try again." })
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
        <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
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
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
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
        <Label htmlFor="phone" className="text-sm font-medium text-foreground">
          Phone Number <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={handleChange}
            className={`pl-10 ${inputClass} ${errors.phone ? "border-destructive" : ""}`}
            disabled={isLoading}
          />
        </div>
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
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
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm Password
        </Label>
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
        className={`w-full h-11 rounded-full font-medium shadow-sm transition-all duration-300 ${
          isSuccess
            ? "bg-green-500 hover:bg-green-500 text-white scale-105"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
        disabled={isLoading || isSuccess}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : isSuccess ? (
          <span className="flex items-center justify-center gap-2 animate-in zoom-in-50 duration-300">
            <Check className="w-5 h-5" />
            Account Created!
          </span>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  )
}
