"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

/**
 * This component detects Nhost password reset redirects and sends user to /reset-password
 * Nhost redirects to the Client URL with hash: #refreshToken=xxx&type=passwordReset
 */
export function PasswordResetHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return

    if (pathname === "/reset-password") return

    const hash = window.location.hash

    // Check for password reset type in hash
    if (hash && (hash.includes("type=passwordReset") || hash.includes("type=signinPasswordless"))) {
      router.replace(`/reset-password${hash}`)
      return
    }

    // Also check URL search params
    const searchParams = new URLSearchParams(window.location.search)
    const type = searchParams.get("type")

    if (type === "passwordReset" || type === "signinPasswordless") {
      router.replace(`/reset-password${window.location.search}${hash}`)
    }
  }, [router, pathname])

  return null
}
