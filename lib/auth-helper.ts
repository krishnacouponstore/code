"use server"

import { cookies } from "next/headers"
import { getUserRoles } from "@/app/actions/user-roles"

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

    // Check user roles from database
    const { isAdmin } = await getUserRoles(userId)

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
