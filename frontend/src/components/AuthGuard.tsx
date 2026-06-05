"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const publicRoutes = ["/auth", "/pricing", "/"];

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

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isPending) return;

    const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

    // Not logged in → redirect to /auth (but never redirect from /pricing to avoid loops)
    if (!session && !isPublic) {
      router.push("/auth");
      return;
    }

    // Logged in and on a protected route → check subscription
    if (session && protectedRoutes.some((r) => pathname.startsWith(r))) {
      const cookieToken = document.cookie
        .split("; ")
        .find((c) => c.startsWith("better-auth.session_token="))
        ?.split("=")[1];

      const token = cookieToken || null;

      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
        fetch(`${apiUrl}/auth/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => {
            if (r.status === 403) {
              // Only redirect to pricing on explicit subscription expiry/blocked
              router.push("/pricing?reason=expired");
            } else {
              setChecked(true);
            }
          })
          .catch(() => {
            // Network error or backend down — allow access, don't block user
            setChecked(true);
          });
      } else {
        // No token in cookie yet — allow access (session exists, token may still be setting)
        setChecked(true);
      }
    } else {
      setChecked(true);
    }
  }, [session, isPending, pathname, router]);

  // While checking auth, show nothing (prevents flash)
  if (isPending) return null;

  // Not logged in on a public page — show page
  if (!session) return <>{children}</>;

  // Show children once checked
  return <>{children}</>;
}
