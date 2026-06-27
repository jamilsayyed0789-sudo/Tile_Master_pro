"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const checkAuthAndTrial = async () => {
      // Do not block public pages or the pricing page from rendering
      const isPublicOrAllowed = 
        pathname === "/" || 
        pathname.startsWith("/auth") || 
        pathname.startsWith("/pricing") ||
        pathname.startsWith("/api");

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsPending(false);
        return;
      }

      // Check the 10-minute trial logic based on user creation time
      if (session.user?.created_at) {
        const createdAt = new Date(session.user.created_at).getTime();
        const now = Date.now();
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

        if (now - createdAt > THREE_DAYS) {
          // Trial expired
          if (!isPublicOrAllowed) {
            window.location.href = "/pricing?expired=true";
            return; // Stop execution, redirecting...
          }
        }
      }

      setIsPending(false);
    };

    checkAuthAndTrial();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuthAndTrial();
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
