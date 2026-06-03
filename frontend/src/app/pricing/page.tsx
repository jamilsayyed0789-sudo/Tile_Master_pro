"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, Clock } from 'lucide-react';

const LAUNCH_DATE = new Date('2026-07-01T00:00:00');

function getDaysRemaining(): number {
  const now = new Date();
  const diff = LAUNCH_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const plans = [
  {
    name: "Monthly",
    price: "2,500",
    period: "/month",
    description: "Perfect for getting started with full access.",
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
    price: "16,000",
    period: "one-time",
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

export default function PricingPage() {
  const [selected, setSelected] = useState<'monthly' | 'lifetime' | null>(null);
  const [daysLeft, setDaysLeft] = useState(getDaysRemaining());

  useEffect(() => {
    setDaysLeft(getDaysRemaining());
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-5xl w-full">
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
            Choose the plan that fits your business. No hidden fees, no surprises.
          </p>

          {daysLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm"
            >
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{daysLeft} days</span>
              <span className="text-amber-400/70">remaining — launch offer ends soon</span>
            </motion.div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const isSelected =
              (idx === 0 && selected === 'monthly') ||
              (idx === 1 && selected === 'lifetime');

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className={`relative rounded-2xl border p-8 transition-all duration-300 cursor-pointer ${
                  idx === 1
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelected(idx === 0 ? 'monthly' : 'lifetime')}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2.5 rounded-xl ${idx === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">₹{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1.5">{plan.period}</span>
                </div>

                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    idx === 1
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                      : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>


      </div>
    </div>
  );
}
