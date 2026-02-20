"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "tiujfdwdudfhfoqnzhxl";
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || "ap-south-1";
const AUTH_URL = `https://${NHOST_SUBDOMAIN}.auth.${NHOST_REGION}.nhost.run/v1`;
// Fetch wrapper with 15s timeout (auth can be slower than DB)
function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}
class AuthService {
    /**
     * Generate a random password
     */
    generatePassword(length = 12) {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        const randomBytes = crypto_1.default.randomBytes(length);
        for (let i = 0; i < length; i++) {
            password += chars[randomBytes[i] % chars.length];
        }
        return password;
    }
    /**
     * Create a new CoupX account.
     * Telegram linking is intentionally NOT done here — the caller handles it after
     * the user confirms they have saved their credentials.
     */
    async createAccount(email, displayName) {
        try {
            const password = this.generatePassword();
            // Step 1: Create auth user via Nhost signup API
            const signupResponse = await fetchWithTimeout(`${AUTH_URL}/signup/email-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    options: {
                        displayName,
                    },
                }),
            });
            const signupData = await signupResponse.json();
            console.log("🔐 Nhost signup response:", signupResponse.status, JSON.stringify(signupData));
            if (!signupResponse.ok || signupData.error) {
                // 409 = email already exists in Nhost auth
                if (signupResponse.status === 409 || signupData.error === "email-already-in-use") {
                    return {
                        success: false,
                        error: "EMAIL_ALREADY_IN_USE",
                    };
                }
                return {
                    success: false,
                    error: signupData.error?.message || signupData.message || JSON.stringify(signupData) || "Failed to create account",
                };
            }
            const userId = signupData.session?.user?.id || signupData.user?.id;
            console.log("🔐 Extracted userId:", userId);
            if (!userId) {
                return {
                    success: false,
                    error: "User ID not returned from signup",
                };
            }
            // Wait briefly for the Nhost webhook/trigger to create the user_profile row
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return {
                success: true,
                userId,
                credentials: {
                    email,
                    password,
                },
            };
        }
        catch (error) {
            console.error("Account creation error:", error);
            return {
                success: false,
                error: error.message || "An error occurred during account creation",
            };
        }
    }
    /**
     * Login existing user
     */
    async loginUser(email, password) {
        try {
            const loginResponse = await fetchWithTimeout(`${AUTH_URL}/signin/email-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });
            const loginData = await loginResponse.json();
            if (!loginResponse.ok || loginData.error) {
                return {
                    success: false,
                    error: loginData.error?.message || "Invalid email or password",
                };
            }
            const userId = loginData.session?.user?.id;
            const accessToken = loginData.session?.accessToken;
            if (!userId) {
                return {
                    success: false,
                    error: "User ID not returned from login",
                };
            }
            return {
                success: true,
                userId,
                accessToken,
            };
        }
        catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                error: error.message || "An error occurred during login",
            };
        }
    }
}
exports.AuthService = AuthService;
