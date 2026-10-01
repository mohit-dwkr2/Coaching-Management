import { supabase } from "@/supabaseClient";
import {
    getCurrentAcademicYear,
    getAcademicYearFromDate,
} from "@/utils/academicYear";

export interface DashboardData {

    attendance: {
        present: number;
        absent: number;
        leave: number;
        total: number;
        percentage: number;
        todayStatus: string;
    };

    attendanceHistory: {
        academicYear: string;
        present: number;
        absent: number;
        leave: number;
        total: number;
        percentage: number;
    }[];

    fees: {
        academicYear: string;

        totalFee: number;
        paid: number;
        remaining: number;
        status: string;
        nextDueDate: string | null;

        feeAssigned: boolean;

        previousDues: {
            academicYear: string;
            remaining: number;
        }[];

        previousDueTotal: number;
    };

    notes: {
        total: number;
    };

    notifications: {
        total: number;
    };
}

export async function getStudentDashboardData(
    studentId: number,
    tenantId: string
): Promise<DashboardData> {

    const currentAcademicYear = getCurrentAcademicYear();

    // ========================================
    // CURRENT YEAR FEE
    // ========================================

    const {
        data: fee,
        error: feeError,
    } = await supabase
        .from("Coaching-3_StudentFees")
        .select("*")
        .eq("student_id", studentId)
        .eq("tenant_id", tenantId)
        .eq("academic_year", currentAcademicYear)
        .maybeSingle();

    if (feeError) {
        console.error("Current fee fetch error:", feeError);
    }

    // ========================================
    // PREVIOUS YEAR DUES
    // ========================================

    const {
        data: previousFeeRecords,
        error: previousFeeError,
    } = await supabase
        .from("Coaching-3_StudentFees")
        .select(`
            id,
            academic_year,
            remaining_amount
        `)
        .eq("student_id", studentId)
        .eq("tenant_id", tenantId)
        .neq("academic_year", currentAcademicYear)
        .gt("remaining_amount", 0)
        .order("academic_year", {
            ascending: false,
        });

    if (previousFeeError) {
        console.error(
            "Previous dues fetch error:",
            previousFeeError
        );
    }

    const previousDues =
        (previousFeeRecords ?? []).map((record: any) => ({
            academicYear: record.academic_year,
            remaining: Number(record.remaining_amount ?? 0),
        }));

    const previousDueTotal = previousDues.reduce(
        (total, due) => total + due.remaining,
        0
    );

    // ========================================
    // ATTENDANCE
    // ========================================

    const {
        data: attendance,
        error: attendanceError,
    } = await supabase
        .from("Coaching-3_AttendanceRecords")
        .select(`
        status,
        session:Coaching-3_AttendanceSessions!attendance_records_session_tenant_fk(
            attendance_date
        )
    `)
        .eq("student_id", studentId)
        .eq("tenant_id", tenantId);

    if (attendanceError) {
        console.error(
            "Attendance fetch error:",
            attendanceError
        );
    }

    const currentAttendance =
        attendance?.filter((item: any) => {
            const attendanceDate =
                item.session?.attendance_date;

            if (!attendanceDate) return false;

            return (
                getAcademicYearFromDate(attendanceDate) ===
                currentAcademicYear
            );
        }) || [];

    const previousAttendance =
        attendance?.filter((item: any) => {
            const attendanceDate =
                item.session?.attendance_date;

            if (!attendanceDate) return false;

            return (
                getAcademicYearFromDate(attendanceDate) !==
                currentAcademicYear
            );
        }) || [];

    const historyMap: Record<
        string,
        {
            present: number;
            absent: number;
            leave: number;
            total: number;
        }
    > = {};

    previousAttendance.forEach((item: any) => {
        const attendanceDate =
            item.session?.attendance_date;

        if (!attendanceDate) return;

        const academicYear =
            getAcademicYearFromDate(attendanceDate);

        if (!historyMap[academicYear]) {
            historyMap[academicYear] = {
                present: 0,
                absent: 0,
                leave: 0,
                total: 0,
            };
        }

        historyMap[academicYear].total++;

        if (item.status === "present") {
            historyMap[academicYear].present++;
        }

        if (item.status === "absent") {
            historyMap[academicYear].absent++;
        }

        if (item.status?.toLowerCase() === "leave") {
            historyMap[academicYear].leave++;
        }
    });

    const attendanceHistory = Object.entries(historyMap)
        .map(([academicYear, data]) => ({
            academicYear,
            present: data.present,
            absent: data.absent,
            leave: data.leave,
            total: data.total,
            percentage:
                data.total === 0
                    ? 0
                    : Math.round(
                        (data.present / data.total) * 100
                    ),
        }))
        .sort((a, b) =>
            b.academicYear.localeCompare(a.academicYear)
        );

    const today = new Date().toISOString().split("T")[0];

    const todayAttendance = currentAttendance.find(
        (item: any) =>
            item.session?.attendance_date === today
    );

    const todayStatus =
        todayAttendance?.status || "Not Marked";

    const present =
        currentAttendance.filter(
            (item) => item.status === "present"
        ).length;

    const absent =
        currentAttendance.filter(
            (item) => item.status === "absent"
        ).length;

    const leave =
        currentAttendance.filter(
            (item) =>
                item.status?.toLowerCase() === "leave"
        ).length;

    const total = currentAttendance.length;

    const percentage =
        total === 0
            ? 0
            : Math.round((present / total) * 100);

    return {
        attendance: {
            present,
            absent,
            leave,
            total,
            percentage,
            todayStatus,
        },

        attendanceHistory,

        fees: {
            academicYear: currentAcademicYear,

            totalFee: Number(fee?.final_fee ?? 0),

            paid: Number(fee?.paid_amount ?? 0),

            remaining: Number(fee?.remaining_amount ?? 0),

            status: fee?.status ?? "Pending",

            nextDueDate: fee?.next_due_date ?? null,

            feeAssigned: !!fee,

            previousDues,

            previousDueTotal,
        },

        notes: {
            total: 0,
        },

        notifications: {
            total: 0,
        },
    };
}