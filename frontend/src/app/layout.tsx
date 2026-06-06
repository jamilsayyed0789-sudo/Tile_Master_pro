import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AuthGuard>
          <Navbar />
          <main className="flex-grow pt-14">
            {children}
          </main>
          <Footer />
        </AuthGuard>
        {/* <script src="https://checkout.razorpay.com/v1/checkout.js" async /> */}  {/* Razorpay temporarily disabled */}
      </body>
    </html>
  );
}
