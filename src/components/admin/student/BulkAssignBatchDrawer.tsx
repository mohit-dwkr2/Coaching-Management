import { CheckCircle2, Layers, Users, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/supabaseClient";
import { updateBatchStudentCount } from "@/utils/batchUtils";
import { toast } from "sonner";
import { getHighestRollNumber } from "@/utils/rollNumberUtils";

interface BulkAssignBatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  onAssigned: () => void;
}

export default function BulkAssignBatchDrawer({
  isOpen,
  onClose,
  students,
  onAssigned,
}: BulkAssignBatchDrawerProps) {
  const { tenant } = useTenant();

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const courseId = students[0]?.course_id;

  const fetchBatches = useCallback(async () => {
    if (!tenant?.id || !courseId) {
      setBatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("Coaching-3_StudentBatches")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("course_id", courseId)
      .eq("status", "active")
      .order("batch_name");

    if (error) {
      console.error("Failed to load batches:", error);
      setBatches([]);
      toast.error("Failed to load batches.");
    } else {
      setBatches(data ?? []);
    }

    setIsLoading(false);
  }, [tenant?.id, courseId]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedBatch("");
    void fetchBatches();
  }, [isOpen, fetchBatches]);

  if (!isOpen) return null;


  const assignBulkBatch = async () => {
    if (!tenant?.id) {
      toast.error("Tenant information is missing.");
      return;
    }

    if (!students.length) {
      toast.error("No students selected.");
      return;
    }

    if (!selectedBatch) {
      toast.error("Please select a batch.");
      return;
    }

    if (students.some((student) => student.course_id !== courseId)) {
      toast.error("Select students from the same course.");
      return;
    }

    setIsAssigning(true);

    const oldBatchIds = [
      ...new Set(
        students
          .map((student) => student.batch_id)
          .filter(Boolean)
      ),
    ];


    try {
      const selected = batches.find(
        (batch) => batch.id === selectedBatch
      );

      if (!selected) {
        toast.error("Batch not found.");
        setIsAssigning(false);
        return;
      }

      let highestRoll = await getHighestRollNumber(
        selectedBatch,
        tenant.id
      );

      for (const student of students) {
        let rollNumber = student.roll_number;

        if (student.batch_id !== selectedBatch) {
          highestRoll++;
          rollNumber = highestRoll;
        }

        const { error } = await supabase
          .from("Coaching-3_Students")
          .update({
            batch_id: selectedBatch,
            batch: selected.batch_name,
            roll_number: rollNumber,
            updated_at: new Date().toISOString(),
          })
          .eq("id", student.id)
          .eq("tenant_id", tenant.id);

        if (error) throw error;
      }

      for (const batchId of oldBatchIds) {
        await updateBatchStudentCount(batchId, tenant.id);
      }

      await updateBatchStudentCount(selectedBatch, tenant.id);
      toast.success("Students assigned successfully.");

      onAssigned();
      onClose();
    } catch (err) {
      console.error("Failed to assign students to batch:", err);
      toast.error("Failed to assign students to batch.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      {/* Backdrop Overlay with Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-slate-50 z-[70] shadow-2xl flex flex-col border-l border-slate-200 transition-transform duration-300 ease-in-out">

        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Bulk Assign Batch
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-slate-400">
                  Target Selection:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
                  {students.length} Students Selected
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

          {/* Target Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Selected Pool
                </p>
                <p className="text-sm font-extrabold text-slate-800">
                  {students.length} {students.length === 1 ? "Student" : "Students"} Ready
                </p>
              </div>
            </div>
          </div>

          {/* Batch Selection Box OR Skeleton Loader */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 animate-pulse">
              <div className="h-3 w-28 bg-slate-200 rounded"></div>
              <div className="h-12 w-full bg-slate-100 rounded-xl"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                Available Batches
              </label>

              <div className="relative">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Choose target batch...</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name}
                    </option>
                  ))}
                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Layers size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Empty State: Fetching complete hone par agar koi batches nahi hai tab hi dikhega */}
          {!isLoading && batches.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
              <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                <Layers size={24} />
              </div>
              <p className="font-extrabold text-slate-800 text-sm pt-1">
                No Batches Found
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Please add batches before attempting bulk assignment.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-slate-200/80 shrink-0 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAssigning}
            className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
          >
            Cancel
          </Button>

          <Button
            onClick={assignBulkBatch}
            disabled={!selectedBatch || isAssigning || isLoading}
            className="flex-1 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {isAssigning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Batch"
            )}
          </Button>
        </div>

      </div>
    </>
  );
}