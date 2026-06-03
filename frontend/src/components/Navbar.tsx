"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LayoutDashboard, Calculator, Box, Droplet, Sun, Rotate3d, ShowerHead, Columns, LogOut, CookingPot, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getToken, clearToken } from '../utils/auth';

const navItems = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Pricing', path: '/pricing', icon: IndianRupee },
  { name: 'Floor Calculator', path: '/floor-calculator', icon: Calculator },
  { name: 'Bathroom Calculator', path: '/bathroom-calculator', icon: Droplet },
  { name: '3D Bathroom', path: '/bathroom-3d', icon: ShowerHead },
  { name: 'Designer Mode', path: '/designer', icon: Sun },
  { name: '3D Room', path: '/room-previewer', icon: Rotate3d },
  { name: '3D Wall Elevation', path: '/wall-elevation', icon: Columns },
  { name: '3D Kitchen', path: '/kitchen-3d', icon: CookingPot },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setIsOpen(false);
    router.push('/auth');
    router.refresh();
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center gap-1.5">
                <Box className="w-6 h-6 text-primary dark:text-white" />
                <span className="font-bold text-base tracking-tight text-gradient whitespace-nowrap">TileMaster Pro</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`px-2.5 py-1.5 rounded-md text-[15px] font-medium transition-colors relative group whitespace-nowrap ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-white rounded-t-full"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
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

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-foreground focus:outline-none p-2"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
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
                        ? 'bg-primary/10 text-primary dark:bg-white/10 dark:text-white' 
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
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
