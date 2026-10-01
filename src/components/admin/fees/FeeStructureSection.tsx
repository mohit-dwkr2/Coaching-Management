import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeeStructureCards from "./FeeStructureCards";
import FeeStructureDrawer from "./FeeStructureDrawer";
import { useTenant } from "@/contexts/TenantContext";

import {
  CourseData,
  FeeStructure,
} from "./types";

interface FeeStructureSectionProps {
  searchQuery: string;
  refreshTrigger: number;
}

export default function FeeStructureSection({ searchQuery, refreshTrigger }: FeeStructureSectionProps) {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { tenant } = useTenant();

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");


  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);


  const fetchCourses = useCallback(async () => {
    if (!tenant?.id) return;

    try {
      const { data, error } = await supabase
        .from("Coaching-3_Courses")
        .select("id, course_name")
        .eq("tenant_id", tenant.id)
        .order("course_name", { ascending: true });

      if (error) throw error;

      setCourses(data || []);
    } catch (err: any) {
      console.error("Course fetch error:", err.message);
      toast.error("Failed to load courses.");
    }
  }, [tenant?.id]);


  const fetchFeeStructures = useCallback(async () => {
    if (!tenant?.id) return;

    try {
      const { data, error } = await supabase
        .from("Coaching-3_FeeStructures")
        .select(`
    id,
    course_id,
    total_fee,
    admission_fee,
    registration_fee,
    duration_months,
    status,
    created_at,
    updated_at,
    course:Coaching-3_Courses!fee_structures_course_tenant_fk(
      id,
      course_name
    )
  `)
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      const { data: studentFees, error: studentFeesError } =
        await supabase
          .from("Coaching-3_StudentFees")
          .select("fee_structure_id")
          .eq("tenant_id", tenant.id);

      if (studentFeesError) throw studentFeesError;

      const structuresWithCount = (data || []).map((structure) => ({
        ...structure,
        assigned_students:
          studentFees?.filter(
            (fee) => fee.fee_structure_id === structure.id
          ).length || 0,
      }));

      setStructures(structuresWithCount);
    } catch (err: any) {
      toast.error(`Failed to load fee structures: ${err.message}`);
    }
  }, [tenant?.id]);

  const refreshData = useCallback(async () => {
    if (!tenant?.id) return;

    setLoading(true);

    try {
      await Promise.all([
        fetchCourses(),
        fetchFeeStructures(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCourses, fetchFeeStructures, tenant?.id]);

  useEffect(() => {
    if (!tenant?.id) return;

    refreshData();
  }, [refreshData, refreshTrigger, tenant?.id]);


  const handleCreateOpen = () => {
    setSelectedStructure(null);
    setDrawerOpen(true);
  };

  const handleEditOpen = (structure: FeeStructure) => {
    setSelectedStructure(structure);
    setDrawerOpen(true);
  };


  const handleToggleStatus = async (structure: FeeStructure) => {
    if (!tenant?.id) {
      toast.error("Coaching tenant is not loaded.");
      return;
    }

    try {
      const newStatus =
        structure.status === "active"
          ? "inactive"
          : "active";

      const { error } = await supabase
        .from("Coaching-3_FeeStructures")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", structure.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      toast.success(
        `Fee structure ${newStatus === "active"
          ? "activated"
          : "deactivated"
        } successfully.`
      );

      await refreshData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  const handleDelete = async (id: string) => {
    if (!tenant?.id) {
      toast.error("Coaching tenant is not loaded.");
      return;
    }

    const structure = structures.find((s) => s.id === id);

    if ((structure?.assigned_students ?? 0) > 0) {
      toast.error(
        "This fee structure is already assigned to students and cannot be deleted."
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("Coaching-3_FeeStructures")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      toast.success("Fee structure deleted successfully");
      await refreshData();

    } catch (err: any) {
      toast.error(err.message);
    }
  };



  const handleSave = async (
    formData: Omit<FeeStructure, "id" | "course"> & { id?: string }
  ) => {
    if (!tenant?.id) {
      toast.error("Coaching tenant is not loaded.");
      return;
    }
    if (
      formData.duration_months < 1 ||
      formData.duration_months > 60
    ) {
      toast.error(
        "Course duration must be between 1 and 60 months."
      );
      return;
    }

    if (formData.total_fee <= 0) {
      toast.error("Total fee must be greater than zero.");
      return;
    }

    if (formData.admission_fee < 0) {
      toast.error("Admission fee cannot be negative.");
      return;
    }

    if (formData.registration_fee < 0) {
      toast.error("Registration fee cannot be negative.");
      return;
    }

    setSaving(true);
    try {
      if (formData.id) {
        // Update state logic execution block
        const { error } = await supabase
          .from("Coaching-3_FeeStructures")
          .update({
            course_id: formData.course_id,
            total_fee: formData.total_fee,
            admission_fee: formData.admission_fee,
            registration_fee: formData.registration_fee,
            duration_months: formData.duration_months,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq("id", formData.id)
          .eq("tenant_id", tenant.id);

        if (error) throw error;
        toast.success("Fee structure updated successfully.");
      } else {
        // Creation insertion logic block
        const { error } = await supabase
          .from("Coaching-3_FeeStructures")
          .insert([
            {
              tenant_id: tenant.id,
              course_id: formData.course_id,
              total_fee: formData.total_fee,
              admission_fee: formData.admission_fee,
              registration_fee: formData.registration_fee,
              duration_months: formData.duration_months,
              status: formData.status,
            },
          ]);

        if (error) throw error;
        toast.success("Fee structure created successfully.");
      }
      setDrawerOpen(false);
      setSelectedStructure(null);

      await refreshData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };


  const totalCount = structures.length;

  const activeCount = structures.filter(
    (s) => s.status === "active"
  ).length;

  const inactiveCount = structures.filter(
    (s) => s.status === "inactive"
  ).length;


  const filteredStructures = structures.filter((item) => {
    const courseName = item.course?.course_name?.toLowerCase() || "";

    const matchesSearch = courseName.includes(
      searchQuery.toLowerCase()
    );

    const matchesStatus =
      statusFilter === "all" ||
      item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing structure schema values...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-">
      {/* Section Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Title & Description */}
          <div className="space-y-1 pt-4 sm:pt-8 min-w-0">
            <h2 className="text-xl sm:text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Fee Structures
            </h2>

            <p className="text-[12px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Create and manage course fee structures and pricing tiers.
            </p>
          </div>

          {/* Primary Action Button */}
          <Button
            onClick={handleCreateOpen}
            size="sm"
            className="h-10 w-full sm:w-auto px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Structure</span>
          </Button>
        </div>

        {/* Modern Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">

          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mr-1 uppercase tracking-wider">
            Filter:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${statusFilter === "all"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
          >
            <span>All</span>

            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === "all"
                ? "bg-slate-700 text-slate-100 dark:bg-slate-300 dark:text-slate-900"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${statusFilter === "active"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
          >
            <span>Active</span>

            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === "active"
                ? "bg-slate-700 text-slate-100 dark:bg-slate-300 dark:text-slate-900"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${statusFilter === "inactive"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
          >
            <span>Inactive</span>

            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === "inactive"
                ? "bg-slate-700 text-slate-100 dark:bg-slate-300 dark:text-slate-900"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
            >
              {inactiveCount}
            </span>
          </button>

        </div>
      </div>

      {/* Cards Section */}
      <FeeStructureCards
        items={filteredStructures}
        onEdit={handleEditOpen}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Drawer Section */}
      <FeeStructureDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        structure={selectedStructure}
        courses={courses}
        saving={saving}
      />
    </div>
  );
}