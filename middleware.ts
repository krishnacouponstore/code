import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// User-only routes that require authentication
const userRoutes = ["/dashboard", "/store", "/history", "/add-balance"]

// Admin routes
const adminRoutes = ["/admin"]

// Public routes that should redirect based on role
const authRoutes = ["/login", "/signup"]

// Shared routes accessible by both
const sharedRoutes = ["/profile", "/store"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for Nhost refresh token in cookies (indicates authenticated session)
  const refreshToken = request.cookies.get("nhostRefreshToken")?.value
  const isAuthenticated = !!refreshToken

  // Check if current path is a user route
  const isUserRoute = userRoutes.some((route) => pathname.startsWith(route))

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Check if current path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Check if shared route
  const isSharedRoute = sharedRoutes.some((route) => pathname.startsWith(route))

  // Require authentication for protected routes
  if ((isUserRoute || isAdminRoute || isSharedRoute) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth routes redirect handled by client-side in login-form
  // We can't check role here as middleware doesn't have access to user data
  // Role-based redirects are handled in the login form and individual pages

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/store/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/add-balance/:path*",
    "/admin/:path*",
    "/store/:path*",
    "/login",
    "/signup",
  ],
}
