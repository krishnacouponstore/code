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
    if (hash && hash.includes("type=passwordReset")) {
      console.log("[v0] Password reset detected in URL hash")
      setIsRedirecting(true)

      // Keep the hash parameters when redirecting so Nhost can process the token
      // The hash will be preserved and Nhost SDK will auto-authenticate the user
      router.replace(`/reset-password${hash}`)
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
