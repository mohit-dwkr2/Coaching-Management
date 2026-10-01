import { BookOpen, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/supabaseClient";
import { updateBatchStudentCount } from "@/utils/batchUtils";
import {
    getCurrentAcademicYear,
    getAcademicYearFromDate,
} from "@/utils/academicYear";
import { toast } from "sonner";

interface BulkChangeCourseDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    students: any[];
    onUpdated: () => void;

}

export default function BulkChangeCourseDrawer({
    isOpen,
    onClose,
    students,
    onUpdated,

}: BulkChangeCourseDrawerProps) {

    const { tenant } = useTenant();
    const academicYear = getCurrentAcademicYear();

    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchCourses = useCallback(async () => {
        if (!tenant?.id) {
            setCourses([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from("Coaching-3_Courses")
                .select("*")
                .eq("tenant_id", tenant.id)
                .eq("status", "active")
                .order("course_name");

            if (error) throw error;

            setCourses(data ?? []);
        } catch (err) {
            console.error("Failed to load courses:", err);
            setCourses([]);
            toast.error("Failed to load courses.");
        } finally {
            setIsLoading(false);
        }
    }, [tenant?.id]);

    useEffect(() => {
        if (!isOpen) return;

        setSelectedCourse("");
        void fetchCourses();
    }, [isOpen, fetchCourses]);


    const changeBulkCourse = async () => {
        if (!tenant?.id) {
            toast.error("Tenant information is missing.");
            return;
        }

        if (!students.length) {
            toast.error("No students selected.");
            return;
        }

        if (!selectedCourse) {
            toast.error("Please select a course.");
            return;
        }

        const allSameCourse = students.every(
            (student) => student.course_id === selectedCourse
        );

        const targetCourse = courses.find(
            (course) => course.id === selectedCourse
        );

        if (!targetCourse) {
            toast.error("Please select a valid course.");
            return;
        }

        if (allSameCourse) {
            toast.info("Selected students are already in this course.");
            return;
        }

        try {
            setIsLoading(true);

            /*
             * STEP 1
             * Fetch current academic-year fee records
             * for all selected students.
             *
             * Previous-year fee records are intentionally ignored.
             */
            const studentIds = students.map((student) => student.id);

            const { data: feeRecords, error: feeError } = await supabase
                .from("Coaching-3_StudentFees")
                .select(`
        id,
        student_id,
        academic_year,
        paid_amount,
        remaining_amount,
        status
      `)
                .in("student_id", studentIds)
                .eq("tenant_id", tenant.id)
                .eq("academic_year", academicYear);
            if (feeError) {
                throw feeError;
            }

            const currentFeeRecords = feeRecords ?? [];


            // ============================
            // STEP 2 — ATTENDANCE CHECK
            // ============================

            const {
                data: attendanceRecords,
                error: attendanceError,
            } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
        student_id,
        session:Coaching-3_AttendanceSessions!attendance_records_session_tenant_fk(
            attendance_date
        )
    `)
                .in("student_id", studentIds)
                .eq("tenant_id", tenant.id);

            if (attendanceError) {
                throw attendanceError;
            }

            const currentYearAttendanceStudentIds = new Set(
                (attendanceRecords ?? [])
                    .filter((record: any) => {
                        const attendanceDate =
                            record.session?.attendance_date;

                        if (!attendanceDate) return false;

                        return (
                            getAcademicYearFromDate(attendanceDate) ===
                            academicYear
                        );
                    })
                    .map((record: any) => record.student_id)
            );

            if (currentYearAttendanceStudentIds.size > 0) {
                const blockedStudents = students.filter((student) =>
                    currentYearAttendanceStudentIds.has(student.id)
                );

                const names = blockedStudents
                    .map((student) => student.name)
                    .join(", ");

                toast.error(
                    `Course change blocked. ${names} ${blockedStudents.length === 1 ? "has" : "have"
                    } attendance recorded in the current academic year.`
                );

                return;
            }


            /*
             * STEP 2
             * Find students who have already paid something
             * in the CURRENT academic year.
             *
             * These students cannot change course.
             */
            const paidStudents = currentFeeRecords.filter(
                (fee) => Number(fee.paid_amount) > 0
            );

            if (paidStudents.length > 0) {
                const blockedStudentIds = new Set(
                    paidStudents.map((fee) => fee.student_id)
                );

                const blockedStudents = students.filter((student) =>
                    blockedStudentIds.has(student.id)
                );

                const names = blockedStudents
                    .map((student) => student.name)
                    .join(", ");

                toast.error(
                    `Course change blocked. ${names} ${blockedStudents.length === 1 ? "has" : "have"
                    } already paid fees in the current academic year.`
                );

                return;
            }

            /*
             * STEP 3
             *
             * Students who have a current-year fee record
             * but paid_amount = 0 can change course.
             *
             * Their old fee assignment will be removed first.
             *
             * This makes them appear again in the
             * Unassigned Fees section.
             */
            const unpaidCurrentFees = currentFeeRecords.filter(
                (fee) => Number(fee.paid_amount) === 0
            );

            for (const fee of unpaidCurrentFees) {
                const { error: deleteFeeError } = await supabase
                    .from("Coaching-3_StudentFees")
                    .delete()
                    .eq("id", fee.id)
                    .eq("tenant_id", tenant.id);

                if (deleteFeeError) {
                    throw deleteFeeError;
                }
            }

            /*
             * STEP 4
             * Remember old batches so their student counts
             * can be recalculated after the course change.
             */
            const oldBatchIds = [
                ...new Set(
                    students
                        .map((student) => student.batch_id)
                        .filter(Boolean)
                ),
            ];

            /*
             * STEP 5
             * Change course and remove batch assignment.
             *
             * New course will require a fresh batch assignment.
             */
            for (const student of students) {
                const { error: studentError } = await supabase
                    .from("Coaching-3_Students")
                    .update({
                        course_id: selectedCourse,

                        // Course changed → old batch is no longer valid
                        batch_id: null,
                        batch: "Not Assigned",

                        roll_number: null,

                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", student.id)
                    .eq("tenant_id", tenant.id);

                if (studentError) {
                    throw studentError;
                }

                /*
                 * Keep approval/enrollment information synchronized.
                 */
                const { error: approvalError } = await supabase
                    .from("Coaching-3_StudentApprovals")
                    .update({
                        course_id: selectedCourse,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("user_id", student.user_id)
                    .eq("tenant_id", tenant.id);

                if (approvalError) {
                    throw approvalError;
                }
            }

            /*
             * STEP 6
             * Update old batch counts.
             */
            for (const batchId of oldBatchIds) {
                await updateBatchStudentCount(batchId, tenant.id);
            }

            toast.success(
                "Course updated successfully. Students now need a new batch and fee structure."
            );

            onUpdated();
            onClose();

        } catch (err) {
            console.error("BULK COURSE CHANGE ERROR:", err);
            toast.error("Failed to change course.");
        } finally {
            setIsLoading(false);
        }
    };


    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop Overlay with Backdrop Blur */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
            />

            {/* Drawer Side Panel */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-slate-50 z-[70] shadow-2xl flex flex-col border-l border-slate-200 transition-transform duration-300 ease-in-out">

                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                Bulk Change Course
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-slate-400">
                                    Target Selection:
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200/60">
                                    {students.length} Students Selected
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* Scrollable Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

                    {/* Target Summary Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Selected Pool
                                </p>
                                <p className="text-sm font-extrabold text-slate-800">
                                    {students.length} {students.length === 1 ? "Student" : "Students"} Ready
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Course Selection Container */}
                    {isLoading ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 animate-pulse">
                            <div className="h-3 w-28 bg-slate-200 rounded"></div>
                            <div className="h-12 w-full bg-slate-100 rounded-xl"></div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                                Available Courses
                            </label>

                            <div className="relative">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                                >
                                    <option value="">Choose target course...</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.course_name}
                                        </option>
                                    ))}
                                </select>

                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <BookOpen size={18} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && courses.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
                            <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                                <BookOpen size={24} />
                            </div>
                            <p className="font-extrabold text-slate-800 text-sm pt-1">
                                No Courses Available
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                                Please create courses in settings before updating student enrollments.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 bg-white border-t border-slate-200/80 shrink-0 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={changeBulkCourse}
                        disabled={!selectedCourse || isLoading}
                        className="flex-1 h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        Change Course
                    </Button>
                </div>

            </div>
        </>
    );
}