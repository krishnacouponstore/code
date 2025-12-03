import { useQuery } from "@tanstack/react-query"
import { useUserId } from "@nhost/nextjs"
import { GraphQLClient, gql } from "graphql-request"

const GRAPHQL_ENDPOINT = "https://tiujfdwdudfhfoqnzhxl.hasura.ap-south-1.nhost.run/v1/graphql"
const ADMIN_SECRET = "b%$=u(i'FPeG9hGIhasTLkdcYz5c'7vr"

// Use admin client to query auth schema tables
const adminClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "x-hasura-admin-secret": ADMIN_SECRET,
  },
})

// Query to check user roles from auth.user_roles table
// Nhost uses authUserRoles as the table name in GraphQL
const GET_USER_ROLES = gql`
  query GetUserRoles($userId: uuid!) {
    authUserRoles(where: { userId: { _eq: $userId } }) {
      role
    }
  }
`

export function useUserRoles() {
  const userId = useUserId()

  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return { roles: [], isAdmin: false }

      try {
        const data: { authUserRoles: { role: string }[] } = await adminClient.request(GET_USER_ROLES, { userId })
        const roles = data.authUserRoles?.map((r) => r.role) || []
        return {
          roles,
          isAdmin: roles.includes("admin"),
        }
      } catch (error) {
        console.error("Error fetching user roles:", error)
        return { roles: [], isAdmin: false }
      }
    },
    enabled: !!userId,
  })
}
