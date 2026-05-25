"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Heart, Send, Loader2 } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";

export default function Pricing() {
  const { user, isPro, isAdmin, loading } = useSubscription();

  // Task 1: Waitlist states
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Waitlist error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section id="pricing" className="py-[140px] bg-transparent overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-8 animate-pulse">
          <div className="h-10 w-32 bg-stone-200 rounded-full mx-auto mb-10" />
          <div className="h-16 w-3/4 bg-stone-200 rounded-2xl mx-auto mb-6" />
          <div className="h-6 w-1/2 bg-stone-200 rounded-xl mx-auto mb-14" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[860px] mx-auto">
            <div className="h-[500px] bg-stone-100 rounded-[24px]" />
            <div className="h-[500px] bg-stone-100 rounded-[24px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-[140px] bg-transparent overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="text-center mb-10">

        </div>
        
        <h2 className="font-display text-[32px] sm:text-[40px] lg:text-[56px] font-extrabold leading-[1.1] tracking-tight text-ink text-center mb-6">
          {isPro ? (
            isAdmin ? (
              <>You&apos;re the <span className="text-accent">boss</span>.</>
            ) : (
              <>You&apos;re a <span className="text-accent">legend</span>.</>
            )
          ) : (
            <>Simple pricing for <span className="text-accent">students</span>.</>
          )}
        </h2>
        
        <p className="text-[18px] text-ink-2 text-center max-w-[520px] mx-auto mb-14 leading-[1.65]">
          {isPro 
            ? (isAdmin ? "Welcome back, Chief. You have absolute power over the buddy's ecosystem." : "Your support fuels our mission to help students succeed. Thank you for being part of the family.")
            : "Start free. Upgrade when you need more. No confusing tiers, no hidden fees."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-[1000px] mx-auto items-stretch">
          {/* Left Side: Thank you (Pro) or Free Plan */}
          {isPro ? (
            <div className="relative group perspective-1000">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-12 rounded-[32px] bg-white border border-amber-500/20 shadow-[0_20px_50px_rgba(146,64,14,0.15)] flex flex-col items-center justify-center text-center space-y-8 min-h-[500px] transition-all duration-500 transform-gpu group-hover:-translate-y-3 group-hover:rotate-1 group-hover:shadow-[0_40px_80px_rgba(146,64,14,0.25)]">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Heart className="w-12 h-12 text-orange-500 fill-orange-500 animate-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black uppercase tracking-widest">
                    {isAdmin ? "Super Admin" : "Elite Status"}
                  </div>
                  <h3 className="font-display text-[32px] font-black text-ink leading-tight">
                    {isAdmin ? "Ultimate" : "Infinite"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">{isAdmin ? "Control" : "Gratitude"}</span>
                  </h3>
                  <p className="text-[16px] text-ink-2 font-medium leading-relaxed max-w-[320px] mx-auto">
                    {isAdmin 
                      ? "Full system overrides active. Your vision drives this project forward every single day."
                      : "Thank you for being a Premium member! Your support fuels our innovation and keeps the buddy growing every day."}
                  </p>
                </div>
                <div className="flex gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-amber-200 group-hover:bg-amber-400 group-hover:scale-125 transition-all duration-500" style={{ transitionDelay: `${i * 100}ms` }} />
                  ))}
                </div>
                
                {/* 3D Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl animate-pulse delay-700"></div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-9 rounded-[24px] border-2 border-accent-premium relative shadow-[0_20px_40px_-10px_rgba(193,154,107,0.2)] transition-all duration-400 hover:-translate-y-2 hover:border-amber-500 hover:shadow-[0_0_10px_rgba(245,158,11,0.4),0_0_20px_rgba(245,158,11,0.2),0_30px_50px_-10px_rgba(193,154,107,0.3)]">
              <div className="font-display text-[15px] font-bold tracking-wide mb-3">Free</div>
              <div className="font-display text-[32px] sm:text-[40px] font-extrabold tracking-tight text-ink leading-none mb-1.5">$0 / 0 BDT</div>
              <div className="text-[13px] text-ink-3 mb-7">forever · no credit card</div>
              <div className="h-px bg-border-strong mb-6"></div>
              <ul className="list-none space-y-0 mb-7">
                {[
                  { text: "5 PDF operations per month", helper: "(1 operation = 1 merge, split, or convert action)" },
                  { text: "Up to 10 subjects" },
                  { text: "Unlimited attendance records" },
                  { text: "Up to 20 active tasks" }
                ].map((f, i) => (
                  <li key={i} className="py-2 border-b border-border-subtle last:border-0">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-[14px] text-ink-2">{f.text}</span>
                    </div>
                    {f.helper && (
                      <div className="text-[11px] text-ink-3 ml-6.5 mt-0.5">{f.helper}</div>
                    )}
                  </li>
                ))}
              </ul>
              <Link 
                href={user ? "/dashboard" : "/signup"} 
                className="block text-center w-full bg-white border border-border-strong text-ink font-body text-[14px] font-bold p-3.5 rounded-xl transition-all hover:bg-bg hover:border-black/20"
              >
                {user ? "Go to Dashboard" : "Get started free"}
              </Link>
            </div>
          )}

          {/* Pro Plan */}
          <div className={cn(
            "p-9 rounded-[24px] bg-ink border transition-all duration-400 hover:-translate-y-2 relative overflow-hidden",
            isPro 
              ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]" 
              : "border-ink shadow-[0_20px_30px_-10px_rgba(0,0,0,0.3)] hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.6),0_0_30px_rgba(59,130,246,0.3),0_20px_30px_-10px_rgba(0,0,0,0.5)]"
          )}>
            <div className="inline-block bg-accent text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-5 shadow-[0_2px_4px_rgba(43,43,43,0.3)]">
              {isPro ? "Your Current Plan" : "Most popular"}
            </div>
            <div className="font-display text-[15px] font-bold tracking-wide mb-3 text-white/60">Pro</div>
            <div className="font-display text-[32px] sm:text-[40px] font-extrabold tracking-tight text-white leading-none mb-1.5">$1.99 / 239 BDT</div>
            <div className="text-[13px] text-white/50 mb-7">per month · billed yearly</div>
            <div className="h-px bg-white/10 mb-6"></div>
            <ul className="list-none space-y-0 mb-7">
              {[
                "Unlimited PDF operations",
                "Unlimited subjects",
                "Unlimited attendance records",
                "Unlimited tasks",
                "Priority processing speed",
                "Early access to new features"
              ].map((f, i) => (
                <li key={i} className="text-[14px] py-2 flex items-center gap-2.5 text-white/75 border-b border-white/10 last:border-0">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Link 
                href="/dashboard" 
                className="block text-center w-full bg-ink border-2 border-amber-500 text-white font-body text-[15px] font-black p-4 rounded-xl transition-all hover:bg-amber-500 hover:text-ink hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                Go to Dashboard
              </Link>
            ) : isSubmitted ? (
              <div className="bg-white/10 border border-white/20 p-4 rounded-xl text-center animate-in zoom-in-95 duration-300">
                <p className="text-[13px] font-bold text-white">You&apos;re on the list! 🎉</p>
                <p className="text-[11px] text-white/60 mt-1">We&apos;ll notify you when Pro launches.</p>
              </div>
            ) : isWaitlistOpen ? (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-[14px] px-4 py-3 rounded-xl focus:outline-none focus:border-white/40 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="absolute right-2 top-2 bottom-2 bg-white text-ink px-3 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-ink" /> : <Send className="w-4 h-4 text-ink" />}
                  </button>
                </div>
                <p className="text-[10px] text-white/40 text-center uppercase tracking-widest font-black">Notify Me</p>
              </form>
            ) : (
              <button 
                onClick={() => setIsWaitlistOpen(true)}
                className="block text-center w-full bg-white text-ink font-body text-[14px] font-bold p-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Join Waitlist
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}
