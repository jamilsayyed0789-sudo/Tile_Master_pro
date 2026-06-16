"use client";

import dynamic from "next/dynamic";

const PdfExtractClient = dynamic(() => import("./PdfExtractClient"), { ssr: false });

export default function PdfExtractPage() {
  return <PdfExtractClient />;
}
