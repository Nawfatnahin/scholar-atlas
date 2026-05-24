"use client";

import { Crown, Shield, User as UserIcon } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";

export default function UserBadge({ email }: { email: string }) {
  const { isPro, isAdmin, user } = useSubscription();

  if (!email && !user) return null;

  const displayName = user?.user_metadata?.display_name || email.split('@')[0] || "User";

  return (
    <div className="relative group flex items-center hidden md:flex">
      <div className={`relative px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-md border shadow-sm flex items-center gap-3 transition-all duration-300 hover:shadow-md border-[#92400e]/20 hover:border-[#92400e]/40`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 ${isAdmin ? 'bg-purple-100 text-purple-600' : (isPro ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500')}`}>
          {isAdmin ? <Shield className="w-4 h-4" /> : (isPro ? <Crown className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />)}
        </div>
        <div className="flex flex-col pr-2">
          <span className={`text-[8px] font-black uppercase tracking-widest ${isAdmin ? 'text-purple-600' : (isPro ? 'text-amber-600' : 'text-stone-500')}`}>
            {isAdmin ? "Super Admin" : (isPro ? "Premium Access" : "Standard Tier")}
          </span>
          <span className="text-xs font-bold text-ink truncate max-w-[120px] lg:max-w-[180px]">{displayName}</span>
        </div>
        <div className="absolute top-1.5 right-1.5">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
