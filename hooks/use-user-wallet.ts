import { useQuery } from "@tanstack/react-query"
import { getGraphQLClient } from "@/lib/graphql-client"
import { GET_USER_WALLET, type UserWallet } from "@/lib/graphql/coupons"

export function useUserWallet(userId: string | null) {
  return useQuery({
    queryKey: ["user-wallet", userId],
    queryFn: async () => {
      if (!userId) return null
      const client = getGraphQLClient()
      const result: { user_profiles_by_pk: UserWallet } = await client.request(GET_USER_WALLET, { userId })
      return result.user_profiles_by_pk
    },
    enabled: !!userId,
  })
}
