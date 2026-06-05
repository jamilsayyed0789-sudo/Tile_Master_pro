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

    try {
      const cookieValue = sessionCookie.value.includes(".")
        ? sessionCookie.value.split(".")[0]
        : sessionCookie.value;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/auth/subscription`,
        {
          headers: {
            Authorization: `Bearer ${cookieValue}`,
          },
        }
      );

      if (res.status === 403) {
        return NextResponse.redirect(
          new URL("/pricing?reason=expired", request.url)
        );
      }
      if (res.status === 401) {
        return NextResponse.redirect(new URL("/auth", request.url));
      }
    } catch {
      // Backend down — let client handle it
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
