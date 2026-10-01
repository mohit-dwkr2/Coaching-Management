import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Edit2, X, Save, Loader2 } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function BatchManager() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [batches, setBatchState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ className: "", subjects: "", timing: "", fees: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchBatches = async () => {
    if (tenantLoading) return;
    if (!tenant?.id) {
      setBatchState([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("Coaching-3_Batches")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch batches error:", error);
      toast.error("Unable to load batches.");
    } else {
      setBatchState(data ?? []);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (tenantLoading) return;
    fetchBatches();
  }, [tenant?.id, tenantLoading]);


  const addOrUpdate = async () => {
    if (!tenant?.id) {
      toast.error("Coaching could not be identified.");
      return;
    }

    if (!form.className.trim()) {
      toast.error("Please enter class.");
      return;
    }

    const batchData = {
      class_name: form.className.trim(),
      subjects: form.subjects.trim(),
      start_time: form.timing.trim(),
      price: Number(form.fees) || 0,
    };

    if (editingId) {
      const { error } = await supabase
        .from("Coaching-3_Batches")
        .update(batchData)
        .eq("id", editingId)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("Update batch error:", error);
        toast.error("Unable to update batch.");
        return;
      }

      setEditingId(null);
      toast.success("Batch updated.");
    } else {
      const { error } = await supabase
        .from("Coaching-3_Batches")
        .insert([
          {
            ...batchData,
            tenant_id: tenant.id,
          },
        ]);

      if (error) {
        console.error("Add batch error:", error);
        toast.error("Unable to add batch.");
        return;
      }

      toast.success("Batch added.");
    }
    setForm({ className: "", subjects: "", timing: "", fees: "" });
    await fetchBatches();
  };

  const startEdit = (b: any) => {
    setEditingId(b.id);
    setForm({
      className: b.class_name,
      subjects: b.subjects,
      timing: b.start_time,
      fees: b.price.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ className: "", subjects: "", timing: "", fees: "" });
  };

  const remove = async (id: string) => {
    if (!tenant?.id) {
      toast.error("Coaching could not be identified.");
      return;
    }

    const { error } = await supabase
      .from("Coaching-3_Batches")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (error) {
      console.error("Delete batch error:", error);
      toast.error("Unable to delete batch.");
      return;
    }

    toast.success("Batch deleted.");
    await fetchBatches();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-0 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Batch Manager</h2>
          <p className="text-slate-500 text-sm mt-1">Add, Edit And Delete Batches.</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">
          {editingId ? "Edit Batch Details" : "Add New Batch"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <Input placeholder="Course Title" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="text-sm" />

          <Input type="number" placeholder="Class" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} className="text-sm" />

          <Input placeholder="Timing" value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} className="text-sm" />

          <Input type="number" placeholder="Fees" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} className="text-sm" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={addOrUpdate} disabled={loading} className="flex-1 sm:flex-none h-11 sm:h-10">
            {editingId ? <><Save className="h-4 w-4 mr-2" /> Update</> : <><Plus className="h-4 w-4 mr-2" /> Add Batch</>}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={cancelEdit} className="flex-1 sm:flex-none h-11 sm:h-10">
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Batches List */}
      <div className="grid gap-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          batches.map((b) => (
            <div key={b.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-white rounded-2xl border border-slate-200 gap-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-sm md:text-base">
                  {b.class_name?.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm md:text-base truncate">Class {b.class_name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] md:text-xs text-slate-500">
                    <span className="truncate max-w-[120px] sm:max-w-none">{b.subjects}</span>
                    <span className="hidden xs:inline">|</span>
                    <span>{b.start_time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                <p className="text-lg font-black text-slate-900">₹{b.price}</p>
                <div className="flex gap-1 md:gap-2">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(b)} className="h-9 w-9 text-slate-400 hover:text-primary"><Edit2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-destructive" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}