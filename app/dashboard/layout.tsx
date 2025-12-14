import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("nhostSession")?.value
  const refreshToken = cookieStore.get("nhostRefreshToken")?.value

  // Not authenticated - redirect to login
  if (!refreshToken) {
    redirect("/login")
  }

  // Check if user is admin from session token
  if (sessionToken) {
    try {
      const payload = JSON.parse(atob(sessionToken.split(".")[1]))
      const userRoles = payload?.["https://hasura.io/jwt/claims"]?.["x-hasura-allowed-roles"] || []
      const isAdmin = userRoles.includes("admin")

      if (isAdmin) {
        redirect("/admin/dashboard")
      }
    } catch (error) {
      console.error("Error validating dashboard access:", error)
    }
  }

  return <>{children}</>
}
