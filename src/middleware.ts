import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to protect routes from unauthorized access
 * Runs before every route in the application
 */
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Check for authentication token in cookies
  const token = request.cookies.get("auth_token")?.value;

  // If user is authenticated and trying to access login/signup pages, redirect to /home
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If no token is found for private routes, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    // Add a redirect parameter to send user back after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If token exists, allow the request to proceed
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (with extensions)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
