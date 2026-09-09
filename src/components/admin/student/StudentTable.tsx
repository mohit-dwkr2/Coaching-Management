import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Phone,
  Layers,
  ShieldCheck,
  ShieldX,
  Eye,
  GraduationCap,
} from "lucide-react";

interface StudentTableProps {
  students: any[];

  openStudentDrawer: (student: any) => void;

  toggleNotesAccess: (student: any) => void;

  getInitials: (name: string) => string;

  inactive?: boolean;

  selectedStudents: string[];

  setSelectedStudents: React.Dispatch<
    React.SetStateAction<string[]>
  >;
}

export default function StudentTable({
  students,
  openStudentDrawer,
  toggleNotesAccess,
  getInitials,
  inactive = false,
  selectedStudents,
  setSelectedStudents,
}: StudentTableProps) {

  const toggleStudentSelection = (studentId: string) => {

    setSelectedStudents((prev) =>

      prev.includes(studentId)

        ? prev.filter((id) => id !== studentId)

        : [...prev, studentId]

    );

  };

  const toggleSelectAll = () => {

    if (selectedStudents.length === students.length) {

      setSelectedStudents([]);

    } else {

      setSelectedStudents(
        students.map((student) => student.id)
      );

    }

  };


  return (
    <>
      {/* ================= DESKTOP TABLE VIEW (md & above) ================= */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hidden md:block transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            {/* Table Header */}
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="w-14 px-5 py-4 text-center">
                  <Checkbox
                    checked={
                      students.length > 0 &&
                      selectedStudents.length === students.length
                    }
                    onCheckedChange={() => toggleSelectAll()}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md border-slate-300"
                  />
                </th>
                <th className="px-5 py-4 font-extrabold text-slate-500">Roll No.</th>
                <th className="px-5 py-4 font-extrabold text-slate-500">Student ID</th>
                <th className="px-5 py-4 font-extrabold text-slate-500">Student Profile</th>
                <th className="px-5 py-4 font-extrabold text-slate-500">Course & Batch</th>
                <th className="px-5 py-4 font-extrabold text-slate-500">Status</th>
                <th className="px-5 py-4 font-extrabold text-slate-500">Notes Access</th>
                <th className="px-6 py-4 pr-8 text-right font-extrabold text-slate-400">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100/80">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4 border border-slate-200/60 shadow-inner">
                        <Search size={32} strokeWidth={1.8} />
                      </div>
                      <p className="text-slate-900 font-extrabold text-lg">No students found</p>
                      <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">
                        Adjust your search or filter options to find the student records you are looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const isSelected = selectedStudents.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`transition-all duration-200 group ${isSelected
                        ? "bg-blue-50/40 hover:bg-blue-50/60"
                        : "hover:bg-slate-50/80"
                        }`}
                    >
                      {/* Checkbox Column */}
                      <td className="px-5 py-4 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStudentSelection(s.id)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md border-slate-300"
                        />
                      </td>

                      {/* Roll Number Column */}
                      <td className="px-5 py-4 font-extrabold text-xs text-slate-700">
                        {s.roll_number ? (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200/60 inline-block">
                            {s.roll_number}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium">—</span>
                        )}
                      </td>

                      {/* Student ID Column */}
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600">
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          {s.student_id || "N/A"}
                        </span>
                      </td>

                      {/* Student Profile Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                            {getInitials(s.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                              {s.name}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{s.mobile}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Course & Batch Column */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200/60">
                            <GraduationCap size={13} className="text-blue-600" />
                            <span>{s.course?.course_name || s.class || "Unassigned"}</span>
                          </span>

                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 pl-0.5">
                            <Layers size={13} className="text-slate-400" />
                            <span
                              className={
                                s.batch?.batch_name || s.batch
                                  ? "text-slate-500"
                                  : "text-red-600 font-bold"
                              }
                            >
                              {s.batch?.batch_name || s.batch || "Unassigned"}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${s.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-slate-100 text-slate-600 border border-slate-200/80"
                            }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${s.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                              }`}
                          />
                          {s.status}
                        </span>
                      </td>

                      {/* Notes Access Column */}
                      <td className="px-5 py-4">
                        {s.notes_access ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/70 shadow-2xs">
                            <ShieldCheck size={14} className="text-blue-600" />
                            <span>Enabled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/70 shadow-2xs">
                            <ShieldX size={14} className="text-rose-500" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 pr-8 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {/* View Profile Button */}
                          <Button
                            onClick={() => openStudentDrawer(s)}
                            variant="outline"
                            className="h-9 px-3.5 rounded-xl border-slate-200/80 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-700 text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-2xs translate-x-1 group-hover:translate-x-0"
                          >
                            <Eye size={15} className="mr-1.5" />
                            <span>View Profile</span>
                          </Button>

                          {/* Switch Toggle */}
                          {inactive ? (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                              Not Available
                            </span>
                          ) : (
                            <div className="scale-95">
                              <Switch
                                checked={s.notes_access}
                                onCheckedChange={() => toggleNotesAccess(s)}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= COMPACT ACCORDION LIST VIEW ================= */}
      <div className="md:hidden space-y-2">
        {students.map((s) => {
          const isSelected = selectedStudents.includes(s.id);
          return (
            <details
              key={s.id}
              className={`group bg-white rounded-xl border transition-all overflow-hidden ${isSelected ? "border-blue-500 bg-blue-50/20" : "border-slate-200"
                }`}
            >
              {/* Always Visible Summary Header */}
              <summary className="flex items-center justify-between p-2.5 cursor-pointer list-none select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleStudentSelection(s.id)}
                    className="rounded h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(s.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate leading-tight">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">#{s.student_id || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`h-2 w-2 rounded-full ${s.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {/* Arrow Indicator */}
                  <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              {/* Collapsible Details */}
              <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone size={12} className="text-slate-400" />
                    <span className="truncate">{s.mobile}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <GraduationCap size={12} className="text-blue-600" />
                    <span className="truncate">{s.course?.course_name || s.class || "Unassigned"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ShieldCheck size={12} /> Notes Access
                  </span>
                  {inactive ? (
                    <span className="text-[10px] text-slate-400">Inactive</span>
                  ) : (
                    <Switch checked={s.notes_access} onCheckedChange={() => toggleNotesAccess(s)} className="scale-75 origin-right" />
                  )}
                </div>

                <Button
                  onClick={() => openStudentDrawer(s)}
                  className="w-full bg-slate-900 text-white rounded-lg h-7 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Eye size={12} />
                  <span>View Profile</span>
                </Button>
              </div>
            </details>
          );
        })}
      </div>

    </>
  );
}