"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewQuotationPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/quotation-project"); }, []);
  return null;
}
