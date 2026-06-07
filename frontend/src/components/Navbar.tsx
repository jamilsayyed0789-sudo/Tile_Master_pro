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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";

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
  {
    name: "Bathroom Calculator",
    path: "/bathroom-calculator",
    icon: Droplet,
  },
  { name: "Designer Mode", path: "/designer", icon: Sun },
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
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center gap-1.5">
                <Box className="w-6 h-6 text-primary dark:text-white" />
                <span className="font-bold text-base tracking-tight text-gradient whitespace-nowrap">
                  TileMaster Pro
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`px-2.5 py-1.5 rounded-md text-[15px] font-medium transition-colors relative group whitespace-nowrap ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-white rounded-t-full"
                        initial={false}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </Link>
                );
              })}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setThreeDDropdownOpen(!threeDDropdownOpen)}
                  className={`px-2.5 py-1.5 rounded-md text-[15px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    isThreeDActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  3D View
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      threeDDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                  {isThreeDActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-white rounded-t-full"
                      initial={false}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </button>

                <AnimatePresence>
                  {threeDDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-xl overflow-hidden"
                    >
                      {threeDItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                          <Link
                            key={item.name}
                            href={item.path}
                            onClick={() => setThreeDDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-1 rounded-lg text-xs font-bold bg-red-950/20 hover:bg-red-950/40 text-red-300 border border-red-500/20 hover:text-red-200 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </button>
              )}
            </nav>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-foreground focus:outline-none p-2"
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden pt-20"
          >
            <div className="px-4 pt-2 pb-3 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-2">
                <div className="flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  <Boxes className="w-4 h-4" />
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
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-semibold bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-950/40 hover:text-red-200 transition-colors cursor-pointer mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
