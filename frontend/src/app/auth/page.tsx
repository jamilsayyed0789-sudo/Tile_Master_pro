"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  Activity,
  AlertCircle,
  CheckCircle2,
  Layers,
  Box,
  Grid3X3,
  FileText,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();

  const supabase = createClient();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) router.push("/");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) router.push("/");
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isLogin && !name) {
      setError("Please enter your name.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw new Error(signInError.message || "Invalid email or password");
        }

        setSuccess("Login successful! Redirecting...");

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          throw new Error(
            signUpError.message || "Registration failed. Try again."
          );
        }

        setSuccess(
          "Account registered successfully! Please check your email to verify your account."
        );

        setTimeout(() => {
          // If auto sign-in is disabled or email confirmation is required,
          // don't redirect immediately.
          setLoading(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send reset link");
      let msg = "Reset link sent! Check your email.";
      if (data.reset_link) {
        msg += `\n\n${data.reset_link}`;
      }
      setSuccess(msg);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        throw new Error(error.message || "Failed to sign in with Google");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      title: "3D Bathroom Visualizer",
      description:
        "Customize walls, floors, borders, and rows in dynamic real-time 3D.",
    },
    {
      icon: <Grid3X3 className="w-5 h-5 text-blue-400" />,
      title: "Wall Elevation Layouts",
      description:
        "Set alternating patterns of dark, light, and decorative highlighter tiles.",
    },
    {
      icon: <Box className="w-5 h-5 text-emerald-400" />,
      title: "Tile box Calculator",
      description:
        "Instant Indian standard box and tile count calculations with wastage buffer.",
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      title: "Seamless PDF & Sharing",
      description:
        "Export clean estimation tables and share layout configurations instantly.",
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden aurora-bg grid-bg-pattern px-4 py-12 md:py-24">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 radial-glow-amber -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 radial-glow-blue -z-10 pointer-events-none" />

      <div className="max-w-6xl w-full grid md:grid-cols-12 gap-8 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="md:col-span-6 space-y-6 text-left"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 px-4 py-1.5 rounded-full text-xs font-semibold gold-glow-border">
            <Sparkles className="w-4 h-4 animate-spin-slow" /> Elite Estimator
            Tool
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Design & Calculate Tiles Like{" "}
            <span className="text-gradient">a Pro</span>
          </h1>

          <p className="text-muted-foreground text-base max-w-lg">
            Empower your tile shop, dealership, or design workflow with real-time
            3D room previewers, dynamic calculation boxes, and premium layouts.
          </p>

          <div className="space-y-4 pt-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                className="flex items-start gap-4 p-3 rounded-2xl bg-black/10 border border-white/5 backdrop-blur-sm"
              >
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="md:col-span-6"
        >
          <div className="glass-card p-8 rounded-3xl w-full max-w-md mx-auto gold-glow-border relative">
            {!isLogin && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-black px-4 py-1 rounded-full text-xs font-extrabold shadow-lg animate-bounce flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-black" /> 3-Day Free
                Trial
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold mb-1">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-muted-foreground text-xs">
                {isLogin
                  ? "Log in to your account to continue calculating"
                  : "Sign up in 5 seconds — no credit card needed"}
              </p>
            </div>

            {showForgotPassword ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold mb-1">
                    Reset Password
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Enter your email to receive a reset link
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/60" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-blue-500 text-black font-extrabold text-sm hover:bg-blue-400 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Activity className="w-4.5 h-4.5 animate-spin" />{" "}
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Reset Link <ArrowRight className="w-4.5 h-4.5" />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="w-full text-center text-xs text-muted-foreground hover:text-white font-semibold transition cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 p-1 bg-black/30 rounded-xl mb-6 border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError(null);
                      setLoading(false);
                    }}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                      isLogin
                        ? "bg-white/10 text-white font-bold"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError(null);
                      setLoading(false);
                    }}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all relative ${
                      !isLogin
                        ? "bg-white/10 text-white font-bold"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    Register
                    {isLogin && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                    )}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-muted-foreground">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required={!isLogin}
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/60" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/60" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-1 transition"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>

                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1 overflow-hidden"
                    >
                      <label className="block text-xs font-medium text-muted-foreground">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-muted-foreground/60" />
                        <input
                          type="password"
                          required={!isLogin}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-blue-500 text-black font-extrabold text-sm hover:bg-blue-400 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Activity className="w-4.5 h-4.5 animate-spin" />{" "}
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isLogin ? "Log In" : "Activate Trial"}{" "}
                        <ArrowRight className="w-4.5 h-4.5" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center gap-4">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-xs text-muted-foreground font-medium">OR</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-3 mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-[10px] text-muted-foreground/50 text-center mt-6">
                  By accessing TileMaster Pro, you agree to our Terms and agree
                   that the 3-day free trial limit applies per email account.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
