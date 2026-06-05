"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const publicRoutes = ["/auth", "/pricing", "/"];

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [checkedToken, setCheckedToken] = useState(false);

  useEffect(() => {
    if (isPending) return;

    const isPublic = publicRoutes.includes(pathname);

    if (!session && !isPublic && !pathname.startsWith("/auth")) {
      router.push("/auth");
    }
  }, [session, isPending, pathname, router]);

  useEffect(() => {
    if (session && !checkedToken) {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("tilemaster_token")
          : null;
      if (!storedToken) {
        fetch("/api/auth/exchange", { method: "POST" })
          .then((res) => res.json())
          .then((data) => {
            if (data.token) {
              localStorage.setItem("tilemaster_token", data.token);
            }
            setCheckedToken(true);
          })
          .catch(() => setCheckedToken(true));
      } else {
        setCheckedToken(true);
      }
    }
    if (!session) setCheckedToken(false);
  }, [session, checkedToken]);

  return <>{children}</>;
}
