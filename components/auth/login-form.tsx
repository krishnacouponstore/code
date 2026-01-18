"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, Loader2, Check, ShieldX, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSignInEmailPassword, useSignOut } from "@nhost/nextjs"
import { GraphQLClient, gql } from "graphql-request"

const GRAPHQL_ENDPOINT = "https://tiujfdwdudfhfoqnzhxl.hasura.ap-south-1.nhost.run/v1/graphql"
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET

if (!ADMIN_SECRET) {
  throw new Error("NHOST_ADMIN_SECRET is not set")
}

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

const CHECK_USER_BLOCKED = gql`
  query CheckUserBlocked($userId: uuid!) {
    user_profiles_by_pk(id: $userId) {
      is_blocked
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
  const [isBlocked, setIsBlocked] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const { signInEmailPassword, isLoading, error: nhostError } = useSignInEmailPassword()
  const { signOut } = useSignOut()
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
    setIsBlocked(false)

    try {
      const result = await signInEmailPassword(email, password)

      if (result.isSuccess && result.user) {
        try {
          const blockData: { user_profiles_by_pk: { is_blocked: boolean } | null } = await adminClient.request(
            CHECK_USER_BLOCKED,
            { userId: result.user.id },
          )

          if (blockData.user_profiles_by_pk?.is_blocked) {
            setIsBlocked(true)
            await signOut()
            return
          }
        } catch {}

        setIsSuccess(true)

        let isAdmin = false
        try {
          const data: { authUserRoles: { role: string }[] } = await adminClient.request(CHECK_ADMIN_ROLE, {
            userId: result.user.id,
          })
          isAdmin = data.authUserRoles && data.authUserRoles.length > 0
        } catch {
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

  const displayError = errors.general || (nhostError?.message && !isSuccess && !isBlocked ? nhostError.message : null)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isBlocked && (
        <div className="p-4 text-sm bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <ShieldX className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Account Blocked</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Your account has been suspended. Please contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {displayError && !isBlocked && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {displayError}
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
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
        <div className="flex items-center justify-end">
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
              <span className="font-medium tracking-wide">Signing in...</span>
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

            {/* Sparkle particles */}
            <span className="absolute top-1 left-4 w-1.5 h-1.5 bg-white rounded-full animate-[ping_1s_ease-in-out_infinite]" />
            <span className="absolute top-2 right-6 w-1 h-1 bg-white rounded-full animate-[ping_1.2s_ease-in-out_0.3s_infinite]" />
            <span className="absolute bottom-2 left-8 w-1 h-1 bg-white rounded-full animate-[ping_1.4s_ease-in-out_0.6s_infinite]" />

            {/* Content */}
            <span className="relative flex items-center justify-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm animate-in zoom-in-50 duration-500">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </span>
              <span className="animate-in fade-in slide-in-from-bottom-2 duration-500 font-semibold">
                Welcome Back!
              </span>
              <Sparkles className="w-4 h-4 animate-in spin-in-180 duration-700 text-white/80" />
            </span>
          </>
        ) : (
          <span className="relative flex items-center justify-center gap-2 group">
            <span>Login</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </form>
  )
}
