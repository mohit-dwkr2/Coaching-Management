import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, User, Briefcase, BookOpen, Save, Pencil, X, Image as ImageIcon, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient"; // Supabase client check kar lein
import { useTenant } from "@/contexts/TenantContext";

export default function FacultyManager() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oldImageUrl, setOldImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    experience: "",
    image: "",
  });

  // 1. Database se data load karna
  const fetchFaculty = async () => {
    if (!tenant?.id) return;
    const { data, error } = await supabase
      .from("Coaching-3_Faculty")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Fetch faculty error:", error);
      toast.error("Could not load faculty");
      return;
    }
    setFacultyList(data || []);
  };
  useEffect(() => {
    if (tenantLoading || !tenant?.id) return;
    fetchFaculty();
  }, [tenant?.id, tenantLoading]);

  // 2. Image Bucket Upload Logic (coaching-3_data/faculty)
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setLoading(true);

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${tenant.id}/faculty_images-3/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("coaching-3_data")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("coaching-3_data")
        .getPublicUrl(filePath);

      // Nayi image ka URL form mein set karo
      setFormData((prev) => ({
        ...prev,
        image: data.publicUrl,
      }));
      setOldImageUrl(data.publicUrl);

      // Purani image delete karo, agar edit mode mein hai
      if (isEditing && oldImageUrl) {
        const marker = "/storage/v1/object/public/coaching-3_data/";
        const oldPath = oldImageUrl.split(marker)[1];

        if (oldPath?.startsWith(`${tenant.id}/`)) {
          const { error: removeError } = await supabase.storage
            .from("coaching-3_data")
            .remove([oldPath]);

          if (removeError) {
            console.error("Old faculty image removal failed:", removeError);
          }
        }
      }

      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Faculty image upload error:", error);
      toast.error("Upload failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Save ya Update Logic
  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }

    if (!formData.name || !formData.subject || !formData.experience) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    const dbPayload = {
      tenant_id: tenant.id,
      name: formData.name,
      subject: formData.subject,
      experience_years: Number(formData.experience) || 0,
      image_url: formData.image,
    };

    try {
      if (isEditing) {
        await supabase
          .from("Coaching-3_Faculty")
          .update(dbPayload)
          .eq("id", isEditing)
          .eq("tenant_id", tenant.id);
        toast.success("Faculty updated!");
      } else {
        await supabase.from("Coaching-3_Faculty").insert([dbPayload]);
        toast.success("New faculty added!");
      }
      resetForm();
      fetchFaculty();
    } catch (err) {
      toast.error("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", subject: "", experience: "", image: "" });
    setIsEditing(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (member: any) => {
    setFormData({
      name: member.name,
      subject: member.subject,
      experience: member.experience_years.toString(),
      image: member.image_url || "",
    });
    setOldImageUrl(member.image_url || "");
    setIsEditing(member.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (faculty: any) => {
    if (!confirm("Remove this faculty?")) return;

    try {
      // Delete image from bucket
      if (faculty.image_url) {
        const imagePath = faculty.image_url.split(
          "/storage/v1/object/public/coaching-3_data/"
        )[1];

        if (imagePath) {
          await supabase.storage
            .from("coaching-3_data")
            .remove([imagePath]);
        }
      }

      // Delete database row
      const { error } = await supabase
        .from("Coaching-3_Faculty")
        .delete()
        .eq("id", faculty.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      fetchFaculty();

      toast.success("Faculty removed");
    } catch (err) {
      toast.error("Failed to delete faculty");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <Card className={`border-none shadow-xl transition-all duration-300 ${isEditing ? 'ring-2 ring-orange-400 bg-orange-50/20' : 'bg-white'}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-3 text-slate-800">
            <div className={`p-2 rounded-lg ${isEditing ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
              {isEditing ? <Pencil className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </div>
            {isEditing ? "Edit Faculty Profile" : "Add Expert Faculty"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="h-40 w-40 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Upload From Device</p>
                    </div>
                  )}
                  {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                  <Upload className="h-4 w-4" />
                </button>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-2"><User className="h-3.5 w-3.5" /> FULL NAME</label>
                <Input className="bg-slate-50 border-none h-11" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> SUBJECT/ABOUT</label>
                <Input className="bg-slate-50 border-none h-11" placeholder="subject or about" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> EXPERIENCE (YEARS)</label>
                <Input className="bg-slate-50 border-none h-11" type="number" placeholder="0" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5" /> IMAGE URL (OPTIONAL)</label>
                <Input className="bg-slate-50 border-none h-11" placeholder="https://..." value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
              </div>

              <div className="md:col-span-2 flex gap-3 mt-2">
                <Button onClick={handleSave} disabled={loading} className="flex-1 h-11 font-bold shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                  {isEditing ? "Update Changes" : "Confirm & Save"}
                </Button>
                {isEditing && <Button variant="outline" onClick={resetForm} className="h-11 px-6"><X className="h-5 w-5" /></Button>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LIST SECTION */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 px-1">Currently Listed Faculty ({facultyList.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {facultyList.map((f) => (
            <Card key={f.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-0 flex items-center h-28">
                <div className="h-full w-28 bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border-r">
                  {f.image_url ? <img src={f.image_url} alt={f.name} className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-slate-300" />}
                </div>
                <div className="flex-1 px-4 py-2 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{f.name}</h4>
                  <p className="text-[11px] text-primary font-extrabold uppercase mb-1">{f.subject}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1"><Briefcase className="h-3 w-3" /> {f.experience_years} Years</p>
                </div>
                <div className="flex flex-col gap-1 pr-3">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(f)} className="h-8 w-8 text-slate-400 hover:text-orange-500"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(f)} className="h-8 w-8 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}