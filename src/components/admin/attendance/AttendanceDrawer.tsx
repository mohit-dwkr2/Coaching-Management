import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";

import {
    X,
    Search,
    Users,
    Calendar,
    GraduationCap,
    CheckCircle2,
    XCircle,
    Clock3,
    Loader2,
} from "lucide-react";


interface AttendanceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCourse: string;
    selectedBatch: string;
    selectedDate: string;
    onAttendanceSaved: () => void;
}


interface AttendanceStudent {
    id: string;
    name: string;
    roll_number: number | null;
    attendanceStatus: "present" | "absent" | "leave";
    remarks?: string;
    isModified?: boolean;
}

interface AttendanceRecord {
    student_id: string;
    status: "present" | "absent" | "leave";
    remarks: string | null;
}


export default function AttendanceDrawer({

    isOpen,
    onClose,
    selectedCourse,
    selectedBatch,
    selectedDate,
    onAttendanceSaved,

}: AttendanceDrawerProps) {


    const [students, setStudents] =
        useState<AttendanceStudent[]>([]);

    const [courseName, setCourseName] =
        useState("");

    const [batchName, setBatchName] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [hasChanges, setHasChanges] =
        useState(false);

    const [sessionLocked, setSessionLocked] =
        useState(false);

    const [sessionId, setSessionId] =
        useState<string | null>(null);

    // =========================
    // DATABASE FUNCTIONS
    // =========================

    const fetchCourse = async () => {

        if (!selectedCourse) return;

        const { data, error } = await supabase
            .from("Coaching-3_Courses")
            .select("course_name")
            .eq("id", selectedCourse)
            .single();

        if (error) {
            toast.error(error.message);
            return;
        }
        setCourseName(data.course_name);
    };


    const fetchBatch = async () => {

        if (!selectedBatch) return;

        const { data, error } = await supabase
            .from("Coaching-3_StudentBatches")
            .select("batch_name")
            .eq("id", selectedBatch)
            .single();

        if (error) {
            toast.error(error.message);
            return;
        }

        setBatchName(data.batch_name);

    };


    const fetchStudents = async () => {
        if (!selectedBatch) return;

        try {
            setLoading(true);

            // ==========================================
            // EXISTING SESSION
            // ==========================================
            // Agar attendance session already exist karta hai,
            // toh students ko CURRENT batch se nahi,
            // balki AttendanceRecords se load karna hai.
            if (sessionId) {
                await loadAttendanceRecords();
                return;
            }

            // ==========================================
            // NEW SESSION
            // ==========================================
            // New attendance ke liye current batch ke
            // students hi dikhne chahiye.
            const { data, error } = await supabase
                .from("Coaching-3_Students")
                .select(`
                id,
                name,
                roll_number
            `)
                .eq("batch_id", selectedBatch)
                .eq("status", "active")
                .order("roll_number", {
                    ascending: true,
                });

            if (error) throw error;

            const studentList = data || [];

            const attendanceStudents: AttendanceStudent[] =
                studentList.map(student => ({
                    ...student,
                    attendanceStatus: "present",
                    remarks: "",
                    isModified: false,
                }));

            setStudents(attendanceStudents);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };


    const loadAttendanceRecords = async () => {
        if (!sessionId) return;

        try {
            const { data: records, error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
                student_id,
                status,
                remarks,
                student:student_id(
                    id,
                    name,
                    roll_number
                )
            `)
                .eq("session_id", sessionId);

            if (error) throw error;

            const attendanceStudents: AttendanceStudent[] =
                (records || []).map((record: any) => ({
                    id: String(record.student_id),
                    name: record.student?.name || "Unknown Student",
                    roll_number: record.student?.roll_number ?? null,
                    attendanceStatus: record.status,
                    remarks: record.remarks || "",
                    isModified: false,
                }));

            setStudents(attendanceStudents);

        } catch (error: any) {
            toast.error(error.message);
        }
    };


    const checkAttendanceSession = async () => {
        if (!selectedBatch || !selectedDate) return;
        const { data, error } = await supabase
            .from("Coaching-3_AttendanceSessions")
            .select("id, is_locked")
            .eq("batch_id", selectedBatch)
            .eq("attendance_date", selectedDate)
            .maybeSingle();

        if (error) {
            toast.error(error.message);
            return;
        }
        if (!data) {
            setSessionId(null);
            setSessionLocked(false);
            await fetchStudents();
            return;
        }
        setSessionId(data.id);
        setSessionLocked(data.is_locked);

    };


    useEffect(() => {
        if (!isOpen) return;
        fetchCourse();
        fetchBatch();
        checkAttendanceSession();
    }, [
        isOpen,
        selectedCourse,
        selectedBatch,
        selectedDate,
    ]);


    useEffect(() => {

        if (!isOpen || !selectedBatch) return;

        fetchStudents();

    }, [
        sessionId,
        isOpen,
        selectedBatch,
    ]);

    useEffect(() => {

        if (isOpen) return;

        setStudents([]);
        setSearch("");
        setCourseName("");
        setBatchName("");
        setSessionId(null);
        setSessionLocked(false);
        setHasChanges(false);

    }, [isOpen]);

    // =========================
    // HELPER FUNCTIONS
    // =========================

    const updateAttendanceStatus = (
        studentId: string,
        status: "present" | "absent" | "leave"

    ) => {

        setStudents(prev =>
            prev.map(student =>
                student.id === studentId
                    ? {
                        ...student,
                        attendanceStatus: status,
                        isModified: true,
                    }
                    : student
            )
        );
        setHasChanges(true);
    };


    const saveAttendance = async () => {

        if (sessionLocked) {
            toast.error("Attendance is locked.");
            return;
        }

        if (!selectedBatch || !selectedCourse || !selectedDate) {
            toast.error("Missing attendance details.");
            return;
        }

        try {

            setSaving(true);

            let currentSessionId = sessionId;

            // =========================
            // CREATE SESSION
            // =========================

            if (!currentSessionId) {

                const currentDate = new Date(selectedDate);

                const academicYearStart =
                    currentDate.getMonth() >= 3
                        ? currentDate.getFullYear()
                        : currentDate.getFullYear() - 1;

                const academicYear = `${academicYearStart}-${String(
                    academicYearStart + 1
                ).slice(-2)}`;

                const { data, error } = await supabase
                    .from("Coaching-3_AttendanceSessions")
                    .insert({
                        course_id: selectedCourse,
                        batch_id: selectedBatch,
                        attendance_date: selectedDate,
                        academic_year: academicYear,
                        is_locked: false,
                    })
                    .select("id")
                    .single();

                if (error) throw error;

                currentSessionId = data.id;

                setSessionId(currentSessionId);

            }

            // =========================
            // PREPARE RECORDS
            // =========================

            const attendanceRecords = students.map(student => ({

                session_id: currentSessionId,

                student_id: student.id,

                roll_number: student.roll_number,

                status: student.attendanceStatus,

                remarks: student.remarks || null,

                updated_at: new Date().toISOString(),

            }));


            // =========================
            // UPSERT RECORDS
            // =========================

            const { error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .upsert(
                    attendanceRecords,
                    {
                        onConflict: "session_id,student_id",
                    }
                );
            if (error) throw error;


            // =========================
            // UPDATE SESSION SUMMARY
            // =========================

            const presentCount = students.filter(
                s => s.attendanceStatus === "present"
            ).length;

            const absentCount = students.filter(
                s => s.attendanceStatus === "absent"
            ).length;

            const leaveCount = students.filter(
                s => s.attendanceStatus === "leave"
            ).length;

            const { error: sessionError } = await supabase
                .from("Coaching-3_AttendanceSessions")
                .update({

                    present_count: presentCount,

                    absent_count: absentCount,

                    leave_count: leaveCount,

                    total_students: students.length,

                    updated_at: new Date().toISOString(),

                })
                .eq("id", currentSessionId);

            if (sessionError) throw sessionError;

            // =========================
            // SUCCESS
            // =========================

            toast.success("Attendance saved successfully.");

            setHasChanges(false);

            onAttendanceSaved();

            onClose();


        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };


    const filteredStudents = useMemo(() => {

        if (!search.trim()) return students;

        const value = search.toLowerCase();

        return students.filter(student =>

            student.name.toLowerCase().includes(value) ||

            student.roll_number
                ?.toString()
                .includes(value)

        );

    }, [students, search]);

    const presentCount = useMemo(() => {

        return students.filter(
            s => s.attendanceStatus === "present"
        ).length;

    }, [students]);

    const absentCount = useMemo(() => {

        return students.filter(
            s => s.attendanceStatus === "absent"
        ).length;

    }, [students]);

    const leaveCount = useMemo(() => {

        return students.filter(
            s => s.attendanceStatus === "leave"
        ).length;

    }, [students]);

    const totalStudents = students.length;


    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop Overlay with smooth blur */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
                        onClick={onClose}
                    />

                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
                        {/* Drawer Panel - Responsive Widths */}
                        <div className="w-screen max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out">

                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 sm:px-6 py-4 bg-gray-50/50">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                                        {sessionLocked ? "View Attendance" : "Take Attendance"}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                        {sessionLocked
                                            ? "Attendance records are locked for this session"
                                            : "Mark and review daily student attendance"}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-gray-200/60 text-gray-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Lock Warning Banner */}
                            {sessionLocked && (
                                <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 sm:p-4 flex items-center gap-3 text-amber-900 shadow-sm">
                                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                                        🔒
                                    </div>
                                    <div className="text-xs sm:text-sm">
                                        <p className="font-semibold text-amber-800">Attendance Locked</p>
                                        <p className="text-amber-700/90 mt-0.5">Editing is disabled for this session. You are currently in view-only mode.</p>
                                    </div>
                                </div>
                            )}

                            {/* Main Content Scrollable Area */}
                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">

                                {/* Batch & Course Info Grid */}
                                <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-4 sm:p-5">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                                <GraduationCap className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Course</p>
                                                <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{courseName || "-"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Batch</p>
                                                <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{batchName || "-"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</p>
                                                <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedDate}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Students</p>
                                                <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{totalStudents}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Attendance Analytics / Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="rounded-xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm">
                                        <p className="text-xs font-medium text-gray-500">Total</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 sm:p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <p className="text-xs font-semibold">Present</p>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-3 sm:p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 text-rose-600">
                                            <XCircle className="h-4 w-4" />
                                            <p className="text-xs font-semibold">Absent</p>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-3 sm:p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 text-amber-600">
                                            <Clock3 className="h-4 w-4" />
                                            <p className="text-xs font-semibold">Leave</p>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">{leaveCount}</p>
                                    </div>
                                </div>

                                {/* Search Input Box */}
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search student by name or roll number..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Students List Section */}
                                <div className="space-y-3 pt-2">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                            <p className="text-sm font-medium">Fetching students list...</p>
                                        </div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                                            <p className="text-base font-semibold text-gray-700">No Students Found</p>
                                            <p className="text-xs text-gray-400 mt-1">Try adjusting your search filter or check batch assignments.</p>
                                        </div>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                            >
                                                {/* Student Details */}
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0 border border-slate-200/60">
                                                        {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                {student.name}
                                                            </h4>
                                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 shrink-0">
                                                                Roll: {student.roll_number ?? "-"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Radio Button Options */}
                                                <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-auto bg-gray-50/80 p-1 rounded-xl border border-gray-100 w-full sm:w-auto justify-between sm:justify-start">

                                                    {/* Present Choice */}
                                                    <label className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${student.attendanceStatus === "present"
                                                        ? "bg-emerald-500 text-white shadow-sm"
                                                        : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                                                        } ${sessionLocked ? "opacity-60 cursor-not-allowed" : ""}`}>
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            name={`attendance-${student.id}`}
                                                            checked={student.attendanceStatus === "present"}
                                                            disabled={sessionLocked}
                                                            onChange={() => updateAttendanceStatus(student.id, "present")}
                                                        />
                                                        <span>Present</span>
                                                    </label>

                                                    {/* Absent Choice */}
                                                    <label className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${student.attendanceStatus === "absent"
                                                        ? "bg-rose-500 text-white shadow-sm"
                                                        : "text-gray-600 hover:text-rose-600 hover:bg-rose-50/50"
                                                        } ${sessionLocked ? "opacity-60 cursor-not-allowed" : ""}`}>
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            name={`attendance-${student.id}`}
                                                            checked={student.attendanceStatus === "absent"}
                                                            disabled={sessionLocked}
                                                            onChange={() => updateAttendanceStatus(student.id, "absent")}
                                                        />
                                                        <span>Absent</span>
                                                    </label>

                                                    {/* Leave Choice */}
                                                    <label className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${student.attendanceStatus === "leave"
                                                        ? "bg-amber-500 text-white shadow-sm"
                                                        : "text-gray-600 hover:text-amber-600 hover:bg-amber-50/50"
                                                        } ${sessionLocked ? "opacity-60 cursor-not-allowed" : ""}`}>
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            name={`attendance-${student.id}`}
                                                            checked={student.attendanceStatus === "leave"}
                                                            disabled={sessionLocked}
                                                            onChange={() => updateAttendanceStatus(student.id, "leave")}
                                                        />
                                                        <span>Leave</span>
                                                    </label>

                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="border-t border-gray-100 bg-white px-4 sm:px-6 py-4 flex items-center justify-end gap-3 shadow-lg">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="rounded-xl px-5 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    onClick={saveAttendance}
                                    disabled={saving || sessionLocked}
                                    className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                                >
                                    {sessionLocked ? (
                                        "Attendance Locked"
                                    ) : saving ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Saving Changes...</span>
                                        </div>
                                    ) : (
                                        "Save Attendance"
                                    )}
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}