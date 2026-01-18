"use server"

const GRAPHQL_ENDPOINT = "https://tiujfdwdudfhfoqnzhxl.hasura.ap-south-1.nhost.run/v1/graphql"
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET

if (!ADMIN_SECRET) {
  throw new Error("NHOST_ADMIN_SECRET is not set")
}

interface UpdateUserInput {
  userId: string
  displayName?: string
  phoneNumber?: string
}

export async function updateUserProfile(input: UpdateUserInput) {
  const { userId, displayName, phoneNumber } = input

  // Build the set object dynamically based on what's provided
  const setFields: Record<string, string> = {}
  if (displayName !== undefined) setFields.displayName = displayName
  if (phoneNumber !== undefined) setFields.phoneNumber = phoneNumber

  if (Object.keys(setFields).length === 0) {
    return { success: false, error: "No fields to update" }
  }

  const mutation = `
    mutation UpdateUser($userId: uuid!, $set: users_set_input!) {
      updateUser(pk_columns: { id: $userId }, _set: $set) {
        id
        displayName
        phoneNumber
        email
      }
    }
  `

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          userId,
          set: setFields,
        },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error("GraphQL errors:", result.errors)
      return { success: false, error: result.errors[0]?.message || "Failed to update profile" }
    }

    return { success: true, user: result.data?.updateUser }
  } catch (error) {
    console.error("Update user profile error:", error)
    return { success: false, error: "Failed to update profile" }
  }
}
