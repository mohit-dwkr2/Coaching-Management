import { useEffect } from "react";
import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import CourseDrawer from "./CourseDrawer";
import CourseTable from "./CourseTable";
import { toast } from "sonner";


interface CourseSectionProps {
  onUpdated: () => void;
}

export default function CourseSection({
  onUpdated,
}: CourseSectionProps) {

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const fetchCourses = async () => {

    // 1. Courses
    const { data: courses, error: courseError } = await supabase
      .from("Coaching-3_Courses")
      .select("*")
      .order("course_name");

    if (courseError) return;

    // 2. Batches
    const { data: batches } = await supabase
      .from("Coaching-3_StudentBatches")
      .select("course_id");

    // 3. Students
    const { data: students } = await supabase
      .from("Coaching-3_Students")
      .select("course_id")
      .eq("status", "active");

    const finalCourses = courses.map((course) => {

      const batchCount =
        batches?.filter(
          b => b.course_id === course.id
        ).length || 0;

      const studentCount =
        students?.filter(
          s => s.course_id === course.id
        ).length || 0;

      return {
        ...course,
        batchCount,
        studentCount,
      };

    });

    setCourses(finalCourses);
    onUpdated();

  };

  useEffect(() => {
    fetchCourses();
  }, []);


  const deleteCourse = async (course: any) => {

    if (course.batchCount > 0) {
      toast.error(
        "Cannot delete course. Remove all batches first."
      );
      return;
    }

    if (course.studentCount > 0) {
      toast.error(
        "Cannot delete course. Students are still enrolled."
      );
      return;
    }

    if (
      !window.confirm(
        `Delete "${course.course_name}" ?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("Coaching-3_Courses")
      .delete()
      .eq("id", course.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Course deleted.");

    await fetchCourses();

  };


  return (
    /* Outer container without overflow-hidden so Drawer overlays freely across the full screen */
    <div className="relative w-full bg-white rounded-3xl border border-slate-200/90 shadow-xs">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 via-white to-slate-50/30 rounded-t-3xl">

        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <BookOpen size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Courses
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200/60">
                {courses?.length || 0} Total
              </span>
            </div>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
              Manage all available courses for your coaching institute.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="h-11 sm:h-12 px-5 sm:px-6 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 shrink-0 self-start sm:self-auto flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Course</span>
        </Button>

      </div>

      {/* Inner Table Component Wrapper */}
      <div className="p-3 sm:p-6">
        <CourseTable
          courses={courses}
          onEdit={(course: any) => {
            setSelectedCourse(course);
            setIsDrawerOpen(true);
          }}
          onDelete={deleteCourse}
        />
      </div>

      {/* Drawer Component */}
      <CourseDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCourse(null);
        }}
        onCourseCreated={fetchCourses}
        selectedCourse={selectedCourse}
      />
    </div>
  );
}