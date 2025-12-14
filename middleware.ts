import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/coupons", "/purchase-history", "/profile", "/add-balance"]

// Admin routes
const adminRoutes = ["/admin"]

// Public routes that should redirect to dashboard if authenticated
const authRoutes = ["/login", "/signup"]

export function middleware(request: NextRequest) {
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
