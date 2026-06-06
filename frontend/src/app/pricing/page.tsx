"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, Clock, Crown } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/utils/auth";
import { useRouter, useSearchParams } from "next/navigation";

const plans = [
  {
    name: "Monthly",
    price: "2,199",
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

declare global {
  interface Window {
    // Razorpay: any;  // Razorpay temporarily disabled
  }
}

export default function PricingPage() {
  const [selected, setSelected] = useState<"monthly" | "lifetime" | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showExpiredBanner = searchParams.get("reason") === "expired";
  const { data: session } = authClient.useSession();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  useEffect(() => {
    if (!session) return;

    const token = getToken();
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

  // const waitForRazorpay = (): Promise<boolean> => {
  //   return new Promise((resolve) => {
  //     if (typeof window !== "undefined" && window.Razorpay) {
  //       resolve(true);
  //       return;
  //     }
  //     let attempts = 0;
  //     const interval = setInterval(() => {
  //       attempts++;
  //       if (window.Razorpay) {
  //         clearInterval(interval);
  //         resolve(true);
  //       } else if (attempts > 30) {
  //         clearInterval(interval);
  //         resolve(false);
  //       }
  //     }, 200);
  //   });
  // };

  // const handlePurchase = async (plan: "monthly" | "lifetime") => {
  //   if (!session) {
  //     router.push("/auth");
  //     return;
  //   }

  //   setPaying(true);
  //   const token = getToken();

  //   if (!token) {
  //     alert("Session expired. Please log in again.");
  //     setPaying(false);
  //     router.push("/auth");
  //     return;
  //   }

  //   const rzpReady = await waitForRazorpay();
  //   if (!rzpReady) {
  //     alert("Razorpay failed to load. Please refresh the page and try again.");
  //     setPaying(false);
  //     return;
  //   }

  //   try {
  //     const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ planType: plan }),
  //     });

  //     if (!orderRes.ok) {
  //       const err = await orderRes.json();
  //       throw new Error(err.detail || `Failed to create order (${orderRes.status})`);
  //     }

  //     const order = await orderRes.json();

  //     const options = {
  //       key: order.key_id,
  //       amount: order.amount,
  //       currency: order.currency,
  //       name: "TileMaster Pro",
  //       description: `${plan === "monthly" ? "Monthly" : "Lifetime"} Plan`,
  //       order_id: order.order_id,
  //       handler: async (response: any) => {
  //         try {
  //           const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //               Authorization: `Bearer ${token}`,
  //             },
  //             body: JSON.stringify({
  //               razorpay_order_id: response.razorpay_order_id,
  //               razorpay_payment_id: response.razorpay_payment_id,
  //               razorpay_signature: response.razorpay_signature,
  //               plan_type: plan,
  //             }),
  //           });

  //           if (verifyRes.ok) {
  //             alert(
  //               `${plan === "monthly" ? "Monthly" : "Lifetime"} plan activated!`
  //             );
  //             router.push("/");
  //             router.refresh();
  //           } else {
  //             const err = await verifyRes.json();
  //             alert(err.detail || "Payment verification failed.");
  //           }
  //         } catch {
  //           alert("Payment verification failed.");
  //         } finally {
  //           setPaying(false);
  //         }
  //       },
  //       prefill: {
  //         name: session.user.name,
  //         email: session.user.email,
  //       },
  //       theme: {
  //         color: "#f59e0b",
  //       },
  //       modal: {
  //         ondismiss: () => {
  //           setPaying(false);
  //         },
  //       },
  //     };

  //     const rzp = new window.Razorpay(options);
  //     rzp.on("payment.failed", (response: any) => {
  //       alert(`Payment failed: ${response.error.description || "Unknown error"}`);
  //       setPaying(false);
  //     });
  //     rzp.open();
  //   } catch (e: any) {
  //     alert(e.message || "Failed to initiate payment.");
  //     setPaying(false);
  //   }
  // };

  const handlePurchase = async (plan: "monthly" | "lifetime") => {
    if (!session) {
      router.push("/auth");
      return;
    }
    alert(`Payment integration is coming soon. Plan: ${plan}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-5xl w-full">
        {showExpiredBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-amber-950/40 border border-red-500/30 flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 flex-shrink-0">
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-300 font-bold text-sm mb-1">
                Your free trial has ended
              </h3>
              <p className="text-red-200/80 text-xs leading-relaxed">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Choose the plan that fits your business. No hidden fees, no
            surprises.
          </p>

          {currentPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm"
            >
              <Crown className="w-4 h-4" />
              <span className="font-semibold capitalize">
                {currentPlan === "trial" ? "Free Trial" : currentPlan}
              </span>
              {currentPlan === "trial" && trialDaysLeft !== null && (
                <span className="text-primary/70">
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
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm"
            >
              <Clock className="w-4 h-4" />
              <span className="font-semibold">3-Day Free Trial</span>
              <span className="text-amber-400/70">— start exploring now</span>
            </motion.div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const isSelected =
              (idx === 0 && selected === "monthly") ||
              (idx === 1 && selected === "lifetime");

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className={`relative rounded-2xl border p-8 transition-all duration-300 cursor-pointer ${
                  idx === 1
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                } ${isSelected ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelected(plan.planKey)}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2.5 rounded-xl ${
                      idx === 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {plan.name}
                  </h2>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">
                    ₹{plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1.5">
                    {plan.period}
                  </span>
                </div>

                <p className="text-muted-foreground text-sm mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-foreground/80"
                    >
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.planKey)}
                  disabled={paying}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    idx === 1
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                  }`}
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
