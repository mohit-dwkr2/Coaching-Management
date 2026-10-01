import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { X, Users, Layers, CalendarCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { updateBatchStudentCount } from "@/utils/batchUtils";
import { getNextRollNumber } from "@/utils/rollNumberUtils";

interface AssignBatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onAssigned: () => void;
}

export default function AssignBatchDrawer({
  isOpen,
  onClose,
  student,
  onAssigned,
}: AssignBatchDrawerProps) {
  const { tenant } = useTenant();
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");

  const fetchBatches = useCallback(async () => {
    if (!tenant?.id || !student?.course_id) {
      setBatches([]);
      return;
    }

    const { data, error } = await supabase
      .from("Coaching-3_StudentBatches")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("course_id", student.course_id)
      .eq("status", "active")
      .order("batch_name");

    if (error) {
      console.error("Failed to load batches:", error);
      setBatches([]);
      toast.error("Failed to load batches.");
      return;
    }

    setBatches(data ?? []);
  }, [tenant?.id, student?.course_id]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedBatch("");
    void fetchBatches();
  }, [isOpen, fetchBatches]);

  if (!isOpen) return null;


  const assignBatch = async () => {
    if (!tenant?.id || !student?.id) {
      toast.error("Tenant or student information is missing.");
      return;
    }

    if (!selectedBatch) {
      toast.error("Please select a batch.");
      return;
    }

    const selected = batches.find((batch) => batch.id === selectedBatch);

    if (!selected) {
      toast.error("Please select a valid batch.");
      return;
    }

    const oldBatchId = student.batch_id;

    try {
      let rollNumber = student.roll_number;

      if (oldBatchId !== selectedBatch) {
        rollNumber = await getNextRollNumber(selectedBatch, tenant.id);
      }

      const { error } = await supabase
        .from("Coaching-3_Students")
        .update({
          batch_id: selectedBatch,
          batch: selected.batch_name || "",
          roll_number: rollNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      // Update batch counts only after the student update succeeds.
      if (oldBatchId && oldBatchId !== selectedBatch) {
        await updateBatchStudentCount(oldBatchId, tenant.id);
      }

      if (oldBatchId !== selectedBatch) {
        await updateBatchStudentCount(selectedBatch, tenant.id);
      }

      toast.success("Batch assigned successfully.");
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Failed to assign batch:", error);
      toast.error("Failed to assign batch.");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to assign batch."
      );
    }
  };



  return (
    <>
      {/* Backdrop Overlay with Smooth Fade */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
      />

      {/* Drawer Side Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-slate-50 z-[70] shadow-2xl flex flex-col border-l border-slate-200 transition-transform duration-300 ease-in-out">

        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Assign Batch
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Assign this student to an active coaching batch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

          {/* Student Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-3">
              Student Details
            </p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200/60 flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner shrink-0">
                {student?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 truncate text-base">
                  {student?.name || "N/A"}
                </p>
                <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-wide">
                  ID: {student?.student_id || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Course Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-3">
              Enrolled Course
            </p>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200/60 text-indigo-600">
                <Layers size={18} />
              </div>
              <span className="font-extrabold text-slate-800 text-sm truncate">
                {student?.course?.course_name || "No Course Enrolled"}
              </span>
            </div>
          </div>

          {/* Batch Selector Input */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <label className="text-xs uppercase tracking-widest font-black text-slate-400 block mb-2">
              Select Batch
            </label>

            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
              >
                <option value="">Choose a batch from list...</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_name}
                  </option>
                ))}
              </select>

              {/* Dropdown Chevron Icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <CalendarCheck size={18} />
              </div>
            </div>
          </div>

          {/* Empty State when no batches are available */}
          {batches.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white p-8 text-center shadow-sm space-y-2">
              <div className="h-14 w-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Users size={28} />
              </div>
              <p className="font-extrabold text-slate-800 text-base pt-2">
                No Active Batches
              </p>
              <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
                There are no active batches found for this course. Please create a new batch in settings first.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200/80 p-5 bg-white flex gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
          >
            Cancel
          </Button>

          <Button
            onClick={assignBatch}
            disabled={!selectedBatch}
            className="flex-1 h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none transition-all"
          >
            Assign Batch
          </Button>
        </div>

      </div>
    </>
  );
}