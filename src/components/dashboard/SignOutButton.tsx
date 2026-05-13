"use client";

import { LogOut } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";

export default function SignOutButton() {
  const { logout } = useSubscription();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <button 
      onClick={handleSignOut}
      className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#92400e] hover:bg-[#78350f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg shadow-[#92400e]/20 no-tap-highlight"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden xs:inline">Sign out</span>
    </button>
  );
}
