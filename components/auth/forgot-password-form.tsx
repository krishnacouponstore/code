"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Loader2, CheckCircle2, Clock, Lock, AlertCircle, Sparkles, Send, ArrowRight } from "lucide-react"

import { sendPasswordResetEmail } from "@/app/actions/users"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const validateEmail = () => {
    if (!email) {
      setError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) return

    setError("")
    setIsLoading(true)

    try {
      const result = await sendPasswordResetEmail(email)

      if (!result.success) {
        if (result.error?.includes("rate") || result.error?.includes("limit")) {
          setError("Too many requests. Please try again later.")
        } else {
          setIsSuccess(true)
          setTimeout(() => {
            setIsSubmitted(true)
            setCountdown(60)
          }, 1200)
        }
      } else {
        setIsSuccess(true)
        setTimeout(() => {
          setIsSubmitted(true)
          setCountdown(60)
        }, 1200)
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setIsLoading(true)
    setError("")

    try {
      const result = await sendPasswordResetEmail(email)

      if (!result.success && (result.error?.includes("rate") || result.error?.includes("limit"))) {
        setError("Too many requests. Please try again later.")
      } else {
        setCountdown(60)
      }
    } catch {
      setError("Failed to resend. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <CheckCircle2 className="w-8 h-8 text-primary relative" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Reset Link Sent!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {"We've sent a password reset link to "}
            <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        <div className="p-4 border border-border rounded-lg bg-secondary/50 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Link Status</span>
            <Badge variant="default" className="bg-primary text-primary-foreground">
              Active
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>Sent to: {email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Valid for: 1 hour</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Single use only</span>
            </div>
          </div>
        </div>

        <div className="text-left p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs font-medium text-foreground mb-1">Next Steps:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the reset link to create a new password</li>
            <li>Log in with your new password</li>
          </ol>
        </div>

        <div className="pt-2">
          <p className="text-sm text-muted-foreground">
            {"Didn't receive the email? "}
            {countdown > 0 ? (
              <span className="text-muted-foreground/60">Resend in {countdown}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Resend Reset Link"}
              </button>
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
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
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError("")
            }}
            className={`pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary ${
              error ? "border-destructive" : ""
            }`}
            required
            disabled={isLoading || isSuccess}
          />
        </div>
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
              <span className="font-medium tracking-wide">Sending...</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-[bounce_1s_ease-in-out_infinite]" />
                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-[bounce_1s_ease-in-out_0.4s_infinite]" />
              </span>
            </span>
          </>
        ) : isSuccess ? (
          <>
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
            <span className="absolute top-2 left-8 w-1 h-1 bg-white rounded-full animate-[ping_1s_ease-in-out_infinite]" />
            <span className="absolute bottom-2 right-10 w-1.5 h-1.5 bg-white rounded-full animate-[ping_1.2s_ease-in-out_0.3s_infinite]" />
            <span className="relative flex items-center justify-center gap-2">
              <Send className="w-4 h-4 animate-in zoom-in-50 slide-in-from-left-2 duration-500 text-white" />
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="animate-in fade-in slide-in-from-bottom-2 duration-500 font-semibold">Email Sent!</span>
              <Sparkles className="w-4 h-4 animate-in spin-in-180 duration-700 text-white/80" />
            </span>
          </>
        ) : (
          <span className="relative flex items-center justify-center gap-2 group">
            <span>Send Reset Link</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">{"We'll send you a password reset link via email"}</p>
    </form>
  )
}
