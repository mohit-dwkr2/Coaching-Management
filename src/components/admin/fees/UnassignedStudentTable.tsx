import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Check,
  Users,
  ChevronDown,
} from "lucide-react";
import React from "react";

interface UnassignedStudentTableProps {
  items: any[];
  loading: boolean;

  onAssignFee: (student: any) => void;

  // Bulk selection
  selectedStudents: string[];
  onSelectionChange: (selectedIds: string[]) => void;

  // Open bulk fee drawer
  onBulkAssignFee: () => void;
}

const UnassignedStudentTable = ({
  items,
  loading,
  onAssignFee,
  selectedStudents,
  onSelectionChange,
  onBulkAssignFee,
}: UnassignedStudentTableProps) => {

  if (loading) {
    return <div>Loading...</div>;
  }

  // Empty State
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 mb-3">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
          All Fees Assigned
        </h3>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          All students already have fee structures assigned. No pending assignments found.
        </p>
      </div>
    );
  }

  const allSelected =
    items.length > 0 &&
    items.every((student) =>
      selectedStudents.includes(String(student.id))
    );

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onSelectionChange(
        selectedStudents.filter((id) => id !== studentId)
      );
    } else {
      onSelectionChange([
        ...selectedStudents,
        studentId,
      ]);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
      return;
    }

    onSelectionChange(
      items.map((student) => String(student.id))
    );
  };

  return (
    <div className="space-y-4">
      {/* ========================= */}
      {/* BULK ACTION BAR           */}
      {/* ========================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Select All */}
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span
              className={`
                h-5 w-5 rounded-md border flex items-center justify-center transition-all
                ${allSelected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                }
              `}
            >
              {allSelected && <Check className="h-3.5 w-3.5" />}
            </span>

            {allSelected ? "Deselect All" : "Select All"}
          </button>

          {/* Selected Count */}
          {selectedStudents.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[10px] font-extrabold">
              <Users className="h-3 w-3" />
              {selectedStudents.length} Selected
            </span>
          )}
        </div>

        {/* Right */}
        <Button
          type="button"
          disabled={selectedStudents.length === 0}
          onClick={onBulkAssignFee}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold disabled:opacity-40 disabled:pointer-events-none"
        >
          <Users className="h-4 w-4 mr-1.5" />
          Bulk Assign Fee
        </Button>
      </div>

      {/* ========================================================= */}
      {/* MOBILE VIEW (COMPACT ACCORDION LIST) - < md              */}
      {/* ========================================================= */}
      <div className="md:hidden space-y-2.5 w-full">
        {items.map((student) => {
          const studentId = String(student.id);
          const isSelected = selectedStudents.includes(studentId);

          return (
            <details
              key={student.id}
              className={`
                group bg-white dark:bg-slate-900/90 rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs
                ${isSelected
                  ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md"
                  : "border-slate-200/80 dark:border-slate-800"
                }
              `}
            >
              {/* Accordion Header / Summary */}
              <summary className="flex items-center justify-between p-3 cursor-pointer list-none select-none">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm shadow-blue-500/20">
                    {student.name ? student.name.charAt(0) : "S"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {student.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                      Awaiting Structure
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectStudent(studentId);
                    }}
                    aria-label={
                      isSelected ? "Deselect student" : "Select student"
                    }
                  >
                    <span
                      className={`
                        h-5 w-5 rounded-md border flex items-center justify-center transition-all
                        ${isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        }
                      `}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>

                  {/* Expand Arrow Icon */}
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                </div>
              </summary>

              {/* Accordion Content */}
              <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                {/* Course + Batch */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      Course
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                      {student.course?.course_name ?? "-"}
                    </span>
                  </div>

                  <div className="min-w-0 border-l border-slate-200/60 dark:border-slate-700/60 pl-2.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      Batch
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                      {student.batch?.batch_name ?? "-"}
                    </span>
                  </div>
                </div>

                {/* Single Assign Button */}
                <Button
                  size="sm"
                  onClick={() => {
                    onAssignFee(student);
                  }}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold text-xs py-2 shadow-xs shadow-blue-500/20 active:scale-[0.98] transition-all"
                >
                  Assign Fee Structure
                </Button>
              </div>
            </details>
          );
        })}
      </div>


      {/* ========================================================= */}
      {/* DESKTOP VIEW (STUDENT CARD GRID) - >= md                  */}
      {/* ========================================================= */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {items.map((student) => {
          const studentId = String(student.id);

          const isSelected = selectedStudents.includes(studentId);

          return (
            <div
              key={student.id}
              className={`
                group relative flex flex-col justify-between rounded-2xl
                border bg-white dark:bg-slate-900/90 p-4
                shadow-xs transition-all duration-200

                ${isSelected
                  ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md"
                  : "border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-blue-500/40 dark:hover:border-blue-500/40"
                }
              `}
            >
              {/* ========================= */}
              {/* SELECT CHECKBOX */}
              {/* ========================= */}

              <button
                type="button"
                onClick={() => handleSelectStudent(studentId)}
                className="absolute top-3 right-3 z-10"
                aria-label={
                  isSelected ? "Deselect student" : "Select student"
                }
              >
                <span
                  className={`
                    h-5 w-5 rounded-md border flex items-center justify-center transition-all
                    ${isSelected
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    }
                  `}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>

              {/* ========================= */}
              {/* STUDENT HEADER */}
              {/* ========================= */}

              <div className="flex items-center gap-3 pr-7">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  {student.name ? student.name.charAt(0) : "S"}
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    className="
                      text-xs font-bold text-slate-900
                      dark:text-slate-100 truncate
                      group-hover:text-blue-600
                      dark:group-hover:text-blue-400
                      transition-colors
                    "
                  >
                    {student.name}
                  </h4>

                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    Awaiting Structure
                  </p>
                </div>
              </div>

              {/* ========================= */}
              {/* COURSE + BATCH */}
              {/* ========================= */}

              <div className="grid grid-cols-2 gap-2 my-3.5 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    Course
                  </span>

                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {student.course?.course_name ?? "-"}
                  </span>
                </div>

                <div className="min-w-0 border-l border-slate-200/60 dark:border-slate-700/60 pl-2.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    Batch
                  </span>

                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {student.batch?.batch_name ?? "-"}
                  </span>
                </div>
              </div>

              {/* ========================= */}
              {/* SINGLE ASSIGN BUTTON */}
              {/* ========================= */}

              <Button
                size="sm"
                onClick={() => {
                  onAssignFee(student);
                }}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold text-xs py-2 shadow-xs shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                Assign Fee Structure
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnassignedStudentTable;