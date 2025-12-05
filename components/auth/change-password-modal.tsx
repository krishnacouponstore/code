"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useChangePassword } from "@nhost/nextjs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { MAGIC_LINK_PASSWORD_RESET_KEY } from "./forgot-password-form"

interface ChangePasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ChangePasswordModal({ open, onOpenChange, onSuccess }: ChangePasswordModalProps) {
  const { changePassword, isLoading, isSuccess, error } = useChangePassword()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [strength, setStrength] = useState(0)

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

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      // Clear the localStorage flag
      localStorage.removeItem(MAGIC_LINK_PASSWORD_RESET_KEY)
      // Wait a moment to show success state
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 2000)
    }
  }, [isSuccess, onOpenChange, onSuccess])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setNewPassword("")
      setConfirmPassword("")
      setValidationError("")
      setShowPassword(false)
      setShowConfirm(false)
    }
  }, [open])

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

  function handleSkip() {
    // Clear the localStorage flag
    localStorage.removeItem(MAGIC_LINK_PASSWORD_RESET_KEY)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Set New Password
          </DialogTitle>
          <DialogDescription>Create a new secure password for your account</DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Password Changed!</h3>
              <p className="text-sm text-muted-foreground mt-1">Your password has been updated successfully.</p>
            </div>
          </div>
        ) : (
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
              <Label htmlFor="modal-newPassword" className="text-sm font-medium text-foreground">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="modal-newPassword"
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
              <Label htmlFor="modal-confirmPassword" className="text-sm font-medium text-foreground">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="modal-confirmPassword"
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
                  className={cn("text-xs mt-1", confirmPassword === newPassword ? "text-primary" : "text-destructive")}
                >
                  {confirmPassword === newPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-3 border border-border rounded-lg bg-secondary/50">
              <p className="text-xs font-medium text-foreground mb-2">Password Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className={newPassword.length >= 8 ? "text-primary" : ""}>• At least 8 characters</li>
                <li className={/[A-Z]/.test(newPassword) ? "text-primary" : ""}>• At least one uppercase letter</li>
                <li className={/[a-z]/.test(newPassword) ? "text-primary" : ""}>• At least one lowercase letter</li>
                <li className={/\d/.test(newPassword) ? "text-primary" : ""}>• At least one number</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Set Password"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
