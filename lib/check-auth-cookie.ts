/**
 * Client-side helper to check if Nhost auth cookie exists
 * Used to prevent false redirects during session restoration
 */
export function hasAuthCookie(): boolean {
    if (typeof window === "undefined") return false

    // Check if nhostRefreshToken cookie exists
    const cookies = document.cookie.split(";")
    return cookies.some((cookie) => cookie.trim().startsWith("nhostRefreshToken="))
}
