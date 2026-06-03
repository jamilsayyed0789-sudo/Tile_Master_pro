"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, AlertCircle, CheckCircle2, Sparkles, ArrowRight, Activity } from "lucide-react";
import { API_BASE_URL } from "../../../utils/auth";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) { setError("Invalid or missing reset token."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");
      setSuccess(true);
      setTimeout(() => router.push("/auth"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
        <h2 className="text-2xl font-extrabold text-white">Password Reset!</h2>
        <p className="text-neutral-400 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold mb-1">Set New Password</h2>
        <p className="text-muted-foreground text-xs">Enter your new password below</p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/60" />
            <input type="password" required placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/60" />
            <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-extrabold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center gap-2"><Activity className="w-4.5 h-4.5 animate-spin" /> Resetting...</span>
          ) : (
            <span className="flex items-center gap-2">Reset Password <ArrowRight className="w-4.5 h-4.5" /></span>
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const [show, setShow] = useState(true);
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden aurora-bg grid-bg-pattern px-4 py-12">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 radial-glow-amber -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 radial-glow-blue -z-10 pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8 rounded-3xl w-full gold-glow-border relative">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 mx-auto w-fit">
            <Sparkles className="w-4 h-4" /> TileMaster Pro
          </div>
          <Suspense fallback={<div className="text-center py-8 text-neutral-400">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
