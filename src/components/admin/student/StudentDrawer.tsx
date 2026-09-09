import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import AssignBatchDrawer from "./AssignBatchDrawer";
import AssignFeeDrawer from "../fees/AssignFeeDrawer";
import { updateBatchStudentCount } from "@/utils/batchUtils";
import {
    getCurrentAcademicYear,
    getAcademicYearFromDate,
} from "@/utils/academicYear";
import { toast } from "sonner";
import {
    X,
    UserCheck,
    ShieldCheck,
    ShieldX,
    Briefcase,
    CreditCard,
    Calendar,
    Activity,
    Users,
    Lock,
    ChevronRight,
} from "lucide-react";

interface StudentDrawerProps {
    student: any;
    isOpen: boolean;
    onClose: () => void;

    getInitials: (name: string) => string;
    handleComingSoon: (feature: string) => void;
    deactivateStudent: (student: any) => void;
    activateStudent: (student: any) => void;
    onBatchAssigned: () => void;
}


export default function StudentDrawer({
    student,
    isOpen,
    onClose,
    getInitials,
    deactivateStudent,
    activateStudent,
    handleComingSoon,
    onBatchAssigned,
}: StudentDrawerProps) {

    const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);
    const [isAssignFeeDrawerOpen, setIsAssignFeeDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const courseChanged =
        selectedCourse !== student?.course_id;

    const [editName, setEditName] = useState("");
    const [editMobile, setEditMobile] = useState("");
    const [editEmail, setEditEmail] = useState("");

    useEffect(() => {
        if (isOpen && student) {
            setIsEditMode(false);

            setSelectedCourse(student.course_id || "");

            fetchCourses();

            setEditName(student.name || "");
            setEditMobile(student.mobile || "");
            setEditEmail(student.email || "");
        }
    }, [isOpen, student]);


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


    const saveStudentChanges = async () => {

        // ============================
        // VALIDATION
        // ============================

        if (!editName.trim()) {
            toast.error("Student name is required.");
            return;
        }

        if (editName.trim().length < 3) {
            toast.error("Name must be at least 3 characters.");
            return;
        }

        if (!/^[0-9]{10}$/.test(editMobile.trim())) {
            toast.error("Enter a valid 10 digit mobile number.");
            return;
        }

        const courseChanged = selectedCourse !== student.course_id;

        const detailsChanged =
            editName.trim() !== (student.name || "") ||
            editMobile.trim() !== (student.mobile || "");

        if (!courseChanged && !detailsChanged) {
            toast.info("No changes detected.");
            setIsEditMode(false);
            return;
        }

        try {

            // ============================
            // COURSE CHANGE CHECK
            // ============================

            let currentYearFee: any = null;

            if (courseChanged) {
                const academicYear = getCurrentAcademicYear();

                // ============================
                // ATTENDANCE CHECK
                // ============================

                const {
                    data: attendanceRecords,
                    error: attendanceError,
                } = await supabase
                    .from("Coaching-3_AttendanceRecords")
                    .select(`
            session:Coaching-3_AttendanceSessions!attendance_records_session_fk(
                attendance_date
            )
        `)
                    .eq("student_id", student.id);

                if (attendanceError) {
                    console.error(
                        "Course change attendance check error:",
                        attendanceError
                    );

                    toast.error(
                        "Unable to verify current academic year attendance."
                    );

                    return;
                }

                const hasCurrentYearAttendance =
                    attendanceRecords?.some((record: any) => {
                        const attendanceDate =
                            record.session?.attendance_date;

                        if (!attendanceDate) return false;

                        return (
                            getAcademicYearFromDate(attendanceDate) ===
                            academicYear
                        );
                    }) ?? false;

                if (hasCurrentYearAttendance) {
                    toast.error(
                        "Course change is not allowed because attendance has already been recorded for the current academic year."
                    );

                    return;
                }

                // ============================
                // FEE CHECK
                // ============================

                const { data: fee, error: feeError } = await supabase
                    .from("Coaching-3_StudentFees")
                    .select(`
            id,
            paid_amount,
            remaining_amount,
            academic_year
        `)
                    .eq("student_id", student.id)
                    .eq("academic_year", academicYear)
                    .maybeSingle();

                if (feeError) {
                    console.error(
                        "Course change fee check error:",
                        feeError
                    );

                    toast.error(
                        "Unable to verify current academic year fee."
                    );

                    return;
                }

                currentYearFee = fee;

                // ============================
                // PAYMENT RECEIVED → BLOCK
                // ============================

                if (
                    currentYearFee &&
                    Number(currentYearFee.paid_amount) > 0
                ) {
                    toast.error(
                        "Course change is not allowed because payment has already been received for the current academic year."
                    );

                    return;
                }

                // ============================
                // UNPAID FEE → REMOVE
                // ============================

                if (currentYearFee) {
                    const { error: deleteFeeError } = await supabase
                        .from("Coaching-3_StudentFees")
                        .delete()
                        .eq("id", currentYearFee.id);

                    if (deleteFeeError) {
                        console.error(
                            "Old fee removal error:",
                            deleteFeeError
                        );

                        toast.error(
                            "Unable to remove old fee assignment."
                        );

                        return;
                    }
                }
            }

            // ============================
            // UPDATE STUDENT
            // ============================

            const updateData: any = {
                name: editName.trim(),
                mobile: editMobile.trim(),
                course_id: selectedCourse,
                updated_at: new Date().toISOString(),
            };

            // Course changed
            if (courseChanged) {

                updateData.batch_id = null;
                updateData.batch = "Not Assigned";
                updateData.roll_number = null;
            }

            const { error: studentError } = await supabase
                .from("Coaching-3_Students")
                .update(updateData)
                .eq("id", student.id);

            if (studentError) {
                throw studentError;
            }

            // ============================
            // UPDATE APPROVAL TABLE
            // ============================

            const { error: approvalError } = await supabase
                .from("Coaching-3_StudentApprovals")
                .update({
                    name: editName.trim(),
                    mobile: editMobile.trim(),
                    email: editEmail.trim(),
                    course_id: selectedCourse,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", student.user_id);

            if (approvalError) {
                throw approvalError;
            }

            // ============================
            // UPDATE BATCH COUNT
            // ============================

            if (student.batch_id) {
                await updateBatchStudentCount(student.batch_id);
            }

            await onBatchAssigned();

            // ============================
            // SUCCESS
            // ============================

            if (courseChanged) {

                toast.success(
                    "Course changed successfully. Please assign the new course fee."
                );

            } else {

                toast.success(
                    "Student details updated."
                );
            }

            setIsEditMode(false);

        } catch (err: any) {

            console.error(err);

            toast.error(
                err.message || "Failed to update student."
            );
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[520px] xl:w-[600px] bg-slate-100/90 backdrop-blur-2xl shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col border-l border-white/20 ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {student && (
                    <>
                        {/* Drawer Top Navigation Bar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    Student Profile Overview
                                </h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-xl font-bold border-slate-200 hover:bg-slate-100 text-slate-700 h-8 px-3 text-xs transition-all"
                                    onClick={() => {
                                        if (isEditMode) {
                                            setIsEditMode(false);
                                            setSelectedCourse(student.course_id);
                                        } else {
                                            setIsEditMode(true);
                                        }
                                    }}
                                >
                                    {isEditMode ? "Cancel" : "Edit Profile"}
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all bg-white/80 border border-slate-200/60"
                                    title="Close Drawer"
                                >
                                    <X size={18} strokeWidth={2.2} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Dark Premium Profile Hero Banner */}
                            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
                                {/* Background Accent Lights */}
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative z-10 flex items-start gap-5">
                                    {/* Avatar */}
                                    <div className="h-16 w-16 xl:h-20 xl:w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-inner ring-4 ring-white/10 text-white flex items-center justify-center font-black text-2xl xl:text-3xl shrink-0">
                                        {getInitials(student.name)}
                                    </div>

                                    {/* Info Header */}
                                    <div className="flex-1 min-w-0">
                                        {isEditMode ? (
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="border border-white/20 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 rounded-xl px-3 py-1.5 w-full font-bold text-lg bg-slate-800/80 text-white outline-none transition-all mb-2"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h2 className="text-lg sm:text-xl xl:text-2xl font-black tracking-tight truncate text-white">
                                                    {student.name}
                                                </h2>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${student.status === "active"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                        : "bg-slate-700/50 text-slate-300 border-slate-600"
                                                        }`}
                                                >
                                                    {student.status}
                                                </span>
                                            </div>
                                        )}

                                        {/* Student ID Badge */}
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-slate-300">
                                            <UserCheck size={13} className="text-blue-400" />
                                            <span>{student.student_id || "PENDING-ID"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Roll No</p>
                                    <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                                        {student.roll_number ?? "N/A"}
                                    </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Joined On</p>
                                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                                        {student.joined_at
                                            ? new Date(student.joined_at).toLocaleDateString("en-GB")
                                            : "—"}
                                    </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                        Notes Access
                                    </p>
                                    <div className="mt-1">
                                        {student.notes_access ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600">
                                                <ShieldCheck size={13} /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-500">
                                                <ShieldX size={13} /> Off
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Basic Information Section */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 xl:p-6 shadow-sm space-y-5">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <UserCheck size={14} className="text-blue-600" /> Basic Information
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Mobile */}
                                    <div>
                                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                                            Mobile Number
                                        </label>
                                        {isEditMode ? (
                                            <input
                                                value={editMobile}
                                                onChange={(e) => setEditMobile(e.target.value)}
                                                className="border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 w-full font-semibold text-sm outline-none transition-all bg-white"
                                            />
                                        ) : (
                                            <p className="text-sm font-extrabold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                                {student.mobile}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                                            Email Address
                                        </label>
                                        {isEditMode ? (
                                            <div className="relative">
                                                <input
                                                    value={editEmail}
                                                    readOnly
                                                    disabled
                                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-100/80 text-slate-500 text-sm font-medium cursor-not-allowed pr-9"
                                                />
                                                <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                        ) : (
                                            <p className="text-sm font-extrabold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 truncate">
                                                {student.email || "—"}
                                            </p>
                                        )}
                                    </div>

                                    {/* Course */}
                                    <div className="sm:col-span-2">
                                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                                            Course
                                        </label>
                                        {isEditMode ? (
                                            <div>
                                                <select
                                                    value={selectedCourse}
                                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                                    className="w-full border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-sm font-semibold outline-none transition-all bg-white"
                                                >
                                                    {courses.map((course) => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.course_name}
                                                        </option>
                                                    ))}
                                                </select>

                                                {courseChanged && (
                                                    <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 font-medium leading-relaxed">
                                                        ⚠️ Changing the course will automatically remove the student from the current batch.
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm font-extrabold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                                {student.course?.course_name || "—"}
                                            </p>
                                        )}
                                    </div>

                                    {/* Batch */}
                                    <div className="sm:col-span-2">
                                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                                            Batch
                                        </label>
                                        <p className="text-sm font-extrabold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                            {student.batch?.batch_name || "Unassigned"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ERP Modules Grid - Hero + Grid Layout */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                                    <Briefcase size={14} className="text-blue-600" /> ERP Management
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <DrawerAppCard
                                        icon={<CreditCard size={22} className="text-amber-600" />}
                                        title="Assign Fees"
                                        subtitle="View fee status, structure, and collect installments"
                                        onClick={() => setIsAssignFeeDrawerOpen(true)}
                                        featured
                                    />

                                    <DrawerAppCard
                                        icon={<Users size={20} className="text-indigo-600" />}
                                        title="Assign Batch"
                                        subtitle="Allocate or update batch"
                                        onClick={() => setIsBatchDrawerOpen(true)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fixed Drawer Footer */}
                        <div className="p-5 xl:p-6 bg-white/80 backdrop-blur-md border-t border-slate-200/80 shrink-0">
                            {isEditMode ? (
                                <Button
                                    onClick={saveStudentChanges}
                                    className="w-full h-12 rounded-2xl font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all"
                                >
                                    Save Changes
                                </Button>
                            ) : (
                                <Button
                                    onClick={() =>
                                        student.status === "active"
                                            ? deactivateStudent(student)
                                            : activateStudent(student)
                                    }
                                    variant={student.status === "active" ? "destructive" : "default"}
                                    className={`w-full h-12 rounded-2xl font-extrabold active:scale-[0.98] transition-all ${student.status === "active"
                                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                                        }`}
                                >
                                    {student.status === "active"
                                        ? "Deactivate Student"
                                        : "Activate Student"}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Sub Drawers */}
            <AssignBatchDrawer
                isOpen={isBatchDrawerOpen}
                onClose={() => setIsBatchDrawerOpen(false)}
                student={student}
                onAssigned={onBatchAssigned}
            />

            <AssignFeeDrawer
                isOpen={isAssignFeeDrawerOpen}
                onClose={() => setIsAssignFeeDrawerOpen(false)}
                student={student}
                onAssigned={onBatchAssigned}
            />
        </>
    );

    // Internal Component for ERP Cards
    function DrawerAppCard({
        icon,
        title,
        subtitle,
        onClick,
        featured = false,
    }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        onClick: () => void;
        featured?: boolean;
    }) {
        return (
            <button
                onClick={onClick}
                /* Yahan 'w-full' add kar diya gaya hai */
                className={`w-full bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all group text-left relative overflow-hidden ${featured ? "p-5 bg-gradient-to-r from-white to-slate-50/50" : "p-4"
                    }`}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div
                        className={`bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-blue-50 group-hover:scale-105 transition-all shrink-0 ${featured ? "p-3.5" : "p-3"
                            }`}
                    >
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <span
                            className={`font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors block truncate ${featured ? "text-base" : "text-sm"
                                }`}
                        >
                            {title}
                        </span>
                        {subtitle && (
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5 truncate">
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 ml-2"
                />
            </button>
        );
    }
}