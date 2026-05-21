'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  Layout, 
  BookOpen, 
  AlertCircle,
  Hash,
  Info,
  X,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { calculateStats, SubjectAttendanceStats } from '@/lib/attendance/calculator';
import { SubjectCard } from './SubjectCard';
import { TodaySchedule } from './TodaySchedule';
import { HolidayModal } from './HolidayModal';
import { BatchMarkFooter } from './BatchMarkFooter';
import { addSubject, updateSubject, bulkMarkAttendance } from '@/app/dashboard/attendance/actions';

interface AttendanceTrackerProps {
  initialSubjects: any[];
  initialHolidays: any[];
}

export function AttendanceTracker({ initialSubjects, initialHolidays }: AttendanceTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [batchChanges, setBatchChanges] = useState<Record<string, any>>({});

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    courseCode: '',
    requiredThreshold: 75,
    personalTarget: null as number | null,
    classDays: [] as string[],
    semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
    totalWeeks: 15,
  });

  const subjectsWithStats = useMemo(() => {
    return initialSubjects.map(subject => {
      const records = subject.attendance_records || [];
      const stats = calculateStats(subject, records);
      return { subject, stats };
    });
  }, [initialSubjects]);

  const overallHealth = useMemo(() => {
    if (subjectsWithStats.length === 0) return 0;
    const totalAttended = subjectsWithStats.reduce((sum, s) => sum + s.stats.attended, 0);
    const totalClasses = subjectsWithStats.reduce((sum, s) => sum + s.stats.totalClasses, 0);
    return totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 100;
  }, [subjectsWithStats]);

  const subjectsNeedingAttention = subjectsWithStats.filter(
    s => s.stats.healthStatus === 'caution' || s.stats.healthStatus === 'danger'
  ).length;

  const criticalSubjects = subjectsWithStats.filter(
    s => s.stats.healthStatus === 'unreachable'
  ).length;

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.classDays.length === 0) {
      toast.error("Please fill all required fields, Sir.");
      return;
    }
    setIsPending(true);
    try {
      console.log('[JARVIS]: Dispatching subject configuration to server...');
      const res = await addSubject({
        name: formData.name,
        courseCode: formData.courseCode,
        requiredThreshold: Number(formData.requiredThreshold),
        personalTarget: formData.personalTarget ? Number(formData.personalTarget) : null,
        classDays: formData.classDays,
        semesterStartDate: formData.semesterStartDate,
        totalWeeks: Number(formData.totalWeeks)
      });

      if (res.success) {
        setIsAdding(false);
        setEditingSubject(null);
        setFormData({
          name: '',
          courseCode: '',
          requiredThreshold: 75,
          personalTarget: null,
          classDays: [],
          semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
          totalWeeks: 15,
        });
        toast.success("Academic track initialized with absolute precision, Sir.");
      } else {
        console.error('[JARVIS]: Server Action reported failure:', res.error);
        toast.error(`Configuration Failed: ${res.error}`);
      }
    } catch (error: any) {
      console.error('[JARVIS]: Unexpected network or runtime exception:', error);
      toast.error(`System Anomaly: ${error.message || 'Unknown network error'}`);
    } finally {
      setIsPending(false);
    }
  };

  const handleSaveBatch = async () => {
    setIsPending(true);
    try {
      const records = Object.entries(batchChanges).map(([key, value]) => {
        const [subjectId, classDate] = key.split('|');
        return { subjectId, classDate, absenceType: value };
      });
      await bulkMarkAttendance({ records });
      setBatchChanges({});
      setIsBatchMode(false);
      toast.success("Batch updates finalized, Sir.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleBatchToggle = (subjectId: string, date: string, currentType: string) => {
    const key = `${subjectId}|${date}`;
    const types = ['present', 'unexcused', 'medical', 'excused', 'cancelled'];
    const currentIndex = types.indexOf(currentType || 'none');
    const nextType = types[(currentIndex + 1) % types.length];
    
    setBatchChanges(prev => ({
      ...prev,
      [key]: nextType
    }));
  };

  return (
    <div className="space-y-10 pb-32">
      {/* Semester Health Score Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-[44px] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">Semester Health Score</h3>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-black tracking-tighter ${
                overallHealth >= 75 ? 'text-green-400' : overallHealth >= 65 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {overallHealth.toFixed(1)}%
              </span>
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border font-mono ${
                overallHealth >= 75
                  ? 'bg-green-500/10 text-green-400 border-green-500/25'
                  : overallHealth >= 65
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  : 'bg-red-500/10 text-red-400 border-red-500/25'
              }`}>
                {overallHealth >= 75 ? 'NOMINAL' : overallHealth >= 65 ? 'ATTENTION' : 'CRITICAL'}
              </span>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 font-mono">Attention</p>
              <p className="text-2xl font-black text-amber-500">{subjectsNeedingAttention}</p>
            </div>
            <div className="flex-1 md:flex-none p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 font-mono">Critical</p>
              <p className="text-2xl font-black text-red-500">{criticalSubjects}</p>
            </div>
          </div>
        </div>

        {/* Weighted average explanation — prominent callout */}
        <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs font-mono text-zinc-500 leading-relaxed">
            <span className="font-bold text-zinc-400">Weighted semester average:</span> Modules with more total classes held carry proportionally greater weight in this score. A subject with 40 sessions impacts your health more than one with 10.
          </p>
        </div>
      </div>

      {/* Today's Schedule */}
      <TodaySchedule subjects={initialSubjects} />

      {/* Main Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Active Modules</h2>
          <p className="text-zinc-500 font-mono text-sm">Tracking {initialSubjects.length} mission-critical modules.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`flex items-center gap-3 px-6 py-4 rounded-[20px] font-black uppercase tracking-widest transition-all active:scale-95 ${
              isBatchMode 
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-5 h-5" />
            Batch Log Sessions
          </button>
          <button
            onClick={() => setIsHolidayModalOpen(true)}
            className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 px-6 py-4 rounded-[20px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700"
          >
            <Calendar className="w-5 h-5" />
            Suspend Days
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-[20px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-black/10"
          >
            <Plus className="w-5 h-5" />
            Deploy Module
          </button>
        </div>
      </div>

      {/* Batch mode instruction banner */}
      {isBatchMode && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/20">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <p className="text-xs font-mono text-cyan-400/90">
            <span className="font-bold text-cyan-300">BATCH LOG MODE ACTIVE</span> — Tap each date tile on any module card to cycle through session states: Present → Absent → Medical → Excused → Cancelled. Commit when ready.
          </p>
        </div>
      )}

      {/* Subject Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjectsWithStats.map(({ subject, stats }) => (
          <SubjectCard 
            key={subject.id} 
            subject={subject} 
            stats={stats} 
            isBatchMode={isBatchMode}
            batchChanges={batchChanges}
            onBatchToggle={(date, currentType) => handleBatchToggle(subject.id, date, currentType)}
          />
        ))}
      </div>

      {/* Empty State */}
      {initialSubjects.length === 0 && (
        <div className="py-20 text-center bg-zinc-950/50 dark:bg-zinc-800/20 rounded-[60px] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center px-8">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <BookOpen className="w-8 h-8 text-cyan-500/50" />
          </div>
          <h3 className="text-2xl font-black text-zinc-100 mb-2 tracking-tight">Academic Void Detected</h3>
          <p className="text-zinc-500 font-mono text-sm max-w-sm mb-8">No modules deployed. Initialize your first tracking unit to activate precision monitoring.</p>
          <button onClick={() => setIsAdding(true)} className="bg-cyan-500 hover:bg-cyan-400 text-white px-12 py-4 rounded-[20px] font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 active:scale-95 transition-all mb-14">
            Deploy First Module
          </button>

          {/* 3-step ghost onboarding preview */}
          <div className="w-full max-w-2xl">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-6">— System Preview: What activating a module looks like —</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="animate-pulse p-5 rounded-3xl border border-cyan-500/10 bg-zinc-900/60 flex flex-col gap-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-[9px] font-black text-cyan-400">01</span>
                  </div>
                  <span className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest font-mono">Deploy Module</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full w-3/4" />
                <div className="h-2.5 bg-zinc-800/70 rounded-full w-1/2" />
                <div className="h-8 bg-zinc-800/40 rounded-xl w-full mt-1" />
                <p className="text-[10px] text-zinc-600 font-mono mt-1">Name your course, set schedule days &amp; semester length.</p>
              </div>
              {/* Step 2 */}
              <div className="animate-pulse p-5 rounded-3xl border border-amber-500/10 bg-zinc-900/60 flex flex-col gap-3 text-left" style={{animationDelay:'0.15s'}}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-[9px] font-black text-amber-400">02</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest font-mono">Log Daily Sessions</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-7 flex-1 bg-green-900/30 rounded-lg" />
                  <div className="h-7 flex-1 bg-red-900/30 rounded-lg" />
                  <div className="h-7 flex-1 bg-green-900/30 rounded-lg" />
                  <div className="h-7 flex-1 bg-zinc-800/50 rounded-lg" />
                </div>
                <div className="h-2 bg-zinc-800 rounded-full w-full" />
                <p className="text-[10px] text-zinc-600 font-mono mt-1">Mark Present or Absent daily. Batch log across sessions.</p>
              </div>
              {/* Step 3 */}
              <div className="animate-pulse p-5 rounded-3xl border border-green-500/10 bg-zinc-900/60 flex flex-col gap-3 text-left" style={{animationDelay:'0.3s'}}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-[9px] font-black text-green-400">03</span>
                  </div>
                  <span className="text-[10px] font-black text-green-500/60 uppercase tracking-widest font-mono">Precision Forecast</span>
                </div>
                <div className="h-3 bg-green-900/30 rounded-full w-full" />
                <div className="p-2 rounded-xl bg-green-950/50 border border-green-500/15">
                  <div className="h-2 bg-green-800/40 rounded-full w-3/4 mb-1.5" />
                  <div className="h-2 bg-green-800/30 rounded-full w-1/2" />
                </div>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">See your skip budget &amp; how many classes to attend to recover.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Footers */}
      <HolidayModal 
        isOpen={isHolidayModalOpen} 
        onClose={() => setIsHolidayModalOpen(false)}
        holidays={initialHolidays}
        subjects={initialSubjects}
      />

      <BatchMarkFooter 
        isVisible={isBatchMode}
        changeCount={Object.keys(batchChanges).length}
        onSave={handleSaveBatch}
        onCancel={() => {
          setBatchChanges({});
          setIsBatchMode(false);
        }}
        isPending={isPending}
      />

      {/* Add/Edit Subject Modal */}
      {(isAdding || editingSubject) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleAddSubject} className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-b-8 border-stone-200 dark:border-zinc-800">
            <div className="px-10 py-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-lg">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {editingSubject ? "Module Configuration" : "New Monitoring Track"}
                </h3>
              </div>
              <button type="button" onClick={() => { setIsAdding(false); setEditingSubject(null); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><Info className="w-3 h-3" /> Subject Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Data Structures" className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold outline-none focus:border-cyan-500 transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><Hash className="w-3 h-3" /> Course Code</label>
                  <input type="text" value={formData.courseCode} onChange={(e) => setFormData({...formData, courseCode: e.target.value})} placeholder="Optional" className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold outline-none focus:border-cyan-500 transition-all" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><Calendar className="w-3 h-3" /> Active Schedule Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <button key={day} type="button" onClick={() => {
                      const days = formData.classDays.includes(day) ? formData.classDays.filter(d => d !== day) : [...formData.classDays, day];
                      setFormData({...formData, classDays: days});
                    }} className={`px-5 py-3 rounded-xl text-[11px] font-black transition-all border-b-4 ${formData.classDays.includes(day) ? 'bg-cyan-500 text-white border-cyan-700/50 shadow-lg shadow-cyan-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}>{day.slice(0, 3).toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Threshold %</label>
                  <input type="number" value={formData.requiredThreshold} onChange={(e) => setFormData({...formData, requiredThreshold: parseFloat(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold outline-none focus:border-cyan-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Personal %</label>
                  <input type="number" value={formData.personalTarget || ''} onChange={(e) => setFormData({...formData, personalTarget: e.target.value ? parseFloat(e.target.value) : null})} placeholder="75" className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold outline-none focus:border-cyan-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Planned</label>
                  <input type="number" value={formData.totalWeeks * formData.classDays.length} readOnly className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold text-zinc-400 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Start Date</label>
                  <input type="date" value={formData.semesterStartDate} onChange={(e) => setFormData({...formData, semesterStartDate: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold outline-none focus:border-cyan-500 transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Semester Duration (Weeks)</label>
                  <input type="number" value={formData.totalWeeks} onChange={(e) => setFormData({...formData, totalWeeks: parseInt(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold outline-none focus:border-cyan-500 transition-all" required />
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-zinc-50/50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-4">
              <button type="button" onClick={() => { setIsAdding(false); setEditingSubject(null); }} className="px-8 py-4 text-xs font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
              <button type="submit" disabled={isPending} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all disabled:opacity-50 shadow-xl shadow-black/10 active:scale-95 border-b-4 border-black/20 dark:border-zinc-200/50">{isPending ? "Configuring..." : (editingSubject ? "Update Track" : "Initialize Track")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
