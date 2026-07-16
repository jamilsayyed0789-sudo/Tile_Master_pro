"use client";
import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

export default function LoadingScreen() {
  const { progress, active, errors } = useProgress();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) setShow(true);
    if (!active && progress === 100) {
      const timer = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!show && !errors.length) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        active || errors.length ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {errors.length > 0 ? (
        <div className="text-center">
          <p className="text-red-500 mb-4 text-lg">Unable to load the 3D room. Please check your internet connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <svg className="w-full h-full text-neutral-800" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" stroke="currentColor" />
            </svg>
            <svg
              className="w-full h-full text-blue-500 absolute top-0 left-0 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"
              viewBox="0 0 100 100"
              style={{
                strokeDasharray: 283,
                strokeDashoffset: 283 - (283 * progress) / 100,
                transition: "stroke-dashoffset 0.1s linear",
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
              }}
            >
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" stroke="currentColor" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-medium tracking-wide mb-2 animate-pulse">Loading 3D Room...</h2>
          <p className="text-neutral-400 text-sm">{Math.round(progress)}% - Preparing your visualization...</p>
        </div>
      )}
    </div>
  );
}
