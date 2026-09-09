import { BookOpen, Layers, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseTableProps {
  courses: any[];
  onEdit: (course: any) => void;
  onDelete: (course: any) => void;
}

export default function CourseTable({
  courses, onEdit, onDelete,
}: CourseTableProps) {
  return (
    <div className="w-full relative">
      {/* Container - Overflow hidden removed so Drawers are never clipped */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">


        {/* ================= 1. MOBILE CARD VIEW (Mobile Screen ke liye) ================= */}
        <div className="block sm:hidden space-y-3 bg-slate-50/50 p-2 rounded-2xl">
          {courses.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-300 mx-auto mb-3">
                <BookOpen size={28} />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                No Courses Found
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                Click "Add Course" to create your first course.
              </p>
            </div>
          ) : (
            courses.map((course: any) => (
              <div
                key={course.id}
                className="p-3.5 space-y-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                {/* Header: Title + Status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen size={16} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                        {course.course_name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                        ID: #{String(course.id).substring(0, 6)}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200/60 shrink-0 capitalize">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {course.status || "Active"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 font-medium line-clamp-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/80 leading-relaxed">
                  {course.description ? (
                    course.description
                  ) : (
                    <span className="text-slate-300 italic">No description</span>
                  )}
                </p>

                {/* Metrics Badges + Actions */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-[11px] border border-slate-200/60">
                      <Layers size={12} className="text-slate-400" />
                      {course.batchCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-100">
                      <Users size={12} className="text-blue-500" />
                      {course.studentCount ?? 0}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(course)}
                      className="h-8 px-2.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold text-xs"
                    >
                      <Pencil size={13} className="mr-1" /> Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(course)}
                      className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ================= 2. DESKTOP / TABLET VIEW (Desktop Screen ke liye) ================= */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[650px]">
            {/* Table Header */}
            <thead className="bg-slate-50/80 border-b border-slate-200/80">
              <tr className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-4 px-6 pl-8">Course</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-center">Batches</th>
                <th className="py-4 px-6 text-center">Students</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 font-medium">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-300 shadow-inner mb-3">
                        <BookOpen size={28} />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                        No Courses Found
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 font-medium">
                        Click "Add Course" to create your first course.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course: any) => (
                  <tr
                    key={course.id}
                    className="group hover:bg-slate-50/80 transition-colors duration-200"
                  >
                    {/* Course Name */}
                    <td className="py-4 px-6 pl-8">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                          <BookOpen size={18} strokeWidth={2.2} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                            {course.course_name}
                          </p>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            ID: #{String(course.id).substring(0, 6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate font-medium">
                      {course.description ? (
                        <span className="text-slate-600">{course.description}</span>
                      ) : (
                        <span className="text-slate-300 italic">No description</span>
                      )}
                    </td>

                    {/* Batch Count */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200/60">
                        <Layers size={13} className="text-slate-400" />
                        {course.batchCount ?? 0}
                      </span>
                    </td>

                    {/* Student Count */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-100">
                        <Users size={13} className="text-blue-500" />
                        {course.studentCount ?? 0}
                      </span>
                    </td>

                    {/* Status Tag */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200/60 capitalize">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {course.status || "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 pr-8 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(course)}
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="Edit Course"
                        >
                          <Pencil size={15} strokeWidth={2.2} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(course)}
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Course"
                        >
                          <Trash2 size={15} strokeWidth={2.2} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}