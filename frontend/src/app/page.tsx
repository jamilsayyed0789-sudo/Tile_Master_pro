"use client";

import { useState } from "react";
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
} from "lucide-react";

// FAQs Data Structure
const FAQS = [
  {
    question: "How do I calculate tiles needed for a bathroom wall with doors?",
    answer: "To calculate bathroom walls accurately: (1) Find the perimeter of the bathroom (Length + Width) × 2, then multiply by the wall height to get the total wall area. (2) Subtract the area of doors and windows (e.g. standard door is 3ft x 7ft = 21 sq.ft). (3) Add a wastage buffer (typically 8-10% to account for cut corners around layout transitions). Use our 'Bathroom Calculator' route for a comprehensive step-by-step assistant that handles this automatically."
  },
  {
    question: "Why is wastage factor important for different layout patterns?",
    answer: "Tile wastage occurs due to corner cuts, cutting mistakes, or structural columns. A standard stacked grid pattern requires about 5% wastage buffer. In contrast, running bond (brick) offsets require 8-10% wastage. Highly complex patterns like Herringbone or Diagonal grids require 12-15% wastage because almost every tile near the walls has to be sliced diagonally, leaving unusable remnants."
  },
  {
    question: "What are standard box packing counts in India?",
    answer: "In India, tile packing details depend heavily on the tile dimensions: \n• 12\" x 12\" (300x300mm): Packed as 10 tiles/box (covers 10 sq.ft)\n• 24\" x 24\" (600x600mm): Packed as 4 tiles/box (covers 16 sq.ft)\n• 24\" x 48\" (600x1200mm): Packed as 2 tiles/box (covers 15.5 sq.ft)\n• 32\" x 32\" (800x800mm): Packed as 3 tiles/box (covers 17 sq.ft)\n• 32\" x 64\" (800x1600mm): Packed as 2 tiles/box (covers 27.5 sq.ft)\nOur Pro Calculator automatically adjusts calculations to these packing standards so you order exact integer boxes."
  },
  {
    question: "Can I generate and print professional quotations for my customers?",
    answer: "Yes! Both the Floor Calculator and Bathroom Calculator feature an advanced 'Generate Quotation' utility. Once your calculations are complete, you can key in the price per box, labor costs, brand, and customer details, then download a beautifully structured PDF quotation containing exact metrics, tax breakdown, and wastage warnings, perfectly tailored for Indian tile dealerships."
  }
];

const PATTERNS = [
  {
    id: "grid",
    name: "Stacked Grid",
    waste: "5%",
    difficulty: "Easy",
    desc: "Tiles are aligned in a straight, uniform grid. It is the easiest to install, has clean linear symmetry, and produces the least amount of cut waste.",
    tip: "Ideal for large-format modern vitrified tiles with continuous marble veining."
  },
  {
    id: "brick",
    name: "Running Bond (Brick)",
    waste: "8-10%",
    difficulty: "Medium",
    desc: "Each tile row is offset by 50% from the row below it, mimicking classic brick laying. This hides minor wall alignment and tile curvature defects beautifully.",
    tip: "Highly recommended for rectangular format tiles like 12\"x24\" or wood planks."
  },
  {
    id: "diagonal",
    name: "Diagonal (45° Grid)",
    waste: "12%",
    difficulty: "Hard",
    desc: "Standard grid pattern rotated by 45 degrees. The angled lines trick the eye into seeing more space, making small rooms feel significantly wider.",
    tip: "Requires precision cuts at all wall perimeters. Standard wastage is 12%."
  },
  {
    id: "herringbone",
    name: "Herringbone",
    waste: "15%",
    difficulty: "Master",
    desc: "Rectangular tiles placed in an interlocking 90-degree V-shape. Highly premium, visually striking pattern that turns any floor or wall into a focal point.",
    tip: "Extremely cut-heavy at borders. Budget for 15% wastage and specialized tile labor."
  }
];

const getTileStyle = (i: number, pattern: string) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  
  switch (pattern) {
    case "grid":
      return {
        x: col * 52 - 104,
        y: row * 52 - 104,
        width: 48,
        height: 48,
        rotate: 0,
      };
    case "brick":
      return {
        x: col * 52 + (row % 2 === 0 ? 26 : 0) - 117,
        y: row * 52 - 104,
        width: 48,
        height: 48,
        rotate: 0,
      };
    case "diagonal":
      return {
        x: col * 52 - 104,
        y: row * 52 - 104,
        width: 48,
        height: 48,
        rotate: 0,
      };
    case "herringbone":
      const isLeftTilt = (col + row) % 2 === 0;
      const angle = isLeftTilt ? -45 : 45;
      const hX = col * 44 - 88 + (isLeftTilt ? 10 : -10);
      const hY = row * 36 - 90;
      return {
        x: hX,
        y: hY,
        width: 50,
        height: 18,
        rotate: angle,
      };
    default:
      return { x: 0, y: 0, width: 48, height: 48, rotate: 0 };
  }
};

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activePattern, setActivePattern] = useState<string>("grid");

  return (
    <div className="min-h-screen text-foreground aurora-bg relative overflow-x-hidden">
      {/* Dynamic Glowing Ambient Blobs */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full radial-glow-amber blur-3xl opacity-30 -z-10 animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full radial-glow-blue blur-3xl opacity-20 -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-[350px] h-[350px] rounded-full radial-glow-green blur-3xl opacity-25 -z-10 pointer-events-none" />

      {/* Grid Pattern Background Layer */}
      <div className="absolute inset-0 grid-bg-pattern opacity-40 -z-20 pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Tag Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-6 shadow-sm shadow-amber-500/5 text-sm font-semibold tracking-wide"
            >
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
              Premium Multi-Pattern AI Calculator
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight mb-8 leading-tight sm:leading-none"
            >
              Calculate Tiles <br className="hidden sm:block" />
              <span className="text-gradient drop-shadow-[0_2px_10px_rgba(251,191,36,0.15)]">Faster & Smarter</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              The ultimate commercial-grade workspace designed for Indian tile dealers, contractors, and home-builders. Estimate boxes, configure dynamic layouts, simulate waste, and prepare professional client quotes.
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6"
            >
              <Link
                href="/floor-calculator"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_25px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5"
              >
                <Calculator className="w-5 h-5" /> Start Floor Calculator <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/designer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card text-white hover:bg-white/10 font-bold text-lg flex items-center justify-center gap-2 border border-white/10 transition-all duration-300 hover:shadow-xl"
              >
                <Layers className="w-5 h-5" /> Open Designer Studio
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="border-y border-white/5 bg-black/40 backdrop-blur-md relative overflow-hidden py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Indian Shops", value: "2,000+", desc: "Relying on our packing metrics" },
              { label: "Precise Calculations", value: "1M+", desc: "With 99.9% waste accuracy" },
              { label: "Preloaded Brands", value: "50+", desc: "Signature sizes pre-mapped" },
              { label: "Perfect Quotations", value: "100%", desc: "Downloaded as premium Client PDFs" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center gap-1.5"
              >
                <h3 className="text-3xl sm:text-5xl font-black text-amber-500 tracking-tight">{stat.value}</h3>
                <span className="text-white font-bold text-sm sm:text-base">{stat.label}</span>
                <p className="text-neutral-500 text-xs mt-0.5">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE WORKSPACE FEATURES GRID */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Building className="w-3.5 h-3.5" /> High-Performance Workspaces
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">Commercial Suite</h2>
          <p className="text-lg text-muted-foreground">Select a custom calculator engineered for specific architectural layouts.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Floor Tile Calculator",
              desc: "Determine exact room carpet areas, incorporate precise wastage calculations, configure box packs, and draft complete valuations.",
              icon: Box,
              href: "/floor-calculator",
              color: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40",
              badge: "Commercial Floor"
            },
            {
              title: "Bathroom Calculator",
              desc: "Incorporate complex combinations of light, dark, and highlighter wall tiles. Calculate floor spaces and auto-deduct doors/windows.",
              icon: Droplet,
              href: "/bathroom-calculator",
              color: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/40",
              badge: "Wall & Floor"
            },
            {
              title: "Designer Mode Studio",
              desc: "The professional selection model. Plan custom heights, band patterns, border tiles, and accent walls visually.",
              icon: Sparkles,
              href: "/designer",
              color: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/40",
              badge: "Visual Presets"
            }
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className={`glass-card p-8 rounded-[2rem] border transition-all duration-300 relative group flex flex-col justify-between min-h-[350px] ${feature.color}`}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">{feature.desc}</p>
              </div>
              
              <Link
                href={feature.href}
                className="inline-flex items-center gap-1.5 text-sm font-extrabold text-white mt-auto group-hover:gap-2.5 transition-all duration-300 cursor-pointer"
              >
                Access workspace <ArrowRight className="w-4 h-4 text-amber-500" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE TILE PATTERN SANDBOX */}
      <section className="py-24 border-t border-white/5 bg-black/20 backdrop-blur-md relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full radial-glow-blue blur-3xl opacity-10 -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live Pattern Sandbox
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Visual Layout Playground</h2>
            <p className="text-lg text-muted-foreground">
              Select different laying styles to see how tiles align, and understand why recommended wastage budgets change.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Sidebar Controls */}
            <div className="lg:col-span-5 space-y-6">
              {/* Pattern Selector Buttons */}
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
                      <span className="font-bold text-base">{p.name}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full w-fit font-bold ${
                        isActive ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-400"
                      }`}>
                        {p.waste} Waste
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="active-pattern-bg"
                          className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent -z-10"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pattern details card */}
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
                      {/* Glowing highlight */}
                      <div className="absolute top-0 right-0 w-24 h-24 radial-glow-amber opacity-20 pointer-events-none" />

                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                          {p.name}
                        </h4>
                        <div className="flex gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full">
                            Wastage: {p.waste}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full">
                            Skill: {p.difficulty}
                          </span>
                        </div>
                      </div>

                      <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                        {p.desc}
                      </p>

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

            {/* Live Animated Canvas Container */}
            <div className="lg:col-span-7 flex justify-center items-center">
              <div className="glass-card p-8 sm:p-12 rounded-[2.5rem] border border-white/10 w-full max-w-[480px] aspect-square flex items-center justify-center relative overflow-hidden group shadow-2xl">
                {/* Visual grid reference lines under the tiles */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                
                {/* Visual Frame */}
                <div className="w-[300px] h-[300px] relative flex items-center justify-center">
                  <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none -z-20 bg-black/40" />
                  
                  {/* Glowing perimeter border */}
                  <div className="absolute inset-0 gold-glow-border rounded-2xl pointer-events-none -z-10" />

                  {/* Tile grid viewport to keep everything nicely clipped */}
                  <div className="w-[280px] h-[280px] overflow-hidden rounded-xl relative flex items-center justify-center">
                    {/* The layout parent: when activePattern is 'diagonal', rotate this container! */}
                    <motion.div
                      animate={{
                        rotate: activePattern === "diagonal" ? 45 : 0,
                        scale: activePattern === "diagonal" ? 1.25 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 70, damping: 15 }}
                      className="w-[260px] h-[260px] relative flex items-center justify-center"
                    >
                      {/* Render 25 tiles */}
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
                            {/* Visual grout line lines or fine pattern inside tiles */}
                            <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/5" />
                            {/* Tiny center gold dot for premium look */}
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30 border border-amber-500/20" />
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>

                {/* Subtitle details label */}
                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                  <span>Interactive Preview Canvas</span>
                  <span className="text-amber-500/80 animate-pulse font-extrabold">Live Rendering</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANIMATED ACCORDION FAQ SECTION */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 relative">
        <div className="text-center mb-16">
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
                        {faq.answer.split('\n').map((line, i) => (
                          <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
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
      <footer className="bg-neutral-600/80 border-t border-white/5 py-12 mt-12 text-center text-sm text-neutral-500 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-neutral-400 mb-2">TileMaster Pro Calculator</p>
          <p className="max-w-md mx-auto text-xs text-neutral-600 mb-8">
            Commercial pack estimation tools mapped accurately to Indian industrial tile specifications.
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
            © {new Date().getFullYear()} TileMaster Pro. Developed with pairs on professional grade workspace.
          </div>
        </div>
      </footer>
    </div>
  );
}
