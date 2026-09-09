import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/supabaseClient";
import StudentTable from "./student/StudentTable";
import StudentDrawer from "./student/StudentDrawer";
import BatchManager from "./batch/BatchManager";
import BulkAssignBatchDrawer from "./student/BulkAssignBatchDrawer";
import ManualAdmissionDrawer from "./student/ManualAdmissionDrawer";
import BulkChangeCourseDrawer from "./student/BulkChangeCourseDrawer";
import { generateStudentId } from "@/utils/studentUtils";
import { exportToExcel } from "@/utils/exportExcel";
import { printTable } from "@/utils/printTable";
import ExportStudentsModal from "./student/ExportStudentsModal";

import {
  CheckCircle,
  Trash2,
  Users,
  Search,
  Phone,
  GraduationCap,
  UserPlus,
  RefreshCw,
  Mail,
  UserCheck,
  Clock,
  BookMarked,
  Filter,
} from "lucide-react";

import {
  Download,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const StudentManager = () => {

  const [showExportModal, setShowExportModal] =
    useState(false);

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkAssignDrawerOpen, setBulkAssignDrawerOpen] = useState(false);
  const [bulkCourseDrawerOpen, setBulkCourseDrawerOpen] =
    useState(false);
  const [manualAdmissionOpen, setManualAdmissionOpen] =
    useState(false);

  // Data States
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);


  // UI States
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "students" | "batch" | "inactive">("students");
  const [filterType, setFilterType] = useState<"All" | "Notes Enabled" | "Notes Disabled">("All");

  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");

  // Drawer State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


  // ================================
  // Data Fetching
  // ================================

  const fetchPendingRequests = async () => {
    const { data, error } = await supabase
      .from("Coaching-3_StudentApprovals")
      .select(`
    *,
    course:course_id (
      id,
      course_name
    )
  `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setPendingRequests(data || []);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("Coaching-3_Students")
      .select(`
      *,
      course:course_id (
        id,
        course_name
      ),
      batch:batch_id (
        id,
        batch_name
      )
    `)
      .order("student_id", { ascending: true });

    if (error) throw error;

    setStudents(data || []);

    if (selectedStudent && data) {

      const updatedStudent = data.find(
        (student) => student.id === selectedStudent.id
      );

      if (updatedStudent) {
        setSelectedStudent(updatedStudent);
      }

    }
  };


  const fetchCourses = async () => {
    const { data } = await supabase
      .from("Coaching-3_Courses")
      .select("id, course_name")
      .eq("status", "active")
      .order("course_name");

    if (data) {
      setCourses(data);
    }
  };

  const fetchBatches = async () => {
    const { data } = await supabase
      .from("Coaching-3_StudentBatches")
      .select("id, batch_name, course_id")
      .eq("status", "active")
      .order("batch_name");

    if (data) {
      setBatches(data);
    }
  };


  const fetchAllData = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) setIsRefreshing(true);
      else setLoading(true);

      await Promise.all([fetchPendingRequests(), fetchStudents()]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchCourses();
    fetchBatches();
  }, []);

  // ================================
  // Core Actions (Unchanged Logic)
  // ================================
  const approveStudent = async (id: string) => {
    try {
      // STEP 1 -> Approval Request Fetch
      const { data: approval, error: approvalError } = await supabase
        .from("Coaching-3_StudentApprovals")
        .select(`*,course:course_id (id,course_name)`)
        .eq("id", id)
        .single();

      if (approvalError || !approval) throw new Error("Student request not found");
      if (approval.status === "approved") {
        toast.error("Student is already approved");
        return;
      }

      // STEP 2 -> Check Student Exists
      const { data: existingStudent } = await supabase
        .from("Coaching-3_Students")
        .select("*")
        .eq("user_id", approval.user_id)
        .maybeSingle();

      // ==========================
      // NEW STUDENT
      // ==========================
      if (!existingStudent) {

        const studentId = await generateStudentId();

        // Insert Student
        const { error: insertError } = await supabase
          .from("Coaching-3_Students")
          .insert({
            student_id: studentId,
            user_id: approval.user_id,
            name: approval.name,
            email: approval.email,
            mobile: approval.mobile,

            batch: "Not Assigned",

            course_id: approval.course_id,
            batch_id: null,

            status: "active",

            notes_access: true,
            joined_at: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // ==========================
      // EXISTING STUDENT
      // ==========================
      else {
        const { error: updateStudentError } = await supabase
          .from("Coaching-3_Students")
          .update({
            name: approval.name,
            email: approval.email,
            mobile: approval.mobile,

            course_id: approval.course_id,

            status: "active",
            notes_access: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", approval.user_id);

        if (updateStudentError) throw updateStudentError;
      }

      // ==========================
      // APPROVAL STATUS
      // ==========================
      const { error: approveError } = await supabase
        .from("Coaching-3_StudentApprovals")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (approveError) throw approveError;

      // ==========================
      // Refresh Lists
      // ==========================
      await fetchAllData();

      toast.success("Student Approved");
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  const rejectRequest = async (id: string) => {

    if (!window.confirm("Reject this admission request?"))
      return;

    try {

      const { error } = await supabase
        .from("Coaching-3_StudentApprovals")
        .update({
          status: "denied",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await fetchPendingRequests();

      toast.success("Request rejected.");

    } catch (err: any) {

      toast.error(err.message);

    }

  };


  const disableNotesAccess = async (id: string) => {

    if (!window.confirm("Are you sure? This will disable study material access for this student."))
      return;

    try {

      const { error } = await supabase
        .from("Coaching-3_Students")
        .update({
          notes_access: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await fetchStudents();

      toast.success("Study material access disabled.");

      if (isDrawerOpen)
        closeStudentDrawer();

    } catch (err: any) {

      toast.error(err.message);

    }

  };


  const toggleNotesAccess = async (student: any) => {

    try {

      const newValue = !student.notes_access;

      const { error } = await supabase
        .from("Coaching-3_Students")
        .update({
          notes_access: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id);

      if (error) throw error;

      await fetchStudents();

      toast.success(
        newValue
          ? "Study Material Enabled"
          : "Study Material Disabled"
      );

    } catch (err: any) {

      toast.error(err.message);

    }

  };


  const deactivateStudent = async (student: any) => {

    if (
      !window.confirm(
        "Deactivate this student?\n\nThe student will become inactive and study material access will be disabled."
      )
    )
      return;

    try {

      const { error } = await supabase
        .from("Coaching-3_Students")
        .update({

          status: "inactive",

          notes_access: false,

          updated_at: new Date().toISOString(),

        })
        .eq("id", student.id);

      if (error) throw error;

      await fetchStudents();

      setIsDrawerOpen(false);

      toast.success("Student deactivated.");

    } catch (err: any) {

      toast.error(err.message);

    }

  };


  const activateStudent = async (student: any) => {

    if (
      !window.confirm(
        "Activate this student?\n\nStudy material access will be restored."
      )
    )
      return;

    try {

      const { error } = await supabase
        .from("Coaching-3_Students")
        .update({
          status: "active",
          notes_access: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id);

      if (error) throw error;

      await fetchStudents();

      setSelectedStudent(null);
      setIsDrawerOpen(false);

      toast.success("Student activated.");

    } catch (err: any) {

      toast.error(err.message);

    }

  };

  // ================================
  // Search, Filters & Stats
  // ================================
  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} module coming soon!`);
  };

  const openStudentDrawer = (student: any) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const closeStudentDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const filteredPending = pendingRequests.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mobile?.includes(searchTerm) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const filteredStudents = students.filter((s) => {

    // ✅ Students tab me sirf active students dikhenge
    if (s.status !== "active") return false;

    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mobile?.includes(searchTerm) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course?.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batch?.batch_name
        ?.toLowerCase()
        ?.includes(searchTerm.toLowerCase())

    const matchesCourse =
      selectedCourse === "all" ||
      s.course_id === selectedCourse;

    const matchesBatch =
      selectedBatch === "all" ||
      s.batch_id === selectedBatch;

    if (!matchesSearch) return false;

    if (!matchesCourse) return false;

    if (!matchesBatch) return false;

    if (filterType === "Notes Enabled")
      return s.notes_access === true;

    if (filterType === "Notes Disabled")
      return s.notes_access === false;

    return true;
  });


  const inactiveStudents = students.filter((s) => {

    if (s.status !== "inactive") return false;

    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mobile?.includes(searchTerm) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course?.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batch?.batch_name
        ?.toLowerCase()
        ?.includes(searchTerm.toLowerCase())


    return matchesSearch;

  });


  // export students function 
  const mapStudent = (student: any) => ({
    "Student ID": student.student_id,
    "Roll No": student.roll_number || "",
    "Student Name": student.name,
    "Mobile": student.mobile,
    "Email": student.email,
    "Course": student.course?.course_name || "",
    "Batch": student.batch?.batch_name || "Not Assigned",
    "Status": student.status,
    "Notes Access": student.notes_access ? "Enabled" : "Disabled",
    "Joined Date": student.joined_at || "",
  });


  const exportStudents = (
    reportType: string,
    courseId?: string,
    batchId?: string,
    fromDate?: string,
    toDate?: string
  ) => {
    let exportData = [...students];


    if (
      reportType === "complete" &&
      (fromDate || toDate)
    ) {
      exportData = exportData.filter((student) => {

        if (!student.joined_at) return false;

        const joinedDate =
          student.joined_at.split("T")[0];

        if (fromDate && joinedDate < fromDate)
          return false;

        if (toDate && joinedDate > toDate)
          return false;
        return true;
      });
    }


    if (reportType === "current") {
      exportData = filteredStudents;
    }


    if (reportType === "course") {
      exportData = students.filter((s) => {
        if (courseId !== "all" &&
          s.course_id !== courseId) {
          return false;
        }
        if (!s.joined_at) return false;
        const joinedDate =
          s.joined_at.split("T")[0];

        if (fromDate && joinedDate < fromDate)
          return false;

        if (toDate && joinedDate > toDate)
          return false;
        return true;
      });
    }


    if (reportType === "batch") {
      exportData = students.filter((s) => {
        if (
          courseId &&
          courseId !== "all" &&
          s.course_id !== courseId
        ) {
          return false;
        }
        if (
          batchId &&
          batchId !== "all" &&
          s.batch_id !== batchId
        ) {
          return false;
        }

        if (!s.joined_at) return false;

        const joinedDate =
          s.joined_at.split("T")[0];

        if (fromDate && joinedDate < fromDate)
          return false;

        if (toDate && joinedDate > toDate)
          return false;
        return true;
      });
    }


    if (reportType === "special") {
      exportData = students.filter(
        (s) =>
          s.status !== "active" ||
          !s.notes_access ||
          !s.batch
      );
    }
    if (!exportData.length) {
      toast.error("No students found.");
      return;
    }



    const sheets: any[] = [];
    sheets.push({
      sheetName: "All Students",
      data: exportData.map(mapStudent)
    });
    const courses = [
      ...new Set(
        exportData.map(
          s => s.course?.course_name
        )
      ),
    ];
    courses.forEach(course => {
      if (!course) return;
      sheets.push({
        sheetName: `Course - ${course}`,
        data: exportData
          .filter(
            s => s.course?.course_name === course
          )
          .map(mapStudent),
      });
    });



    const batches = [
      ...new Set(
        exportData.map(
          s =>
            s.batch?.batch_name
        )
      ),
    ];
    batches.forEach(batch => {
      if (!batch) return;
      sheets.push({
        sheetName: `Batch - ${batch}`,
        data: exportData
          .filter(
            s =>
              s.batch?.batch_name ===
              batch
          )
          .map(mapStudent),
      });
    });



    sheets.push({
      sheetName: "Special Cases",
      data: students
        .filter(
          s =>
            s.status !== "active" ||
            !s.notes_access ||
            !s.batch
        )
        .map(mapStudent),
    });


    exportToExcel({

      fileName: `Students_${new Date().toLocaleDateString()}`,

      sheets,

    });

    toast.success("Students exported successfully.");

  };


  // print students function 
  const printStudents = (
    reportType: string,
    courseId?: string,
    batchId?: string,
    fromDate?: string,
    toDate?: string
  ) => {

    let exportData = [...students];


    if (
      reportType === "complete" &&
      (fromDate || toDate)
    ) {
      exportData = exportData.filter((student) => {

        if (!student.joined_at) return false;

        const joinedDate =
          student.joined_at.split("T")[0];

        if (fromDate && joinedDate < fromDate)
          return false;

        if (toDate && joinedDate > toDate)
          return false;
        return true;
      });
    }


    if (reportType === "current") {
      exportData = filteredStudents;
    }


    if (reportType === "course") {
      exportData = students.filter((s) => {
        if (
          courseId !== "all" &&
          s.course_id !== courseId
        ) {
          return false;
        }

        if (!s.joined_at) return false;

        const joinedDate =
          s.joined_at.split("T")[0];

        if (fromDate && joinedDate < fromDate)
          return false;

        if (toDate && joinedDate > toDate)
          return false;

        return true;
      });
    }


    if (reportType === "batch") {
      exportData = students.filter((s) => {
        if (
          courseId &&
          courseId !== "all" &&
          s.course_id !== courseId
        ) {
          return false;
        }

        if (
          batchId &&
          batchId !== "all" &&
          s.batch_id !== batchId
        ) {
          return false;
        }

        if (!s.joined_at) return false;

        const joinedDate =
          s.joined_at.split("T")[0];

        if (fromDate && joinedDate < fromDate)
          return false;

        if (toDate && joinedDate > toDate)
          return false;

        return true;
      });
    }


    if (reportType === "special") {
      exportData = students.filter(
        (s) =>
          s.status !== "active" ||
          !s.notes_access ||
          !s.batch
      );
    }


    if (!exportData.length) {
      toast.error("No students found.");
      return;
    }

    const data = exportData.map(student => ({
      "Student ID": student.student_id,
      "Roll No": student.roll_number || "",
      "Student Name": student.name,
      "Mobile": student.mobile,
      "Email": student.email,
      "Course": student.course?.course_name || "",
      "Batch": student.batch?.batch_name || "Not Assigned",
      "Status": student.status,
    }));

    printTable(
      "Students Report",
      Object.keys(data[0]),
      data
    );
  };



  // Statistics
  const stats = {
    total: students.length,
    active: students.filter(s => s.status === "active").length,
    pending: pendingRequests.length,
    notesEnabled: students.filter(s => s.notes_access).length
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-3 sm:p-5 md:p-8 font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ================= HEADER SECTION ================= */}
        <header className="relative overflow-hidden bg-white/80 backdrop-blur-xl p-5 sm:p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/80 space-y-6 transition-all">

          {/* Subtle Ambient Background Accents */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute bottom-0 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

          {/* Top Header Row: Title & Action Buttons */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">

            {/* Title & Description */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-sm opacity-30 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative p-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shrink-0 shadow-lg shadow-blue-500/20">
                  <Users size={28} strokeWidth={2.2} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Student Manager
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                    Pro Suite
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                 Manage student records, enrollments, and batches with ease.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">

              {/* Refresh Button */}
              <Button
                onClick={() => fetchAllData(true)}
                variant="outline"
                title="Refresh Data"
                className="h-11 w-11 p-0 sm:w-auto sm:px-4 rounded-xl border-slate-200/90 bg-white/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-2xs transition-all duration-200 shrink-0 group active:scale-95"
              >
                <RefreshCw
                  size={17}
                  className={`transition-transform duration-500 ${isRefreshing ? "animate-spin text-blue-600" : "group-hover:rotate-180 text-slate-500"
                    }`}
                />
                <span className="hidden sm:inline ml-2 text-xs sm:text-sm font-bold">Refresh</span>
              </Button>

              {/* Export Dropdown Trigger */}
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl border-slate-200/90 bg-white/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-2xs text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 active:scale-95"
                onClick={() => setShowExportModal(true)}
              >
                <Download size={17} className="mr-2 text-slate-500" />
                <span>Export</span>
                <ChevronDown size={15} className="ml-2 text-slate-400" />
              </Button>

              {/* New Admission Action Button */}
              <Button
                onClick={() => setManualAdmissionOpen(true)}
                className="h-11 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2.5 grow sm:grow-0 active:scale-95"
              >
                <UserPlus size={18} strokeWidth={2.2} />
                <span>New Admission</span>
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-md text-[10px] uppercase font-black tracking-wider ml-0.5">
                  Open
                </span>
              </Button>
            </div>
          </div>

          {/* Filter Controls Row: Search & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 pt-3 border-t border-slate-100">

            {/* Search Bar */}
            <div className="lg:col-span-6 relative group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                size={18}
              />
              <Input
                placeholder="Search by Student ID, Name, Phone, or Batch..."
                className="pl-11 bg-slate-50/90 hover:bg-slate-100/60 focus:bg-white border-slate-200/90 focus:border-blue-500/80 h-11 rounded-2xl focus-visible:ring-4 focus-visible:ring-blue-500/10 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-none text-slate-800 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Course Filter Dropdown */}
            <div className="lg:col-span-3 relative group">
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedBatch("all"); // Course change hote hi batch reset
                }}
                className="w-full h-11 rounded-2xl border border-slate-200/90 bg-slate-50/90 hover:bg-slate-100/60 focus:bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 appearance-none cursor-pointer pr-10 shadow-none"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
            </div>

            {/* Batch Filter Dropdown */}
            <div className="lg:col-span-3 relative group">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full h-11 rounded-2xl border border-slate-200/90 bg-slate-50/90 hover:bg-slate-100/60 focus:bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 appearance-none cursor-pointer pr-10 shadow-none"
              >
                <option value="all">All Batches</option>
                {batches
                  .filter(
                    (batch) =>
                      selectedCourse === "all" ||
                      batch.course_id === selectedCourse
                  )
                  .map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name}
                    </option>
                  ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
            </div>

          </div>

          {/* BULK ACTIONS TOOLBAR (Appears smoothly with gradient badge & actions) */}
          {selectedStudents.length > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-4.5 shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex items-center gap-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-500/30 shrink-0">
                  {selectedStudents.length}
                </span>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                    Student{selectedStudents.length > 1 ? "s" : ""} Selected
                  </h3>
                  <p className="text-[11px] sm:text-xs text-indigo-200/80 font-medium">
                    Perform bulk actions across all selected entries
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  size="sm"
                  className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all active:scale-95"
                  onClick={() => {
                    const selected = students.filter(student =>
                      selectedStudents.includes(student.id)
                    );
                    const courseIds = [
                      ...new Set(selected.map(student => student.course_id))
                    ];
                    if (courseIds.length > 1) {
                      toast.error(
                        "Please select students from the same course."
                      );
                      return;
                    }
                    setBulkAssignDrawerOpen(true);
                  }}
                >
                  Assign Batch
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 bg-white/10 hover:bg-white/20 hover:text-white border-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all active:scale-95"
                  onClick={() => {
                    setBulkCourseDrawerOpen(true);
                  }}
                >
                  Change Course
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-3.5 text-indigo-200 hover:text-white hover:bg-white/10 font-bold text-xs rounded-xl transition-all"
                  onClick={() => setSelectedStudents([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </header>


        {/* ================= STATS CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Students Card */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <Users size={26} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stats.total}</h3>
              </div>
            </div>
          </div>

          {/* Active Students Card */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <UserCheck size={26} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Students</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stats.active}</h3>
              </div>
            </div>
          </div>

          {/* Pending Logins Card */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                <Clock size={26} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Logins</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stats.pending}</h3>
              </div>
            </div>
          </div>

          {/* Notes Enabled Card */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                <BookMarked size={26} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes Access</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stats.notesEnabled}</h3>
              </div>
            </div>
          </div>
        </div>


        {/* ================= MAIN TABS NAVIGATION ================= */}
        <div className="bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-md border border-slate-200/60 inline-flex flex-wrap sm:flex-nowrap gap-1.5 w-full md:w-auto shadow-inner">

          {/* Pending Requests Tab */}
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2.5 ${activeTab === "pending"
              ? "bg-white text-amber-600 shadow-md shadow-slate-200/50 scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            <span>Pending Requests</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === "pending"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-300/60 text-slate-700"
                }`}
            >
              {filteredPending.length}
            </span>
          </button>

          {/* Students Tab */}
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2.5 ${activeTab === "students"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            <span>Students</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === "students"
                ? "bg-white/20 text-white"
                : "bg-slate-300/60 text-slate-700"
                }`}
            >
              {filteredStudents.length}
            </span>
          </button>

          {/* Batch Manager Tab */}
          <button
            onClick={() => setActiveTab("batch")}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2.5 ${activeTab === "batch"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            <span>Batch Manager</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === "batch"
                ? "bg-white/20 text-white"
                : "bg-slate-300/60 text-slate-700"
                }`}
            >
              {batches.length}
            </span>
          </button>

          {/* Inactive Tab */}
          <button
            onClick={() => setActiveTab("inactive")}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2.5 ${activeTab === "inactive"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            <span>Inactive</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${activeTab === "inactive"
                ? "bg-white/20 text-white"
                : "bg-slate-300/60 text-slate-700"
                }`}
            >
              {inactiveStudents.length}
            </span>
          </button>

        </div>


        {/* ================= LOADING STATE ================= */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/80 h-56 rounded-3xl border border-slate-200/80 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded-lg w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded-lg w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2.5 pt-3">
                  <div className="h-9 bg-slate-100 rounded-xl"></div>
                  <div className="h-9 bg-slate-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ================= TAB CONTENT: PENDING ================= */}
            {activeTab === "pending" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPending.length === 0 ? (
                  <div className="col-span-full bg-white/80 backdrop-blur-md p-14 sm:p-20 rounded-3xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center shadow-sm">
                    <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-4 border border-emerald-100 shadow-inner">
                      <CheckCircle size={38} strokeWidth={2.2} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">All Caught Up!</h3>
                    <p className="text-slate-500 text-sm mt-1 font-semibold max-w-sm">
                      There are no pending admission requests requiring review right now.
                    </p>
                  </div>
                ) : (
                  filteredPending.map((s) => (
                    <div
                      key={s.id}
                      className="group bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.12)] hover:border-amber-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>

                      <div>
                        <div className="flex items-center gap-3.5 mb-5 pt-1">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center font-black text-base shrink-0 shadow-inner border border-slate-300/50">
                            {getInitials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-base leading-snug truncate group-hover:text-blue-600 transition-colors">
                              {s.name}
                            </p>
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block border border-amber-200/70 mt-1">
                              Pending Approval
                            </span>
                          </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-3 text-slate-700 text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <Phone size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate">{s.mobile}</span>
                          </div>

                          {s.email && (
                            <div className="flex items-center gap-3 text-slate-700 text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100 truncate">
                              <Mail size={15} className="text-slate-400 shrink-0" />
                              <span className="truncate">{s.email}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-slate-700 text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <GraduationCap size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate">{s.course?.course_name || "No Course"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                        <Button
                          onClick={() => approveStudent(s.id)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl h-11 text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
                        >
                          Approve Student
                        </Button>
                        <Button
                          onClick={() => rejectRequest(s.id)}
                          variant="outline"
                          title="Reject Request"
                          className="border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 rounded-xl h-11 w-11 p-0 shrink-0 transition-all active:scale-95"
                        >
                          <Trash2 size={17} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ================= TAB CONTENT: STUDENTS ================= */}
            {activeTab === "students" && (
              <div className="space-y-5">
                {/* Secondary Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mr-3 text-slate-400 text-xs font-black uppercase tracking-wider pl-1">
                    <Filter size={15} className="text-blue-600" />
                    <span>Filters:</span>
                  </div>

                  {["All", "Notes Enabled", "Notes Disabled"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterType(filter as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${filterType === filter
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-slate-200/60"
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>



                <StudentTable
                  students={filteredStudents}
                  openStudentDrawer={openStudentDrawer}
                  toggleNotesAccess={toggleNotesAccess}
                  getInitials={getInitials}
                  inactive={false}
                  selectedStudents={selectedStudents}
                  setSelectedStudents={setSelectedStudents}
                />
              </div>
            )}


            {/* ================= TAB CONTENT: BATCH ================= */}
            {activeTab === "batch" && (
              <BatchManager />
            )}


            {/* ================= TAB CONTENT: INACTIVE ================= */}
            {activeTab === "inactive" && (
              <div className="space-y-6">
                <StudentTable
                  students={inactiveStudents}
                  openStudentDrawer={openStudentDrawer}
                  toggleNotesAccess={toggleNotesAccess}
                  getInitials={getInitials}
                  inactive={true}
                  selectedStudents={selectedStudents}
                  setSelectedStudents={setSelectedStudents}
                />
              </div>
            )}
          </>
        )}
      </div>


      <StudentDrawer
        student={selectedStudent}
        isOpen={isDrawerOpen}
        onClose={closeStudentDrawer}
        getInitials={getInitials}
        deactivateStudent={deactivateStudent}
        activateStudent={activateStudent}
        handleComingSoon={handleComingSoon}
        onBatchAssigned={fetchAllData}
      />

      <BulkAssignBatchDrawer
        isOpen={bulkAssignDrawerOpen}
        onClose={() => setBulkAssignDrawerOpen(false)}
        students={students.filter(student =>
          selectedStudents.includes(student.id)
        )}
        onAssigned={async () => {
          await fetchAllData();
          setSelectedStudents([]);
        }}
      />

      <BulkChangeCourseDrawer
        isOpen={bulkCourseDrawerOpen}
        onClose={() =>
          setBulkCourseDrawerOpen(false)
        }
        students={students.filter(student =>
          selectedStudents.includes(student.id)
        )}
        onUpdated={async () => {
          await fetchAllData();
          setSelectedStudents([]);
          setBulkCourseDrawerOpen(false);
        }}
      />

      <ManualAdmissionDrawer
        isOpen={manualAdmissionOpen}
        onClose={() =>
          setManualAdmissionOpen(false)
        }
        onCreated={async () => {
          await fetchAllData();
          setManualAdmissionOpen(false);
        }}
      />

      <ExportStudentsModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        courses={courses}
        batches={batches}
        onExportExcel={exportStudents}
        onPrint={printStudents}
      />

    </div>
  );
};

export default StudentManager;