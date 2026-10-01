import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { supabase } from "@/supabaseClient";
import { generateStudentId } from "@/utils/studentUtils";
import { toast } from "sonner";

import { getNextRollNumber } from "@/utils/rollNumberUtils";
import { updateBatchStudentCount } from "@/utils/batchUtils";
import { ChevronDown, Loader2, UserPlus, X } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface ManualAdmissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function ManualAdmissionDrawer({

  isOpen,
  onClose,
  onCreated,

}: ManualAdmissionDrawerProps) {
  const { tenant } = useTenant();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");

  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    if (!tenant?.id) return;

    const { data, error } = await supabase
      .from("Coaching-3_Courses")
      .select("id, course_name")
      .eq("tenant_id", tenant.id)
      .eq("status", "active")
      .order("course_name");

    if (!error && data) {
      setCourses(data);
    }
  };


  useEffect(() => {
    if (!isOpen || !tenant?.id) return;

    fetchCourses();

    setName("");
    setMobile("");
    setEmail("");
    setSelectedCourse("");
    setSelectedBatch("");
    setBatches([]);
  }, [isOpen, tenant?.id]);


  const fetchBatches = async (courseId: string) => {
    if (!courseId || !tenant?.id) {
      setBatches([]);
      return;
    }

    const { data, error } = await supabase
      .from("Coaching-3_StudentBatches")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("course_id", courseId)
      .eq("status", "active")
      .order("batch_name");

    if (!error && data) {
      setBatches(data);
    }
  };



  const createStudent = async () => {
    if (!tenant?.id) {
      toast.error("Coaching tenant is not loaded.");
      return;
    }

    // --------------------
    // Validation
    // --------------------

    if (!name.trim()) {
      toast.error("Student name is required.");
      return;
    }

    if (name.trim().length < 3) {
      toast.error("Name must be at least 3 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile.trim())) {
      toast.error("Enter a valid 10 digit mobile number.");
      return;
    }

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (!selectedCourse) {
      toast.error("Please select a course.");
      return;
    }

    // --------------------
    // Duplicate Mobile Check
    // --------------------

    const { data: mobileExists, error: mobileCheckError } = await supabase
      .from("Coaching-3_Students")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("mobile", mobile.trim())
      .maybeSingle();

    if (mobileCheckError) {
      toast.error("Could not check mobile number. Please try again.");
      return;
    }

    if (mobileExists) {
      toast.error("A student with this mobile number already exists.");
      return;
    }

    // --------------------
    // Duplicate Email Check
    // --------------------

    const { data: emailExists, error: emailCheckError } = await supabase
      .from("Coaching-3_Students")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("email", email.trim())
      .maybeSingle();

    if (emailCheckError) {
      toast.error("Could not check email. Please try again.");
      return;
    }

    if (emailExists) {
      toast.error("A student with this email already exists.");
      return;
    }

    try {

      setLoading(true);

      const studentId = await generateStudentId(tenant.id)

      const selectedBatchData =
        batches.find(
          batch => batch.id === selectedBatch
        );

      let rollNumber = null;

      if (selectedBatch) {
        rollNumber = await getNextRollNumber(selectedBatch, tenant.id);
      }

      const { error } = await supabase
        .from("Coaching-3_Students")
        .insert({
          tenant_id: tenant.id,

          student_id: studentId,

          user_id: null,

          name: name.trim(),

          email: email.trim(),

          mobile: mobile.trim(),

          course_id: selectedCourse,

          batch_id:
            selectedBatch || null,

          batch:
            selectedBatchData?.batch_name ||
            "Not Assigned",

          roll_number: rollNumber,

          status: "active",

          notes_access: true,

          joined_at:
            new Date()
              .toISOString()
              .split("T")[0],

          updated_at:
            new Date().toISOString(),

        });

      if (error) throw error;

      if (selectedBatch) {
        await updateBatchStudentCount(selectedBatch, tenant.id);
      }
      toast.success("Student admitted successfully.");
      await onCreated();
      onClose();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);

    }

  };



  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/80 shrink-0">
              <UserPlus size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Manual Admission
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Create a new student directly from the admin panel.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all shrink-0 active:scale-95"
            title="Close Drawer"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Body Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Student Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              Student Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter student name"
                className="w-full h-12 bg-slate-50/80 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full h-12 bg-slate-50/80 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full h-12 bg-slate-50/80 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          {/* Course */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              Course <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedBatch("");
                  fetchBatches(e.target.value);
                }}
                className="w-full h-12 bg-slate-50/80 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
            </div>
          </div>

          {/* Batch */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Batch <span className="text-slate-400 font-medium normal-case">(Optional)</span>
            </label>
            <div className="relative group">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={!selectedCourse}
                className="w-full h-12 bg-slate-50/80 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer pr-10 disabled:bg-slate-100/80 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">Not Assigned</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
            </div>

            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mt-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></span>
              <p className="text-xs text-slate-500 font-medium">
                If no batch is selected, the student will be added as{" "}
                <span className="font-bold text-slate-700">Not Assigned</span>.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 flex items-center gap-3 shrink-0 bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm active:scale-95 transition-all"
          >
            Cancel
          </Button>

          <Button
            onClick={createStudent}
            disabled={loading}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Creating...
              </span>
            ) : (
              "Create Student"
            )}
          </Button>
        </div>

      </div>
    </>
  );
}