"use server"

const GRAPHQL_ENDPOINT = "https://tiujfdwdudfhfoqnzhxl.hasura.ap-south-1.nhost.run/v1/graphql"
const NHOST_AUTH_URL = "https://tiujfdwdudfhfoqnzhxl.auth.ap-south-1.nhost.run/v1"

export async function verifyAndChangePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Verify current password by attempting to sign in
    const signInResponse = await fetch(`${NHOST_AUTH_URL}/signin/email-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: currentPassword,
      }),
    })

    const signInResult = await signInResponse.json()

    if (signInResult.error || !signInResult.session) {
      return {
        success: false,
        error: "Current password is incorrect",
      }
    }

    // Step 2: Use the session token to change password
    const accessToken = signInResult.session.accessToken

    const changePasswordResponse = await fetch(`${NHOST_AUTH_URL}/user/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        newPassword,
      }),
    })

    if (!changePasswordResponse.ok) {
      const errorData = await changePasswordResponse.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || "Failed to change password",
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
