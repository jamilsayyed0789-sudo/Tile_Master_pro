"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Calculator, Box, Maximize, ArrowRight, Activity, Percent } from "lucide-react";
import { useCalculatorStore } from "../../store";

const floorSchema = z.object({
  length: z.number().min(0.1, "Length must be greater than 0"),
  width: z.number().min(0.1, "Width must be greater than 0"),
  unit: z.enum(["feet", "inches", "mm", "cm"]),
  tile_length: z.number().min(0.1, "Tile length is required"),
  tile_width: z.number().min(0.1, "Tile width is required"),
  tile_unit: z.enum(["feet", "inches", "mm", "cm"]),
  wastage_percent: z.number().min(0).max(100),
  price_per_box: z.number().min(0).optional(),
  tiles_per_box: z.number().min(1),
});

type FloorFormValues = z.infer<typeof floorSchema>;

type FloorResult = {
  area_sqft: string;
  total_tiles: number;
  wastage_tiles: number;
  total_boxes: number;
  total_price: string | null;
};

export default function FloorCalculator() {
  const { floorData, setFloorData, floorResult: result, setFloorResult: setResult } = useCalculatorStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FloorFormValues>({
    resolver: zodResolver(floorSchema),
    defaultValues: floorData || {
      unit: "feet",
      tile_unit: "feet",
    } as Partial<FloorFormValues>
  });

  useEffect(() => {
    const subscription = watch((value) => {
      setFloorData(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, setFloorData]);

  const onSubmit = async (data: FloorFormValues) => {
    setLoading(true);
    try {
      // In a real app we'd convert units. Assuming backend takes feet for now.
      // We will perform local calculation for instantaneous 'premium' feel
      setTimeout(() => {
        const area_sqft = data.length * data.width;
        let t_len = data.tile_length;
        let t_wid = data.tile_width;
        if(data.tile_unit === "inches") {
            t_len = t_len / 12;
            t_wid = t_wid / 12;
        } else if (data.tile_unit === "mm") {
            t_len = t_len / 304.8;
            t_wid = t_wid / 304.8;
        }

        let tile_area_sqft = t_len * t_wid;

        // Indian Standard Fix: 32"x64" tiles are commonly referred to as 5x2.5 feet
        // The actual area is (32 * 64) / 144 = 14.2222 sq.ft per tile (28.44 sq.ft per box of 2)
        if (data.tile_unit === "feet" && ((data.tile_length === 5 && data.tile_width === 2.5) || (data.tile_length === 2.5 && data.tile_width === 5))) {
            tile_area_sqft = (32 * 64) / 144;
        }

        const tiles_needed_raw = area_sqft / tile_area_sqft;
        const wastage_tiles = tiles_needed_raw * (data.wastage_percent / 100.0);
        const total_tiles = Math.ceil(tiles_needed_raw + wastage_tiles);
        const total_boxes = Math.ceil(total_tiles / data.tiles_per_box);

        setResult({
          area_sqft: area_sqft.toFixed(2),
          total_tiles,
          wastage_tiles: Math.ceil(wastage_tiles),
          total_boxes,
          total_price: data.price_per_box ? (total_boxes * data.price_per_box).toFixed(2) : null
        });
        setLoading(false);
      }, 600); // Simulate network delay for animation

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
          <Calculator className="w-10 h-10 text-primary dark:text-white" />
          Floor Tile Calculator
        </h1>
        <p className="text-muted-foreground text-lg">Calculate required tiles, boxes, and exact costs instantly.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 glass-card p-6 md:p-8 rounded-3xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                <Maximize className="w-5 h-5 text-primary" /> Room Dimensions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Length</label>
                  <input type="number" step="0.01" {...register("length", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                  {errors.length && <span className="text-destructive text-xs mt-1">{errors.length.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Width</label>
                  <input type="number" step="0.01" {...register("width", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                  {errors.width && <span className="text-destructive text-xs mt-1">{errors.width.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select {...register("unit")} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all">
                    <option value="feet">Feet</option>
                    <option value="inches">Inches</option>
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2 mt-8">
                <Box className="w-5 h-5 text-primary" /> Tile Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tile Length</label>
                  <input type="number" step="0.01" {...register("tile_length", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tile Width</label>
                  <input type="number" step="0.01" {...register("tile_width", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tile Unit</label>
                  <select {...register("tile_unit")} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all">
                    <option value="feet">Feet</option>
                    <option value="inches">Inches</option>
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">Wastage <Percent className="w-3 h-3"/></label>
                  <input type="number" step="0.1" {...register("wastage_percent", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tiles Per Box</label>
                  <input type="number" {...register("tiles_per_box", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price per Box (₹)</label>
                  <input type="number" step="1" {...register("price_per_box", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Optional" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-spin" /> Calculating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Calculate Now <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-6"
        >
          {!result && !loading && (
            <div className="glass-card p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-2 border-border/50">
              <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground mb-2">Ready to Calculate</h3>
              <p className="text-sm text-muted-foreground/70">Enter your dimensions on the left and hit calculate to see the magic.</p>
            </div>
          )}

          {loading && (
            <div className="glass-card p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px]">
               <Activity className="w-16 h-16 text-primary animate-spin mb-4" />
               <h3 className="text-xl font-bold animate-pulse">Running AI Calculation...</h3>
            </div>
          )}

          {result && !loading && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-8 rounded-3xl premium-gradient text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 text-white/5">
                <Box className="w-64 h-64" />
              </div>
              <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 relative z-10">Calculation Result</h3>
              
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md">
                  <p className="text-sm text-white/60 mb-1">Total Area</p>
                  <p className="text-2xl font-bold">{result.area_sqft} <span className="text-sm font-normal">sq.ft</span></p>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md">
                  <p className="text-sm text-white/60 mb-1">Total Tiles Needed</p>
                  <p className="text-2xl font-bold">{result.total_tiles}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md">
                  <p className="text-sm text-white/60 mb-1">Total Boxes</p>
                  <p className="text-3xl font-extrabold text-[#fcd34d]">{result.total_boxes}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md">
                  <p className="text-sm text-white/60 mb-1">Wastage Buffer</p>
                  <p className="text-xl font-bold">{result.wastage_tiles} <span className="text-sm font-normal">tiles</span></p>
                </div>
              </div>

              {result.total_price && (
                <div className="mt-6 bg-white/10 p-5 rounded-2xl backdrop-blur-md relative z-10 border border-white/20">
                  <p className="text-sm text-white/70 mb-1">Estimated Cost</p>
                  <p className="text-4xl font-extrabold">₹{result.total_price}</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
