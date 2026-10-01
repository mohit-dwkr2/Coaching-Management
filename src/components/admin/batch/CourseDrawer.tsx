import { useState, useEffect } from "react";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

interface CourseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: () => void;
  selectedCourse: any;
}

export default function CourseDrawer({
  isOpen,
  onClose,
  onCourseCreated,
  selectedCourse,
}: CourseDrawerProps) {
  const { tenant, loading: tenantLoading } = useTenant();

  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");


  const saveCourse = async () => {
    if (tenantLoading || !tenant?.id) {
      toast.error("Tenant not found. Please try again.");
      return;
    }

    if (!courseName.trim()) {
      toast.error("Course name is required.");
      return;
    }

    try {

      if (selectedCourse) {

        // UPDATE

        const { error } = await supabase
          .from("Coaching-3_Courses")
          .update({
            course_name: courseName.trim(),
            description: description.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedCourse.id)
          .eq("tenant_id", tenant.id);

        if (error) throw error;

        toast.success("Course updated successfully.");

      } else {

        // CREATE

        const { error } = await supabase
          .from("Coaching-3_Courses")
          .insert({
            tenant_id: tenant.id,
            course_name: courseName.trim(),
            description: description.trim(),
            status: "active",
          });

        if (error) throw error;

        toast.success("Course created successfully.");

      }

      setCourseName("");
      setDescription("");

      onCourseCreated();

      onClose();

    } catch (err: any) {

      toast.error(err.message);

    }

  };


  useEffect(() => {
  if (tenantLoading) return;

  if (!tenant?.id) {
    setCourseName("");
    setDescription("");
    return;
  }

  if (selectedCourse) {
    setCourseName(selectedCourse.course_name || "");
    setDescription(selectedCourse.description || "");
  } else {
    setCourseName("");
    setDescription("");
  }
}, [selectedCourse, tenant?.id, tenantLoading]);


  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity duration-300 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                {selectedCourse ? "Edit Course" : "Create New Course"}
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                {selectedCourse
                  ? "Update course details."
                  : "Add a new course program to your institute."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close drawer"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Course Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Class 10th - Science & Math"
              className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-semibold transition-all focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Description
              </label>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Optional</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add brief details about the syllabus, target audience, or requirements..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white p-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 p-5 bg-slate-50/30 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 px-5 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={saveCourse}
            className="flex-1 h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            {selectedCourse ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </div>
    </>
  );
}