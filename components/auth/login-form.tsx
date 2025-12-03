"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { useSignInEmailPassword } from "@nhost/nextjs"
import { GraphQLClient, gql } from "graphql-request"

const GRAPHQL_ENDPOINT = "https://tiujfdwdudfhfoqnzhxl.hasura.ap-south-1.nhost.run/v1/graphql"
const ADMIN_SECRET = "b%$=u(i'FPeG9hGIhasTLkdcYz5c'7vr"

const adminClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "x-hasura-admin-secret": ADMIN_SECRET,
  },
})

const CHECK_ADMIN_ROLE = gql`
  query CheckAdminRole($userId: uuid!) {
    authUserRoles(where: { userId: { _eq: $userId }, role: { _eq: "admin" } }) {
      role
    }
  }
`

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const { signInEmailPassword, isLoading, error: nhostError } = useSignInEmailPassword()
  const router = useRouter()

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setErrors({})

    try {
      const result = await signInEmailPassword(email, password)

      if (result.isSuccess && result.user) {
        setIsSuccess(true)

        let isAdmin = false
        try {
          const data: { authUserRoles: { role: string }[] } = await adminClient.request(CHECK_ADMIN_ROLE, {
            userId: result.user.id,
          })
          isAdmin = data.authUserRoles && data.authUserRoles.length > 0
        } catch {
          // If role check fails, default to non-admin
          isAdmin = false
        }

        setTimeout(() => {
          if (redirectTo) {
            router.replace(redirectTo)
          } else if (isAdmin) {
            router.replace("/admin/dashboard")
          } else {
            router.replace("/dashboard")
          }
        }, 1000)
      } else if (result.needsEmailVerification) {
        setErrors({
          general: "Please verify your email address before logging in. Check your inbox for a verification link.",
        })
      } else if (result.error) {
        const errorMessage = result.error.message || "Invalid email or password. Please try again."

        // Check for specific Nhost error messages
        if (errorMessage.toLowerCase().includes("unverified")) {
          setErrors({
            general: "Please verify your email address before logging in. Check your inbox for a verification link.",
          })
        } else if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("incorrect")) {
          setErrors({ general: "Invalid email or password. Please try again." })
        } else {
          setErrors({ general: errorMessage })
        }
      } else {
        setErrors({ general: "Invalid email or password. Please try again." })
      }
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." })
    }
  }

  const displayError = errors.general || (nhostError?.message && !isSuccess ? nhostError.message : null)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {displayError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary ${
              errors.email ? "border-destructive" : ""
            }`}
            required
            disabled={isLoading}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`pl-10 pr-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary ${
              errors.password ? "border-destructive" : ""
            }`}
            required
            disabled={isLoading}
            autoComplete="off"
            aria-describedby={errors.password ? "password-error" : undefined}
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
        {errors.password && (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          disabled={isLoading}
        />
        <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
          Remember me
        </Label>
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
            Signing in...
          </>
        ) : isSuccess ? (
          <span className="flex items-center justify-center gap-2 animate-in zoom-in-50 duration-300">
            <Check className="w-5 h-5" />
            Success!
          </span>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  )
}
