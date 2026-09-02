import { useState, useEffect } from "react";
import { ChevronDown, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";

interface BatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated: () => void;
  selectedBatch: any;
}

export default function BatchDrawer({
  isOpen,
  onClose,
  onBatchCreated,
  selectedBatch,
}: BatchDrawerProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [batchName, setBatchName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [days, setDays] = useState("Daily");
  const [maxStudents, setMaxStudents] = useState("");

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("Coaching-3_Courses")
      .select("*")
      .eq("status", "active")
      .order("course_name");

    if (data) {
      setCourses(data);
    }
  };
  useEffect(() => {
    fetchCourses();
  }, []);


  useEffect(() => {

    if (selectedBatch) {

      setSelectedCourse(selectedBatch.course_id || "");
      setBatchName(selectedBatch.batch_name || "");
      setDescription(selectedBatch.description || "");
      setStartTime(selectedBatch.start_time || "");
      setEndTime(selectedBatch.end_time || "");
      setDays(selectedBatch.days || "Daily");
      setMaxStudents(String(selectedBatch.max_students || ""));

    } else {

      setSelectedCourse("");
      setBatchName("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setDays("Daily");
      setMaxStudents("");

    }

  }, [selectedBatch]);


  const saveBatch = async () => {

    if (!selectedCourse) {
      toast.error("Please select a course.");
      return;
    }

    if (!batchName.trim()) {
      toast.error("Batch name is required.");
      return;
    }

    if (!startTime) {
      toast.error("Please select start time.");
      return;
    }

    if (!endTime) {
      toast.error("Please select end time.");
      return;
    }

    try {

      if (selectedBatch) {

        // UPDATE

        const { error } = await supabase
          .from("Coaching-3_StudentBatches")
          .update({
            course_id: selectedCourse,
            batch_name: batchName.trim(),
            description: description.trim(),
            start_time: startTime,
            end_time: endTime,
            days,
            max_students: Number(maxStudents),
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedBatch.id);

        if (error) throw error;

        toast.success("Batch updated successfully.");

      } else {

        // CREATE

        const { error } = await supabase
          .from("Coaching-3_StudentBatches")
          .insert({
            course_id: selectedCourse,
            batch_name: batchName.trim(),
            description: description.trim(),
            start_time: startTime,
            end_time: endTime,
            days,
            max_students: Number(maxStudents),
            student_count: 0,
            status: "active",
          });

        if (error) throw error;

        toast.success("Batch created successfully.");

      }

      setSelectedCourse("");
      setBatchName("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setDays("Daily");
      setMaxStudents("");

      onBatchCreated();
      onClose();

    } catch (err: any) {

      toast.error(err.message);

    }

  };


  // Agar drawer open nahi hai to kuch bhi render mat karo
  if (!isOpen) return null;

  // Final Return Statement jo missing tha
  return (
    <>
      {/* Overlay Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                {selectedBatch ? "Edit Batch" : "Create New Batch"}
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                {selectedBatch
                  ? "Update batch details and schedules."
                  : "Configure schedule and limits for the new batch."}
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

        {/* Form Fields */}

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Course Select */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Course <span className="text-rose-500">*</span>
            </label>

            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={!!selectedBatch}
                className={`w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none ${selectedBatch
                    ? "bg-slate-100 cursor-not-allowed text-slate-500"
                    : "bg-slate-50/50 focus:bg-white cursor-pointer"
                  }`}
              >
                <option value="">Choose a course</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>

            {selectedBatch && (
              <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                Course cannot be changed after batch creation.
              </p>
            )}
          </div>


          {/* Batch Name */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Batch Name <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., Morning Batch A"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-semibold transition-all focus-visible:ring-indigo-500"
            />
          </div>

          {/* Description */}
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
              rows={3}
              placeholder="Add optional notes about syllabus pace, target exams, etc..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white p-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Timing Inputs */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-semibold transition-all focus-visible:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                End Time
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-semibold transition-all focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Days Select */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Schedule Days
            </label>
            <div className="relative">
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
              >
                <option value="Daily">Daily</option>
                <option value="Monday-Friday">Monday - Friday</option>
                <option value="Weekend">Weekend</option>
                {/* <option value="Custom">Custom Schedule</option> */}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Max Students */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Max Capacity (Students)
            </label>
            <Input
              type="number"
              placeholder="40"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
              className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-semibold transition-all focus-visible:ring-indigo-500"
            />
          </div>

        </div>

        {/* Drawer Action Footer */}
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
            onClick={saveBatch}
            className="flex-1 h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            {selectedBatch ? "Update Batch" : "Save Batch"}
          </Button>
        </div>

      </div>
    </>
  );
}