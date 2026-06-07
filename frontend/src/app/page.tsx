"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Box,
  Droplet,
  Sparkles,
  Layers,
  ChevronDown,
  Building,
  Rotate3d,
  ShowerHead,
  CookingPot,
  Columns,
  UploadCloud,
  Search,
  Zap,
  Shield,
  Crown,
  Check,
  Star,
  Play,
  Eye,
  MousePointer2,
  TrendingUp,
  Users,
  Award,
  Clock,
  FileText,
  Wand2,
  Box as BoxIcon,
  Boxes,
  Grid3X3,
  Palette,
  BadgeCheck,
  Heart,
  IndianRupee,
  Rocket,
  Target,
  Timer,
  Layout,
  Square,
  Square as Tile,
  ChevronRight,
} from "lucide-react";

/* Real tile samples from your catalog — used in hero showcase */
const FEATURED_TILES = [
  {
    name: "Endless Glossy",
    code: "38223",
    size: "600×1200",
    finish: "Glossy",
    image:
      "https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668397/tile_catalog/SHERGAON_p1_ab1a09e3.jpg",
  },
  {
    name: "Endless PRM 200",
    code: "38224",
    size: "600×1200",
    finish: "Polished",
    image:
      "https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668398/tile_catalog/SHERGAON_p1_2630b1ff.jpg",
  },
  {
    name: "Magic Satvari",
    code: "33390",
    size: "600×1200",
    finish: "Glossy",
    image:
      "https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668400/tile_catalog/SHERGAON_p2_ce80427c.jpg",
  },
  {
    name: "Endless PRM 300",
    code: "38781",
    size: "600×1200",
    finish: "High Gloss",
    image:
      "https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668399/tile_catalog/SHERGAON_p2_8b98a088.jpg",
  },
  {
    name: "Armani Glossy",
    code: "33605",
    size: "600×1200",
    finish: "Polished",
    image:
      "https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668404/tile_catalog/SHERGAON_p3_d641b90c.jpg",
  },
  {
    name: "Bianco Glossy",
    code: "33659",
    size: "600×1200",
    finish: "Polished",
    image:
      "https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668411/tile_catalog/SHERGAON_p4_5f2c2119.jpg",
  },
];

const TILE_CATEGORIES = [
  {
    name: "Vitrified Tiles",
    desc: "High-strength, low-porosity tiles for heavy-traffic floors",
    icon: "VT",
    color: "from-amber-200/60 to-orange-200/40",
    borderColor: "border-amber-400/40",
  },
  {
    name: "Ceramic Tiles",
    desc: "Affordable, versatile tiles for walls and light-traffic areas",
    icon: "CT",
    color: "from-rose-200/60 to-pink-200/40",
    borderColor: "border-rose-400/40",
  },
  {
    name: "Porcelain Slabs",
    desc: "Large-format 800×1600, 1200×2400 for seamless premium look",
    icon: "PS",
    color: "from-blue-200/60 to-cyan-200/40",
    borderColor: "border-blue-400/40",
  },
  {
    name: "Marble Collection",
    desc: "Italian and Indian marble-look tiles with realistic veining",
    icon: "MR",
    color: "from-emerald-200/60 to-teal-200/40",
    borderColor: "border-emerald-400/40",
  },
  {
    name: "Mosaic & Décor",
    desc: "Hand-crafted mosaic sheets, water-jet designs, accent pieces",
    icon: "MO",
    color: "from-purple-200/60 to-violet-200/40",
    borderColor: "border-purple-400/40",
  },
  {
    name: "Outdoor & Parking",
    desc: "Anti-skid, weather-resistant tiles for exteriors and parking",
    icon: "OD",
    color: "from-stone-300/60 to-neutral-300/40",
    borderColor: "border-stone-400/40",
  },
];

const TILE_FINISHES = [
  { name: "Glossy", swatch: "from-white via-amber-50 to-amber-100" },
  { name: "Matte", swatch: "from-stone-200 via-stone-300 to-stone-400" },
  { name: "Polished", swatch: "from-amber-100 via-amber-200 to-amber-300" },
  { name: "Satin", swatch: "from-rose-100 via-rose-200 to-rose-300" },
  { name: "Rustic", swatch: "from-amber-300 via-amber-500 to-amber-700" },
  { name: "High-Gloss", swatch: "from-cyan-100 via-cyan-200 to-cyan-400" },
];

const FAQS = [
  {
    question: "How do I calculate tiles needed for a bathroom wall with doors?",
    answer: "To calculate bathroom walls accurately: (1) Find the perimeter of the bathroom (Length + Width) × 2, then multiply by the wall height to get the total wall area. (2) Subtract the area of doors and windows (e.g. standard door is 3ft x 7ft = 21 sq.ft). (3) Add a wastage buffer (typically 8-10% to account for cut corners around layout transitions). Use our 'Bathroom Calculator' route for a comprehensive step-by-step assistant that handles this automatically.",
  },
  {
    question: "Why is wastage factor important for different layout patterns?",
    answer: "Tile wastage occurs due to corner cuts, cutting mistakes, or structural columns. A standard stacked grid pattern requires about 5% wastage buffer. In contrast, running bond (brick) offsets require 8-10% wastage. Highly complex patterns like Herringbone or Diagonal grids require 12-15% wastage because almost every tile near the walls has to be sliced diagonally, leaving unusable remnants.",
  },
  {
    question: "Can customers visualize my tiles in 3D before buying?",
    answer: "Absolutely! TileMaster Pro lets you place any tile texture in a fully interactive 3D room, bathroom, kitchen, or wall elevation in seconds. Customers can walk through the space, rotate the camera, change tile sizes, adjust grout, and see exactly how the finished room will look. This dramatically increases conversion rates at your tile shop.",
  },
  {
    question: "Can I generate and print professional quotations for my customers?",
    answer: "Yes! Both the Floor Calculator and Bathroom Calculator feature an advanced 'Generate Quotation' utility. Once your calculations are complete, you can key in the price per box, labor costs, brand, and customer details, then download a beautifully structured PDF quotation containing exact metrics, tax breakdown, and wastage warnings, perfectly tailored for Indian tile dealerships.",
  },
  {
    question: "Do I need to install any software?",
    answer: "No installation needed. TileMaster Pro runs entirely in your browser and on your phone. Your designs, quotes, and catalogs are stored securely in the cloud, so you can access them from your shop computer, laptop, or even showroom tablet with the same login.",
  },
];

const PATTERNS = [
  {
    id: "grid",
    name: "Stacked Grid",
    waste: "5%",
    difficulty: "Easy",
    desc: "Tiles are aligned in a straight, uniform grid. Clean linear symmetry with the least amount of cut waste.",
    tip: "Ideal for large-format modern vitrified tiles with continuous marble veining.",
  },
  {
    id: "brick",
    name: "Running Bond (Brick)",
    waste: "8-10%",
    difficulty: "Medium",
    desc: "Each tile row is offset by 50% from the row below it, mimicking classic brick laying. Hides wall alignment defects beautifully.",
    tip: "Highly recommended for rectangular format tiles like 12\"x24\" or wood planks.",
  },
  {
    id: "diagonal",
    name: "Diagonal (45° Grid)",
    waste: "12%",
    difficulty: "Hard",
    desc: "Standard grid pattern rotated by 45 degrees. The angled lines trick the eye into seeing more space, making small rooms feel wider.",
    tip: "Requires precision cuts at all wall perimeters. Standard wastage is 12%.",
  },
  {
    id: "herringbone",
    name: "Herringbone",
    waste: "15%",
    difficulty: "Master",
    desc: "Rectangular tiles placed in an interlocking 90-degree V-shape. Highly premium, visually striking pattern that turns any floor or wall into a focal point.",
    tip: "Extremely cut-heavy at borders. Budget for 15% wastage and specialized tile labor.",
  },
];

const TESTIMONIALS = [
  {
    name: "Rajesh Patel",
    shop: "Patel Tiles & Sanitary, Surat",
    avatar: "RP",
    rating: 5,
    text: "The 3D room preview changed my showroom completely. Customers now see their tiles in a real room before buying. My conversion rate doubled in 3 months.",
  },
  {
    name: "Mohammed Aslam",
    shop: "Aslam Ceramic, Bengaluru",
    avatar: "MA",
    rating: 5,
    text: "I used to spend 30 minutes calculating tiles for a single bathroom. Now the calculator does it in 30 seconds. The PDF quotation feature saves me 2 hours daily.",
  },
  {
    name: "Priya Sharma",
    shop: "Sharma Interior Hub, Jaipur",
    avatar: "PS",
    rating: 5,
    text: "The wall elevation 3D tool is incredible. My clients love seeing their living room walls in 3D before approving designs. Worth every rupee of the subscription.",
  },
];

const getTileStyle = (i: number, pattern: string) => {
  const row = Math.floor(i / 5);
  const col = i % 5;

  switch (pattern) {
    case "grid":
      return { x: col * 52 - 104, y: row * 52 - 104, width: 48, height: 48, rotate: 0 };
    case "brick":
      return { x: col * 52 + (row % 2 === 0 ? 26 : 0) - 117, y: row * 52 - 104, width: 48, height: 48, rotate: 0 };
    case "diagonal":
      return { x: col * 52 - 104, y: row * 52 - 104, width: 48, height: 48, rotate: 0 };
    case "herringbone": {
      const isLeftTilt = (col + row) % 2 === 0;
      const angle = isLeftTilt ? -45 : 45;
      const hX = col * 44 - 88 + (isLeftTilt ? 10 : -10);
      const hY = row * 36 - 90;
      return { x: hX, y: hY, width: 50, height: 18, rotate: angle };
    }
    default:
      return { x: 0, y: 0, width: 48, height: 48, rotate: 0 };
  }
};

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activePattern, setActivePattern] = useState<string>("grid");
  const [activeShowcase, setActiveShowcase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveShowcase((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-neutral-900 dark:text-foreground aurora-bg relative overflow-x-hidden">
      {/* Warm showroom glow blobs */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] rounded-full radial-glow-amber opacity-60 -z-10 animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full radial-glow-rose opacity-40 -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full radial-glow-blue opacity-40 -z-10 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] rounded-full radial-glow-warm opacity-40 -z-10 pointer-events-none" />

      {/* Tile grid + marble veining overlays */}
      <div className="absolute inset-0 porcelain-tile-bg opacity-60 -z-20 pointer-events-none" />
      <div className="absolute inset-0 granite-tile-bg opacity-40 -z-20 pointer-events-none" />
      <div className="absolute inset-0 marble-vein-bg opacity-50 -z-20 pointer-events-none" />

      {/* Decorative real-tile image strips in corners (blurred, decorative) */}
      <div className="absolute top-20 -left-20 w-72 h-72 rounded-3xl overflow-hidden opacity-30 -z-10 rotate-12 border-4 border-white/40 shadow-2xl pointer-events-none hidden lg:block">
        <img src="https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668397/tile_catalog/SHERGAON_p1_ab1a09e3.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-40 -right-20 w-80 h-80 rounded-3xl overflow-hidden opacity-25 -z-10 -rotate-12 border-4 border-white/40 shadow-2xl pointer-events-none hidden lg:block">
        <img src="https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668404/tile_catalog/SHERGAON_p3_d641b90c.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-40 left-10 w-64 h-64 rounded-3xl overflow-hidden opacity-20 -z-10 rotate-6 border-4 border-white/40 shadow-2xl pointer-events-none hidden lg:block">
        <img src="https://res.cloudinary.com/dwlzgxtxc/image/upload/v1780668411/tile_catalog/SHERGAON_p4_5f2c2119.jpg" alt="" className="w-full h-full object-cover" />
      </div>

      {/* HERO SECTION — with real tile samples floating */}
      <section className="relative pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/80 dark:bg-black/40 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-500/30 mb-6 shadow-md shadow-amber-500/10 text-sm font-bold tracking-wide backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: "3s" }} />
              India's #1 Tile Showroom Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight mb-6 leading-tight sm:leading-none text-neutral-900 dark:text-white"
            >
              Sell More Tiles.
              <br className="hidden sm:block" />{" "}
              <span className="text-gradient drop-shadow-[0_2px_10px_rgba(184,134,11,0.25)]">Show. Calculate. Quote.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-neutral-700 dark:text-neutral-300 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              The all-in-one platform for Indian tile dealers. Let customers{" "}
              <span className="text-amber-700 dark:text-amber-400 font-bold">see your tiles in photorealistic 3D rooms</span>,
              then close the deal with exact-quantity calculations and branded PDF quotations in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5"
            >
              <Link
                href="/room-previewer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_35px_rgba(245,158,11,0.6)] transform hover:-translate-y-0.5"
              >
                <Box className="w-5 h-5" /> Visualize a Tile in 3D <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/floor-calculator"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card text-neutral-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl"
              >
                <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Calculate Tile Quantity
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-700 dark:text-neutral-400"
            >
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> No credit card to start
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 3-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Works for every tile size
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Indian packing standards
              </span>
            </motion.div>
          </div>
        </div>

        {/* Real Tile Samples — 3D Floating Showcase with perspective */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 perspective-1000">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">
              ✦ Sample from your catalog ✦
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {FEATURED_TILES.map((tile, i) => (
              <motion.div
                key={tile.code}
                initial={{ opacity: 0, y: 60, rotateX: 25, rotateY: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5 + i * 0.1,
                  type: "spring",
                  bounce: 0.3,
                }}
                style={{ transformStyle: "preserve-3d" }}
                className="group relative"
              >
                <motion.div
                  whileHover={{
                    y: -16,
                    scale: 1.08,
                    rotateX: -8,
                    rotateY: 5,
                    z: 50,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-neutral-800 dark:to-neutral-900 tile-bevel pulse-glow-3d border-2 border-amber-300/40 dark:border-amber-500/30 group-hover:border-amber-500"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <img
                    src={tile.image}
                    alt={tile.name}
                    className="w-full h-full object-cover"
                    style={{ transform: "translateZ(20px)" }}
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <p className="text-white text-[10px] font-bold truncate">{tile.name}</p>
                    <p className="text-amber-200 text-[9px] font-mono">#{tile.code} · {tile.size}</p>
                  </div>
                  <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-wider"
                    style={{ transform: "translateZ(40px)" }}
                  >
                    {tile.finish}
                  </div>
                  {/* Reflection at bottom */}
                  <div className="absolute inset-x-0 -bottom-2 h-1/2 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none" style={{ transform: "scaleY(-1) translateZ(-10px)" }} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D ROTATING TILE CAROUSEL — CSS-only spinning tile tower */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 perspective-2000 relative overflow-hidden">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">
            ✦ Interactive 3D View ✦
          </span>
          <h2 className="text-3xl md:text-4xl font-black mt-2 text-neutral-900 dark:text-white">
            Your Tiles. In Motion.
          </h2>
        </div>

        <div className="relative h-[500px] md:h-[560px] flex items-center justify-center">
          {/* Glowing floor under the carousel */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-32 rounded-full radial-glow-amber opacity-60 blur-3xl pointer-events-none" />

          {/* Center rotating cylinder of tiles */}
          <div
            className="relative w-72 h-96 md:w-96 md:h-[450px]"
            style={{
              transformStyle: "preserve-3d",
              animation: "spin-3d-y 28s linear infinite",
            }}
          >
            {FEATURED_TILES.map((tile, i) => {
              const angle = (360 / FEATURED_TILES.length) * i;
              return (
                <div
                  key={tile.code}
                  className="absolute inset-0 rounded-3xl overflow-hidden tile-bevel border-4 border-white/40 dark:border-amber-500/30"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(220px)`,
                    backfaceVisibility: "hidden",
                  }}
                >
                  <img
                    src={tile.image}
                    alt={tile.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-4 text-center">
                    <p className="text-white text-sm font-extrabold">{tile.name}</p>
                    <p className="text-amber-300 text-[10px] font-mono mt-1">
                      #{tile.code} · {tile.size} · {tile.finish}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floor reflection plane */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72 h-72 md:w-96 md:h-96 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(184, 134, 11, 0.4) 0%, transparent 60%)",
              transform: "rotateX(80deg)",
            }}
          />

          {/* Floating mini-tiles around the carousel */}
          {[
            { top: "10%", left: "8%", size: 60, delay: 0 },
            { top: "20%", right: "10%", size: 80, delay: 1 },
            { bottom: "20%", left: "5%", size: 70, delay: 2 },
            { bottom: "15%", right: "8%", size: 50, delay: 0.5 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute rounded-xl overflow-hidden tile-bevel border-2 border-white/40 dark:border-amber-500/30 shadow-2xl"
              style={{
                ...pos,
                width: pos.size,
                height: pos.size * 1.3,
              }}
              animate={{
                y: [0, -15, 0],
                rotateY: [0, 360],
              }}
              transition={{
                y: { duration: 4, repeat: Infinity, delay: pos.delay, ease: "easeInOut" },
                rotateY: { duration: 12 + i * 2, repeat: Infinity, ease: "linear" },
              }}
            >
              <img
                src={FEATURED_TILES[i % FEATURED_TILES.length].image}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3D SHOWCASE CAROUSEL */}
      <section className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-2 rounded-[2rem] border border-white/10 relative overflow-hidden">
          <div className="grid md:grid-cols-3 gap-2">
            {[
              {
                title: "3D Room",
                desc: "Full room walkthrough with your tile on every surface",
                icon: Rotate3d,
                href: "/room-previewer",
                gradient: "from-amber-500/30 to-orange-500/30",
                iconBg: "bg-amber-500/20",
                iconColor: "text-amber-400",
              },
              {
                title: "3D Bathroom",
                desc: "Wet-wall layouts, niches, and shower floors in 3D",
                icon: ShowerHead,
                href: "/bathroom-3d",
                gradient: "from-blue-500/30 to-cyan-500/30",
                iconBg: "bg-blue-500/20",
                iconColor: "text-blue-400",
              },
              {
                title: "3D Kitchen",
                desc: "Countertop splashbacks and dado tiles in 3D",
                icon: CookingPot,
                href: "/kitchen-3d",
                gradient: "from-rose-500/30 to-pink-500/30",
                iconBg: "bg-rose-500/20",
                iconColor: "text-rose-400",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link
                    href={item.href}
                    className={`group relative flex flex-col items-start p-6 md:p-8 rounded-3xl bg-gradient-to-br ${item.gradient} hover:from-white/10 hover:to-white/5 border border-white/5 hover:border-white/20 transition-all duration-500 h-full`}
                  >
                    <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-neutral-300 text-sm mb-5 flex-1">{item.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:gap-2.5 transition-all">
                      Launch <ArrowRight className={`w-4 h-4 ${item.iconColor}`} />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="border-y border-amber-900/15 dark:border-white/5 bg-white/50 dark:bg-black/40 backdrop-blur-md relative overflow-hidden py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Tile Shops Trust Us", value: "2,000+", icon: Building, desc: "Across India" },
              { label: "Calculations Done", value: "1M+", icon: Calculator, desc: "99.9% box accuracy" },
              { label: "Brands Pre-Mapped", value: "50+", icon: Award, desc: "Sizes ready to use" },
              { label: "Avg. Quote Time Saved", value: "85%", icon: Timer, desc: "Per customer visit" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-1">
                    <Icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-3xl sm:text-5xl font-black text-amber-500 tracking-tight">{stat.value}</h3>
                  <span className="text-white font-bold text-sm sm:text-base">{stat.label}</span>
                  <p className="text-neutral-500 text-xs">{stat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TILE CATEGORIES — what kind of tiles we handle */}
      <section className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative subway-tile-bg">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/30 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Square className="w-3.5 h-3.5" /> Every Tile Type Supported
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-neutral-900 dark:text-white">
            Built for <span className="text-gradient">Indian Tile Showrooms</span>
          </h2>
          <p className="text-lg text-neutral-700 dark:text-neutral-300">
            From 300×300 mm ceramic to 1200×2400 mm porcelain slabs — we support every tile you stock.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 perspective-1000">
          {TILE_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 30, rotateX: 20 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{
                y: -12,
                rotateX: -6,
                rotateY: 6,
                scale: 1.03,
                z: 40,
              }}
              style={{ transformStyle: "preserve-3d" }}
              className={`group relative p-6 rounded-3xl bg-gradient-to-br ${cat.color} border-2 ${cat.borderColor} backdrop-blur-md overflow-hidden shadow-md hover:shadow-2xl transition-all tile-bevel`}
            >
              {/* Decorative tile corner pattern */}
              <div className="absolute -top-8 -right-8 w-32 h-32 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="grid grid-cols-4 gap-1 w-full h-full">
                  {Array.from({ length: 16 }).map((_, j) => (
                    <div key={j} className="bg-neutral-900/40 rounded-sm" />
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/70 dark:bg-black/40 border-2 border-white/60 dark:border-white/20 flex items-center justify-center mb-4 shadow-md">
                  <span className="text-lg font-black text-amber-800 dark:text-amber-300">{cat.icon}</span>
                </div>
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2">{cat.name}</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{cat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TILE FINISHES — visual swatches */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative granite-tile-bg">
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">
            ✦ Finishes We Support ✦
          </span>
          <h2 className="text-2xl md:text-3xl font-black mt-2 text-neutral-900 dark:text-white">
            Every Finish. Every Look.
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TILE_FINISHES.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <div className={`aspect-square rounded-2xl bg-gradient-to-br ${f.swatch} border-2 border-white/40 dark:border-white/10 shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 relative overflow-hidden`}>
                {/* Tile grout effect */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_calc(100%-2px),rgba(0,0,0,0.1)_calc(100%-2px)),linear-gradient(90deg,transparent_calc(100%-2px),rgba(0,0,0,0.1)_calc(100%-2px))] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tl from-white/30 via-transparent to-transparent" />
              </div>
              <p className="text-center text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-3 tracking-wider uppercase">
                {f.name}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3D VISUALIZATION SUITE */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative diamond-tile-bg">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Box className="w-3.5 h-3.5" /> Immersive 3D Visualization
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Let Your Customers <span className="text-gradient">Walk Through</span> Their New Room
          </h2>
          <p className="text-lg text-muted-foreground">
            Four powerful 3D engines. Drop in any tile texture, configure dimensions, change grout, rotate, zoom, and watch your
            customer's confidence in the purchase grow in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "3D Room",
              desc: "Full floor-to-ceiling rooms. Rotate, zoom, change tile size, configure grout colour, and toggle skirting.",
              icon: Rotate3d,
              href: "/room-previewer",
              gradient: "from-amber-500/20 to-orange-500/10",
              iconBg: "bg-amber-500/15",
              iconColor: "text-amber-400",
              badge: "Most Popular",
            },
            {
              title: "3D Bathroom",
              desc: "Configure wet walls, dry walls, shower zones, and floor patterns. Show niche tiles and accent strips.",
              icon: ShowerHead,
              href: "/bathroom-3d",
              gradient: "from-blue-500/20 to-cyan-500/10",
              iconBg: "bg-blue-500/15",
              iconColor: "text-blue-400",
              badge: "High Demand",
            },
            {
              title: "3D Kitchen",
              desc: "Visualize countertop splashbacks, dado tiles, and full wall layouts with realistic lighting.",
              icon: CookingPot,
              href: "/kitchen-3d",
              gradient: "from-rose-500/20 to-pink-500/10",
              iconBg: "bg-rose-500/15",
              iconColor: "text-rose-400",
              badge: "New",
            },
            {
              title: "3D Wall Elevation",
              desc: "Show customers how their feature wall, TV unit backdrop, or headboard wall will look with their chosen tile.",
              icon: Columns,
              href: "/wall-elevation",
              gradient: "from-purple-500/20 to-violet-500/10",
              iconBg: "bg-purple-500/15",
              iconColor: "text-purple-400",
              badge: "Premium",
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30, rotateX: 15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -12, scale: 1.05, rotateX: -5, rotateY: 4, z: 30 }}
                style={{ transformStyle: "preserve-3d" }}
                className="group relative"
              >
                <Link href={feature.href} className="block h-full">
                  <div
                    className={`relative h-full p-6 rounded-3xl bg-gradient-to-br ${feature.gradient} border border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden backdrop-blur-md tile-bevel`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-black/40 rounded-full border border-white/10 text-white/80">
                        {feature.badge}
                      </span>
                    </div>

                    <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>

                    <h3 className="text-xl font-extrabold text-white mb-2">{feature.title}</h3>
                    <p className="text-neutral-300 text-sm leading-relaxed mb-5">{feature.desc}</p>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:gap-2.5 transition-all">
                      Open in 3D <ArrowRight className={`w-3.5 h-3.5 ${feature.iconColor}`} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 md:py-24 border-t border-amber-900/15 dark:border-white/5 bg-white/40 dark:bg-black/30 backdrop-blur-md relative overflow-hidden porcelain-tile-bg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full radial-glow-amber blur-3xl opacity-10 -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Rocket className="w-3.5 h-3.5" /> 3-Step Workflow
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">From Showroom to Sale in 5 Minutes</h2>
            <p className="text-lg text-muted-foreground">
              No learning curve. No software to install. Your showroom staff can use this on day one.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-amber-500/50 via-blue-500/50 to-purple-500/50 -z-0" />

            {[
              {
                step: "01",
                title: "Upload Your Tile Catalog",
                desc: "Drop a PDF, and our AI extracts every tile image, sizes, and codes into a searchable digital catalog.",
                icon: UploadCloud,
                color: "from-amber-500 to-orange-500",
                iconBg: "bg-amber-500/15",
                iconColor: "text-amber-400",
              },
              {
                step: "02",
                title: "Visualize in 3D with the Customer",
                desc: "Pick any tile from your catalog. Place it in a 3D room, bathroom, kitchen, or wall — live, together with the customer.",
                icon: Eye,
                color: "from-blue-500 to-cyan-500",
                iconBg: "bg-blue-500/15",
                iconColor: "text-blue-400",
              },
              {
                step: "03",
                title: "Calculate & Send Branded Quote",
                desc: "One click generates exact box count, wastage buffer, and a professional PDF quotation ready to print or WhatsApp.",
                icon: FileText,
                color: "from-purple-500 to-pink-500",
                iconBg: "bg-purple-500/15",
                iconColor: "text-purple-400",
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 h-full relative z-10 bg-black/40">
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${step.iconBg} border border-white/10 flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${step.iconColor}`} />
                      </div>
                      <span className={`text-5xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-30`}>
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mb-3">{step.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/catalog/upload"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-base transition-all duration-300 shadow-[0_4px_25px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_35px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" /> Start with Your Catalog <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CALCULATOR + DESIGNER SUITE */}
      <section className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative herringbone-tile-bg">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Calculator className="w-3.5 h-3.5" /> Smart Calculators
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-neutral-900 dark:text-white">
            Exact Boxes. Zero Wasted Stock.
          </h2>
          <p className="text-lg text-neutral-700 dark:text-neutral-300">
            Industry-accurate algorithms built for Indian tile packaging — 300×300, 600×600, 600×1200, 800×1600, 1200×2400, and more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Floor Tile Calculator",
              desc: "Determine exact room carpet areas, incorporate precise wastage calculations, configure box packs, and draft complete valuations.",
              icon: Box,
              href: "/floor-calculator",
              gradient: "from-amber-500/15 to-orange-500/5",
              iconBg: "bg-amber-500/15",
              iconColor: "text-amber-400",
              badge: "Commercial Floor",
              features: ["Auto box count", "5 layout patterns", "PDF quotation"],
            },
            {
              title: "Bathroom Calculator",
              desc: "Incorporate complex combinations of light, dark, and highlighter wall tiles. Calculate floor spaces and auto-deduct doors/windows.",
              icon: Droplet,
              href: "/bathroom-calculator",
              gradient: "from-blue-500/15 to-cyan-500/5",
              iconBg: "bg-blue-500/15",
              iconColor: "text-blue-400",
              badge: "Wall & Floor",
              features: ["Multi-zone walls", "Door/window deduct", "Highlight strips"],
            },
            {
              title: "Designer Mode Studio",
              desc: "The professional selection model. Plan custom heights, band patterns, border tiles, and accent walls visually.",
              icon: Wand2,
              href: "/designer",
              gradient: "from-purple-500/15 to-violet-500/5",
              iconBg: "bg-purple-500/15",
              iconColor: "text-purple-400",
              badge: "Visual Presets",
              features: ["Band patterns", "Accent walls", "Border tiles"],
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  href={feature.href}
                  className={`block h-full p-7 rounded-3xl bg-gradient-to-br ${feature.gradient} border border-white/10 hover:border-white/25 transition-all duration-300 backdrop-blur-md`}
                >
                  <div className="flex justify-between items-center mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} border border-white/10 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-black/30 rounded-full border border-white/10 text-white/80">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-2">{feature.title}</h3>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-5">{feature.desc}</p>

                  <ul className="space-y-2 mb-5">
                    {feature.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-neutral-300">
                        <Check className={`w-3.5 h-3.5 ${feature.iconColor}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:gap-2.5 transition-all">
                    Launch <ArrowRight className={`w-4 h-4 ${feature.iconColor}`} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE TILE PATTERN SANDBOX */}
      <section className="py-20 md:py-24 border-t border-amber-900/15 dark:border-white/5 bg-gradient-to-b from-transparent via-amber-50/40 to-transparent dark:from-transparent dark:via-black/20 dark:to-transparent backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full radial-glow-blue blur-3xl opacity-10 -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Grid3X3 className="w-3.5 h-3.5 animate-pulse" /> Live Pattern Sandbox
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Visual Layout Playground</h2>
            <p className="text-lg text-muted-foreground">
              Click through different laying styles and instantly see how recommended wastage budgets change.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {PATTERNS.map((p) => {
                  const isActive = activePattern === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePattern(p.id)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-24 relative group cursor-pointer overflow-hidden ${
                        isActive
                          ? "bg-amber-500/10 text-white border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                          : "bg-white/5 text-neutral-400 border-white/5 hover:border-white/10 hover:text-white"
                      }`}
                    >
                      <span className="font-bold text-sm">{p.name}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full w-fit font-bold ${
                          isActive ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {p.waste} Waste
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-h-[220px]">
                <AnimatePresence mode="wait">
                  {PATTERNS.filter((p) => p.id === activePattern).map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden h-full"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 radial-glow-amber opacity-20 pointer-events-none" />
                      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                        <h4 className="text-xl font-bold text-white">{p.name}</h4>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full">
                            Wastage: {p.waste}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full">
                            Skill: {p.difficulty}
                          </span>
                        </div>
                      </div>
                      <p className="text-neutral-400 text-sm leading-relaxed mb-5">{p.desc}</p>
                      <div className="flex gap-3 items-start bg-neutral-900/60 p-4 rounded-xl border border-white/5 text-xs text-amber-500/90">
                        <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                        <p className="leading-relaxed">
                          <strong className="text-white block mb-0.5">Dealer Pro Tip:</strong>
                          {p.tip}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-7 flex justify-center items-center">
              <div className="glass-card p-8 sm:p-12 rounded-[2.5rem] border border-white/10 w-full max-w-[480px] aspect-square flex items-center justify-center relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="w-[300px] h-[300px] relative flex items-center justify-center">
                  <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none -z-20 bg-black/40" />
                  <div className="absolute inset-0 gold-glow-border rounded-2xl pointer-events-none -z-10" />
                  <div className="w-[280px] h-[280px] overflow-hidden rounded-xl relative flex items-center justify-center">
                    <motion.div
                      animate={{
                        rotate: activePattern === "diagonal" ? 45 : 0,
                        scale: activePattern === "diagonal" ? 1.25 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 70, damping: 15 }}
                      className="w-[260px] h-[260px] relative flex items-center justify-center"
                    >
                      {Array.from({ length: 25 }).map((_, i) => {
                        const style = getTileStyle(i, activePattern);
                        return (
                          <motion.div
                            key={i}
                            layout
                            animate={{
                              x: style.x,
                              y: style.y,
                              width: style.width,
                              height: style.height,
                              rotate: style.rotate,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 90,
                              damping: 18,
                              layout: { duration: 0.45 },
                            }}
                            className="absolute rounded bg-gradient-to-br from-neutral-800 to-neutral-700/80 border border-white/10 flex items-center justify-center shadow-lg pointer-events-none overflow-hidden"
                            style={{
                              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.3)",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/5" />
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30 border border-amber-500/20" />
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                  <span>Interactive Preview</span>
                  <span className="text-amber-500/80 animate-pulse font-extrabold">Live Rendering</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY TILE SHOPS LOVE US */}
      <section className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative granite-tile-bg">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Heart className="w-3.5 h-3.5" /> Built for Indian Tile Shops
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-neutral-900 dark:text-white">Why Indian Tile Dealers Switched</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: "Close 2x More Sales",
              desc: "When customers see their tiles in 3D, they're 2.7x more likely to commit on the spot.",
              gradient: "from-amber-500/15 to-orange-500/5",
              iconBg: "bg-amber-500/15",
              iconColor: "text-amber-400",
            },
            {
              icon: Clock,
              title: "Save 3 Hours Per Day",
              desc: "Stop doing manual calculations. Stop handwriting quotations. Everything is one click.",
              gradient: "from-blue-500/15 to-cyan-500/5",
              iconBg: "bg-blue-500/15",
              iconColor: "text-blue-400",
            },
            {
              icon: Award,
              title: "Look More Professional",
              desc: "Branded PDF quotations, real-time 3D previews, instant WhatsApp-ready outputs — your showroom will look 10x more premium.",
              gradient: "from-purple-500/15 to-violet-500/5",
              iconBg: "bg-purple-500/15",
              iconColor: "text-purple-400",
            },
          ].map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`p-7 rounded-3xl bg-gradient-to-br ${benefit.gradient} border border-white/10 backdrop-blur-md`}
              >
                <div className={`w-12 h-12 rounded-2xl ${benefit.iconBg} border border-white/10 flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${benefit.iconColor}`} />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2">{benefit.title}</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">{benefit.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 md:py-24 border-t border-amber-900/15 dark:border-white/5 bg-gradient-to-b from-transparent via-amber-50/30 to-transparent dark:from-transparent dark:via-black/30 dark:to-transparent backdrop-blur-md relative overflow-hidden subway-tile-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Users className="w-3.5 h-3.5" /> Real Dealer Stories
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-neutral-900 dark:text-white">Trusted by Tile Shops Across India</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card p-6 md:p-7 rounded-3xl border border-white/10 bg-black/30 flex flex-col"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-neutral-200 text-sm leading-relaxed mb-6 flex-1 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-black text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{t.name}</div>
                    <div className="text-neutral-500 text-xs">{t.shop}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-black/40 to-orange-500/10 p-10 md:p-16 text-center"
        >
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full radial-glow-amber blur-3xl opacity-30 -z-0 pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full radial-glow-amber blur-3xl opacity-30 -z-0 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-5" />
            <h2 className="text-3xl md:text-5xl font-black mb-5 text-white">
              Ready to <span className="text-gradient">10x Your Tile Sales?</span>
            </h2>
            <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
              Join 2,000+ Indian tile shops that closed more sales, saved hours every day, and look more professional with
              TileMaster Pro. Start your 3-day free trial — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/auth"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_35px_rgba(245,158,11,0.6)] transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5" /> Start 3-Day Free Trial
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card text-white hover:bg-white/10 font-bold text-lg flex items-center justify-center gap-2 border border-white/10"
              >
                <IndianRupee className="w-5 h-5 text-amber-400" /> See Pricing
              </Link>
            </div>
            <p className="text-xs text-neutral-500 mt-6">Cancel anytime · No hidden fees · Indian billing support</p>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-amber-900/15 dark:border-white/5 relative porcelain-tile-bg">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-black mb-3">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Expert insights on managing packaging, fractions, and room estimations.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={faq.question}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left font-bold text-white hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
                >
                  <span className="pr-4 text-base md:text-lg">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "transform rotate-180 text-amber-500" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm md:text-base text-neutral-400 leading-relaxed border-t border-white/5 bg-black/10">
                        {faq.answer.split("\n").map((line, i) => (
                          <p key={i} className={i > 0 ? "mt-2" : ""}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-amber-100/40 to-amber-50/60 dark:from-neutral-900/80 dark:to-neutral-950/80 border-t border-amber-900/15 dark:border-white/5 py-12 mt-12 text-center text-sm text-neutral-700 dark:text-neutral-500 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-neutral-400 mb-2">TileMaster Pro</p>
          <p className="max-w-md mx-auto text-xs text-neutral-600 mb-8">
            3D visualization + smart calculators, built for Indian tile dealers, contractors, and home-builders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 min-w-[250px] md:min-w-[300px]"
            />
            <button className="px-6 py-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black font-semibold transition-all shadow-sm">
              Subscribe
            </button>
          </div>

          <div className="border-t border-white/5 pt-6 text-xs">
            © {new Date().getFullYear()} TileMaster Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
