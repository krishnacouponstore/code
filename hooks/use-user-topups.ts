import { useQuery } from "@tanstack/react-query"
import { useUserId } from "@nhost/nextjs"
import { getGraphQLClient } from "@/lib/graphql-client"
import { GET_USER_TOPUPS, type Topup } from "@/lib/graphql/topups"

export function useUserTopups(limit = 10) {
  const userId = useUserId()

  return useQuery<Topup[]>({
    queryKey: ["user-topups", userId, limit],
    queryFn: async () => {
      if (!userId) return []
      const client = getGraphQLClient()
      const result: any = await client.request(GET_USER_TOPUPS, { userId, limit })
      return result.topups || []
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  })
}
