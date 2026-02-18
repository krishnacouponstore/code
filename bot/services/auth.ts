import crypto from "crypto"

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl"
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1"
const AUTH_URL = `https://${NHOST_SUBDOMAIN}.auth.${NHOST_REGION}.nhost.run/v1`

interface AuthResult {
  success: boolean
  userId?: string
  credentials?: {
    email: string
    password: string
  }
  error?: string
}

interface LoginResult {
  success: boolean
  userId?: string
  accessToken?: string
  error?: string
}

export class AuthService {
  /**
   * Generate a random password
   */
  private generatePassword(length = 12): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    const randomBytes = crypto.randomBytes(length)

    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length]
    }

    return password
  }

  /**
   * Create a new CoupX account
   */
  async createAccount(email: string, displayName: string, telegramId: string): Promise<AuthResult> {
    try {
      const password = this.generatePassword()

      // Step 1: Create auth user via Nhost signup API
      const signupResponse = await fetch(`${AUTH_URL}/signup/email-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          options: {
            displayName,
            metadata: telegramId ? {
              telegram_id: telegramId,
            } : {},
          },
        }),
      })

      const signupData = await signupResponse.json()

      if (!signupResponse.ok || signupData.error) {
        return {
          success: false,
          error: signupData.error?.message || "Failed to create account",
        }
      }

      const userId = signupData.session?.user?.id

      if (!userId) {
        return {
          success: false,
          error: "User ID not returned from signup",
        }
      }

      // Step 2: Create user profile (handled by database trigger/webhook)
      // Wait a bit for profile creation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 3: Update profile with telegram_id using GraphQL (only if telegramId provided)
      if (telegramId) {
        const { DatabaseService } = await import("./database")
        const db = new DatabaseService()
        await db.linkTelegramAccount(userId, telegramId)
      }

      return {
        success: true,
        userId,
        credentials: {
          email,
          password,
        },
      }
    } catch (error: any) {
      console.error("Account creation error:", error)
      return {
        success: false,
        error: error.message || "An error occurred during account creation",
      }
    }
  }

  /**
   * Login existing user
   */
  async loginUser(email: string, password: string): Promise<LoginResult> {
    try {
      const loginResponse = await fetch(`${AUTH_URL}/signin/email-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok || loginData.error) {
        return {
          success: false,
          error: loginData.error?.message || "Invalid email or password",
        }
      }

      const userId = loginData.session?.user?.id
      const accessToken = loginData.session?.accessToken

      if (!userId) {
        return {
          success: false,
          error: "User ID not returned from login",
        }
      }

      return {
        success: true,
        userId,
        accessToken,
      }
    } catch (error: any) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.message || "An error occurred during login",
      }
    }
  }
}
