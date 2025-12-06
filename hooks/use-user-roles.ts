"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUserId } from "@nhost/nextjs"
import { useEffect } from "react"
import { getUserRoles } from "@/app/actions/user-roles"

export function useUserRoles() {
  const userId = useUserId()
  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["user-roles"] })
  }, [userId, queryClient])

  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return { roles: [], isAdmin: false }
      return getUserRoles(userId)
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
  })
}
