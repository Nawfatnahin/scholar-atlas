"use client";

import { usePdfSessionLimit, PdfAction } from "@/hooks/usePdfSessionLimit";
import { Trash2, Clock, File, Images, ArrowLeftRight, SplitSquareHorizontal } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function ActionHistorySidebar() {
  const { actions, clearHistory, isLoaded } = usePdfSessionLimit();

  const getIcon = (type: PdfAction["type"]) => {
    switch (type) {
      case "merge": return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
      case "split": return <SplitSquareHorizontal className="w-4 h-4 text-emerald-500" />;
      case "pdf-to-image": return <Images className="w-4 h-4 text-purple-500" />;
      case "image-to-pdf": return <File className="w-4 h-4 text-amber-500" />;
    }
  };

  const formatTime = (ts: number) => {
    if (!ts || isNaN(ts)) return 'Unknown time';
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(new Date(ts));
    } catch {
      return 'Unknown time';
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your history? This won't reset your session limit.")) {
      clearHistory();
      toast.success("History cleared");
    }
  };

  if (!isLoaded) return (
    <div className="bg-white dark:bg-bg-elevated/70 dark:border-border-default rounded-3xl p-6 shadow-sm border border-stone-200 animate-pulse h-64"></div>
  );

  return (
    <div className="flex flex-col gap-6 sticky top-28">
      
      {/* History Card */}
      <div className="bg-white dark:bg-bg-elevated/70 dark:backdrop-blur-xl dark:border-border-default rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-stone-200 flex-1 flex flex-col max-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
            <Clock className="w-5 h-5 text-stone-400" />
            Recent Files
          </h3>
          {actions.length > 0 && (
            <button 
              onClick={handleClear}
              className="text-xs text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm flex flex-col items-center gap-2">
              <File className="w-8 h-8 opacity-20" />
              <p>No recent actions</p>
            </div>
          ) : (
            actions.map((action) => (
              <div key={action.id} className="group p-3 rounded-2xl bg-stone-50 hover:bg-amber-50/50 dark:bg-bg-surface/50 dark:hover:bg-bg-elevated/50 border border-stone-100 hover:border-amber-200/50 dark:border-border-subtle/50 dark:hover:border-border-default/50 transition-all flex items-start gap-3">
                <div className="mt-1 shrink-0 bg-white dark:bg-bg-elevated p-1.5 rounded-lg shadow-sm border border-stone-100 dark:border-border-subtle">
                  {getIcon(action.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate" title={action.filename}>
                    {action.filename}
                  </p>
                  <p className="text-xs text-stone-500 capitalize flex items-center gap-1.5 mt-0.5">
                    {action.type.replace('-', ' ')} • {formatTime(action.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-border-subtle">
           <Link href="/tools/pdf" className="text-sm text-amber-700 dark:text-accent-amber dark:hover:text-[#FD1D1D] font-medium hover:text-amber-800 transition-colors w-full text-center block">
             ← Back to all tools
           </Link>
        </div>
      </div>

    </div>
  );
}
