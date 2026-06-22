"use client";
import Link from "next/link";
import { Box, MessageCircle, Briefcase, Code, Camera } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/50 py-8 px-6 lg:px-12 text-sm text-slate-400 mt-auto w-full backdrop-blur-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="relative w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/20">
              <Box className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-base tracking-tight text-slate-50 font-space-grotesk">
              TileMasterPro
            </span>
          </Link>
          <p className="font-light leading-relaxed max-w-xs">
            The next-generation AI platform for tile visualization and room previewing.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors"><MessageCircle className="w-4 h-4" /></a>
            <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors"><Briefcase className="w-4 h-4" /></a>
            <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors"><Code className="w-4 h-4" /></a>
            <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors"><Camera className="w-4 h-4" /></a>
          </div>
        </div>

        {/* Product */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-50 font-space-grotesk">Product</h4>
          <ul className="space-y-2 font-light">
            <li><Link href="/catalog" className="hover:text-blue-400 transition-colors">Tile Collection</Link></li>
            <li><Link href="/catalog/pdf-extract" className="hover:text-blue-400 transition-colors">Catalog Hub</Link></li>
            <li><Link href="/room-previewer" className="hover:text-blue-400 transition-colors">3D Room Viewer</Link></li>
            <li><Link href="/designer" className="hover:text-blue-400 transition-colors">Designer Mode</Link></li>
            <li><Link href="/floor-calculator" className="hover:text-blue-400 transition-colors">Calculators</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-50 font-space-grotesk">Resources</h4>
          <ul className="space-y-2 font-light">
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Blog</Link></li>
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Community</Link></li>
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact Sales</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-50 font-space-grotesk">Company</h4>
          <ul className="space-y-2 font-light">
            <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-6 border-t border-slate-800">
        <p className="font-light text-slate-500">© {new Date().getFullYear()} TileMasterPro. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-4 md:mt-0 font-light text-slate-500">
          <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
          <span>·</span>
          <Link href="#" className="hover:text-slate-300 transition-colors">Status</Link>
        </div>
      </div>
    </footer>
  );
}
