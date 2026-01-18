"use server"

import { GraphQLClient, gql } from "graphql-request"

const GRAPHQL_ENDPOINT = "https://tiujfdwdudfhfoqnzhxl.hasura.ap-south-1.nhost.run/v1/graphql"
const ADMIN_SECRET = "rohanpwd123"

const adminClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "x-hasura-admin-secret": ADMIN_SECRET,
  },
})

const CREATE_USER_PROFILE = gql`
  mutation CreateUserProfile($id: uuid!) {
    insert_user_profiles_one(
      object: {
        id: $id
        wallet_balance: 0
        is_blocked: false
        total_spent: 0
        total_purchased: 0
      }
      on_conflict: {
        constraint: user_profiles_pkey
        update_columns: [updated_at]
      }
    ) {
      id
    }
  }
`

const CHECK_USER_PROFILE_EXISTS = gql`
  query CheckUserProfileExists($id: uuid!) {
    user_profiles_by_pk(id: $id) {
      id
    }
  }
`

export async function createUserProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if profile already exists
    const existingProfile = await adminClient.request<{
      user_profiles_by_pk: { id: string } | null
    }>(CHECK_USER_PROFILE_EXISTS, { id: userId })

    if (existingProfile.user_profiles_by_pk) {
      return { success: true }
    }

    await adminClient.request(CREATE_USER_PROFILE, {
      id: userId,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user profile",
    }
  }
}
