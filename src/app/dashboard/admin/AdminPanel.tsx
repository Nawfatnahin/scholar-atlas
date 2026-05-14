"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Plus, 
  Crown, 
  ArrowLeft,
  Users,
  Search,
  Trash2,
  Monitor,
  Database,
  Zap,
  Cpu,
  Globe,
  Radar,
  ArrowRight,
  Settings,
  Sparkles,
  Activity as ActivityIcon
} from "lucide-react";
import { toggleProStatus, deleteSubscription } from "./actions";
import { toast } from "sonner";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getJarvisMessage } from "./jarvis-utils";

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
  const [adminName] = useState(ownerEmail.split('@')[0]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [jarvisMessage, setJarvisMessage] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Dynamic calculations
  const totalGmails = (subscriptions || []).length;
  const isActuallyPro = (s: Subscription) => s.plan === 'pro' && (!s.premium_until || new Date(s.premium_until) > new Date());
  const premiumCount = (subscriptions || []).filter(isActuallyPro).length;

  useEffect(() => {
    setMounted(true);
    
    // Determine activity level
    let activityLevel: 'high' | 'idle' | 'normal' = 'normal';
    if (totalGmails > 100) activityLevel = 'high';
    else if (totalGmails < 10) activityLevel = 'idle';
    
    const message = getJarvisMessage(activityLevel);
    setJarvisMessage(message);

    // Typing effect simulation
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 2000);
    return () => clearTimeout(timer);
  }, [totalGmails]);
  
  // Filtering
  const filteredSubscriptions = subscriptions
    .filter(s => s.email !== ownerEmail)
    .filter(s => s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Recent Logins
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const recentLogins = [...(subscriptions || [])]
    .filter(s => new Date(s.created_at) > threeDaysAgo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

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
      toast.success(`${email} matrix updated.`);
    } catch {
      toast.error("Failed to update account.");
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

      const newUser = { id: Math.random().toString(), email: newEmail.toLowerCase(), plan: 'pro', premium_until, created_at: new Date().toISOString() };
      setSubscriptions(prev => [newUser, ...prev.filter(s => s.email !== newEmail.toLowerCase())]);
      
      setNewEmail("");
      setIsAdding(false);
      toast.success(`${newEmail} authorized.`);
    } catch {
      toast.error("Authorization failed.");
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Remove account ${email}?`)) return;
    try {
      const result = await deleteSubscription(email);
      if (result && !result.success) {
        toast.error(`Error: ${result.error}`);
        return;
      }
      setSubscriptions(subscriptions.filter(s => s.email !== email));
      toast.success(`${email} offline.`);
    } catch {
      toast.error(`Critical error.`);
    }
  };

  if (!mounted) return null;

  return (
    <div className="jarvis-theme min-h-screen overflow-x-hidden relative">
      
      {/* 3D Space Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Holographic Sticky Header */}
      <header className="h-28 border-b border-white/5 sticky top-0 z-50 px-8 flex items-center justify-between bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-12">
          <Link href="/dashboard" className="relative group perspective-1000 block">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transform group-hover:-translate-x-2 transition-all duration-500 hover:border-jarvis-accent/50 shadow-[0_0_30px_rgba(0,0,0,0.5)]" title="Back to Dashboard">
              <ArrowLeft className="text-jarvis-accent w-8 h-8 drop-shadow-[0_0:10px_rgba(34,211,238,0.8)]" />
            </div>
            <div className="absolute -inset-2 bg-jarvis-accent/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Link>
          
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-widest text-white  flex items-center gap-4 font-sans">
              <span className="bg-jarvis-accent text-black px-3 py-1 rounded-lg text-xl shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse">ADMIN</span>
              <span className="text-jarvis-accent">OS</span>
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
            </h1>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-12">
           <div className="relative w-96 group">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-jarvis-accent transition-colors" />
             <input 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Access user registry..."
               className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-14 pr-6 text-sm font-semibold tracking-normal outline-none focus:border-jarvis-accent/30 focus:bg-white/[0.08] transition-all text-white placeholder:text-white/10 font-sans"
             />
           </div>

           <div className="h-10 w-[1px] bg-white/10" />

           <div className="flex items-center gap-5 font-sans">
              <div className="text-right">
                <p className="text-xs text-white/20 font-semibold  tracking-normal mb-1">Authenticated</p>
                <button onClick={() => setIsEditingName(true)} className="text-lg font-semibold text-white hover:text-jarvis-accent transition-colors  tracking-tight flex items-center gap-3">
                  {adminName}
                  <Settings className="w-4 h-4 text-white/20" />
                </button>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-2xl flex items-center justify-center text-white font-semibold text-xl shadow-2xl overflow-hidden relative group/avatar">
                {adminName[0].toUpperCase()}
                <div className="absolute inset-0 bg-jarvis-accent/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
              </div>
           </div>
        </div>
      </header>

      <main className="p-8 lg:p-16 max-w-[1800px] mx-auto w-full space-y-20 relative z-10 font-sans">
        
        {/* Advanced 3D Stats Pedestals */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: 'Network Population', val: totalGmails, icon: Users, accent: 'cyan' },
             { label: 'Elite Sub-Nodes', val: premiumCount, icon: Crown, accent: 'amber' },
             { label: 'Uptime Matrix', val: '99.99%', icon: Globe, accent: 'blue' },
             { label: 'Security Shield', val: 'MAX', icon: ShieldCheck, accent: 'green' }
           ].map((stat, i) => (
             <div key={i} className="group relative">
                <div className="absolute inset-0 bg-jarvis-accent/5 blur-[40px] rounded-[40px] group-hover:bg-jarvis-accent/10 transition-all duration-700" />
                
                <div className="jarvis-box !p-8 backdrop-blur-3xl transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:border-jarvis-accent/30">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-jarvis-accent/40 transition-all">
                        <stat.icon className="w-6 h-6 text-white/60 group-hover:text-jarvis-accent transition-colors" />
                      </div>
                      <div className="text-[10px] font-bold text-jarvis-accent/40 tracking-widest uppercase">{stat.accent}.sys</div>
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{stat.label}</h4>
                      <p className="text-4xl font-bold text-white tracking-tighter group-hover:text-jarvis-accent transition-colors font-sans">{stat.val}</p>
                   </div>
                   <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-jarvis-accent/20 w-3/4 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                   </div>
                </div>
             </div>
           ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
           
           {/* Modern 3D Admin OS Sidebar */}
           <div className="xl:col-span-5 space-y-8 perspective-2000">
              
              {/* Buddy OS AI Assistant Card */}
              <div className="group relative transition-all duration-700 hover:translate-z-10 transform-gpu">
                 <div className="absolute -inset-1 bg-gradient-to-br from-jarvis-accent via-purple-500 to-blue-600 blur-2xl rounded-[40px] opacity-10 group-hover:opacity-30 transition-opacity animate-pulse-slow" />
                 
                 <div className="jarvis-box !p-12 !rounded-[50px] backdrop-blur-3xl border-jarvis-accent/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group-hover:border-jarvis-accent/40 transition-all duration-500">
                    {/* Glowing corner accents */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-jarvis-accent/20 rounded-tl-[50px] group-hover:border-jarvis-accent transition-colors" />
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-jarvis-accent/20 rounded-br-[50px] group-hover:border-jarvis-accent transition-colors" />
                    
                    <div className="relative space-y-10">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-jarvis-accent/10 border border-jarvis-accent/30 rounded-full flex items-center justify-center relative">
                                <Sparkles className="w-8 h-8 text-jarvis-accent animate-pulse" />
                                <div className="absolute inset-0 bg-jarvis-accent/20 blur-lg rounded-full animate-ping" />
                             </div>
                             <div>
                                <h2 className="text-2xl font-bold tracking-tight text-white group-hover:text-jarvis-accent transition-colors">Buddy OS</h2>
                                <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                                   <span className="text-xs font-bold uppercase tracking-widest text-white/40">Neural Sync: Online</span>
                                </div>
                             </div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-jarvis-accent/30 transition-colors">
                             <Cpu className="w-6 h-6 text-jarvis-accent animate-spin-slow" />
                          </div>
                       </div>

                       <div className="space-y-6 min-h-[220px]">
                          <div className="p-8 bg-black/40 border border-white/5 rounded-[32px] relative group-hover:border-jarvis-accent/20 transition-all">
                             <div className="absolute top-4 left-5 flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                             </div>
                             <div className="mt-4">
                                {isTyping ? (
                                   <div className="flex gap-1.5 items-center py-4">
                                      <div className="w-2 h-2 bg-jarvis-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                                      <div className="w-2 h-2 bg-jarvis-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                                      <div className="w-2 h-2 bg-jarvis-accent rounded-full animate-bounce" />
                                   </div>
                                ) : (
                                   <p className="text-lg font-medium text-white/90 leading-relaxed tracking-tight italic">
                                      &quot;{jarvisMessage}&quot;
                                   </p>
                                )}
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-5">
                             <div className="bg-white/5 border border-white/10 p-5 rounded-3xl group-hover:bg-jarvis-accent/5 transition-colors">
                                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1.5">Users</p>
                                <p className="text-3xl font-bold text-white">{totalGmails}</p>
                             </div>
                             <div className="bg-white/5 border border-white/10 p-5 rounded-3xl group-hover:bg-amber-500/5 transition-colors">
                                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1.5">Elite</p>
                                <p className="text-3xl font-bold text-amber-500">{premiumCount}</p>
                             </div>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs font-bold text-white/20 uppercase tracking-[0.2em]">
                             <span>System Status</span>
                             <span className="text-jarvis-accent">Nominal</span>
                          </div>
                          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-jarvis-accent shadow-[0_0_15px_#22d3ee] w-3/4 animate-shimmer" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Recessed Login Matrix (Session History) */}
              <div className="relative group perspective-1000 transform-gpu transition-all duration-700">
                 <div className="absolute inset-x-4 -bottom-4 h-full bg-jarvis-accent/5 blur-3xl rounded-[50px] pointer-events-none" />
                 
                 <div className="jarvis-box !p-8 !rounded-[40px] backdrop-blur-md shadow-2xl group-hover:border-jarvis-accent/20 transition-all duration-500">
                    <div className="flex items-center justify-between mb-8">
                       <div className="space-y-1">
                          <h3 className="text-base font-bold text-white flex items-center gap-3 tracking-tight font-sans">
                            <Radar className="w-5 h-5 text-jarvis-accent" />
                            Session<span className="text-jarvis-accent">_History</span>
                          </h3>
                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Temporal Log / 72.hrs</p>
                       </div>
                       <ActivityIcon className="w-4 h-4 text-white/10 group-hover:text-jarvis-accent transition-colors" />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       {recentLogins.map((user) => (
                         <div key={user.id} className="group/log relative p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 hover:border-jarvis-accent/20 transition-all duration-300">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white/20 group-hover/log:text-jarvis-accent transition-colors text-sm">
                                  {user.email[0].toUpperCase()}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white tracking-tight truncate font-sans">{user.email}</p>
                                  <p className="text-[10px] text-white/20 mt-0.5">{new Date(user.created_at).toLocaleDateString()}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs font-bold text-jarvis-accent font-sans">{new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  <span className="text-[8px] font-bold text-white/10 font-sans uppercase">GMT+6</span>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-jarvis-accent rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Active Link</span>
                       </div>
                       <button className="text-[10px] font-bold text-jarvis-accent hover:text-white transition-colors uppercase tracking-widest">Export Logs</button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Elevated Database Console */}
           <div className="xl:col-span-7 space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                 <div className="space-y-2">
                    <h2 className="text-4xl font-bold text-white tracking-tighter flex items-center gap-4 font-sans">
                       <Database className="w-10 h-10 text-jarvis-accent" />
                       User<span className="text-jarvis-accent">_Registry</span>
                    </h2>
                    <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Strategic Management of Student Accounts</p>
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute inset-0 bg-jarvis-accent/20 blur-2xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button 
                       onClick={() => setIsAdding(!isAdding)}
                       className="relative bg-white border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-3 group-hover:bg-jarvis-accent group-hover:border-jarvis-accent transition-all duration-500 shadow-xl"
                    >
                       <Plus className="w-4 h-4 text-black group-hover:rotate-90 transition-transform" />
                       <span className="text-black font-bold text-xs uppercase tracking-widest">Authorize Node</span>
                    </button>
                 </div>
              </div>

              {isAdding && (
                 <div className="relative animate-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-0 bg-jarvis-accent/10 blur-3xl rounded-[30px] pointer-events-none" />
                    <form onSubmit={handleAddUser} className="relative bg-white/[0.03] border border-jarvis-accent/20 p-8 rounded-[30px] backdrop-blur-2xl flex flex-col md:flex-row gap-4 shadow-2xl">
                       <div className="flex-1 relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-jarvis-accent/40 w-4 h-4" />
                          <input 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Input account email..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-14 pr-6 text-sm font-medium text-white outline-none focus:border-jarvis-accent focus:bg-white/10 transition-all font-sans"
                            required
                          />
                       </div>
                       <button type="submit" className="bg-jarvis-accent text-black px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-jarvis-accent/20 active:scale-95">
                          Provision Access
                       </button>
                    </form>
                 </div>
              )}

              {/* 3D Interactive Table Box */}
              <div className="relative group/matrix">
                 <div className="absolute -inset-4 bg-jarvis-accent/5 blur-[80px] rounded-[50px] pointer-events-none" />
                 
                 <div className="jarvis-box !p-0 !rounded-[40px] overflow-hidden backdrop-blur-3xl shadow-2xl group-hover/matrix:border-white/10 transition-all duration-700">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-white/[0.05] border-b border-white/5">
                                <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-widest text-jarvis-accent border-r border-white/5">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-jarvis-accent rounded-full shadow-[0_0_8px_#22d3ee]" />
                                      Identity
                                   </div>
                                </th>
                                <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-widest text-jarvis-accent border-r border-white/5">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-jarvis-accent rounded-full shadow-[0_0_8px_#22d3ee]" />
                                      Access
                                   </div>
                                </th>
                                <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-widest text-jarvis-accent border-r border-white/5">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-jarvis-accent rounded-full shadow-[0_0_8px_#22d3ee]" />
                                      Sync
                                   </div>
                                </th>
                                <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-widest text-jarvis-accent text-right">
                                   <div className="flex items-center justify-end gap-2">
                                      <div className="w-1.5 h-1.5 bg-jarvis-accent rounded-full shadow-[0_0_8px_#22d3ee]" />
                                      Overrides
                                   </div>
                                </th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04] font-sans">
                             {filteredSubscriptions.map((s) => (
                               <tr key={s.id} className="group/row hover:bg-white/[0.03] transition-all">
                                  <td className="px-10 py-8">
                                     <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white/20 group-hover/row:scale-110 group-hover/row:border-jarvis-accent/40 group-hover/row:text-jarvis-accent transition-all text-sm">
                                           {s.email[0].toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                           <p className="text-base font-bold text-white tracking-tight group-hover/row:text-jarvis-accent transition-colors font-sans">{s.email}</p>
                                           <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest flex items-center gap-2 font-sans">
                                              Verified Node
                                           </span>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-10 py-8">
                                     <div className={cn(
                                       "inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all font-sans",
                                       isActuallyPro(s) 
                                         ? "bg-jarvis-accent/10 border-jarvis-accent/30 text-jarvis-accent" 
                                         : "bg-white/5 border-white/10 text-white/20"
                                     )}>
                                        {isActuallyPro(s) ? <Zap className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                                        {isActuallyPro(s) ? 'Premium' : 'Standard'}
                                     </div>
                                  </td>
                                  <td className="px-10 py-8">
                                     <div className="space-y-2.5">
                                        <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                           <div className={cn("h-full transition-all duration-1000", isActuallyPro(s) ? "bg-jarvis-accent w-full shadow-[0_0_15px_#22d3ee]" : "bg-white/20 w-1/3")} />
                                        </div>
                                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest font-sans">Sync Active</p>
                                     </div>
                                  </td>
                                  <td className="px-10 py-8 text-right">
                                     <div className="flex items-center justify-end gap-5 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                        <div className="relative group/btn">
                                           <div className={cn("absolute inset-0 blur-xl opacity-0 group-hover/btn:opacity-60 transition-opacity", s.plan === 'pro' ? "bg-red-500" : "bg-jarvis-accent")} />
                                           <button 
                                              onClick={() => handleTogglePro(s.email, s.plan)}
                                              className={cn(
                                                "relative px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-90",
                                                s.plan === 'pro'
                                                  ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
                                                  : "bg-white text-black hover:bg-jarvis-accent"
                                              )}
                                           >
                                              {s.plan === 'pro' ? 'Downgrade' : 'Upgrade'}
                                           </button>
                                        </div>
                                        <button 
                                           onClick={() => handleDeleteUser(s.email)}
                                           className="p-2.5 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-75"
                                        >
                                           <Trash2 className="w-5 h-5" />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    {/* Matrix Controller Footer */}
                    <div className="px-10 py-8 bg-white/[0.02] border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                       <div className="flex items-center gap-6">
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{filteredSubscriptions.length} Active Node Fragments Identified</p>
                       </div>
                       
                       <div className="flex gap-3">
                          <button className="p-4 border border-white/10 rounded-xl text-white/20 hover:text-cyan-400 hover:border-cyan-400 transition-all"><ArrowLeft className="w-4 h-4" /></button>
                          <button className="px-6 py-4 border border-white/10 rounded-xl text-white/20 hover:text-cyan-400 hover:border-cyan-400 transition-all flex items-center gap-3 group">
                             <span className="text-[10px] font-bold uppercase tracking-widest">Next Matrix</span>
                             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </main>

      {/* Persistent System Overlay Icons Removed */}

      {/* 3D HUD Decorative Borders */}
      <div className="fixed top-0 left-0 w-64 h-64 pointer-events-none opacity-20 border-t-2 border-l-2 border-white/10 rounded-tl-[60px] m-8" />
      <div className="fixed bottom-0 right-0 w-64 h-64 pointer-events-none opacity-20 border-b-2 border-r-2 border-white/10 rounded-br-[60px] m-8" />

      {/* Industrial Grade Footer */}
      <footer className="mt-40 border-t border-white/5 py-16 px-12 flex flex-col md:flex-row items-center justify-between gap-10 opacity-30 hover:opacity-100 transition-all duration-700 bg-white/[0.01]">
         <div className="flex items-center gap-8">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center animate-spin-slow">
               <Cpu className="w-6 h-6 text-white/40" />
            </div>
            <div>
               <p className="text-sm font-semibold text-white  tracking-normal">Jarvis Protocol v4.0.8</p>
               <p className="text-xs font-bold text-cyan-500/40  tracking-widest mt-1 font-sans">Stark Unified Architecture · Terminal 7</p>
            </div>
         </div>
         <div className="flex items-center gap-12 font-sans">
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
               <span className="text-sm font-semibold  tracking-normal text-white">Cloud Link Active</span>
            </div>
            <div className="px-6 py-2 border border-white/10 rounded-full text-xs font-semibold  tracking-normal text-white/30">
               © 2026 Stark Industries Global
            </div>
         </div>
      </footer>

      {/* Global Style Injector */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.3);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.05), transparent);
          background-size: 200% 100%;
          animation: shimmer 4s infinite linear;
        }
        .perspective-2000 {
          perspective: 2000px;
        }
        .transform-gpu {
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .group:hover .transform-gpu {
          transform: rotateY(-5deg) rotateX(2deg) translateZ(20px);
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
