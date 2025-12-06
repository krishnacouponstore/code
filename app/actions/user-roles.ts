"use server"

import { GraphQLClient, gql } from "graphql-request"

const GRAPHQL_ENDPOINT = `https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.hasura.${process.env.NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1/graphql`

function getAdminClient() {
  const adminSecret = process.env.NHOST_ADMIN_SECRET
  if (!adminSecret) {
    throw new Error("NHOST_ADMIN_SECRET is not configured")
  }

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      "x-hasura-admin-secret": adminSecret,
    },
  })
}

const GET_USER_ROLES = gql`
  query GetUserRoles($userId: uuid!) {
    authUserRoles(where: { userId: { _eq: $userId } }) {
      role
    }
  }
`

export async function getUserRoles(userId: string): Promise<{ roles: string[]; isAdmin: boolean }> {
  if (!userId) {
    return { roles: [], isAdmin: false }
  }

  try {
    const client = getAdminClient()
    const data: { authUserRoles: { role: string }[] } = await client.request(GET_USER_ROLES, { userId })
    const roles = data.authUserRoles?.map((r) => r.role) || []

    return {
      roles,
      isAdmin: roles.includes("admin"),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes("Failed to fetch") && !errorMessage.includes("aborted")) {
      console.error("Error fetching user roles:", error)
    }
    return { roles: [], isAdmin: false }
  }
}
