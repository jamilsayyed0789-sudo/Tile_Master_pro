"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
// import { authClient } from "@/lib/auth-client";

/* === AUTH/TRIAL DISABLED FOR DEMO — re-enable later === */

// const publicRoutes = ["/auth", "/pricing", "/"];

// const protectedRoutes = [
//   "/dashboard",
//   "/tile-search",
//   "/catalog-upload",
//   "/catalog/search",
//   "/catalog/upload",
//   "/saved-calculations",
//   "/floor-calculator",
//   "/bathroom-calculator",
//   "/bathroom-3d",
//   "/kitchen-3d",
//   "/room-previewer",
//   "/wall-elevation",
//   "/designer",
// ];

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  // const router = useRouter();
  // const pathname = usePathname();
  // const { data: session, isPending } = authClient.useSession();
  // const [checked, setChecked] = useState(false);

  // useEffect(() => {
  //   if (isPending) return;

  //   const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  //   if (!session && !isPublic) {
  //     router.push("/auth");
  //     return;
  //   }

  //   if (session && protectedRoutes.some((r) => pathname.startsWith(r))) {
  //     const cookieToken = document.cookie
  //       .split("; ")
  //       .find((c) => c.startsWith("better-auth.session_token="))
  //       ?.split("=")[1];

  //     const token = cookieToken || null;

  //     if (token) {
  //       const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
  //       fetch(`${apiUrl}/auth/subscription`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       })
  //         .then((r) => {
  //           if (r.status === 403) {
  //             router.push("/pricing?reason=expired");
  //           } else {
  //             setChecked(true);
  //           }
  //         })
  //         .catch(() => {
  //           setChecked(true);
  //         });
  //     } else {
  //       setChecked(true);
  //     }
  //   } else {
  //     setChecked(true);
  //   }
  // }, [session, isPending, pathname, router]);

  return <>{children}</>;
}
