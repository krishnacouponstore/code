import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/coupons", "/purchase-history", "/profile", "/add-balance"]

// Admin routes
const adminRoutes = ["/admin"]

// Public routes that should redirect to dashboard if authenticated
const authRoutes = ["/login", "/signup"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for Nhost refresh token in cookies (indicates authenticated session)
  const refreshToken = request.cookies.get("nhostRefreshToken")?.value
  const isAuthenticated = !!refreshToken

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Check if current path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isAdminRoute && isAuthenticated) {
    try {
      const sessionToken = request.cookies.get("nhostSession")?.value

      if (sessionToken) {
        // Decode JWT to check role (session token contains user metadata)
        const payload = JSON.parse(atob(sessionToken.split(".")[1]))
        const userRoles = payload?.["https://hasura.io/jwt/claims"]?.["x-hasura-allowed-roles"] || []
        const isAdmin = userRoles.includes("admin")

        if (!isAdmin) {
          const homeUrl = new URL("/", request.url)
          homeUrl.searchParams.set("error", "access_denied")
          return NextResponse.redirect(homeUrl)
        }
      } else {
        // No session token, redirect to login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      // If token parsing fails, let the page handle it (will redirect to login)
      console.error("Error parsing session token:", error)
    }
  }

  if (isProtectedRoute && isAuthenticated && pathname.startsWith("/dashboard")) {
    try {
      const sessionToken = request.cookies.get("nhostSession")?.value

      if (sessionToken) {
        const payload = JSON.parse(atob(sessionToken.split(".")[1]))
        const userRoles = payload?.["https://hasura.io/jwt/claims"]?.["x-hasura-allowed-roles"] || []
        const isAdmin = userRoles.includes("admin")

        if (isAdmin) {
          const homeUrl = new URL("/", request.url)
          homeUrl.searchParams.set("error", "access_denied")
          return NextResponse.redirect(homeUrl)
        }
      }
    } catch (error) {
      console.error("Error parsing session token:", error)
    }
  }

  if ((isProtectedRoute || isAdminRoute) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get("redirect")
    if (redirectTo && !redirectTo.startsWith("/login") && !redirectTo.startsWith("/signup")) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    try {
      const sessionToken = request.cookies.get("nhostSession")?.value
      if (sessionToken) {
        const payload = JSON.parse(atob(sessionToken.split(".")[1]))
        const userRoles = payload?.["https://hasura.io/jwt/claims"]?.["x-hasura-allowed-roles"] || []
        const isAdmin = userRoles.includes("admin")

        if (isAdmin) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url))
        }
      }
    } catch (error) {
      console.error("Error parsing session token:", error)
    }

    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/coupons/:path*",
    "/purchase-history/:path*",
    "/profile/:path*",
    "/add-balance/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
}
