"use client"

import { useQuery } from "@tanstack/react-query"
import { useUserId } from "@nhost/nextjs"
import { getUserRoles } from "@/app/actions/user-roles"

export function useUserRoles() {
  const userId = useUserId()

  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return { roles: [], isAdmin: false }
      return getUserRoles(userId)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
    refetchOnWindowFocus: false,
    // Return default value on error instead of throwing
    placeholderData: { roles: [], isAdmin: false },
  })
}
