"use client";
import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, Clock, Crown, Timer } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getToken } from "@/utils/auth";
import { useRouter, useSearchParams } from "next/navigation";

const plans = [
  {
    name: "Monthly",
    price: "1,599",
    period: "/month",
    planKey: "monthly" as const,
    description: "Perfect for professionals needing ongoing access.",
    features: [
      "Full access to all 3D tools",
      "Floor, Bathroom & Kitchen calculators",
      "Real-time texture preview",
      "All tile sizes & styles",
      "Customer presentation mode",
      "Email support",
    ],
    cta: "Choose Monthly",
    icon: Zap,
  },
  {
    name: "Lifetime",
    price: "16,999",
    period: "one-time",
    planKey: "lifetime" as const,
    description: "Pay once, own forever. Best value for professionals.",
    features: [
      "Everything in Monthly",
      "Lifetime access, no recurring bills",
      "All future updates included",
      "Priority email & chat support",
      "Premium showroom mode",
      "Early access to new features",
    ],
    cta: "Get Lifetime Access",
    icon: Shield,
  },
];

function PricingContent() {
  const [selected, setSelected] = useState<"monthly" | "lifetime" | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showExpiredBanner = searchParams.get("reason") === "expired";
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  // Scarcity Countdown Logic
  useEffect(() => {
    const totalDuration = 24 * 60 * 60; // 24 hours
    const storedStart = localStorage.getItem("scarcity_start_time");
    let startTime = storedStart ? parseInt(storedStart, 10) : null;

    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem("scarcity_start_time", startTime.toString());
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime!) / 1000);
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch remaining lifetime slots
  useEffect(() => {
    fetch(`${API_BASE}/payment/lifetime-slots`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.remaining === "number") {
          setRemainingSlots(data.remaining);
        }
      })
      .catch(() => {});
  }, [API_BASE]);

  useEffect(() => {
    if (!session) return;

    const token = session.access_token;
    if (!token) return;

    fetch(`${API_BASE}/auth/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.subscription) {
          setCurrentPlan(data.subscription.planType);
          if (data.subscription.trialEndDate) {
            const end = new Date(data.subscription.trialEndDate);
            const now = new Date();
            const diffMs = end.getTime() - now.getTime();
            const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            const hours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
            if (days >= 1) {
              setTrialDaysLeft(days);
            } else {
              setTrialDaysLeft(hours / 24);
            }
          }
        }
      })
      .catch(() => {});
  }, [session]);

  const handlePurchase = async (plan: "monthly" | "lifetime") => {
    if (!session) {
      router.push("/auth");
      return;
    }

    setPaying(true);
    try {
      const token = session.access_token;
      let orderData: any = {};
      
      if (plan === "monthly") {
        // 1a. Create Subscription on backend
        const orderRes = await fetch(`${API_BASE}/payment/create-subscription`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planType: plan }),
        });
        if (!orderRes.ok) throw new Error((await orderRes.json()).detail || "Failed to create subscription");
        orderData = await orderRes.json();
      } else {
        // 1b. Create Order on backend
        const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planType: plan }),
        });
        if (!orderRes.ok) throw new Error((await orderRes.json()).detail || "Failed to create order");
        orderData = await orderRes.json();
      }

      // 2. Initialize Razorpay Checkout
      const options: any = {
        key: orderData.key_id,
        name: "TileMaster Pro",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment/Subscription
            const verifyEndpoint = plan === "monthly" ? "/payment/verify-subscription" : "/payment/verify";
            const verifyPayload = plan === "monthly" ? {
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: plan,
            } : {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: plan,
            };

            const verifyRes = await fetch(`${API_BASE}${verifyEndpoint}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(verifyPayload),
            });

            if (!verifyRes.ok) throw new Error((await verifyRes.json()).detail || "Verification failed");

            alert("Payment successful! Your plan is now active.");
            window.location.href = "/";
          } catch (err: any) {
            console.error(err);
            alert("Payment verification failed: " + err.message);
          }
        },
        prefill: { email: session.user?.email || "" },
        theme: { color: "#3b82f6" },
      };

      if (plan === "monthly") {
        options.subscription_id = orderData.subscription_id;
      } else {
        options.order_id = orderData.order_id;
        options.amount = orderData.amount;
        options.currency = orderData.currency;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      alert("Error initiating payment: " + err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-5xl w-full">
        {showExpiredBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-start gap-3 shadow-lg"
          >
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-slate-50 font-bold text-sm mb-1">
                Your free trial has ended
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Your 3-day free trial has expired. Please choose a plan below
                to continue using TileMaster Pro and unlock all 3D tools,
                calculators, and premium features.
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
        {timeLeft !== null && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-pulse"
          >
            <Timer className="w-5 h-5" />
            Lifetime Deal expires in: {Math.floor(timeLeft / 3600).toString().padStart(2, '0')}:
            {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:
            {(timeLeft % 60).toString().padStart(2, '0')}
          </motion.div>
        )}

        <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tight text-white drop-shadow-xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg font-light">
            Choose the plan that fits your business. No hidden fees, no
            surprises.
          </p>

          {currentPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm shadow-sm"
            >
              <Crown className="w-4 h-4" />
              <span className="font-semibold capitalize text-slate-50">
                {currentPlan === "trial" ? "Free Trial" : currentPlan}
              </span>
              {currentPlan === "trial" && trialDaysLeft !== null && (
                <span className="text-slate-400">
                  — {trialDaysLeft < 1
                    ? `${Math.round(trialDaysLeft * 60)} min`
                    : `${Math.ceil(trialDaysLeft)} day${Math.ceil(trialDaysLeft) !== 1 ? "s" : ""}`}{" "}
                  left
                </span>
              )}
            </motion.div>
          )}

          {session && !currentPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm shadow-sm"
            >
              <Clock className="w-4 h-4" />
              <span className="font-semibold text-slate-50">3-Day Free Trial</span>
              <span className="text-slate-400">— start exploring now</span>
            </motion.div>
          )}
        </motion.div>

        <div className={`grid gap-8 max-w-4xl mx-auto items-stretch ${remainingSlots !== null && remainingSlots <= 0 ? "grid-cols-1 max-w-md" : "md:grid-cols-2"}`}>
          {plans
            .filter((plan) => {
              if (plan.planKey === "lifetime" && remainingSlots !== null && remainingSlots <= 0) {
                return false;
              }
              return true;
            })
            .map((plan, idx) => {
              const Icon = plan.icon;
              const isSelected =
                (plan.planKey === "monthly" && selected === "monthly") ||
                (plan.planKey === "lifetime" && selected === "lifetime");

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className={`relative rounded-3xl border p-8 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between border-slate-700 bg-slate-800/40 hover:border-blue-500/40 ${
                    isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900" : ""
                  }`}
                  onClick={() => setSelected(plan.planKey)}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-50 font-space-grotesk">
                          {plan.name}
                        </h2>
                      </div>

                      {plan.planKey === "lifetime" && remainingSlots !== null && (
                        <span className="bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-red-500/20 animate-pulse">
                          {remainingSlots} slots left!
                        </span>
                      )}
                    </div>

                    <div className="mb-6">
                      <span className="text-4xl font-extrabold text-slate-50 font-space-grotesk">
                        ₹{plan.price}
                      </span>
                      <span className="text-slate-400 text-sm ml-1.5 font-light">
                        {plan.period}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm mb-6 font-light">
                      {plan.description}
                    </p>

                    {plan.planKey === "lifetime" && (
                      <p className="text-blue-400 text-xs font-semibold mb-6 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl w-fit">
                        🚀 Launching offer for the first 10 customers only
                      </p>
                    )}

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-slate-300 font-light"
                        >
                          <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handlePurchase(plan.planKey)}
                    disabled={paying}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
                  >
                    {paying && selected === plan.planKey
                      ? "Processing..."
                      : plan.cta}
                  </button>
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading pricing...</div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
