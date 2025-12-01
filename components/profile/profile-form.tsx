"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockUserProfile } from "@/lib/mock-data"

export function ProfileForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: mockUserProfile.full_name,
    email: mockUserProfile.email,
    phone: mockUserProfile.phone,
  })
  const [originalData] = useState({
    full_name: mockUserProfile.full_name,
    phone: mockUserProfile.phone,
  })

  const hasChanges = formData.full_name !== originalData.full_name || formData.phone !== originalData.phone

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }

    if (formData.full_name.trim().length < 2) {
      toast({
        title: "Error",
        description: "Name must be at least 2 characters",
        variant: "destructive",
      })
      return
    }

    // Validate phone if provided
    if (formData.phone && !/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(formData.phone.replace(/\s/g, ""))) {
      toast({
        title: "Error",
        description: "Please enter a valid Indian phone number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    toast({
      title: "Success",
      description: "Profile updated successfully!",
    })
  }

  // Format member since date
  const memberSince = new Date(mockUserProfile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
            {mockUserProfile.full_name.charAt(0)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-foreground">{mockUserProfile.full_name}</CardTitle>
            <CardDescription className="text-muted-foreground">{mockUserProfile.email}</CardDescription>
            <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-foreground">
              Full Name
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="bg-secondary border-border text-foreground"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground flex items-center gap-2">
              Email
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="bg-secondary/50 border-border text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">
              Phone Number <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="bg-secondary border-border text-foreground"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          {/* Save Button */}
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
