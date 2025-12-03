"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useUserData, useSendVerificationEmail, useNhostClient } from "@nhost/nextjs"
import { updateUserProfile } from "@/app/actions/update-user-profile"

export function ProfileForm() {
  const { toast } = useToast()
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile()
  const nhostUser = useUserData()
  const nhostClient = useNhostClient()
  const { sendEmail, isSent: verificationSent } = useSendVerificationEmail()

  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
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
      await sendEmail({ email: nhostUser.email })
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox to verify your email address.",
      })
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
          {!isEmailVerified && (
            <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-chart-4" />
                <span className="text-sm text-chart-4">Email not verified</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendVerification}
                disabled={verificationSent}
                className="text-chart-4 border-chart-4/30 hover:bg-chart-4/10 bg-transparent"
              >
                {verificationSent ? "Email Sent" : "Verify Email"}
              </Button>
            </div>
          )}

          {isEmailVerified && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Email verified</span>
            </div>
          )}

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
            <Input
              id="email"
              name="email"
              value={nhostUser.email || ""}
              disabled
              className="bg-secondary/50 border-border text-muted-foreground cursor-not-allowed"
            />
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
  )
}
