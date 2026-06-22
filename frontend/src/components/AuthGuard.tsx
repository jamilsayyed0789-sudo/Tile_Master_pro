"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
// import { createClient } from "@/utils/supabase/client";

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
  // const supabase = createClient();
  // const [session, setSession] = useState<any>(null);
  // const [isPending, setIsPending] = useState(true);

  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setSession(session);
  //     setIsPending(false);
  //   });
  // }, []);
  // const [checked, setChecked] = useState(false);

  // useEffect(() => {
  //   if (isPending) return;

  //   const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  //   if (!session && !isPublic) {
  //     router.push("/auth");
  //     return;
  //   }

  //   if (session && protectedRoutes.some((r) => pathname.startsWith(r))) {
  //     const token = session?.access_token || null;

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
