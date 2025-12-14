"use server"

import { cookies } from "next/headers"
import { getServerGraphQLClient } from "@/lib/graphql-client-server"
import { gql } from "graphql-request"

export async function verifyAdminAccess(): Promise<{ isAdmin: boolean; userId: string | null }> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("nhostSession")

    if (!sessionCookie?.value) {
      return { isAdmin: false, userId: null }
    }

    // Parse the JWT token to get user ID
    const session = JSON.parse(sessionCookie.value)
    const userId = session?.user?.id

    if (!userId) {
      return { isAdmin: false, userId: null }
    }

    const client = getServerGraphQLClient()
    const query = gql`
      query GetUserRole($userId: uuid!) {
        user_profiles(where: { user_id: { _eq: $userId } }) {
          is_admin
        }
      }
    `

    const result: any = await client.request(query, { userId })
    const isAdmin = result.user_profiles?.[0]?.is_admin || false

    return { isAdmin, userId }
  } catch (error) {
    console.error("Error verifying admin access:", error)
    return { isAdmin: false, userId: null }
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: Admin access required") {
    super(message)
    this.name = "UnauthorizedError"
  }
}
