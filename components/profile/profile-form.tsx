"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lock, Loader2, CheckCircle2, AlertCircle, RefreshCw, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useUserData, useSendVerificationEmail, useNhostClient } from "@nhost/nextjs"
import { updateUserProfile } from "@/app/actions/update-user-profile"

export function ProfileForm() {
  const { toast } = useToast()
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile()
  const nhostUser = useUserData()
  const nhostClient = useNhostClient()
  const { sendEmail, isLoading: isSendingEmail, isSent, isError, error } = useSendVerificationEmail()

  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
  })
  const [originalData, setOriginalData] = useState({
    displayName: "",
    phoneNumber: "",
  })

  useEffect(() => {
    if (nhostUser) {
      setFormData({
        displayName: nhostUser.displayName || "",
        phoneNumber: nhostUser.phoneNumber || "",
      })
      setOriginalData({
        displayName: nhostUser.displayName || "",
        phoneNumber: nhostUser.phoneNumber || "",
      })
    }
  }, [nhostUser])

  const hasChanges =
    formData.displayName !== originalData.displayName || formData.phoneNumber !== originalData.phoneNumber

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    try {
      await nhostClient.auth.refreshSession()
      await refetchProfile()
      toast({
        title: "Refreshed",
        description: "Account status has been refreshed.",
      })
    } catch (error) {
      console.error("Error refreshing session:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.displayName.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }

    if (formData.displayName.trim().length < 2) {
      toast({
        title: "Error",
        description: "Name must be at least 2 characters",
        variant: "destructive",
      })
      return
    }

    if (formData.phoneNumber && !/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      toast({
        title: "Error",
        description: "Please enter a valid Indian phone number",
        variant: "destructive",
      })
      return
    }

    if (!nhostUser?.id) {
      toast({
        title: "Error",
        description: "User not found. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await updateUserProfile({
        userId: nhostUser.id,
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber || undefined,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile")
      }

      setOriginalData({
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
      })

      await nhostClient.auth.refreshSession()

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerification = async () => {
    if (nhostUser?.email) {
      await sendEmail(nhostUser.email)
    }
  }

  if (profileLoading || !nhostUser) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!profile) return null

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const isEmailVerified = nhostUser?.emailVerified

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
              {(nhostUser.displayName || "U").charAt(0)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-foreground">{nhostUser.displayName || "User"}</CardTitle>
              <CardDescription className="text-muted-foreground">{nhostUser.email}</CardDescription>
              <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="text-muted-foreground hover:text-foreground"
              title="Refresh account status"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">
                Full Name
              </Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="bg-secondary border-border text-foreground"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                Email
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  value={nhostUser.email || ""}
                  disabled
                  className="bg-secondary/50 border-border text-muted-foreground cursor-not-allowed pr-28"
                />
                {/* Verification Button */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isEmailVerified ? (
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-500/20 text-xs hover:bg-green-500/10"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVerificationModal(true)}
                      className="h-6 px-2 bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs hover:bg-orange-500/20 hover:text-orange-400 transition-all"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Verify
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-foreground">
                Phone Number <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="bg-secondary border-border text-foreground"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <Button
              type="submit"
              disabled={!hasChanges || isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isSent ? "Check Your Email" : "Verify Your Email"}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-4">
                {!isSent ? (
                  <>
                    <div className="flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">Verification email will be sent to:</p>
                    <p className="text-center font-medium text-foreground">{nhostUser?.email}</p>
                    <p className="text-center text-sm text-muted-foreground">
                      Check your inbox and click the link to verify your account.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                    </div>
                    <p className="text-center font-medium text-green-600">Verification email sent!</p>
                    <p className="text-center text-sm text-muted-foreground">We sent a verification link to:</p>
                    <p className="text-center font-medium text-foreground">{nhostUser?.email}</p>
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <p className="font-medium mb-1">Didn&apos;t receive it?</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Check your spam folder</li>
                        <li>Wait a few minutes</li>
                      </ul>
                    </div>
                  </>
                )}
                {isError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                    <p className="text-sm text-destructive">
                      {error?.message || "Failed to send verification email. Please try again."}
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!isSent ? (
              <>
                <Button variant="ghost" onClick={() => setShowVerificationModal(false)} className="sm:order-1">
                  Cancel
                </Button>
                <Button onClick={handleSendVerification} disabled={isSendingEmail} className="sm:order-2">
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Verification Email"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleSendVerification} disabled={isSendingEmail}>
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Email"
                  )}
                </Button>
                <Button onClick={() => setShowVerificationModal(false)}>Close</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
