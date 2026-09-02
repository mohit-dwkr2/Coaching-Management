import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Layers, Plus } from "lucide-react";

import BatchTable from "./BatchTable";
import BatchDrawer from "./BatchDrawer";
import { toast } from "sonner";


interface BatchSectionProps {
  onUpdated: () => void;
}

export default function BatchSection({
  onUpdated,
}: BatchSectionProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [batches, setBatches] = useState<any[]>([]);

  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const fetchBatches = async () => {
    const { data: batches, error } = await supabase
      .from("Coaching-3_StudentBatches")
      .select(`
    *,
    course:course_id (
      id,
      course_name
    )
  `)
      .order("batch_name");

    if (error) return;

    // Students fetch
    const { data: students } = await supabase
      .from("Coaching-3_Students")
      .select("batch_id")
      .eq("status", "active");

    const finalBatches = batches.map((batch) => {

      const studentCount =
        students?.filter(
          s => s.batch_id === batch.id
        ).length || 0;

      return {
        ...batch,
        studentCount,
      };

    });

    setBatches(finalBatches);
    onUpdated();
  };
  useEffect(() => {
    fetchBatches();
  }, []);


  const deleteBatch = async (batch: any) => {

    if (batch.studentCount > 0) {

      toast.error(
        "Cannot delete batch. Move students first."
      );

      return;

    }

    if (
      !window.confirm(
        `Delete "${batch.batch_name}" ?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("Coaching-3_StudentBatches")
      .delete()
      .eq("id", batch.id);

    if (error) {

      toast.error(error.message);

      return;

    }

    toast.success("Batch deleted.");

    await fetchBatches();

  };


  return (
    <div className="relative w-full bg-white rounded-3xl border border-slate-200/90 shadow-xs mt-8">

      {/* Modern Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 via-white to-slate-50/30 rounded-t-3xl">

        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Layers size={22} strokeWidth={2.2} />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Batches
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200/60">
                {batches?.length || 0} Total
              </span>
            </div>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
              Create and manage coaching batches.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="h-11 sm:h-12 px-5 sm:px-6 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 shrink-0 self-start sm:self-auto flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Create Batch</span>
        </Button>

      </div>

      {/* Table Inner Content */}
      <div className="p-3 sm:p-6">
        <BatchTable
          batches={batches}
          onEdit={(batch) => {
            setSelectedBatch(batch);
            setIsDrawerOpen(true);
          }}
          onDelete={deleteBatch}
        />
      </div>

      {/* Drawer Component */}
      <BatchDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setSelectedBatch(null);
          setIsDrawerOpen(false);
        }}
        selectedBatch={selectedBatch}
        onBatchCreated={fetchBatches}
      />

    </div>
  );
}