import { Layers, Users, Pencil, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchTableProps {
  batches: any[];
  onEdit: (batch: any) => void;
  onDelete: (batch: any) => void;
}

export default function BatchTable({
  batches,
  onEdit,
  onDelete,
}: BatchTableProps) {



  const formatTime = (time: string) => {
    if (!time) return "—";

    const [hours, minutes] = time.split(":");
    const hour = Number(hours);

    const hour12 = hour % 12 || 12;
    const period = hour >= 12 ? "PM" : "AM";

    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <div className="w-full relative">
      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">


        {/* ================= 1. MOBILE CARD VIEW (Mobile Screen ke liye) ================= */}
        <div className="block sm:hidden space-y-3 bg-slate-50/50 p-2 rounded-2xl">
          {batches.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-300 mx-auto mb-3">
                <Layers size={28} />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                No Batches Found
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                Click "Create Batch" to create your first batch.
              </p>
            </div>
          ) : (
            batches.map((batch: any) => (
              <div
                key={batch.id}
                className="p-3.5 space-y-3 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                {/* Top Header: Batch Name + Status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Layers size={16} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                        {batch.batch_name}
                      </h4>
                      {batch.course?.course_name && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] truncate max-w-full">
                          {batch.course.course_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200/60 shrink-0 capitalize">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {batch.status || "Active"}
                  </span>
                </div>

                {/* Timing & Capacity Badges */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                    <Clock size={13} className="text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Timing</p>
                      <p className="text-[9px] sm:text-xs font-extrabold text-slate-700 truncate mt-0.5">
                        {formatTime(batch.start_time)} - {formatTime(batch.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                    <Users size={13} className="text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Students</p>
                      <p className="text-xs font-extrabold text-slate-700 truncate mt-0.5">
                        {batch.studentCount}/{batch.max_students}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-1 pt-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(batch)}
                    className="h-8 px-2.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold text-xs"
                  >
                    <Pencil size={13} className="mr-1" /> Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(batch)}
                    className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </Button>
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
              <tr className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-4 px-6 pl-8">Batch</th>
                <th className="py-4 px-6">Course</th>
                <th className="py-4 px-6 text-center">Timing</th>
                <th className="py-4 px-6 text-center">Students</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 font-medium">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-300 shadow-inner mb-3">
                        <Layers size={28} />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                        No Batches Found
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 font-medium">
                        Click "Create Batch" to create your first batch.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((batch: any) => (
                  <tr
                    key={batch.id}
                    className="group hover:bg-slate-50/80 transition-colors duration-200"
                  >
                    {/* Batch Name */}
                    <td className="py-4 px-6 pl-8">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                          <Layers size={18} strokeWidth={2.2} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                            {batch.batch_name}
                          </p>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            ID: #{String(batch.id).substring(0, 6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Course Name */}
                    <td className="py-4 px-6 text-xs font-semibold text-slate-700">
                      {batch.course?.course_name ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 font-bold text-slate-800">
                          {batch.course.course_name}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Timing */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-slate-700 font-extrabold text-xs border border-slate-200/60">
                        <Clock size={13} className="text-indigo-500" />
                      {formatTime(batch.start_time)} - {formatTime(batch.end_time)}
                      </span>
                    </td>

                    {/* Student Count / Max Capacity */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-100">
                        <Users size={13} className="text-blue-500" />
                        {batch.studentCount}/{batch.max_students}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200/60 capitalize">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {batch.status || "Active"}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 pr-8 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(batch)}
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="Edit Batch"
                        >
                          <Pencil size={15} strokeWidth={2.2} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(batch)}
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Batch"
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