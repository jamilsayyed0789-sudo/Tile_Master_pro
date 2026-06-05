import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/tile-search",
  "/catalog-upload",
  "/catalog/search",
  "/catalog/upload",
  "/saved-calculations",
  "/floor-calculator",
  "/bathroom-calculator",
  "/bathroom-3d",
  "/kitchen-3d",
  "/room-previewer",
  "/wall-elevation",
  "/designer",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get("better-auth.session_token");

    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
