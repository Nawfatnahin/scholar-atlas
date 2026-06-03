"use client";
import { DAYS, type Day, type SubjectSlot, getTodayName } from "@/lib/timetableUtils";

interface Props {
  grid: Record<Day, SubjectSlot[]>;
}

export default function TimetableGrid({ grid }: Props) {
  const today = getTodayName();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 w-full">
      {DAYS.map((day) => {
        const isToday = day === today;
        const slots = grid[day];

        return (
          <div
            key={day}
            className={`rounded-xl border p-3 flex flex-col gap-2 min-h-[120px] transition-all
              ${isToday
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"}`}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wide
                ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                {day.slice(0, 3)}
              </span>
              {isToday && (
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            {/* Subject Slots */}
            {slots.length === 0 ? (
              <span className="text-[11px] text-gray-300 dark:text-gray-600 italic mt-auto">
                No class
              </span>
            ) : (
              slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-lg px-2 py-1.5 text-white text-xs font-medium truncate"
                  style={{ backgroundColor: slot.color }}
                  title={slot.name}
                >
                  {slot.class_time && (
                    <div className="text-[10px] opacity-80 mb-0.5">{slot.class_time}</div>
                  )}
                  {slot.name}
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
