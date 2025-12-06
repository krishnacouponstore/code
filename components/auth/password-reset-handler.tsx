"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * This component detects Nhost password reset redirects and sends user to /reset-password
 * Nhost redirects to the Client URL with hash: #refreshToken=xxx&type=passwordReset
 */
export function PasswordResetHandler() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const hash = window.location.hash
    const fullUrl = window.location.href
    console.log("[v0] PasswordResetHandler - fullUrl:", fullUrl)
    console.log("[v0] PasswordResetHandler - hash:", hash)

    // Check for both type=passwordReset and signinPasswordless (Nhost uses both)
    if (hash && (hash.includes("type=passwordReset") || hash.includes("type=signinPasswordless"))) {
      console.log("[v0] Password reset detected in URL hash - redirecting to /reset-password")
      setIsRedirecting(true)
      router.replace(`/reset-password${hash}`)
      return
    }

    // Also check URL search params in case Nhost sends them there
    const searchParams = new URLSearchParams(window.location.search)
    const type = searchParams.get("type")
    console.log("[v0] PasswordResetHandler - search param type:", type)

    if (type === "passwordReset" || type === "signinPasswordless") {
      console.log("[v0] Password reset detected in search params - redirecting")
      setIsRedirecting(true)
      router.replace(`/reset-password${window.location.search}${hash}`)
    }
  }, [router])

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to reset password...</p>
        </div>
      </div>
    )
  }

  return null
}
