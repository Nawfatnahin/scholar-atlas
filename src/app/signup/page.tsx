"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Attempt Signup
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      // If user already exists but is unconfirmed, Supabase might return an error
      if (signUpError.message.includes("User already registered")) {
        // Try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes("Email not confirmed")) {
            setError("This email is already registered but not verified. Since you turned off verification, please DELETE this user from your Supabase Auth table and try again, or manually 'Confirm User' in the Supabase Dashboard.");
          } else {
            setError(signInError.message);
          }
          setLoading(false);
          return;
        }

        if (signInData.session) {
          setTimeout(() => {
            router.replace("/dashboard");
            router.refresh();
          }, 100);
          return;
        }
      }
      
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2. Success! Check for session
    if (data.session) {
      setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 100);
      return;
    }

    // 3. No session? Supabase still wants verification
    setError("Signup successful, but Supabase is still requesting email verification. If you turned it off, it might take a minute to apply, or you may need to 'Confirm' this user manually in the Supabase Auth dashboard one last time.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-stone-50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute rounded-full blur-[120px] opacity-10 w-[400px] h-[400px] bg-amber-600 -top-[120px] -right-[80px]" />
      </div>

      <div className="w-full max-w-[420px] bg-white border border-stone-200 shadow-xl p-8 rounded-[24px] relative z-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-md">
            <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white">
              <path d="M10 2L3 7v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V7l-7-5z" />
            </svg>
          </div>
        </Link>
        <h1 className="text-[28px] font-bold text-stone-900 tracking-tight mb-2">Create account</h1>
        <p className="text-[11px] text-amber-700 mb-8 font-bold bg-amber-50 py-2 rounded-lg border border-amber-100">
          NOTE: Save the password in Google Password Manager or your browser.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-200 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-[13px] font-bold text-stone-700 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[14px] px-4 py-3 rounded-xl border border-stone-200 bg-white outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-stone-700 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-[14px] px-4 py-3 rounded-xl border border-stone-200 bg-white outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary mt-2"
          >
            {loading ? "Processing..." : "Sign up"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100">
          <p className="text-[13px] text-stone-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-stone-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
