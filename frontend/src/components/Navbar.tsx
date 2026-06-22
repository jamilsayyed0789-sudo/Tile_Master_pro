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
  QrCode,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

const threeDItems = [
  { name: "3D Room", path: "/room-previewer", icon: Rotate3d },
  { name: "3D Bathroom", path: "/bathroom-3d", icon: ShowerHead },
  { name: "3D Kitchen", path: "/kitchen-3d", icon: CookingPot },
  { name: "3D Wall Elevation", path: "/wall-elevation", icon: Columns },
];

const navItems = [
  { name: "Home", path: "/", icon: LayoutDashboard },
  { name: "Pricing", path: "/pricing", icon: IndianRupee },
  { name: "Floor Calculator", path: "/floor-calculator", icon: Calculator },
  { name: "Bathroom Calculator", path: "/bathroom-calculator", icon: Droplet },
  { name: "Designer Mode", path: "/designer", icon: Wand2 },
  { name: "Catalog Hub", path: "/catalog/pdf-extract", icon: FileText },
  { name: "Tile Collection", path: "/catalog/tile-library", icon: LayoutGrid },
  { name: "QR Codes", path: "/dealer/qr-generator", icon: QrCode },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [threeDDropdownOpen, setThreeDDropdownOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const isLoggedIn = !!session;

  const isThreeDActive = threeDItems.some((item) => pathname === item.path);

  // Scroll logic for mobile/desktop
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      // Show on scroll up, hide on scroll down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY - 10) {
        setIsHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Mouse move logic for desktop edge-hover
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 80) {
        setIsHidden(false);
      } else if (e.clientY > 150 && !isOpen && !threeDDropdownOpen && window.scrollY > 20) {
        setIsHidden(true);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen, threeDDropdownOpen]);

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
    // Hide navbar after navigating to save space
    if (pathname !== "/") {
      setIsHidden(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/auth");
    router.refresh();
  };

  return (
    <>
      <header
        className={`fixed left-3 right-3 z-[100] transition-all duration-500 ease-in-out ${
          isHidden ? "-top-32 opacity-0 pointer-events-none" : scrolled ? "top-2 opacity-100" : "top-3 opacity-100"
        }`}
      >
        <div
          className={`mx-auto max-w-[1500px] rounded-2xl transition-all duration-500 ${
            scrolled
              ? "bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              : "bg-slate-900/30 backdrop-blur-xl border border-slate-700/30"
          }`}
        >
          <div className="px-3 sm:px-5">
            <div className="flex justify-between items-center h-14">
              {/* Brand */}
              <div className="flex items-center flex-shrink-0">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="relative w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/20">
                    <Box className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base tracking-tight text-slate-50 font-space-grotesk leading-none">
                      TileMasterPro
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
                      className={`relative px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap group ${
                        isActive
                          ? "text-blue-400 bg-slate-800/50 border border-slate-700/50"
                          : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/30 border border-transparent"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* 3D Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setThreeDDropdownOpen(!threeDDropdownOpen)}
                    className={`relative px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isThreeDActive
                        ? "text-blue-400 bg-slate-800/50 border border-slate-700/50"
                        : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/30 border border-transparent"
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    3D View
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        threeDDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {threeDDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-2">
                          <div className="px-3 py-2 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                              Immersive Tools
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
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  isActive
                                    ? "bg-slate-800/80 text-blue-400 border border-slate-700"
                                    : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-50 border border-transparent"
                                }`}
                              >
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                {item.name}
                                <ArrowUpRight className="w-3 h-3 ml-auto text-slate-500" />
                              </Link>
                            );
                          })}
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
                    className="px-3 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className="px-5 py-2 rounded-xl text-[13px] font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                  >
                    Start Free
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-slate-300 focus:outline-none p-2 rounded-lg hover:bg-slate-800 transition-colors"
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
            className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-2xl md:hidden pt-20 overflow-y-auto"
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800 border border-slate-700 text-blue-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-2">
                <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-slate-500">
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
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-slate-800 border border-slate-700 text-blue-400"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-800">
                          <Icon className="w-3 h-3" />
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
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
               <Link
                 href="/auth"
                 onClick={() => setIsOpen(false)}
                 className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-blue-500 text-white shadow-lg shadow-blue-500/20 mt-4"
               >
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
