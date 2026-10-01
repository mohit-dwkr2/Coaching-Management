import { useState, useEffect, useRef } from "react";
import { Layout, Image as ImageIcon, Upload, Save, Type, AlignLeft, Loader2, RefreshCcw, Trash2, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { useTenant } from "@/contexts/TenantContext";

const DEFAULT_HERO = {
  heading: "Where Excellence Meets Ambition",
  subheading: "Empowering K-12 students with expert coaching, proven results, and a clear path to academic greatness — for over 15 years.",
  image_url: "/hero.webp",
  highlight_word: "Excellence" // Default highlight word
};

export default function HeroManager() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroId, setHeroId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    heading: "",
    subheading: "",
    image_url: "",
    highlight_word: "", // New Field
  });

  const fetchHeroData = async () => {
    if (!tenant?.id) return; // <--- Tenant check
    setLoading(true);
    const { data, error } = await supabase
      .from("Coaching-3_Hero")
      .select("*")
      .eq("tenant_id", tenant.id) // <--- Add this line
      .limit(1)
      .maybeSingle(); // single() ki jagah maybeSingle() better rehta hai

    if (!error && data) {
      setHeroId(data.id);
      setForm({
        heading: data.heading || DEFAULT_HERO.heading,
        subheading: data.subheading || DEFAULT_HERO.subheading,
        image_url: data.image_url || DEFAULT_HERO.image_url,
        highlight_word: data.highlight_word || DEFAULT_HERO.highlight_word
      });
    } else {
      // 🔥 Reset ke baad ya data na milne par empty strings ki jagah default values bharein
      setHeroId(null);
      setForm({
        heading: DEFAULT_HERO.heading,
        subheading: DEFAULT_HERO.subheading,
        image_url: DEFAULT_HERO.image_url,
        highlight_word: DEFAULT_HERO.highlight_word
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tenantLoading || !tenant?.id) return;
    fetchHeroData();
  }, [tenant?.id, tenantLoading]);

  const handleHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length > 7) {
      toast.warning("Only 7 words allowed!");
      return;
    }
    setForm({ ...form, heading: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}.${fileExt}`;
    const filePath = `${tenant.id}/hero_images-3/${fileName}`; // <--- tenant.id add kiya

    const { error: uploadError } = await supabase.storage
      .from('coaching-3_data')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('coaching-3_data').getPublicUrl(filePath);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded!");
  };

  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }
    setLoading(true);
    const payload = {
      heading: form.heading.trim() || DEFAULT_HERO.heading,
      subheading: form.subheading.trim() || DEFAULT_HERO.subheading,
      image_url: form.image_url.trim() || DEFAULT_HERO.image_url,
      highlight_word: form.highlight_word.trim(), // Save highlight word
      updated_at: new Date().toISOString()
    };

    let result;
    if (heroId) {
      result = await supabase
        .from("Coaching-3_Hero")
        .update(payload)
        .eq("id", heroId)
        .eq("tenant_id", tenant.id); // <--- Tenant filter add kiya
    } else {
      result = await supabase
        .from("Coaching-3_Hero")
        .insert([{ ...payload, tenant_id: tenant.id }]); // <--- tenant_id payload mein add kiya
    }

    if (!result.error) {
      toast.success("Changes saved successfully!");
      fetchHeroData();
    } else {
      toast.error("Error: " + result.error.message);
    }
    setLoading(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure? This will reset the section to default values.")) return;

    setLoading(true);

    // 1. Database se delete karein
    if (!tenant?.id) return;
    if (heroId) {
      const { error } = await supabase
        .from("Coaching-3_Hero")
        .delete()
        .eq("id", heroId)
        .eq("tenant_id", tenant.id); // <--- Tenant filter add kiya
      if (error) toast.error("Database reset failed");
    }

    // 2. 🔥 FRONTEND STATE FIX: 
    // Hum values ko "" (empty) nahi karenge, balki seedha DEFAULT_HERO se bhar denge.
    setForm({
      heading: DEFAULT_HERO.heading,
      subheading: DEFAULT_HERO.subheading,
      image_url: DEFAULT_HERO.image_url, // Ab ye khali nahi hoga, default image lega
      highlight_word: DEFAULT_HERO.highlight_word
    });

    setHeroId(null);
    setLoading(false);
    toast.success("Section reset to default state");
  };

  // Helper for Preview Highlight
  const renderPreviewHeading = () => {
    const text = form.heading || DEFAULT_HERO.heading;
    const highlight = form.highlight_word.toLowerCase();
    if (!highlight) return text;

    return text.split(/\s+/).map((word, i) => (
      <span key={i} className={word.toLowerCase().replace(/[^\w]/g, '') === highlight ? "text-primary" : ""}>
        {word}{" "}
      </span>
    ));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hero Section Manager</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Customize text, images, and highlights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button variant="outline" size="icon" onClick={fetchHeroData} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-md border-primary/10">
            <CardHeader className="p-4 md:p-6 pb-2">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" /> Content Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-5">

              {/* Heading Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" /> Main Heading
                  </label>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono">
                    {form.heading.split(/\s+/).filter(Boolean).length}/7 Words
                  </span>
                </div>
                <Input
                  value={form.heading}
                  onChange={handleHeadingChange}
                  placeholder="Enter main heading..."
                />
              </div>

              {/* Highlight Word Input - NEW FIELD */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Highlighter className="w-4 h-4 text-blue-700" /> Word to Highlight (blue Color)
                </label>
                <Input
                  value={form.highlight_word}
                  onChange={(e) => setForm({ ...form, highlight_word: e.target.value })}
                  placeholder="Example: Excellence"
                  className="border-blue-200 focus:ring-blue-500"
                />
                <p className="text-[10px] text-muted-foreground italic">Type the exact word from the heading you want to color blue.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-primary" /> Subheading
                </label>
                <Textarea
                  value={form.subheading}
                  onChange={(e) => setForm({ ...form, subheading: e.target.value })}
                  placeholder="Enter description..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" /> Background Image
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="w-4 h-4 mr-2" />} Upload From Device
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full h-11">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save All Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-5">
          <Card className="lg:sticky lg:top-6 border-dashed border-2 shadow-none bg-muted/20">
            <CardHeader className="p-4 pb-2 text-center text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              Live Preview
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-xl border overflow-hidden bg-background shadow-lg">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={form.image_url || DEFAULT_HERO.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-base font-bold leading-tight">
                    {renderPreviewHeading()}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {form.subheading || DEFAULT_HERO.subheading}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}