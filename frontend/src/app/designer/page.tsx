"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Palette, Box, Grid, Percent, ArrowRight, Activity, Moon, Sun, Combine, Paintbrush } from "lucide-react";
import { useCalculatorStore } from "../../store";

const designerSchema = z.object({
  total_wall_boxes: z.number().min(1, "Total boxes is required"),
  light_percent: z.number().min(0).max(100),
  dark_percent: z.number().min(0).max(100),
  highlighter_percent: z.number().min(0).max(100),
});

type DesignerFormValues = z.infer<typeof designerSchema>;

type DesignerResult = {
  light: number;
  dark: number;
  highlighter: number;
  total: number;
};

export default function DesignerCalculator() {
  const { designerData, setDesignerData, designerResult: result, setDesignerResult: setResult } = useCalculatorStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DesignerFormValues>({
    resolver: zodResolver(designerSchema),
    defaultValues: designerData || ({} as Partial<DesignerFormValues>)
  });

  useEffect(() => {
    const subscription = watch((value) => {
      setDesignerData(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, setDesignerData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const light = watch("light_percent") || 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dark = watch("dark_percent") || 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const high = watch("highlighter_percent") || 0;
  const totalPercent = light + dark + high;

  const onSubmit = async (data: DesignerFormValues) => {
    if (totalPercent !== 100) {
      alert("Percentages must add up to exactly 100%");
      return;
    }

    setLoading(true);
    try {
      setTimeout(() => {
        const lightBoxes = Math.round(data.total_wall_boxes * (data.light_percent / 100));
        const darkBoxes = Math.round(data.total_wall_boxes * (data.dark_percent / 100));
        let highBoxes = Math.round(data.total_wall_boxes * (data.highlighter_percent / 100));

        // Adjust for rounding errors
        const diff = data.total_wall_boxes - (lightBoxes + darkBoxes + highBoxes);
        if(diff !== 0) {
            highBoxes += diff;
        }

        setResult({
          light: lightBoxes,
          dark: darkBoxes,
          highlighter: highBoxes,
          total: data.total_wall_boxes
        });
        setLoading(false);
      }, 600);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
          <Palette className="w-10 h-10 text-[#a855f7]" />
          Designer Mode
        </h1>
        <p className="text-muted-foreground text-lg">Calculate perfect distribution of Light, Dark, and Highlighter tiles.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-6 glass-card p-6 md:p-8 rounded-3xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Wall Boxes Needed</label>
                <input type="number" {...register("total_wall_boxes", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#a855f7] outline-none transition-all text-xl font-bold" />
                {errors.total_wall_boxes && <span className="text-destructive text-xs mt-1">{errors.total_wall_boxes.message}</span>}
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2">Distribution (%)</h3>
                
                <div className={`text-sm mb-4 font-semibold px-3 py-2 rounded-lg ${totalPercent === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                  Total: {totalPercent}% {totalPercent !== 100 && "(Must be 100%)"}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Light</label>
                      <input type="number" {...register("light_percent", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#a855f7] outline-none transition-all" />
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mt-6">
                      <div className="h-full bg-[#f1f5f9]" style={{ width: `${light}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Dark</label>
                      <input type="number" {...register("dark_percent", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#a855f7] outline-none transition-all" />
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mt-6">
                      <div className="h-full bg-[#334155]" style={{ width: `${dark}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Highlighter</label>
                      <input type="number" {...register("highlighter_percent", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#a855f7] outline-none transition-all" />
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mt-6">
                      <div className="h-full bg-[url('/pattern.svg')] bg-[#cbd5e1]" style={{ width: `${high}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || totalPercent !== 100}
              className="w-full py-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-lg transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-spin" /> Calculating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Get Box Distribution <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-6 space-y-6"
        >
          {!result && !loading && (
             <div className="glass-card p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-2 border-border/50">
               <Paintbrush className="w-16 h-16 text-muted-foreground/30 mb-4" />
               <h3 className="text-xl font-bold text-muted-foreground mb-2">Designer Ready</h3>
               <p className="text-sm text-muted-foreground/70">Set your percentages to get exact box splits for your design.</p>
             </div>
          )}

          {loading && (
            <div className="glass-card p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px]">
               <Activity className="w-16 h-16 text-[#a855f7] animate-spin mb-4" />
               <h3 className="text-xl font-bold animate-pulse">Calculating Splits...</h3>
            </div>
          )}

          {result && !loading && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-3xl overflow-hidden shadow-2xl relative bg-[#0f172a] text-white"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <Sun className="text-[#fcd34d]" /> Final Distribution
                </h3>
                
                <div className="space-y-6">
                  {/* Light */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#f8fafc] border border-white/20 shadow-inner" />
                      <div>
                        <p className="font-semibold text-lg">Light Tiles</p>
                        <p className="text-sm text-white/50">{watch("light_percent")}% of Total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{result.light}</p>
                      <p className="text-xs text-white/50">Boxes</p>
                    </div>
                  </div>

                  {/* Dark */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#334155] border border-white/20 shadow-inner" />
                      <div>
                        <p className="font-semibold text-lg">Dark Tiles</p>
                        <p className="text-sm text-white/50">{watch("dark_percent")}% of Total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{result.dark}</p>
                      <p className="text-xs text-white/50">Boxes</p>
                    </div>
                  </div>

                  {/* Highlighter */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[url('/pattern.svg')] bg-[#94a3b8] border border-white/20 shadow-inner relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/30" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Highlighter</p>
                        <p className="text-sm text-white/50">{watch("highlighter_percent")}% of Total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{result.highlighter}</p>
                      <p className="text-xs text-white/50">Boxes</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#a855f7]/20 p-6 flex justify-between items-center text-white backdrop-blur-md relative z-10 border-t border-[#a855f7]/30">
                <span className="font-medium text-lg text-[#e9d5ff]">Verification (Total)</span>
                <span className="text-3xl font-black text-[#e9d5ff]">{result.total} Boxes</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
