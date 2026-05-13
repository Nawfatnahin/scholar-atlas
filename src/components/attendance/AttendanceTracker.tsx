"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Check, X, Trash2, BookOpen, 
  Calendar, Hash, Info,
  AlertCircle, Edit2, Layout
} from "lucide-react";
import { addSubject, updateSessionStatus, deleteSubject, addExtraClass, updateSubject, markHolidayRange } from "@/app/dashboard/attendance/actions";
import { toast } from "sonner";
import { format, parseISO, startOfDay } from "date-fns";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Session {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'cancelled' | 'upcoming' | 'holiday';
  is_extra: boolean;
}

interface Subject {
  id: string;
  name: string;
  course_code: string | null;
  target_percentage: number;
  semester_start_date: string;
  total_weeks: number;
  classes_per_day: number;
  class_days: string[];
  class_sessions: Session[];
}

export function AttendanceTracker({ initialSubjects }: { initialSubjects: Subject[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showTodayPrompt, setShowTodayPrompt] = useState<{ subjectId: string, sessionId: string } | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    courseCode: "",
    targetPercentage: 75,
    classDays: [] as string[],
    semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
    totalWeeks: 15,
    initialAttendedCount: 0,
  });

  const [holidayFormData, setHolidayFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [pastClassCount, setPastClassCount] = useState(0);

  // Sync Form when editing
  useEffect(() => {
    if (editingSubject) {
      setFormData({
        name: editingSubject.name,
        courseCode: editingSubject.course_code || "",
        targetPercentage: editingSubject.target_percentage,
        classDays: editingSubject.class_days,
        semesterStartDate: editingSubject.semester_start_date,
        totalWeeks: editingSubject.total_weeks,
        initialAttendedCount: 0, // Reset for edit
      });
    }
  }, [editingSubject]);

  // Check Schema on Mount
  useEffect(() => {
    import("@/app/dashboard/attendance/actions").then(({ validateSchema }) => {
      validateSchema().then(res => {
        if (!res.valid) setSchemaError(res.message);
      });
    });
  }, []);

  // Calculate past classes
  useEffect(() => {
    if (formData.classDays.length > 0 && formData.semesterStartDate) {
      const start = parseISO(formData.semesterStartDate);
      const today = startOfDay(new Date());
      let count = 0;
      if (start < today) {
        for (let d = start; d < today; d = new Date(d.getTime() + 86400000)) {
          if (formData.classDays.includes(format(d, 'EEEE'))) count++;
        }
      }
      setPastClassCount(count);
    }
  }, [formData.classDays, formData.semesterStartDate]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.classDays.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsPending(true);
    try {
      const res = editingSubject 
        ? await updateSubject(editingSubject.id, formData)
        : await addSubject(formData);
        
      if (res.success) {
        setIsAdding(false);
        setEditingSubject(null);
        resetForm();
        toast.success(editingSubject ? "Subject updated!" : "Schedule generated!");
      } else {
        toast.error(res.error || "Operation failed");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      courseCode: "",
      targetPercentage: 75,
      classDays: [],
      semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
      totalWeeks: 15,
      initialAttendedCount: 0,
    });
  };

  const calculateStats = (subject: Subject) => {
    const sessions = subject.class_sessions || [];
    const logged = sessions.filter(s => s.status !== 'upcoming' && s.status !== 'cancelled' && s.status !== 'holiday');
    const present = logged.filter(s => s.status === 'present').length;
    const totalLogged = logged.length;
    const percentage = totalLogged === 0 ? 0 : Math.round((present / totalLogged) * 100);
    const isBelow = percentage < subject.target_percentage;
    const safeLeaves = Math.max(0, Math.floor((present * 100 / subject.target_percentage) - totalLogged));
    const remaining = sessions.filter(s => s.status === 'upcoming').length;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaySession = sessions.find(s => s.date === todayStr && s.status === 'upcoming');
    return { percentage, isBelow, safeLeaves, remaining, present, totalLogged, todaySession };
  };

  const handleMarkToday = async (sessionId: string, status: 'present' | 'absent' | 'cancelled' | 'holiday') => {
    try {
      await updateSessionStatus(sessionId, status);
      setShowTodayPrompt(null);
      toast.success(`Marked as ${status}`);
    } catch { toast.error("Failed to update"); }
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await markHolidayRange(holidayFormData.startDate, holidayFormData.endDate);
      setShowHolidayModal(false);
      toast.success("Holidays applied globally!");
    } catch {
      toast.error("Failed to apply holidays");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Schema Alert */}
      {schemaError && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[32px] animate-in zoom-in-95">
          <div className="flex items-start gap-4 text-red-900">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-black mb-1">Database Sync Required</h3>
              <p className="text-sm font-medium">{schemaError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-ink tracking-tight mb-2">Academic Control</h2>
          <p className="text-ink-3 font-medium">Manage your {initialSubjects.length} courses with 3D automated precision.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center gap-3 bg-blue-100 text-blue-800 px-6 py-4 rounded-[20px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all shadow-xl shadow-blue-900/10 active:scale-95 border-b-4 border-blue-200"
          >
            <Calendar className="w-5 h-5" />
            Holidays
          </button>
          <button
            onClick={() => { setEditingSubject(null); resetForm(); setIsAdding(true); }}
            className="flex items-center gap-3 bg-[#92400e] text-white px-8 py-4 rounded-[20px] font-black uppercase tracking-widest hover:bg-[#78350f] transition-all shadow-xl shadow-orange-900/10 active:scale-95 border-b-4 border-orange-900/20"
          >
            <Plus className="w-5 h-5" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Holiday Range Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleHolidaySubmit} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col border-b-8 border-stone-200">
            <div className="px-10 py-8 border-b border-border-strong flex justify-between items-center bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-ink">Global Holidays</h3>
              </div>
              <button type="button" onClick={() => setShowHolidayModal(false)} className="p-2 hover:bg-bg rounded-xl transition-colors">
                <X className="w-6 h-6 text-ink-3" />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <p className="text-sm font-medium text-ink-3">Mark a range of dates as holidays for all subjects. These days will not count towards attendance.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ink-2 uppercase tracking-widest">Start Date</label>
                  <input type="date" value={holidayFormData.startDate} onChange={(e) => setHolidayFormData({...holidayFormData, startDate: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong font-bold" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ink-2 uppercase tracking-widest">End Date</label>
                  <input type="date" value={holidayFormData.endDate} onChange={(e) => setHolidayFormData({...holidayFormData, endDate: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong font-bold" required />
                </div>
              </div>
            </div>
            <div className="px-10 py-8 bg-stone-50/50 border-t border-border-strong flex justify-end gap-4">
              <button type="button" onClick={() => setShowHolidayModal(false)} className="px-8 py-4 text-sm font-black text-ink-3 hover:text-ink uppercase tracking-widest">Cancel</button>
              <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-xl shadow-blue-900/10 active:scale-95 border-b-4 border-blue-900/20">{isPending ? "Applying..." : "Apply Holidays"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {(isAdding || editingSubject) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleAction} className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-b-8 border-stone-200">
            <div className="px-10 py-8 border-b border-border-strong flex justify-between items-center bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#92400e] flex items-center justify-center text-white shadow-lg">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-ink">{editingSubject ? "Edit Subject" : "New Subject"}</h3>
              </div>
              <button type="button" onClick={() => { setIsAdding(false); setEditingSubject(null); }} className="p-2 hover:bg-bg rounded-xl transition-colors">
                <X className="w-6 h-6 text-ink-3" />
              </button>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ink-2 uppercase tracking-[0.2em] flex items-center gap-2"><Info className="w-3 h-3" /> Subject Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Physics II" className="w-full px-6 py-4 rounded-2xl border-2 border-border-strong focus:border-[#92400e] outline-none font-bold" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ink-2 uppercase tracking-[0.2em] flex items-center gap-2"><Hash className="w-3 h-3" /> Course Code</label>
                  <input type="text" value={formData.courseCode} onChange={(e) => setFormData({...formData, courseCode: e.target.value})} placeholder="Optional" className="w-full px-6 py-4 rounded-2xl border-2 border-border-strong focus:border-[#92400e] outline-none font-bold" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-ink-2 uppercase tracking-[0.2em] flex items-center gap-2"><Calendar className="w-3 h-3" /> Weekly Schedule</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button key={day} type="button" onClick={() => {
                      const days = formData.classDays.includes(day) ? formData.classDays.filter(d => d !== day) : [...formData.classDays, day];
                      setFormData({...formData, classDays: days});
                    }} className={`px-5 py-3 rounded-xl text-[11px] font-black transition-all border-b-4 ${formData.classDays.includes(day) ? 'bg-[#92400e] text-white border-orange-950/30' : 'bg-stone-100 text-ink-3 border-stone-200 hover:bg-stone-200'}`}>{day.slice(0, 3).toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ink-2 uppercase tracking-widest">Target %</label>
                  <input type="number" value={formData.targetPercentage} onChange={(e) => setFormData({...formData, targetPercentage: parseInt(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ink-2 uppercase tracking-widest">Start Date</label>
                  <input type="date" value={formData.semesterStartDate} onChange={(e) => setFormData({...formData, semesterStartDate: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ink-2 uppercase tracking-widest">Weeks</label>
                  <input type="number" value={formData.totalWeeks} onChange={(e) => setFormData({...formData, totalWeeks: parseInt(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong font-bold" />
                </div>
              </div>

              {!editingSubject && pastClassCount > 0 && (
                <div className="p-6 bg-amber-50 rounded-[24px] border-2 border-amber-200">
                  <p className="font-bold text-sm text-amber-800 mb-2">Historical Attendance ({pastClassCount} classes passed)</p>
                  <div className="flex items-center gap-4">
                    <input type="range" min="0" max={pastClassCount} value={formData.initialAttendedCount} onChange={(e) => setFormData({...formData, initialAttendedCount: parseInt(e.target.value)})} className="flex-1 accent-[#92400e]" />
                    <span className="font-black text-amber-900 text-lg w-10 text-center">{formData.initialAttendedCount}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 bg-stone-50/50 border-t border-border-strong flex justify-end gap-4">
              <button type="button" onClick={() => { setIsAdding(false); setEditingSubject(null); }} className="px-8 py-4 text-sm font-black text-ink-3 hover:text-ink uppercase tracking-widest">Cancel</button>
              <button type="submit" disabled={isPending} className="bg-[#92400e] text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#78350f] transition-all disabled:opacity-50 shadow-xl shadow-orange-900/10 active:scale-95 border-b-4 border-orange-950/20">{isPending ? "Processing..." : (editingSubject ? "Save Changes" : "Generate Schedule")}</button>
            </div>
          </form>
        </div>
      )}

      {/* 3D Subject List */}
      <div className="flex flex-col gap-8">
        {initialSubjects.map((subject) => {
          const stats = calculateStats(subject);
          return (
            <div 
              key={subject.id} 
              className="group relative bg-[#020617] border border-white/10 rounded-[32px] md:rounded-[44px] p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 md:gap-8 transition-all hover:shadow-[0_40px_100px_rgba(0,0,0,0.4)] hover:-translate-y-2 active:translate-y-0 active:shadow-inner border-b-[8px] border-slate-950 overflow-hidden"
            >
              {/* Premium Glow Effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -right-[5%] w-[400px] h-[400px] bg-indigo-500/20 blur-[120px] group-hover:bg-indigo-500/30 transition-colors duration-700" />
                <div className="absolute -bottom-[10%] -left-[5%] w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] group-hover:bg-cyan-500/20 transition-colors duration-700" />
              </div>

              {/* Left: Interactive Info */}
              <div className="flex items-center gap-5 md:gap-8 min-w-0 md:min-w-[340px] relative z-10 w-full md:w-auto">
                <div className="relative">
                   <button 
                    onClick={() => setEditingSubject(subject)} 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[30px] bg-white/5 backdrop-blur-3xl flex items-center justify-center text-cyan-400 group-hover:text-white transition-all border border-white/10 shadow-2xl hover:scale-110 active:scale-95 group-hover:rotate-6" 
                    title="Edit Configuration"
                  >
                    <Edit2 className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                  {stats.todaySession && (
                    <div className="absolute -top-3 -right-3 flex items-center z-20">
                      <button 
                        onClick={() => setShowTodayPrompt({ subjectId: subject.id, sessionId: stats.todaySession!.id })} 
                        className="relative z-10 w-8 h-8 bg-cyan-400 rounded-full border-4 border-[#020617] animate-pulse shadow-[0_0_25px_rgba(34,211,238,0.6)] hover:scale-125 transition-transform" 
                      />
                      <span className="absolute left-full ml-2 text-[9px] font-black text-cyan-300 uppercase tracking-widest bg-[#020617]/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-cyan-400/30 whitespace-nowrap animate-pulse pointer-events-none">
                        Click to mark
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-display font-black text-2xl md:text-3xl text-white leading-tight group-hover:text-cyan-300 transition-colors tracking-tighter">{subject.name}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    {subject.course_code && (
                      <span className="text-[10px] md:text-[11px] font-black text-cyan-200 uppercase tracking-widest bg-cyan-500/20 px-3 py-1 rounded-xl border border-cyan-400/30">{subject.course_code}</span>
                    )}
                    <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">Goal: {subject.target_percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Progress Column */}
              <div className="hidden md:flex flex-1 items-center gap-8 px-12 border-x border-white/5 relative z-10">
                <div className="flex-1 h-5 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5 p-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      stats.isBelow 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' 
                      : 'bg-gradient-to-r from-cyan-400 via-indigo-400 to-blue-500 shadow-[0_0_25px_rgba(34,211,238,0.4)]'
                    }`} 
                    style={{ width: `${Math.min(100, stats.percentage)}%` }} 
                  >
                    <div className="w-full h-full animate-shine bg-white/20" />
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                   <p className={`text-4xl font-black tracking-tighter ${stats.isBelow ? 'text-rose-400' : 'text-cyan-400'}`}>{stats.percentage}%</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mt-1">Efficiency</p>
                </div>
              </div>

              {/* Data & Actions */}
              <div className="flex items-center justify-between w-full lg:w-auto gap-6 md:gap-12 relative z-10">
                <div className="flex gap-8 md:gap-14">
                  <div className="text-center">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Safe</p>
                    <p className={`text-2xl md:text-3xl font-black ${stats.safeLeaves > 0 ? 'text-emerald-400' : 'text-slate-800'}`}>{stats.safeLeaves}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Left</p>
                    <p className="text-2xl md:text-3xl font-black text-white">{stats.remaining}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                  <button 
                    onClick={() => {
                      const d = prompt("Extra Class Date (YYYY-MM-DD):", format(new Date(), 'yyyy-MM-dd'));
                      if (d) addExtraClass(subject.id, d, 'present');
                    }} 
                    className="p-4 md:p-5 bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-2xl md:rounded-[28px] transition-all hover:scale-110 active:scale-95 shadow-2xl border border-white/10" 
                    title="Add Extra Class"
                  >
                    <Plus className="w-6 h-6 md:w-7 md:h-7" />
                  </button>
                  <button 
                    onClick={() => { if(confirm("Permanently delete subject?")) deleteSubject(subject.id); }} 
                    className="p-4 md:p-5 text-slate-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl md:rounded-[28px] transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5 md:w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {initialSubjects.length === 0 && !isAdding && (
        <div className="py-32 text-center bg-white/40 backdrop-blur-xl rounded-[60px] border-4 border-dashed border-border-strong flex flex-col items-center justify-center">
          <BookOpen className="w-16 h-16 text-ink-4 mb-6 opacity-20" />
          <h3 className="text-2xl font-black text-ink mb-2">Command Center Inactive</h3>
          <p className="text-ink-2 font-medium max-w-sm mb-10">Add your first subject to initialize 3D automated tracking.</p>
          <button onClick={() => setIsAdding(true)} className="bg-[#92400e] text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-2xl border-b-4 border-orange-950/20 active:translate-y-1 active:border-b-0 transition-all">Initialize Now</button>
        </div>
      )}

      {/* Quick Mark Modal */}
      {showTodayPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-10 shadow-2xl w-full max-w-md text-center border-b-8 border-stone-200">
            <div className="w-20 h-20 bg-green-100 rounded-[30px] flex items-center justify-center text-green-600 mx-auto mb-8 shadow-inner"><Check className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-ink mb-2 tracking-tight">Today&apos;s Class</h3>
            <p className="text-ink-3 mb-10 leading-relaxed font-medium">Mark your attendance for today&apos;s session.</p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                <button onClick={() => handleMarkToday(showTodayPrompt.sessionId, 'present')} className="flex-1 bg-green-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95 border-b-4 border-green-900/30">Yes</button>
                <button onClick={() => handleMarkToday(showTodayPrompt.sessionId, 'absent')} className="flex-1 bg-red-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95 border-b-4 border-red-900/30">No</button>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleMarkToday(showTodayPrompt.sessionId, 'cancelled')} className="flex-1 bg-amber-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:scale-95 border-b-4 border-amber-900/30">Cancelled</button>
                <button onClick={() => handleMarkToday(showTodayPrompt.sessionId, 'holiday')} className="flex-1 bg-blue-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 border-b-4 border-blue-900/30">Holiday</button>
              </div>
            </div>
            <button onClick={() => setShowTodayPrompt(null)} className="mt-8 text-xs font-black text-ink-4 uppercase tracking-[0.2em] hover:text-ink">Skip for now</button>
          </div>
        </div>
      )}
    </div>
  );
}
