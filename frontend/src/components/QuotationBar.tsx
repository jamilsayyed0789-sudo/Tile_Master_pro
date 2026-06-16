"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useProjectStore } from "@/store/projectStore";

export default function QuotationBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { items, clearAll } = useProjectStore();
  const count = items.length;

  if (!mounted || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none"
      >
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-2xl shadow-black/50 px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">
                  {count} Room{count !== 1 ? "s" : ""} Calculated
                </p>
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                  Ready for quotation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAll}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push("/quotation-project")}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition text-sm"
              >
                <FileText className="w-4 h-4" />
                Generate Quotation
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
