'use client';

import React, { useState, useMemo } from 'react';
import { Plus, X, Save, Cpu, TrendingUp, TrendingDown, FlaskConical, ClipboardList, CalendarCheck, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { AutoCourse, GradeScale, AttendanceSubject } from '@/lib/cgpa/cgpa-types';
import { calculateCourseBreakdown, calculateAutoCGPA } from '@/lib/cgpa/cgpa-calculator';
import { saveAutoCourse } from '@/app/dashboard/cgpa/actions';
import { AutoCourseCard } from './AutoCourseCard';
import { CGPAProgressBar } from './CGPAProgressBar';

interface AutoCGPACounterProps {
  courses: AutoCourse[];
  targetCGPA: number;
  gradeScales: GradeScale[];
  attendanceSubjects: AttendanceSubject[];
  onCoursesChange: (courses: AutoCourse[]) => void;
  isFreeTier?: boolean;
}

export function AutoCGPACounter({
  courses,
  targetCGPA,
  gradeScales,
  attendanceSubjects,
  onCoursesChange,
  isFreeTier,
}: AutoCGPACounterProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_name: '',
    course_code: '',
    credit_hours: '3',
    target_grade_point: '',
    ct_total: '',
    ct_best_of: '',
    ct_weight: '',
    assignment_total_marks: '',
    assignment_weight: '',
    attendance_linked: false,
    attendance_threshold_percentage: '75',
    attendance_weight: '',
    exam_weight: '',
  });

  const globalScale = gradeScales.find((s) => s.is_global);

  const gradePointOptions = useMemo(() => {
    if (!globalScale) return [];
    return [...globalScale.mappings]
      .sort((a, b) => b.gradePoint - a.gradePoint)
      .map((m) => m.gradePoint)
      .filter((v, i, arr) => arr.indexOf(v) === i);
  }, [globalScale]);

  // Calculate per-course breakdowns and overall CGPA
  const courseBreakdowns = useMemo(() => {
    return courses.map((course) => {
      const activeScale = course.grade_scale_id
        ? gradeScales.find((s) => s.id === course.grade_scale_id)
        : globalScale;

      const linkedSubject = course.attendance_linked && course.attendance_course_id
        ? attendanceSubjects.find((s) => s.id === course.attendance_course_id)
        : null;

      const breakdown = calculateCourseBreakdown(
        course,
        course.cgpa_class_tests || [],
        linkedSubject?.attendance_percentage || 0,
        activeScale?.mappings || []
      );

      return {
        course,
        breakdown,
        predictedGradePoint: breakdown.predictedGradePoint,
        creditHours: Number(course.credit_hours),
        onTrack: breakdown.targetAchievable && !breakdown.targetAlreadyAchieved
          ? breakdown.requiredExamPercentage <= 80
          : breakdown.targetAlreadyAchieved,
      };
    });
  }, [courses, gradeScales, globalScale, attendanceSubjects]);

  const overallCGPA = useMemo(() => {
    return calculateAutoCGPA(
      courseBreakdowns.map((cb) => ({
        creditHours: cb.creditHours,
        predictedGradePoint: cb.predictedGradePoint,
      }))
    );
  }, [courseBreakdowns]);

  const onTrackCount = courseBreakdowns.filter((cb) => cb.onTrack).length;
  const needsImprovementCount = courseBreakdowns.filter((cb) => !cb.onTrack).length;

  const handleAddCourse = async () => {
    const name = newCourse.course_name.trim();
    if (!name) {
      toast.error('Course name is required, Sir.');
      return;
    }
    if (!newCourse.target_grade_point) {
      toast.error('Target grade point is required, Sir.');
      return;
    }

    const totalWeight = Number(newCourse.ct_weight) + Number(newCourse.assignment_weight) + 
      Number(newCourse.attendance_weight) + Number(newCourse.exam_weight);
    
    if (Math.abs(totalWeight - 100) > 0.01 && totalWeight > 0) {
      toast.error(`Total weights must equal 100%. Currently: ${totalWeight.toFixed(1)}%`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveAutoCourse({
        course_name: name,
        course_code: newCourse.course_code.trim() || undefined,
        credit_hours: Number(newCourse.credit_hours),
        target_grade_point: Number(newCourse.target_grade_point),
        ct_total: Number(newCourse.ct_total) || 0,
        ct_best_of: Number(newCourse.ct_best_of) || 0,
        ct_weight: Number(newCourse.ct_weight) || 0,
        assignment_total_marks: Number(newCourse.assignment_total_marks) || 0,
        assignment_obtained: 0,
        assignment_weight: Number(newCourse.assignment_weight) || 0,
        attendance_linked: newCourse.attendance_linked,
        attendance_total_marks: 0,
        attendance_threshold_percentage: Number(newCourse.attendance_threshold_percentage) || 75,
        attendance_weight: Number(newCourse.attendance_weight) || 0,
        exam_weight: Number(newCourse.exam_weight) || 0,
      });

      if (res.success) {
        toast.success('Course initialized for prediction, Sir.');
        setIsAdding(false);
        setNewCourse({
          course_name: '', course_code: '', credit_hours: '3', target_grade_point: '',
          ct_total: '', ct_best_of: '', ct_weight: '', assignment_total_marks: '', assignment_weight: '',
          attendance_linked: false, attendance_threshold_percentage: '75', attendance_weight: '', exam_weight: ''
        });
        window.location.reload();
      } else {
        toast.error(`Failed: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCourseChange = (updatedCourse: AutoCourse) => {
    onCoursesChange(courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
  };

  const handleCourseDelete = (id: string) => {
    onCoursesChange(courses.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary - Moved to Top */}
      {courses.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-border-strong p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <h3 className="text-sm font-black text-[#92400e] uppercase tracking-[0.3em] mb-6">
            Predicted CGPA Overview
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-stone-50 border border-border-strong">
              <p className="text-[10px] font-black text-ink-3 uppercase tracking-widest mb-1">Predicted CGPA</p>
              <p className={`text-3xl font-black tracking-tighter ${overallCGPA >= targetCGPA ? 'text-emerald-600' : 'text-ink'}`}>
                {overallCGPA.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-border-strong">
              <p className="text-[10px] font-black text-ink-3 uppercase tracking-widest mb-1">Target</p>
              <p className="text-3xl font-black tracking-tighter text-[#92400e]">{targetCGPA.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> On Track
              </p>
              <p className="text-3xl font-black tracking-tighter text-emerald-600">{onTrackCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Needs Work
              </p>
              <p className="text-3xl font-black tracking-tighter text-amber-600">{needsImprovementCount}</p>
            </div>
          </div>

          <CGPAProgressBar current={overallCGPA} target={targetCGPA} label="Progress Toward Target" />
        </div>
      )}

      {/* Course Cards */}
      {courses.map((course) => (
        <AutoCourseCard
          key={course.id}
          course={course}
          gradeScales={gradeScales}
          attendanceSubjects={attendanceSubjects}
          onCourseChange={handleCourseChange}
          onCourseDelete={handleCourseDelete}
        />
      ))}

      {/* Empty State */}
      {courses.length === 0 && !isAdding && (
        <div className="py-20 text-center bg-white/50 backdrop-blur-xl rounded-[40px] border-4 border-dashed border-border-strong flex flex-col items-center justify-center">
          <Cpu className="w-12 h-12 text-[#92400e]/30 mb-4" />
          <h3 className="text-xl font-black text-ink mb-2">No Courses Configured</h3>
          <p className="text-ink-3 font-medium max-w-sm mb-6">
            Add a course to begin automatic CGPA prediction from your assessment data, Sir.
          </p>
        </div>
      )}

      {/* Add Course Form */}
      {isAdding && (
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-border-strong p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-black text-ink uppercase tracking-widest">New Auto Course Configuration</h4>
            <button onClick={() => setIsAdding(false)} className="p-1.5 rounded-lg text-ink-3 hover:bg-stone-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Course Name</label>
              <input type="text" value={newCourse.course_name} onChange={(e) => setNewCourse({ ...newCourse, course_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 bg-white font-bold text-sm outline-none focus:border-[#92400e] transition-all" placeholder="e.g. Data Structures" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Course Code</label>
              <input type="text" value={newCourse.course_code} onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 bg-white font-bold text-sm outline-none focus:border-[#92400e] transition-all" placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Credit Hours</label>
              <input type="number" value={newCourse.credit_hours} onChange={(e) => setNewCourse({ ...newCourse, credit_hours: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 bg-white font-bold text-sm outline-none focus:border-[#92400e] transition-all" min="0.5" max="10" step="0.5" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Target Grade Point</label>
              <select value={newCourse.target_grade_point} onChange={(e) => setNewCourse({ ...newCourse, target_grade_point: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 bg-white font-bold text-sm outline-none focus:border-[#92400e] transition-all">
                <option value="">Select</option>
                {gradePointOptions.map((gp) => (
                  <option key={gp} value={gp}>{gp.toFixed(2)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-blue-700"/><h5 className="text-xs font-black text-blue-800 uppercase">CTs</h5></div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Total</label>
                  <input type="number" placeholder="0" value={newCourse.ct_total} onChange={e => setNewCourse({...newCourse, ct_total: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Best Of</label>
                  <input type="number" placeholder="0" value={newCourse.ct_best_of} onChange={e => setNewCourse({...newCourse, ct_best_of: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Weight %</label>
                  <input type="number" placeholder="0" value={newCourse.ct_weight} onChange={e => setNewCourse({...newCourse, ct_weight: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-amber-700"/><h5 className="text-xs font-black text-amber-800 uppercase">Assignments</h5></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Total Marks</label>
                  <input type="number" placeholder="0" value={newCourse.assignment_total_marks} onChange={e => setNewCourse({...newCourse, assignment_total_marks: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Weight %</label>
                  <input type="number" placeholder="0" value={newCourse.assignment_weight} onChange={e => setNewCourse({...newCourse, assignment_weight: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-green-50/50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-green-700"/><h5 className="text-xs font-black text-green-800 uppercase">Attendance</h5></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Threshold %</label>
                  <input type="number" placeholder="75" value={newCourse.attendance_threshold_percentage} onChange={e => setNewCourse({...newCourse, attendance_threshold_percentage: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Weight %</label>
                  <input type="number" placeholder="0" value={newCourse.attendance_weight} onChange={e => setNewCourse({...newCourse, attendance_weight: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-violet-50/50 rounded-2xl border border-violet-100">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-violet-700"/><h5 className="text-xs font-black text-violet-800 uppercase">Written Exam</h5></div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-4">Exam Weight %</label>
                  <input type="number" placeholder="0" value={newCourse.exam_weight} onChange={e => setNewCourse({...newCourse, exam_weight: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border-strong">
            <button onClick={handleAddCourse} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#92400e] text-white font-black text-xs uppercase tracking-widest hover:bg-[#78350f] transition-all active:scale-95 shadow-lg shadow-[#92400e]/20 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Initialize Course'}
            </button>
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-ink-3 hover:text-ink hover:bg-stone-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Add Course Button */}
      {!isAdding && (
        <div className="flex flex-col items-start gap-2">
          <button
            onClick={() => {
              if (isFreeTier && courses.length >= 5) {
                toast.error('Free tier is limited to 5 subjects, Sir.');
                return;
              }
              setIsAdding(true);
            }}
            disabled={isFreeTier && courses.length >= 5}
            className="flex items-center gap-3 px-6 py-4 rounded-[20px] bg-[#92400e] text-white font-black text-xs uppercase tracking-widest hover:-translate-y-1 transition-all active:scale-95 shadow-xl shadow-[#92400e]/20 disabled:opacity-50 disabled:hover:-translate-y-0"
          >
            <Plus className="w-5 h-5" />
            Add Course
          </button>
          {isFreeTier && courses.length >= 5 && (
            <p className="text-xs text-red-600 font-bold px-2">Limit of 5 subjects reached for free tier.</p>
          )}
        </div>
      )}
    </div>
  );
}
