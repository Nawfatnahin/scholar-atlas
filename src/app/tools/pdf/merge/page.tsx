"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const PdfMerge = dynamic(() => import("@/components/pdf/PdfMerge").then(mod => mod.PdfMerge), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center bg-stone-50 rounded-3xl border border-stone-200">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-stone-200 rounded-full" />
      <div className="h-4 w-32 bg-stone-200 rounded" />
    </div>
  </div>
});

export default function MergePage() {
  return (
    <div className="flex flex-col h-full">
      <Link href="/tools/pdf" className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-amber-700 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Tools
      </Link>
      <PdfMerge />
    </div>
  );
}
