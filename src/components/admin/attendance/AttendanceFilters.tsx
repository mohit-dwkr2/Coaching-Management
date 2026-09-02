import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { ChevronDown, Download, UserCheck } from "lucide-react";

interface AttendanceFiltersProps {

  selectedCourse: string;
  setSelectedCourse: (value: string) => void;

  selectedBatch: string;
  setSelectedBatch: (value: string) => void;

  selectedDate: string;
  setSelectedDate: (value: string) => void;

  courses: any[];
  batches: any[];

  onTakeAttendance: () => void;
  onExport: () => void;
}

export default function AttendanceFilters({

  selectedCourse,
  setSelectedCourse,

  selectedBatch,
  setSelectedBatch,

  selectedDate,
  setSelectedDate,

  courses,
  batches,

  onTakeAttendance,
  onExport,

}: AttendanceFiltersProps) {



return (
  <div className="w-full space-y-6">
    
    {/* Action Buttons Aligned Right Next To Heading */}
    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-start xl:justify-end">
      
      {/* Export Report Button */}
      {/* <Button
        type="button"
        variant="outline"
        onClick={onExport}
        className="h-11 px-4 sm:px-5 rounded-xl border-slate-200/90 bg-white/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-2xs text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 active:scale-95 flex items-center gap-2"
      >
        <Download size={17} className="text-slate-500" strokeWidth={2.2} />
        <span>Export Report</span>
      </Button> */}

      {/* Take Attendance Button */}
      {/* <Button
        type="button"
        onClick={onTakeAttendance}
        disabled={!selectedCourse || !selectedBatch || !selectedDate}
        className="h-11 px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2.5 shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <UserCheck size={18} strokeWidth={2.2} />
        <span>Take Attendance</span>
      </Button> */}
    </div>

    {/* Filter Inputs Row (Student Manager Inspired Filter Style) */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100">
      
      {/* Course Filter */}
      <div className="relative group">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
          Course
        </label>
        <div className="relative">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full h-11 rounded-2xl border border-slate-200/90 bg-slate-50/90 hover:bg-slate-100/60 focus:bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 appearance-none cursor-pointer pr-10 shadow-none"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
        </div>
      </div>

      {/* Batch Filter */}
      <div className="relative group">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
          Batch
        </label>
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full h-11 rounded-2xl border border-slate-200/90 bg-slate-50/90 hover:bg-slate-100/60 focus:bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 appearance-none cursor-pointer pr-10 shadow-none"
          >
            <option value="">Select Batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
        </div>
      </div>

      {/* Date Filter */}
      <div className="relative group">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
          Date
        </label>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-11 rounded-2xl border border-slate-200/90 bg-slate-50/90 hover:bg-slate-100/60 focus:bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 shadow-none cursor-pointer"
          />
        </div>
      </div>

    </div>

  </div>
);
}