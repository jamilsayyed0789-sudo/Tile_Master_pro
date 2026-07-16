"use client";
import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

export function useModelPrefetch(urls: string[]) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefetch = () => {
      urls.forEach(url => {
        try {
          useGLTF.preload(url);
        } catch (e) {
          console.warn("Prefetch failed for", url, e);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        prefetch();
      });
    } else {
      setTimeout(prefetch, 2000);
    }
  }, [urls]); // Note: urls should be memoized or a static array
}
