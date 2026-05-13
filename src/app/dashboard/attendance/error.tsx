'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Attendance Route Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-[32px] flex items-center justify-center text-red-600 mb-8 animate-in zoom-in-95 duration-500">
        <AlertCircle className="w-10 h-10" />
      </div>
      
      <h2 className="text-3xl font-black text-ink mb-4 tracking-tight">Something went wrong</h2>
      <p className="text-ink-3 font-medium max-w-md mb-12 leading-relaxed">
        We encountered an error while rendering your attendance dashboard. This could be due to a temporary database sync issue.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-[#92400e] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#78350f] transition-all shadow-xl shadow-orange-900/10 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 bg-white border border-border-strong text-ink px-8 py-4 rounded-2xl font-bold hover:bg-stone-50 transition-all active:scale-95"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>

      {error.digest && (
        <p className="mt-12 text-[10px] font-black text-ink-4 uppercase tracking-[0.2em]">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
