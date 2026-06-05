"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";
import { logout as serverLogout } from "@/app/login/actions";

export default function SignOutButton() {
  const { supabase } = useSubscription();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      await serverLogout();
    } catch (e) {
      console.error("Logout error:", e);
      window.location.href = "/";
    }
  };

  return (
    <button 
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-[#92400e]/20 no-tap-highlight
        ${isSigningOut ? 'bg-[#78350f] opacity-80 cursor-wait' : 'bg-[#92400e] hover:bg-[#78350f] hover:shadow-xl hover:-translate-y-0.5 active:scale-95'}
      `}
    >
      {isSigningOut ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span className="hidden xs:inline">{isSigningOut ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}
