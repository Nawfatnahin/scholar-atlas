"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";

export default function SignOutButton() {
  const { logout } = useSubscription();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    // Add a small timeout to ensure the UI updates before the heavy logout process
    setTimeout(async () => {
      await logout();
      // We don't need to set isSigningOut(false) because the page will navigate away
    }, 50);
  };

  return (
    <button 
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-[#92400e]/20 no-tap-highlight
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
