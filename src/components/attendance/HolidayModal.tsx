'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, Trash2, Globe, BookOpen } from 'lucide-react';
import { addHoliday, deleteHoliday } from '@/app/dashboard/attendance/actions';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holidays: any[];
  subjects: any[];
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  holidays,
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'subject'>('global');
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    subjectId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addHoliday({
        name: formData.name,
        date: formData.date,
        scope: activeTab,
        subjectId: activeTab === 'subject' ? formData.subjectId : undefined,
      });
      toast.success('Holiday added successfully');
      setFormData({ ...formData, name: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      toast.success('Holiday removed');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-b-8 border-stone-200 dark:border-zinc-800"
          >
            <div className="px-10 py-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Holiday Manager</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('global')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'global' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Global Holidays
              </button>
              <button
                onClick={() => setActiveTab('subject')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'subject' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Subject Cancellations
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Holiday Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. National Day"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {activeTab === 'subject' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Subject</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                      required
                    >
                      <option value="">Choose a subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? 'Processing...' : 'Add to Calendar'}
                </button>
              </form>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] px-2">Scheduled Items</h4>
                <div className="space-y-3">
                  {holidays.filter(h => h.scope === activeTab).map(holiday => (
                    <div key={holiday.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] group transition-all hover:shadow-lg">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center border border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] font-black text-zinc-400 uppercase leading-none mb-1">
                            {format(new Date(holiday.date), 'MMM')}
                          </span>
                          <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none">
                            {format(new Date(holiday.date), 'dd')}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{holiday.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {holiday.scope === 'global' ? (
                              <Globe className="w-3 h-3 text-zinc-400" />
                            ) : (
                              <BookOpen className="w-3 h-3 text-zinc-400" />
                            )}
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                              {holiday.scope === 'global' ? 'Global Holiday' : subjects.find(s => s.id === holiday.subject_id)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(holiday.id)}
                        className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {holidays.filter(h => h.scope === activeTab).length === 0 && (
                    <div className="py-20 text-center">
                      <Calendar className="w-12 h-12 text-zinc-100 dark:text-zinc-800 mx-auto mb-4" />
                      <p className="text-sm font-bold text-zinc-400">No {activeTab} dates recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
