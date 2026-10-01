import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import CourseSection from "./CourseSection";
import BatchSection from "./BatchSection";
import { CheckCircle2, Layers, Sparkles, Users, UserX } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function BatchManager() {
  const { tenant } = useTenant();
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    assignedStudents: 0,
    unassignedStudents: 0,
  });

  const fetchCourses = useCallback(async () => {
    if (!tenant?.id) {
      setCourses([]);
      return;
    }

    const { data, error } = await supabase
      .from("Coaching-3_Courses")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("course_name");

    if (error) {
      console.error(error);
      toast.error("Failed to load courses.");
      return;
    }
    setCourses(data ?? []);
  }, [tenant?.id]);


  const fetchStats = useCallback(async () => {
    if (!tenant?.id) {
      setStats({
        totalBatches: 0,
        activeBatches: 0,
        assignedStudents: 0,
        unassignedStudents: 0,
      });
      return;
    }

    try {
      const [
        totalBatchesResult,
        activeBatchesResult,
        assignedStudentsResult,
        unassignedStudentsResult,
      ] = await Promise.all([
        supabase
          .from("Coaching-3_StudentBatches")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id),

        supabase
          .from("Coaching-3_StudentBatches")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("status", "active"),

        supabase
          .from("Coaching-3_Students")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .not("batch_id", "is", null)
          .eq("status", "active"),

        supabase
          .from("Coaching-3_Students")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .is("batch_id", null)
          .eq("status", "active"),
      ]);

      const results = [
        totalBatchesResult,
        activeBatchesResult,
        assignedStudentsResult,
        unassignedStudentsResult,
      ];

      const failedResult = results.find((result) => result.error);
      if (failedResult?.error) throw failedResult.error;

      setStats({
        totalBatches: totalBatchesResult.count ?? 0,
        activeBatches: activeBatchesResult.count ?? 0,
        assignedStudents: assignedStudentsResult.count ?? 0,
        unassignedStudents: unassignedStudentsResult.count ?? 0,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load batch statistics.");
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [fetchCourses, fetchStats]);

  const refreshBatchManager = useCallback(async () => {
    await Promise.all([fetchCourses(), fetchStats()]);
  }, [fetchCourses, fetchStats]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb- pt-14">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mb-3 shadow-xs">
            <Sparkles size={13} className="text-blue-600" />
            {/* <span>Management Console</span> */}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Batch Manager
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-1.5">
            Manage batches, courses, and student assignments with ease.
          </p>
        </div>
      </div>

      {/* ================= STATS CARDS (Matching Student Manager Style) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Total Batches Card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Layers size={26} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Batches
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {stats.totalBatches}
              </h3>
            </div>
          </div>
        </div>

        {/* Active Batches Card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0">
              <CheckCircle2 size={26} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Batches
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {stats.activeBatches}
              </h3>
            </div>
          </div>
        </div>

        {/* Assigned Students Card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Users size={26} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned Students
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {stats.assignedStudents}
              </h3>
            </div>
          </div>
        </div>

        {/* Unassigned Students Card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0">
              <UserX size={26} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Unassigned Students
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {stats.unassignedStudents}
              </h3>
            </div>
          </div>
        </div>

      </div>

      {/* Course Section */}
      <div className="pt-6">
        <CourseSection onUpdated={refreshBatchManager} />
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200/70 w-full" />

      {/* Batch Section */}
      <div>
        <BatchSection onUpdated={refreshBatchManager} />
      </div>
    </div>
  );
}