"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Droplet, Layout, Activity, ArrowRight, Percent } from "lucide-react";
import { useCalculatorStore } from "../../store";



const bathroomSchema = z.object({
  running_feet: z.number().min(0.1, "Running feet must be > 0"),
  height: z.number().min(0.1, "Height must be > 0"),
  floor_length: z.number().min(0.1, "Floor length must be > 0").optional(),
  floor_width: z.number().min(0.1, "Floor width must be > 0").optional(),
  wall_tile_length: z.number().min(0.1),
  wall_tile_width: z.number().min(0.1),
  wall_tile_unit: z.enum(["feet", "inches", "mm", "cm"]),
  wall_tiles_per_box: z.number().min(1),
  floor_tiles_per_box: z.number().min(1).optional(),
  wastage_percent: z.number().min(0).max(100),
});

type BathroomFormValues = z.infer<typeof bathroomSchema>;

type BathroomResult = {
  wall_area_sqft: string;
  wall_tiles_final: number;
  wall_boxes: number;
  floor_area_sqft: string | null;
  floor_tiles_final: number | null;
  floor_boxes: number | null;
};

export default function BathroomCalculator() {
  const { bathroomData, setBathroomData, bathroomResult: result, setBathroomResult: setResult } = useCalculatorStore();
  const [loading, setLoading] = useState(false);
  

  const { register, handleSubmit, watch, formState: { errors } } = useForm<BathroomFormValues>({
    resolver: zodResolver(bathroomSchema),
    defaultValues: bathroomData || {
      wall_tile_unit: "feet",
    } as Partial<BathroomFormValues>
  });

  useEffect(() => {
    const subscription = watch((value) => {
      setBathroomData(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, setBathroomData]);

  const convertToSqFt = (length: number, width: number, unit: string) => {
    let l = length;
    let w = width;
    if (unit === "inches") {
      l = l / 12;
      w = w / 12;
    } else if (unit === "mm") {
      l = l / 304.8;
      w = w / 304.8;
    } else if (unit === "cm") {
      l = l / 30.48;
      w = w / 30.48;
    }
    
    // Indian Standard Fix: 32"x64" tiles are commonly referred to as 5x2.5 feet
    if (unit === "feet" && ((length === 5 && width === 2.5) || (length === 2.5 && width === 5))) {
        return (32 * 64) / 144;
    }
    return l * w;
  };

  const onSubmit = async (data: BathroomFormValues) => {
    setLoading(true);
    try {
      setTimeout(() => {
        // Wall Area (Running feet * Height)
        const net_wall_area = data.running_feet * data.height;
        const wall_tile_area = convertToSqFt(data.wall_tile_length, data.wall_tile_width, data.wall_tile_unit);
        const raw_wall_tiles = net_wall_area / wall_tile_area;
        const wall_tiles_final = Math.ceil(raw_wall_tiles * (1 + (data.wastage_percent || 0) / 100));
        const wall_boxes = Math.ceil(wall_tiles_final / data.wall_tiles_per_box);

        let floor_area_sqft = null;
        let floor_tiles_final = null;
        let floor_boxes = null;

        // Floor calculation (Optional if they don't enter floor dimensions)
        if (data.floor_length && data.floor_width) {
          const floor_area = data.floor_length * data.floor_width;
          floor_area_sqft = floor_area.toFixed(2);
          
          // Floor tiles are strictly 1x1 feet, so tile area is 1 sq.ft
          const raw_floor_tiles = floor_area / 1.0; 
          floor_tiles_final = Math.ceil(raw_floor_tiles * (1 + (data.wastage_percent || 0) / 100));
          
          if (data.floor_tiles_per_box) {
             floor_boxes = Math.ceil(floor_tiles_final / data.floor_tiles_per_box);
          }
        }

        setResult({
          wall_area_sqft: net_wall_area.toFixed(2),
          wall_tiles_final,
          wall_boxes,
          floor_area_sqft,
          floor_tiles_final,
          floor_boxes
        });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
          <Droplet className="w-10 h-10 text-primary dark:text-[#3b82f6]" />
          Bathroom Tile Calculator
        </h1>
        <p className="text-muted-foreground text-lg">Calculate wall and floor tiles instantly based on your bathroom dimensions.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 glass-card p-6 md:p-8 rounded-3xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Wall Dimensions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                <Layout className="w-5 h-5 text-[#3b82f6]" /> Wall Dimensions (feet)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Running Feet (rft)</label>
                  <input type="number" step="0.01" {...register("running_feet", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                  {errors.running_feet && <span className="text-destructive text-xs mt-1">{errors.running_feet.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input type="number" step="0.01" {...register("height", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                  {errors.height && <span className="text-destructive text-xs mt-1">{errors.height.message}</span>}
                </div>
              </div>
            </div>

            {/* Floor Dimensions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2 mt-8">
                <Layout className="w-5 h-5 text-[#3b82f6]" /> Floor Dimensions (feet)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Floor Length (Optional)</label>
                  <input type="number" step="0.01" {...register("floor_length", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Floor Width (Optional)</label>
                  <input type="number" step="0.01" {...register("floor_width", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2 mt-8">
                <Droplet className="w-5 h-5 text-[#3b82f6]" /> Tile Details
              </h3>
              <div className="grid grid-cols-1 gap-6">
                
                {/* Wall Tiles */}
                <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/20">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">Wall Tiles</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Length</label>
                      <input type="number" step="0.01" {...register("wall_tile_length", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Width</label>
                      <input type="number" step="0.01" {...register("wall_tile_width", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Unit</label>
                      <select {...register("wall_tile_unit")} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all">
                        <option value="feet">Feet</option>
                        <option value="inches">Inches</option>
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Tiles Per Box</label>
                      <input type="number" {...register("wall_tiles_per_box", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Floor Tiles */}
                <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/20">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 flex justify-between items-center">
                    <span>Floor Tiles</span>
                    <span className="text-xs bg-background px-2 py-1 rounded-md border border-border">Fixed Size: 1 x 1 ft</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Tiles Per Box</label>
                      <input type="number" {...register("floor_tiles_per_box", { valueAsNumber: true })} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">Wastage Buffer <Percent className="w-3 h-3"/></label>
                <input type="number" step="0.1" {...register("wastage_percent", { valueAsNumber: true })} className="w-1/3 bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3b82f6] outline-none transition-all" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-lg transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
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
              <Droplet className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground mb-2">Ready to Calculate</h3>
              <p className="text-sm text-muted-foreground/70">Enter dimensions to get precise floor and wall tile estimates.</p>
            </div>
          )}

          {loading && (
            <div className="glass-card p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px]">
               <Activity className="w-16 h-16 text-[#3b82f6] animate-spin mb-4" />
               <h3 className="text-xl font-bold animate-pulse">Running AI Calculation...</h3>
            </div>
          )}


          {result && !loading && (
            <div className="glass-card p-8 rounded-3xl text-white">
              <div className={`flex justify-between items-end pb-6 ${result.floor_area_sqft ? 'border-b border-white/10' : ''}`}>
                {/* Wall info */}
                <div>
                  <p className="text-white/70 text-sm mb-1">Wall Area</p>
                  <p className="text-3xl font-bold">
                    {result.wall_area_sqft} <span className="text-sm font-normal">sq.ft</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm mb-1">Wall Boxes</p>
                  <p className="text-4xl font-extrabold text-[#fcd34d]">{result.wall_boxes}</p>
                  <p className="text-sm text-white/50">{result.wall_tiles_final} tiles</p>
                </div>
              </div>

              {result.floor_area_sqft && (
                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Floor Area</p>
                    <p className="text-3xl font-bold">
                      {result.floor_area_sqft} <span className="text-sm font-normal">sq.ft</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {result.floor_boxes ? (
                      <>
                        <p className="text-white/70 text-sm mb-1">Floor Boxes</p>
                        <p className="text-4xl font-extrabold text-[#fcd34d]">{result.floor_boxes}</p>
                        <p className="text-sm text-white/50">{result.floor_tiles_final} tiles (1x1)</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/70 text-sm mb-1">Total Floor Tiles</p>
                        <p className="text-4xl font-extrabold text-[#fcd34d]">{result.floor_tiles_final}</p>
                        <p className="text-sm text-white/50">tiles (1x1)</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
