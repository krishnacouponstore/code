import { type NextRequest, NextResponse } from "next/server"
import { GraphQLClient, gql } from "graphql-request"

const GRAPHQL_ENDPOINT = "https://tiujfdwdudfhfoqnzhxl.hasura.ap-south-1.nhost.run/v1/graphql"
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET

if (!ADMIN_SECRET) {
  throw new Error("NHOST_ADMIN_SECRET is not set")
}

const adminClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "x-hasura-admin-secret": ADMIN_SECRET,
  },
})

const CHECK_USER_PROFILE_EXISTS = gql`
  query CheckUserProfileExists($id: uuid!) {
    user_profiles_by_pk(id: $id) {
      id
    }
  }
`

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Check if profile already exists
    const existingProfile = await adminClient.request<{
      user_profiles_by_pk: { id: string } | null
    }>(CHECK_USER_PROFILE_EXISTS, { id: userId })

    if (existingProfile.user_profiles_by_pk) {
      return NextResponse.json({ success: true, exists: true })
    }

    await adminClient.request(CREATE_USER_PROFILE, {
      id: userId,
    })

    return NextResponse.json({ success: true, created: true })
  } catch (error) {
    console.error("Error ensuring user profile:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to ensure profile" },
      { status: 500 },
    )
  }
}
