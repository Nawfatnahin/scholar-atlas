"use client";

import { useState } from "react";
import { 
  UserCheck, 
  ShieldCheck, 
  Mail, 
  Plus, 
  Crown, 
  Edit3, 
  Check, 
  X, 
  ArrowLeft,
  Users,
  Bell,
  Search,
  Activity,
  Trash2
} from "lucide-react";
import { toggleProStatus, deleteSubscription } from "./actions";
import { toast } from "sonner";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Subscription {
  id: string;
  email: string;
  plan: string;
  premium_until?: string | null;
  created_at: string;
}

export default function AdminPanel({ initialSubscriptions, ownerEmail }: { initialSubscriptions: Subscription[], ownerEmail: string }) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions || []);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [adminName, setAdminName] = useState(ownerEmail.split('@')[0]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(adminName);

  // Dynamic calculations with safety checks
  const totalGmails = (subscriptions || []).length;
  const isActuallyPro = (s: Subscription) => s.plan === 'pro' && (!s.premium_until || new Date(s.premium_until) > new Date());
  const premiumCount = (subscriptions || []).filter(isActuallyPro).length;
  
  // Dynamic Activity: Get actual users sorted by creation date (newest first)
  const recentUsers = [...(subscriptions || [])]
    .filter(s => s.email !== ownerEmail)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5); // Show last 5 signups

  const handleTogglePro = async (email: string, currentPlan: string) => {
    const isPro = currentPlan === 'pro';
    try {
      let durationMonths: number | null = null;
      if (!isPro) {
        const val = window.prompt("Enter duration in months (leave empty for unlimited):", "1");
        if (val === null) return;
        if (val.trim() !== "") {
          durationMonths = parseInt(val, 10);
          if (isNaN(durationMonths) || durationMonths <= 0) {
            toast.error("Invalid duration");
            return;
          }
        }
      }

      await toggleProStatus(email, !isPro, durationMonths);

      let premium_until = null;
      if (!isPro && durationMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() + durationMonths);
        premium_until = d.toISOString();
      }

      setSubscriptions(subscriptions.map(s => s.email === email ? { ...s, plan: !isPro ? 'pro' : 'free', premium_until } : s));
      toast.success(`${email} is now ${!isPro ? 'Pro' : 'Free'}. They may need to refresh their page to see the changes.`);
    } catch {
      toast.error("Failed to update status. Ensure you have the necessary database permissions.");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      const val = window.prompt("Enter duration in months (leave empty for unlimited):", "1");
      if (val === null) return;
      
      let durationMonths: number | null = null;
      if (val.trim() !== "") {
        durationMonths = parseInt(val, 10);
        if (isNaN(durationMonths) || durationMonths <= 0) {
          toast.error("Invalid duration");
          return;
        }
      }

      await toggleProStatus(newEmail, true, durationMonths);
      
      let premium_until = null;
      if (durationMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() + durationMonths);
        premium_until = d.toISOString();
      }

      if (!subscriptions.find(s => s.email === newEmail.toLowerCase())) {
        const newUser = { id: Math.random().toString(), email: newEmail.toLowerCase(), plan: 'pro', premium_until, created_at: new Date().toISOString() };
        setSubscriptions([newUser, ...subscriptions]);
      } else {
        setSubscriptions(subscriptions.map(s => s.email === newEmail.toLowerCase() ? { ...s, plan: 'pro', premium_until } : s));
      }
      setNewEmail("");
      setIsAdding(false);
      toast.success(`${newEmail} added as Pro. They may need to refresh their page.`);
    } catch {
      toast.error("Failed to add user. Ensure you are authorized and the database is reachable.");
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Are you sure you want to delete ${email} from the subscription database? This cannot be undone.`)) {
      return;
    }
    try {
      const result = await deleteSubscription(email);
      if (result && !result.success) {
        toast.error(`Failed: ${result.error || 'Unknown error'}`);
        return;
      }
      setSubscriptions(subscriptions.filter(s => s.email !== email));
      toast.success(`${email} deleted successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to delete ${email}: ${errorMessage || 'Error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-warm flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      
      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-orange-50 sticky top-0 z-40 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <Crown className="text-white w-6 h-6" />
          </Link>
          <span className="font-display font-black text-xl text-ink tracking-tight hidden sm:block">Admin<span className="text-orange-500">Buddy</span></span>
        </div>

        <div className="flex-1 max-w-xl hidden md:flex relative ml-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search users, transactions, logs..." 
            className="w-full pl-12 pr-6 py-2.5 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-6">
          <button className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-50 relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
          </button>
          <div className="h-8 w-[1px] bg-stone-100 hidden sm:block" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-ink leading-none">{adminName}</p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Super Admin</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-white shadow-md flex items-center justify-center text-orange-600 font-black text-lg overflow-hidden">
              {adminName[0]}
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 lg:p-12 max-w-[1600px] mx-auto w-full space-y-12">
        
        {/* Hero Welcome Card */}
        <section className="relative group overflow-hidden rounded-[40px]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#fff9f0] to-[#fff3e0]" />
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-500/5 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full" />
          
          <div className="relative p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-[0.2em] border border-green-100">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Authenticated Session
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-black text-ink tracking-tight flex flex-wrap items-center gap-x-4 justify-center md:justify-start">
                  Welcome back, 
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-white border-b-4 border-orange-500 focus:outline-none px-4 py-1 text-orange-600 w-full max-w-[200px]"
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setAdminName(tempName); setIsEditingName(false); }} className="p-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors"><Check className="w-4 h-4"/></button>
                        <button onClick={() => { setTempName(adminName); setIsEditingName(false); }} className="p-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"><X className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-orange-500 italic relative group/name">
                      {adminName}
                      <button onClick={() => setIsEditingName(true)} className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/name:opacity-100 transition-opacity p-2 rounded-lg bg-orange-50 text-orange-400 hover:text-orange-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </h1>
                <p className="text-stone-500 font-medium text-lg max-w-2xl leading-relaxed">
                  Thank you for your incredible leadership and vision. Under your guidance, BackLogger Buddy continues to empower students to conquer their academic challenges. Your dedication to building a better tool for the community is truly inspiring. Let&apos;s keep pushing the boundaries of what&apos;s possible!
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link href="/dashboard" className="px-6 py-3 bg-ink text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-[40px] bg-gradient-to-br from-orange-400 to-amber-600 shadow-[0_30px_60px_-10px_rgba(249,115,22,0.4)] flex items-center justify-center border-[8px] border-white relative z-10 animate-float">
                <Crown className="w-24 h-24 text-white drop-shadow-2xl" />
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-orange-50">
                  <div className="w-12 h-1 bg-green-500 rounded-full mb-1" />
                  <div className="w-8 h-1 bg-green-200 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Shimmer overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-[100%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="bg-white rounded-[32px] p-10 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.05)] border border-orange-50/50 hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.15)] hover:-translate-y-2 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Users className="w-8 h-8" />
              </div>
              <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-blue-50 text-blue-600">
                TOTAL REGISTERED
              </div>
            </div>
            <div>
              <p className="text-stone-400 font-bold text-sm uppercase tracking-[0.2em] mb-1">Total Users (Gmails)</p>
              <p className="text-5xl font-black text-ink tracking-tighter">{totalGmails}</p>
            </div>
            <div className="mt-8 flex items-end gap-1.5 h-12">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors" style={{ height: `${20 + Math.random() * 80}%` }} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-10 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.05)] border border-orange-50/50 hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.15)] hover:-translate-y-2 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-600">
                <Crown className="w-8 h-8" />
              </div>
              <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-orange-50 text-orange-600">
                PREMIUM ACTIVE
              </div>
            </div>
            <div>
              <p className="text-stone-400 font-bold text-sm uppercase tracking-[0.2em] mb-1">Premium Members</p>
              <p className="text-5xl font-black text-ink tracking-tighter">{premiumCount}</p>
            </div>
            <div className="mt-8 flex items-end gap-1.5 h-12">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors" style={{ height: `${20 + Math.random() * 80}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Owner Profile */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Owner Profile Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.05)] border border-orange-50/50 relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-2xl rounded-full -mr-16 -mt-16" />
              <div className="relative space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-black text-2xl text-ink">Owner Profile</h2>
                  <ShieldCheck className="text-orange-500 w-8 h-8" />
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-inner">
                    <UserCheck className="w-10 h-10 text-orange-600" />
                  </div>
                  <div>
                    <div className="px-3 py-1 bg-orange-500 text-white rounded-full text-[8px] font-black uppercase tracking-[0.3em] inline-block mb-2">System Master</div>
                    <p className="text-xl font-black text-ink truncate max-w-[180px]">{ownerEmail}</p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-100 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Full Control Protocol Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Activity (Dynamic Signups) */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-10 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.05)] border border-orange-50/50 h-full">
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-display font-black text-2xl text-ink">Recent Account Signups</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Live Updates</span>
                </div>
              </div>

              <div className="space-y-8 relative">
                <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-orange-50" />
                
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex gap-6 relative z-10 group">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl bg-white border-2 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110",
                      user.plan === 'pro' ? "border-orange-200" : "border-stone-100"
                    )}>
                      {user.plan === 'pro' ? (
                        <Crown className="w-6 h-6 text-orange-500" />
                      ) : (
                        <Mail className="w-6 h-6 text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-ink tracking-tight flex items-center gap-3">
                            {user.email}
                            {user.plan === 'pro' && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-black uppercase rounded-md tracking-widest">PRO</span>
                            )}
                          </p>
                          <p className="text-sm text-stone-500 font-medium">New account created via Google Auth</p>
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-lg">
                          {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {recentUsers.length === 0 && (
                  <div className="py-20 text-center opacity-30">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                    <p className="font-black uppercase tracking-widest text-xs">No recent signups</p>
                  </div>
                )}
              </div>

              <div className="mt-12 p-8 bg-stone-50 rounded-[32px] border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <Activity className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-black text-ink text-sm">Real-time Pulse</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Tracking User Registrations</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1.5 bg-orange-500 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 30}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Database */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-4">
            <div className="space-y-1">
              <h2 className="font-display font-black text-3xl text-ink tracking-tight">Subscription Database</h2>
              <p className="text-stone-500 font-medium">Manage user access and subscription tiers.</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                <input type="text" placeholder="Filter users..." className="w-full pl-10 pr-4 py-3 bg-white border border-stone-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-100" />
              </div>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 font-black text-xs uppercase tracking-widest whitespace-nowrap"
              >
                <Plus className={cn("w-4 h-4 transition-transform", isAdding && "rotate-45")} />
                {isAdding ? 'Cancel' : 'Add User'}
              </button>
            </div>
          </div>

          {isAdding && (
            <form onSubmit={handleAddUser} className="relative group animate-in slide-in-from-top-4 duration-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-500 rounded-[32px] blur opacity-20" />
              <div className="relative bg-white p-8 rounded-[32px] border border-orange-100 shadow-xl flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" />
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter user email..."
                    className="w-full pl-16 pr-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all font-bold"
                    required
                  />
                </div>
                <button type="submit" className="px-10 py-4 bg-ink text-white rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all uppercase tracking-widest text-xs">
                  Grant Pro Access
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-[40px] overflow-hidden shadow-[0_10px_30px_-10px_rgba(249,115,22,0.05)] border border-orange-50/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/30 border-b border-orange-50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-900/50">User Profile</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-900/50">Subscription Tier</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-900/50">Joined Date</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-900/50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscriptions || []).filter(s => s.email !== ownerEmail).map((s, idx) => (
                    <tr key={s.id} className={cn("group hover:bg-orange-50/20 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-[#fffdfa]")}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center font-black text-stone-400 group-hover:scale-110 transition-transform">
                            {s.email[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-ink truncate max-w-[200px]">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                          isActuallyPro(s) 
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" 
                            : "bg-stone-100 text-stone-500"
                        )}>
                          {isActuallyPro(s) ? <Crown className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full bg-stone-300" />}
                          {isActuallyPro(s) ? 'Premium' : 'Free'}
                        </div>
                        {isActuallyPro(s) && s.premium_until && (
                          <div className="text-[10px] text-orange-500/80 font-bold mt-1.5 uppercase tracking-widest pl-1">
                            Ends: {new Date(s.premium_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                        {s.plan === 'pro' && !isActuallyPro(s) && (
                          <div className="text-[10px] text-red-500/80 font-bold mt-1.5 uppercase tracking-widest pl-1">
                            Expired
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-stone-500">
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleTogglePro(s.email, s.plan)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              s.plan === 'pro'
                                ? "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                                : "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white"
                            )}
                          >
                            {s.plan === 'pro' ? 'Revoke' : 'Upgrade'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(s.email)}
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(subscriptions || []).filter(s => s.email !== ownerEmail).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <Mail className="w-16 h-16 text-stone-300" />
                          <p className="font-black text-xl uppercase tracking-widest">Database Empty</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-6 bg-stone-50/50 border-t border-orange-50 flex items-center justify-between">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Showing {((subscriptions || []).length - 1) < 0 ? 0 : ((subscriptions || []).length - 1)} users</p>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg border border-stone-200 text-stone-400 disabled:opacity-50" disabled>Previous</button>
                <button className="p-2 rounded-lg border border-stone-200 text-ink">Next</button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
