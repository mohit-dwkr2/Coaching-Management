import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Trophy, Image as ImageIcon, Upload, Save, Pencil, X, GraduationCap, Calendar, Star, Loader2, BookOpen, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { useTenant } from "@/contexts/TenantContext";

export default function TopperManager() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [toppers, setToppers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    marks: "",
    year: "",
    image: "",
    student_class: "",
  });

  const fetchToppers = async () => {
    if (!tenant?.id) return; // <--- Tenant guard
    setLoading(true);
    const { data, error } = await supabase
      .from("Coaching-3_Toppers")
      .select("*")
      .eq("tenant_id", tenant.id) // <--- Add this line
      .order("created_at", { ascending: false });

    if (data) {
      setToppers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tenantLoading || !tenant?.id) return; // <--- Guard
    fetchToppers();
  }, [tenant?.id, tenantLoading]);


  // --- UPDATED HANDLE FILE CHANGE (Cleans up old image on edit) ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }

    try {
      setLoading(true);

      // 1. AGAR EDIT MODE HAI: Toh nayi upload karne se pehle PURANI delete karo
      if (isEditing && form.image && form.image.includes('coaching-3_data/')) {
        const oldPath = form.image.split('coaching-3_data/')[1]?.split('?')[0];
        if (oldPath && oldPath.startsWith(`${tenant.id}/`)) {
          await supabase.storage.from('coaching-3_data').remove([oldPath]);
        }
      }

      // 2. Nayi file upload karo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${tenant.id}/toppers_images-3/${fileName}`; // <--- Tenant scoped path

      const { error: uploadError } = await supabase.storage
        .from('coaching-3_data')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('coaching-3_data').getPublicUrl(filePath);

      setForm({ ...form, image: data.publicUrl });
      toast.success("New photo uploaded!");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }

    if (!form.name) {
      toast.error("Please fill Student Name");
      return;
    }

    setLoading(true);

    const dbPayload = {
      tenant_id: tenant.id, // <--- Add tenant_id here
      name: form.name,
      percentage: form.marks.trim() === "" ? null : form.marks,
      batch_year: form.year.trim() === "" ? null : form.year,
      image_url: form.image,
      student_class: form.student_class,
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("Coaching-3_Toppers")
          .update(dbPayload)
          .eq("id", isEditing)
          .eq("tenant_id", tenant.id); // <--- Add this line
        if (error) throw error;
        toast.success("Topper updated!");
      } else {
        const { error } = await supabase
          .from("Coaching-3_Toppers")
          .insert([dbPayload]);
        if (error) throw error;
        toast.success("Topper added successfully!");
      }

      resetForm();
      fetchToppers();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", marks: "", year: "", image: "", student_class: "" });
    setIsEditing(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (t: any) => {
    setForm({
      name: t.name || "",
      marks: t.percentage ? t.percentage.toString() : "",
      year: t.batch_year ? t.batch_year.toString() : "",
      image: t.image_url || "",
      student_class: t.student_class || ""
    });
    setIsEditing(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this topper permanently?")) return;

    setLoading(true);
    try {
      if (!tenant?.id) return;

      const { data: topper } = await supabase
        .from("Coaching-3_Toppers")
        .select("image_url")
        .eq("id", id)
        .eq("tenant_id", tenant.id) // <--- Add this line
        .single();

      if (topper?.image_url && topper.image_url.includes('coaching-3_data/')) {
        const filePath = topper.image_url.split('coaching-3_data/')[1]?.split('?')[0];
        if (filePath && filePath.startsWith(`${tenant.id}/`)) {
          await supabase.storage.from('coaching-3_data').remove([filePath]);
        }
      }

      await supabase
        .from("Coaching-3_Toppers")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenant.id); // <--- Add this line

      toast.success("Removed successfully");
      fetchToppers();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Toppers Manager</h2>
          <p className="text-sm text-slate-500">Add, Edit And Delete Toppers</p>
        </div>
      </div>

      <Card className={`border-none shadow-xl transition-all ${isEditing ? 'ring-2 ring-blue-500 bg-blue-50/10' : 'bg-white'}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {isEditing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditing ? "Update Student Record" : "Add New Achievement"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-32 w-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.image ? (
                  <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
              <span className="text-[10px] font-bold text-slate-500 text-center uppercase">Upload from Device</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><GraduationCap className="h-3 w-3" /> STUDENT NAME</label>
                <Input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><BookOpen className="h-3 w-3" /> CLASS</label>
                <Input type="number" placeholder="10th or 12th" value={form.student_class} onChange={(e) => setForm({ ...form, student_class: e.target.value })} className="h-11 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><Star className="h-3 w-3" /> PERCENTAGE</label>
                <Input placeholder="95" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} className="h-11 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><Calendar className="h-3 w-3" /> BATCH YEAR</label>
                <Input placeholder="2026" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="h-11 bg-slate-50/50" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><Link className="h-3 w-3" /> IMAGE URL (PASTE FROM WEB)</label>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="h-11 bg-slate-50/50 border-blue-100 focus:border-blue-300"
                />
              </div>

              <div className="md:col-span-2 flex gap-2 pt-2">
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-11 font-bold">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isEditing ? "Save Changes" : "Add Topper"}
                </Button>
                {isEditing && <Button variant="outline" onClick={resetForm} className="h-11"><X className="h-4 w-4" /></Button>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {toppers.map((t) => (
          <Card key={t.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="p-4 flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                {t.image_url ? (
                  <img src={t.image_url} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-yellow-50"><Trophy className="h-6 w-6 text-yellow-500" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 truncate">{t.name}</h4>
                <div className="flex flex-col mt-0.5">
                  <span className="text-[11px] text-slate-500 font-medium italic">Class {t.student_class}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-blue-600">{t.percentage}%</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">{t.batch_year}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-500" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}