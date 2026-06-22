"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * Global 3D-style animated background.
 * Renders fixed to the viewport, behind all page content.
 * Layers (back to front):
 *  1. Dark base canvas
 *  2. Mouse-parallax gradient blobs (4 colors)
 *  3. 3D perspective grid floor with scrolling lines
 *  4. Floating 3D wireframe shapes (cube + octahedron + diamond)
 *  5. Depth fog (creates the illusion of objects receding)
 *  6. Subtle grid overlay + vignette
 */
export default function PageBackground() {
  /* Mouse parallax --------------------------------------------------- */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 50, stiffness: 100, mass: 0.5 });
  const springY = useSpring(mouseY, { damping: 50, stiffness: 100, mass: 0.5 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mouseX, mouseY]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ perspective: "1200px", contain: "strict" }}
    >
      {/* 1. Base dark canvas */}
      <div className="absolute inset-0 bg-[#06050a]" />

      {/* 2. Mouse-parallax gradient blobs (4 colors) */}
      <motion.div
        className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full"
        style={{
          x: useTransform(springX, (v) => v * 40),
          y: useTransform(springY, (v) => v * 40),
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 65%)",
          filter: "blur(70px)",
          willChange: "transform",
        }}
        animate={{ scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/4 -right-40 w-[800px] h-[800px] rounded-full"
        style={{
          x: useTransform(springX, (v) => v * -35),
          y: useTransform(springY, (v) => v * 35),
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 65%)",
          filter: "blur(80px)",
          willChange: "transform",
        }}
        animate={{ scale: [1, 1.1, 0.92, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/3 w-[750px] h-[750px] rounded-full"
        style={{
          x: useTransform(springX, (v) => v * 30),
          y: useTransform(springY, (v) => v * -30),
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 65%)",
          filter: "blur(80px)",
          willChange: "transform",
        }}
        animate={{ scale: [1, 0.95, 1.12, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-[600px] h-[600px] rounded-full"
        style={{
          x: useTransform(springX, (v) => v * -25),
          y: useTransform(springY, (v) => v * -25),
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 65%)",
          filter: "blur(80px)",
          willChange: "transform",
        }}
        animate={{ scale: [1, 1.18, 0.9, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 3. 3D Perspective Grid Floor — tilts back to create depth */}
      <div
        className="absolute -bottom-[20%] left-[-10%] right-[-10%] h-[80vh]"
        style={{
          transform: "rotateX(65deg)",
          transformOrigin: "bottom center",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <div
          className="absolute inset-0 grid-floor-scroll"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to top, black 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 30%, transparent 100%)",
          }}
        />
        {/* Accent glow line on the horizon */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.4) 30%, rgba(139,92,246,0.5) 50%, rgba(34,211,238,0.4) 70%, transparent 100%)",
            boxShadow: "0 0 40px rgba(139, 92, 246, 0.3)",
          }}
        />
      </div>

      {/* 4. Floating 3D wireframe shapes */}
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {/* Wireframe cube — top left */}
        <motion.div
          className="absolute top-[18%] left-[6%] w-24 h-24 sm:w-32 sm:h-32"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 border border-white/[0.07]" style={{ transform: "translateZ(48px)" }} />
          <div className="absolute inset-0 border border-white/[0.07]" style={{ transform: "translateZ(-48px)" }} />
          <div className="absolute inset-0 border border-white/[0.07]" style={{ transform: "rotateY(90deg) translateZ(48px)" }} />
          <div className="absolute inset-0 border border-white/[0.07]" style={{ transform: "rotateY(-90deg) translateZ(48px)" }} />
          <div className="absolute inset-0 border border-white/[0.07]" style={{ transform: "rotateX(90deg) translateZ(48px)" }} />
          <div className="absolute inset-0 border border-white/[0.07]" style={{ transform: "rotateX(-90deg) translateZ(48px)" }} />
        </motion.div>

        {/* Wireframe octahedron — bottom right */}
        <motion.div
          className="absolute bottom-[25%] right-[8%] w-20 h-20 sm:w-28 sm:h-28"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          animate={{ rotateX: [360, 0], rotateZ: [0, 360] }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 border border-blue-400/[0.08]" style={{ transform: "rotateY(45deg)" }} />
          <div className="absolute inset-0 border border-blue-400/[0.08]" style={{ transform: "rotateX(45deg)" }} />
          <div className="absolute inset-0 border border-blue-400/[0.08]" style={{ transform: "rotateZ(45deg)" }} />
        </motion.div>

        {/* Wireframe diamond — center-right, desktop only */}
        <motion.div
          className="absolute top-[45%] right-[28%] w-16 h-16 sm:w-24 sm:h-24 hidden md:block"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          animate={{ rotateX: [0, 360], rotateY: [360, 0] }}
          transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 border border-violet-400/[0.08]" style={{ transform: "rotateX(45deg) rotateY(45deg)" }} />
          <div className="absolute inset-0 border border-violet-400/[0.08]" style={{ transform: "rotateX(-45deg) rotateY(-45deg)" }} />
        </motion.div>

        {/* Wireframe tetrahedron — top right */}
        <motion.div
          className="absolute top-[12%] right-[15%] w-14 h-14 sm:w-20 sm:h-20 hidden sm:block"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          animate={{ rotateY: [0, 360], rotateZ: [360, 0] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 border border-cyan-400/[0.07]" style={{ transform: "rotateX(35deg)" }} />
          <div className="absolute inset-0 border border-cyan-400/[0.07]" style={{ transform: "rotateY(35deg)" }} />
          <div className="absolute inset-0 border border-cyan-400/[0.07]" style={{ transform: "rotateZ(35deg)" }} />
        </motion.div>
      </div>

      {/* 5. Depth fog — fades the floor into the dark base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, transparent 0%, rgba(6,5,10,0.3) 40%, rgba(6,5,10,0.85) 100%)",
        }}
      />

      {/* 6. Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 80%)",
        }}
      />

      {/* 7. Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 0%, transparent 0%, rgba(6,5,10,0.5) 60%, rgba(6,5,10,0.95) 100%)",
        }}
      />

      {/* Local keyframes — grid scroll animation */}
      <style jsx>{`
        @keyframes grid-scroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 60px;
          }
        }
        .grid-floor-scroll {
          animation: grid-scroll 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
