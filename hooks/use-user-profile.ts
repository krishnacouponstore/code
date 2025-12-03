import { useQuery } from "@tanstack/react-query"
import { useUserId } from "@nhost/nextjs"
import { getGraphQLClient } from "@/lib/graphql-client"
import { gql } from "graphql-request"

const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: uuid!) {
    user_profiles(where: { id: { _eq: $userId } }) {
      id
      wallet_balance
      is_blocked
      total_spent
      total_purchased
      created_at
      updated_at
    }
  }
`

export type UserProfile = {
  id: string
  wallet_balance: number
  is_blocked: boolean
  total_spent: number
  total_purchased: number
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const userId = useUserId()

  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) return null
      const client = getGraphQLClient()
      const data: { user_profiles: UserProfile[] } = await client.request(GET_USER_PROFILE, { userId })
      return data.user_profiles?.[0] || null
    },
    enabled: !!userId,
  })
}
