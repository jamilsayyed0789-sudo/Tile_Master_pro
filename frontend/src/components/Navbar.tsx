"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Calculator,
  Box,
  Droplet,
  Sun,
  Rotate3d,
  ShowerHead,
  Columns,
  LogOut,
  CookingPot,
  IndianRupee,
  UploadCloud,
  Search,
  ChevronDown,
  Boxes,
  Sparkles,
  Wand2,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";

const threeDItems = [
  { name: "3D Room", path: "/room-previewer", icon: Rotate3d, accent: "text-amber-400" },
  { name: "3D Bathroom", path: "/bathroom-3d", icon: ShowerHead, accent: "text-blue-400" },
  { name: "3D Kitchen", path: "/kitchen-3d", icon: CookingPot, accent: "text-rose-400" },
  { name: "3D Wall Elevation", path: "/wall-elevation", icon: Columns, accent: "text-purple-400" },
];

const navItems = [
  { name: "Home", path: "/", icon: LayoutDashboard },
  { name: "Pricing", path: "/pricing", icon: IndianRupee },
  { name: "Floor Calculator", path: "/floor-calculator", icon: Calculator },
  { name: "Bathroom Calculator", path: "/bathroom-calculator", icon: Droplet },
  { name: "Designer Mode", path: "/designer", icon: Wand2 },
  { name: "Upload Catalog", path: "/catalog/upload", icon: UploadCloud },
  { name: "Search Catalog", path: "/catalog/search", icon: Search },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [threeDDropdownOpen, setThreeDDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  const isThreeDActive = threeDItems.some((item) => pathname === item.path);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setThreeDDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setThreeDDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setIsOpen(false);
          router.push("/auth");
          router.refresh();
        },
      },
    });
  };

  return (
    <>
      <header
        className={`fixed top-3 left-3 right-3 z-50 transition-all duration-500 ${
          scrolled ? "top-2" : "top-3"
        }`}
      >
        <div
          className={`mx-auto max-w-[1500px] rounded-2xl transition-all duration-500 ${
            scrolled
              ? "bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]"
              : "bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          }`}
        >
          {/* Gradient accent line */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <div className="px-3 sm:px-5">
            <div className="flex justify-between items-center h-14">
              {/* Brand */}
              <div className="flex items-center flex-shrink-0">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Box className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-base tracking-tight text-white leading-none">
                      Tile<span className="text-gradient">Master</span> Pro
                    </span>
                    <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-[0.18em] leading-none mt-1">
                      Premium Suite
                    </span>
                  </div>
                </Link>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`relative px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap group ${
                        isActive
                          ? "text-white bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                          : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 ${
                          isActive ? "text-amber-400" : ""
                        }`}
                      />
                      {item.name}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-pill"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })}

                {/* 3D Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setThreeDDropdownOpen(!threeDDropdownOpen)}
                    className={`relative px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isThreeDActive
                        ? "text-white bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                        : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Boxes className={`w-3.5 h-3.5 ${isThreeDActive ? "text-amber-400" : ""}`} />
                    3D View
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        threeDDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                  </button>

                  <AnimatePresence>
                    {threeDDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-2">
                          <div className="px-3 py-2 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                              Immersive 3D Tools
                            </span>
                          </div>
                          {threeDItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path;
                            return (
                              <Link
                                key={item.name}
                                href={item.path}
                                onClick={() => setThreeDDropdownOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                  isActive
                                    ? "bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-white border border-amber-500/20"
                                    : "text-neutral-300 hover:bg-white/5 hover:text-white border border-transparent"
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    isActive ? "bg-amber-500/20" : "bg-white/5"
                                  }`}
                                >
                                  <Icon className={`w-3.5 h-3.5 ${item.accent}`} />
                                </div>
                                {item.name}
                                <ArrowUpRight className="w-3 h-3 ml-auto text-neutral-500" />
                              </Link>
                            );
                          })}
                        </div>
                        <div className="px-4 py-2.5 border-t border-white/5 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                          <span className="text-[10px] text-amber-300/80 font-semibold">
                            ✨ New: Wall Elevation 3D
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Right side actions */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-lg text-[12px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className="px-4 py-2 rounded-lg text-[12.5px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                  >
                    <Sparkles className="w-3 h-3" />
                    Start Free
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-white focus:outline-none p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl md:hidden pt-20 overflow-y-auto"
          >
            <div className="px-4 pt-4 pb-8 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-white border border-amber-500/20"
                        : "text-neutral-300 hover:bg-white/5 hover:text-white border border-transparent"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-amber-500/20" : "bg-white/5"
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : ""}`} />
                    </div>
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-2">
                <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
                  <Boxes className="w-3 h-3" />
                  3D View
                </div>
                <div className="space-y-1 pl-2">
                  {threeDItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? "bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-white border border-amber-500/20"
                            : "text-neutral-300 hover:bg-white/5 hover:text-white border border-transparent"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          isActive ? "bg-amber-500/20" : "bg-white/5"
                        }`}>
                          <Icon className={`w-3 h-3 ${item.accent}`} />
                        </div>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-black mt-4"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Free
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
