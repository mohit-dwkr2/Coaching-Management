import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Image as ImageIcon, Upload, Edit2, X, Save, Loader2 } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

export default function GalleryManager() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [gallery, setGalleryState] = useState<any[]>([]);
  const [form, setForm] = useState({ url: "", caption: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    if (!tenant?.id) return; // <--- Tenant check
    const { data, error } = await supabase
      .from("Coaching-3_Gallery")
      .select("*")
      .eq("tenant_id", tenant.id) // <--- Add this line
      .order("created_at", { ascending: false });
    if (data) setGalleryState(data);
  };

  useEffect(() => {
    if (tenantLoading || !tenant?.id) return; // <--- Loading guard
    fetchGallery();
  }, [tenant?.id, tenantLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // --- CLEANUP OLD IMAGE ON EDIT ---
      if (editingId && form.url && form.url.includes('coaching-3_data/')) {
        const oldPath = form.url.split('coaching-3_data/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage.from('coaching-3_data').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${tenant.id}/gallery_images-3/${fileName}`; // <--- tenant.id add kiya

      const { error: uploadError } = await supabase.storage
        .from('coaching-3_data')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('coaching-3_data').getPublicUrl(filePath);
      setForm({ ...form, url: data.publicUrl });
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdate = async () => {
    if (!form.url) return;
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("Coaching-3_Gallery")
          .update({ image_url: form.url, caption: form.caption })
          .eq("id", editingId)
          .eq("tenant_id", tenant.id); // <--- Add this line
        if (error) throw error;
        toast.success("Gallery updated!");
      } else {
        const { error } = await supabase
          .from("Coaching-3_Gallery")
          .insert([{ image_url: form.url, caption: form.caption, tenant_id: tenant.id }]); // <--- tenant_id add kiya
        if (error) throw error;
        toast.success("Added to Gallery!");
      }

      setForm({ url: "", caption: "" });
      setEditingId(null);
      fetchGallery();
    } catch (error: any) {
      toast.error("Error saving: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (g: any) => {
    setEditingId(g.id);
    setForm({ url: g.image_url, caption: g.caption || "" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ url: "", caption: "" });
  };

  // --- UPDATED REMOVE WITH STORAGE CLEANUP ---
  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    setLoading(true);
    try {
      // 1. Image URL fetch karo storage se delete karne ke liye
      // 1. Image URL fetch karo storage se delete karne ke liye
      const { data: item } = await supabase
        .from("Coaching-3_Gallery")
        .select("image_url")
        .eq("id", id)
        .eq("tenant_id", tenant.id) // <--- Add this line
        .single();

      if (item?.image_url && item.image_url.includes('coaching-3_data/')) {
        const filePath = item.image_url.split('coaching-3_data/')[1]?.split('?')[0];
        if (filePath) {
          await supabase.storage.from('coaching-3_data').remove([filePath]);
        }
      }

      // 2. Database row delete karo
      // 2. Database row delete karo
      const { error } = await supabase
        .from("Coaching-3_Gallery")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenant.id); // <--- Add this line

      if (error) throw error;

      toast.success("Image removed");
      fetchGallery();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-0 animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Gallery Manager</h2>
        <p className="text-slate-500 text-sm mt-1">Upload photos from URL or your device gallery.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-10 transition-all hover:shadow-md">
        <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary mb-4">
          {editingId ? "Edit Image Details" : "Add New Image"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 ml-1">Paste Image URL Or Upload From Device</label>
              <div className="flex gap-2">
                <Input
                  className="rounded-xl border-slate-200 text-sm h-11 md:h-10"
                  placeholder="https://images.com/photo.jpg"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="rounded-xl border-slate-200 text-slate-600 shrink-0 h-11 md:h-10 px-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 ml-1">Caption</label>
              <Input
                className="rounded-xl border-slate-200 text-sm h-11 md:h-10"
                placeholder="Student Celebration 2026..."
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
            </div>
          </div>

          <div className="h-40 md:h-full min-h-[160px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
            {form.url ? (
              <img src={form.url} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Preview</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 border-t border-slate-50 pt-6">
          <Button onClick={addOrUpdate} disabled={loading} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20 h-11 sm:h-10 w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingId ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {editingId ? "Update Image" : "Add to Gallery"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={cancelEdit} className="rounded-xl px-6 border-slate-200 text-slate-500 font-bold h-11 sm:h-10 w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 ml-1">Current Photos ({gallery.length})</h3>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {gallery.map((g) => (
          <div key={g.id} className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <div className="aspect-square relative overflow-hidden">
              <img src={g.image_url} alt={g.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

              <div className="absolute inset-0 bg-slate-900/60 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button size="icon" variant="secondary" className="rounded-lg h-10 w-10 bg-white text-slate-900 hover:bg-primary hover:text-white shadow-xl" onClick={() => startEdit(g)}>
                  <Edit2 className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="destructive" className="rounded-lg h-10 w-10 bg-red-500 shadow-xl" onClick={() => remove(g.id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-white">
              <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{g.caption || "No caption"}</p>
            </div>
          </div>
        ))}
      </div>

      {gallery.length === 0 && !loading && (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mx-4 md:mx-0">
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium italic">No images in gallery. Upload one to get started.</p>
        </div>
      )}
    </div>
  );
}