import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import Footer from "@/components/Footer";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TileMaster Pro | Modern Tiles Calculator",
  description: "AI-powered Tiles Calculator Web Application for Indian tile shops, dealers, contractors, and customers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[linear-gradient(135deg,#0F172A_0%,#111827_50%,#1E293B_100%)] text-slate-300 font-sans" suppressHydrationWarning>
        <div id="app-root" className="flex flex-col min-h-screen w-full">
          <AuthGuard>
            <Navbar />
            <main className="flex-grow pt-14">
              {children}
            </main>
            <Footer />
          </AuthGuard>
        </div>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
