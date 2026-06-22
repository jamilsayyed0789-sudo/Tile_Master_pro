"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Droplet,
  Sparkles,
  Layers,
  ChevronRight,
  Building,
  Rotate3d,
  ShowerHead,
  CookingPot,
  Columns,
  UploadCloud,
  Search,
  CheckCircle2,
  FileText,
  MousePointerClick,
  Share2,
  Quote,
  Star,
  Play,
  Zap
} from "lucide-react";
import { useRef } from "react";

const LUXURY_BRANDS = [
  "Kajaria",
  "Somany",
  "Qutone",
  "Simpolo",
  "Varmora",
  "Johnson",
  "AGL Tiles",
  "Nitco",
  "Orientbell"
];

const SHOWCASES_3D = [
  {
    title: "Luxury Bathroom",
    image: "/luxury_bathroom.png",
    icon: ShowerHead,
    href: "/bathroom-3d",
    color: "from-blue-500/20 to-blue-900/5",
  },
  {
    title: "Modern Kitchen",
    image: "/modern_kitchen.png",
    icon: CookingPot,
    href: "/kitchen-3d",
    color: "from-blue-400/20 to-blue-800/5",
  },
  {
    title: "Elegant Living Room",
    image: "/hero_luxury_room.png",
    icon: Rotate3d,
    href: "/room-previewer",
    color: "from-blue-600/20 to-indigo-900/5",
  },
  {
    title: "Exterior Elevation",
    image: "/exterior_elevation.png",
    icon: Columns,
    href: "/wall-elevation",
    color: "from-indigo-500/20 to-slate-800/5",
  }
];

const FEATURES = [
  { title: "Catalog Hub", desc: "Instantly digitize your tile catalogs using our AI.", icon: UploadCloud },
  { title: "Smart Tile Search", desc: "Find any tile by number, name, or size in milliseconds.", icon: Search },
  { title: "Tile Collection", desc: "Manage your entire inventory in one elegant dashboard.", icon: Layers },
  { title: "3D Bathroom Designer", desc: "Build realistic bathrooms with distinct wet/dry zones.", icon: ShowerHead },
  { title: "3D Kitchen Designer", desc: "Visualize countertops and dado walls effortlessly.", icon: CookingPot },
  { title: "3D Living Room Designer", desc: "Fully immersive living room and floor planners.", icon: Rotate3d },
  { title: "3D Elevation Designer", desc: "Exterior and interior feature wall visualizations.", icon: Columns },
  { title: "Tile Calculator", desc: "Calculate exact box requirements and grout width.", icon: Box },
];

const TIMELINE = [
  { title: "Upload Catalog", desc: "Upload your manufacturer PDF.", icon: UploadCloud },
  { title: "AI Extraction", desc: "Our engine detects tiles instantly.", icon: Sparkles },
  { title: "Search Instantly", desc: "Find tiles in front of the customer.", icon: Search },
  { title: "Apply to 3D", desc: "Show them what it looks like.", icon: Rotate3d },
  { title: "Generate Quote", desc: "Export professional PDF quotes.", icon: FileText, badge: "Coming Soon" },
];

export default function PremiumHome() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div ref={containerRef} className="min-h-screen text-slate-50 font-sans overflow-hidden">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-md mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium tracking-widest uppercase text-slate-300">Next-Gen Tile Platform</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 font-space-grotesk text-slate-50">
              Visualize Every <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Tile Before
              </span> <br />
              You Buy.
            </h1>
            
            <p className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed font-light">
              AI-powered tile visualization platform for architects, dealers, designers, and homeowners.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/room-previewer" className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                Start Designing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/catalog/tile-library" className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 border border-slate-700 text-slate-50 rounded-xl font-medium transition-all hover:bg-slate-700 shadow-sm">
                Explore Tile Collection
              </Link>
            </div>
          </motion.div>

          {/* Hero 3D Element */}
          <motion.div 
            style={{ y: heroY }}
            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: -5 }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
            className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden glass-card border border-slate-700 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-transparent z-10 pointer-events-none" />
            <img 
              src="/hero_luxury_room.png" 
              alt="Luxury Room" 
              className="w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[2s]" 
            />
            
            {/* Floating UI Elements over image */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-6 right-6 z-20 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center gap-3 shadow-xl"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase">Active Tile</span>
                <span className="text-sm font-semibold text-slate-50">Statuario Gold</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>



      {/* --- UNIQUE AI NEURAL EXTRACTION VISUALIZATION --- */}
      <section className="py-24 px-6 lg:px-12 max-w-6xl mx-auto relative z-20">
        <div className="flex flex-col md:flex-row items-center gap-16">
          
          {/* Left Text */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Proprietary Engine
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white font-space-grotesk">
              Raw PDFs to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                Live 3D Assets.
              </span>
            </h2>
            <p className="text-slate-400 text-lg font-light leading-relaxed mb-8">
              Our neural engine doesn't just read text. It visually understands catalogs, isolates textures, extracts exact dimensions, and instantly mints them as render-ready 3D assets for your showroom.
            </p>
          </div>

          {/* Right Visual Graphic */}
          <div className="flex-1 w-full relative h-[400px] bg-slate-900/50 rounded-3xl border border-slate-700/50 flex items-center justify-center overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]">
            
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
            
            {/* Center Origin (PDF) */}
            <motion.div 
              animate={{ boxShadow: ["0 0 20px rgba(168,85,247,0.2)", "0 0 60px rgba(168,85,247,0.6)", "0 0 20px rgba(168,85,247,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute z-10 w-20 h-28 bg-slate-800 rounded-xl border-2 border-purple-500/50 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >
              <FileText className="w-8 h-8 text-purple-400 mb-2" />
              <div className="w-10 h-1 bg-slate-600 rounded-full mb-1" />
              <div className="w-12 h-1 bg-slate-600 rounded-full mb-1" />
              <div className="w-8 h-1 bg-slate-600 rounded-full" />
            </motion.div>

            {/* Glowing Connection Lines */}
            <svg className="absolute inset-0 w-full h-full z-0">
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                d="M 240 200 L 100 80" 
                className="stroke-purple-500/40" 
                strokeWidth="2" fill="none" strokeDasharray="4 4" 
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
                d="M 240 200 L 100 320" 
                className="stroke-blue-500/40" 
                strokeWidth="2" fill="none" strokeDasharray="4 4" 
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.4 }}
                d="M 240 200 L 380 200" 
                className="stroke-emerald-500/40" 
                strokeWidth="2" fill="none" strokeDasharray="4 4" 
              />
            </svg>

            {/* Floating Data Nodes */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }}
              className="absolute left-10 top-12 p-3 bg-slate-800/90 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-lg z-20"
            >
              <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">Extracted Size</div>
              <div className="text-slate-200 text-sm font-mono">600x1200 mm</div>
            </motion.div>

            <motion.div 
              animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity }}
              className="absolute left-10 bottom-12 p-3 bg-slate-800/90 backdrop-blur-sm border border-blue-500/30 rounded-xl shadow-lg z-20"
            >
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">Finish</div>
              <div className="text-slate-200 text-sm font-mono">High Gloss / Polished</div>
            </motion.div>

            {/* 3D Render Node */}
            <motion.div 
              animate={{ rotateY: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute right-12 top-[120px] w-32 h-32 z-20 perspective-1000"
            >
              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400 rounded-lg shadow-[20px_20px_40px_rgba(0,0,0,0.5)] border border-white/20 transform rotate-x-12 rotate-y-12 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=400&auto=format&fit=crop')] bg-cover opacity-60 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"></div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- INTERACTIVE 3D SHOWCASE --- */}
      <section className="py-32 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-space-grotesk">
            Immersive <span className="text-blue-400">3D Showcases</span>
          </h2>
          <p className="text-slate-400 max-w-2xl font-light">
            Step inside hyper-realistic environments. Our engines render lighting, reflections, and grout lines instantly in your browser.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {SHOWCASES_3D.map((showcase, i) => {
            const Icon = showcase.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="group relative rounded-3xl overflow-hidden glass-card border border-slate-700 bg-slate-800/50 aspect-[4/3] flex flex-col justify-end shadow-xl"
              >
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={showcase.image} 
                    alt={showcase.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${showcase.color} mix-blend-overlay`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                </div>

                <div className="relative z-10 p-8 md:p-10 flex flex-col items-start">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-600 backdrop-blur-md flex items-center justify-center mb-6 shadow-lg">
                    <Icon className="w-6 h-6 text-slate-50" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-50 mb-2 font-space-grotesk">{showcase.title}</h3>
                  
                  <Link href={showcase.href} className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-300 group-hover:text-blue-400 transition-colors">
                    Open Designer <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* --- AI SECTION --- */}
      <section className="py-32 border-y border-slate-800/50 relative overflow-hidden bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-space-grotesk">
              AI That Understands <br /> <span className="text-blue-400">Tile Catalogs.</span>
            </h2>
            <p className="text-slate-400 max-w-xl font-light mb-10">
              Upload hundreds of pages of PDF catalogs. Our vision models automatically crop tile images, extract tile numbers via OCR, and build a beautiful searchable library instantly.
            </p>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
              {TIMELINE.map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-800 group-[.is-active]:bg-blue-500/10 group-[.is-active]:border-blue-500/30 text-slate-400 group-[.is-active]:text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-500">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/50 border border-slate-700 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-50">{item.title}</div>
                      {item.badge && (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-sm font-light">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl p-8 border border-slate-700 bg-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              <div className="space-y-4">
                {/* Simulated UI Row */}
                {[1, 2, 3].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 3, delay: i, repeat: Infinity }}
                    className="h-16 w-full rounded-2xl bg-slate-700/50 border border-slate-600/50 flex items-center px-4 gap-4 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded bg-slate-600/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-24 bg-slate-500 rounded" />
                      <div className="h-2 w-16 bg-slate-600 rounded" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                      Extracted
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-space-grotesk text-slate-50">
            Everything You Need <br /> <span className="text-blue-400">To Sell Faster.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-8 rounded-3xl border border-slate-700 bg-slate-800/40 flex flex-col items-start transition-all shadow-lg hover:shadow-blue-500/10 hover:border-slate-600"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-inner">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-50 mb-2 font-space-grotesk">{feat.title}</h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* --- CALL TO ACTION --- */}
      <section className="py-32 px-6 lg:px-12 max-w-5xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-transparent blur-3xl pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 font-space-grotesk text-slate-50">
            Start Designing <span className="text-blue-400">Beautiful Spaces</span> Today.
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/catalog/pdf-extract" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/20">
              Upload Catalog
            </Link>
            <Link href="/catalog/tile-library" className="px-8 py-4 border border-slate-600 text-slate-300 rounded-xl font-semibold transition-all hover:bg-slate-800 hover:text-slate-50 bg-slate-800/50 shadow-sm">
              Open Tile Collection
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
