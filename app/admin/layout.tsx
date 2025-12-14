import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getGraphQLClient } from "@/lib/graphql-client-server"
import { gql } from "graphql-request"

const CHECK_ADMIN_ROLE = gql`
  query CheckAdminRole($userId: uuid!) {
    user(id: $userId) {
      id
      defaultRole
    }
  }
`

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("nhostRefreshToken")?.value

  if (!refreshToken) {
    redirect("/login?redirect=/admin/dashboard")
  }

  const sessionToken = cookieStore.get("nhostSession")?.value

  if (sessionToken) {
    try {
      const payload = JSON.parse(atob(sessionToken.split(".")[1]))
      const userId = payload?.sub
      const userRoles = payload?.["https://hasura.io/jwt/claims"]?.["x-hasura-allowed-roles"] || []
      const isAdmin = userRoles.includes("admin")

      if (!isAdmin && userId) {
        const client = getGraphQLClient()
        const data: any = await client.request(CHECK_ADMIN_ROLE, { userId })
        const isAdminDB = data?.user?.defaultRole === "admin"

        if (!isAdminDB) {
          redirect("/?error=access_denied")
        }
      } else if (!isAdmin) {
        redirect("/?error=access_denied")
      }
    } catch (error) {
      console.error("Error validating admin access:", error)
      redirect("/?error=access_denied")
    }
  } else {
    redirect("/login?redirect=/admin/dashboard")
  }

  return <>{children}</>
}
