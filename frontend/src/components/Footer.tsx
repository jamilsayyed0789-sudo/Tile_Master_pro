"use client";
import Link from "next/link";
import { Box, Calculator, Droplet, ShowerHead, Sun, Rotate3d, Columns, CookingPot, IndianRupee, Mail, Phone, MapPin, Heart } from "lucide-react";

const toolLinks = [
  { name: "Floor Calculator",      path: "/floor-calculator",    icon: Calculator  },
  { name: "Bathroom Calculator",   path: "/bathroom-calculator", icon: Droplet     },
  { name: "3D Bathroom",           path: "/bathroom-3d",         icon: ShowerHead  },
  { name: "Designer Mode",         path: "/designer",            icon: Sun         },
  { name: "3D Room",               path: "/room-previewer",      icon: Rotate3d    },
  { name: "3D Wall Elevation",     path: "/wall-elevation",      icon: Columns     },
  { name: "3D Kitchen",            path: "/kitchen-3d",          icon: CookingPot  },
  { name: "Pricing",               path: "/pricing",             icon: IndianRupee },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-neutral-950/90 text-neutral-400 mt-auto">
      {/* Glow accents */}
      <div className="absolute top-0 left-1/4 w-64 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-64 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
                <Box className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-black text-lg text-white tracking-tight">TileMaster Pro</span>
            </Link>
            <p className="text-sm leading-relaxed text-neutral-500 max-w-xs">
              India's smartest tile calculator. Visualise your space in 3D, calculate boxes accurately, and plan with confidence.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              <span>in India</span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Tools</h4>
            <ul className="space-y-2.5">
              {toolLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className="flex items-center gap-2 text-sm text-neutral-500 hover:text-amber-400 transition-colors group"
                    >
                      <Icon className="w-3.5 h-3.5 text-neutral-700 group-hover:text-amber-400 transition-colors" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-neutral-500">
                <Phone className="w-4 h-4 text-neutral-700 mt-0.5 flex-shrink-0" />
                <a href="tel:+918329850523" className="hover:text-amber-400 transition-colors">
                  +91 83298 50523
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-neutral-500">
                <MapPin className="w-4 h-4 text-neutral-700 mt-0.5 flex-shrink-0" />
                <span>India</span>
              </li>
            </ul>

            {/* Badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-400">Live Support Available</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
          <span>© {new Date().getFullYear()} TileMaster Pro. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-amber-400 transition-colors">Pricing</Link>
            <span className="text-neutral-800">|</span>
            <span className="hover:text-amber-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-neutral-800">|</span>
            <span className="hover:text-amber-400 transition-colors cursor-pointer">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
