import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";


import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Eye,
    Loader2,
    Lock,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AttendanceTableProps {
    refreshKey: number;
    selectedCourse: string;
    selectedBatch: string;
    selectedDate: string;

    onOpenAttendance: (
        session: AttendanceSessionRow
    ) => void;

    onDataLoaded?: (
        data: AttendanceSessionRow[]
    ) => void;
}


interface AttendanceSessionRow {
    id: string;
    attendance_date: string;
    course_id: string;
    batch_id: string;
    present_count: number;
    absent_count: number;
    leave_count: number;
    total_students: number;
    is_locked: boolean;
    course: {
        course_name: string;
    };
    batch: {
        batch_name: string;
    };
}


export default function AttendanceTable({
    refreshKey,
    selectedCourse,
    selectedBatch,
    selectedDate,
    onOpenAttendance,
    onDataLoaded,
}: AttendanceTableProps) {

    const { tenant } = useTenant();

    const [attendanceHistory, setAttendanceHistory] =
        useState<AttendanceSessionRow[]>([]);

    const [loading, setLoading] =
        useState(false);


    const fetchAttendanceHistory = useCallback(async () => {
        if (!tenant?.id) {
            setAttendanceHistory([]);
            onDataLoaded?.([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            let query = supabase
                .from("Coaching-3_AttendanceSessions")
                .select(`
                id,
                attendance_date,
                course_id,
                batch_id,
                present_count,
                absent_count,
                leave_count,
                total_students,
                is_locked,
                course:Coaching-3_Courses(course_name),
                batch:Coaching-3_StudentBatches(batch_name)
            `)
                .eq("tenant_id", tenant.id)
                .order("attendance_date", { ascending: false });

            if (selectedCourse) {
                query = query.eq("course_id", selectedCourse);
            }

            if (selectedBatch) {
                query = query.eq("batch_id", selectedBatch);
            }

            if (selectedDate) {
                query = query.eq("attendance_date", selectedDate);
            }

            const { data, error } = await query;

            if (error) throw error;

            const rows = (data ?? []) as AttendanceSessionRow[];
            setAttendanceHistory(rows);
            onDataLoaded?.(rows);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [
        tenant?.id,
        selectedCourse,
        selectedBatch,
        selectedDate,
        onDataLoaded,
    ]);


    const lockAttendance = async (

        sessionId: string
    ) => {
        if (!tenant?.id) return;
        try {
            const { error } = await supabase
                .from("Coaching-3_AttendanceSessions")
                .update({ is_locked: true })
                .eq("id", sessionId)
                .eq("tenant_id", tenant.id);

            if (error) throw error;
            toast.success("Attendance locked.");
            fetchAttendanceHistory();
        } catch (error: any) {
            toast.error(error.message);
        }
    };


    useEffect(() => {
        fetchAttendanceHistory();
    }, [fetchAttendanceHistory, refreshKey]);

    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }


    if (!attendanceHistory.length) {
        return (
            <div className="rounded-xl border bg-white p-12 text-center text-gray-500">
                Attendance history will appear here.
            </div>
        );
    }


    return (
        <div className="w-full">
            {/* ==================== 1. MOBILE VIEW (Cards for Screen < 768px) ==================== */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
                {attendanceHistory.map((session) => (
                    <div
                        key={session.id}
                        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3"
                    >
                        {/* Header: Date & Status */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date</p>
                                <p className="text-sm font-bold text-gray-900"> {new Date(session.attendance_date).toLocaleDateString("en-GB")}</p>
                            </div>
                            <Badge
                                variant={session.is_locked ? "destructive" : "default"}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${session.is_locked
                                    ? "bg-rose-50 text-rose-700 border-rose-200/60"
                                    : "bg-blue-50 text-blue-700 border-blue-200/60"
                                    }`}
                            >
                                {session.is_locked ? "🔒 Locked" : "✏️ Editable"}
                            </Badge>
                        </div>

                        {/* Course & Batch Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-[10px] font-medium text-gray-400 uppercase">Course</p>
                                <p className="font-semibold text-gray-800 truncate">{session.course?.course_name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-gray-400 uppercase">Batch</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 mt-0.5">
                                    {session.batch?.batch_name || "-"}
                                </span>
                            </div>
                        </div>

                        {/* Counts Row Grid */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                            <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2 text-center">
                                <p className="text-[10px] font-semibold text-emerald-700">Present</p>
                                <p className="text-sm font-bold text-emerald-800 mt-0.5">{session.present_count}</p>
                            </div>
                            <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-2 text-center">
                                <p className="text-[10px] font-semibold text-rose-700">Absent</p>
                                <p className="text-sm font-bold text-rose-800 mt-0.5">{session.absent_count}</p>
                            </div>
                            <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2 text-center">
                                <p className="text-[10px] font-semibold text-amber-700">Leave</p>
                                <p className="text-sm font-bold text-amber-800 mt-0.5">{session.leave_count}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                                <p className="text-[10px] font-semibold text-slate-600">Total</p>
                                <p className="text-sm font-bold text-slate-800 mt-0.5">{session.total_students}</p>
                            </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenAttendance(session)}
                                className="flex-1 h-9 rounded-xl border-gray-200 text-gray-700 hover:bg-slate-100 font-medium text-xs"
                            >
                                <Eye className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                                Open
                            </Button>

                            {!session.is_locked && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-medium text-xs"
                                        >
                                            <Lock className="mr-1.5 h-3.5 w-3.5" />
                                            Lock
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-2xl max-w-xs sm:max-w-md p-6">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-lg font-bold text-gray-900">
                                                Lock Attendance Record?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-sm text-gray-500 mt-2">
                                                Once attendance is locked, it cannot be edited later.
                                                Please make sure all attendance records are correct before locking.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-6 gap-2">
                                            <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50">
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => lockAttendance(session.id)}
                                                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
                                            >
                                                Lock Attendance
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== 2. DESKTOP VIEW (Exact Original Table) ==================== */}
            <div className="hidden md:block w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <Table className="w-full min-w-[700px] text-left border-collapse">
                        <TableHeader className="bg-slate-50/80 backdrop-blur-sm border-b border-gray-100">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Date
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Course
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Batch
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                                    Present
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                                    Absent
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                                    Leave
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                                    Total
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Status
                                </TableHead>
                                <TableHead className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100">
                            {attendanceHistory.map((session) => (
                                <TableRow
                                    key={session.id}
                                    className="hover:bg-slate-50/60 transition-colors duration-150 ease-in-out"
                                >
                                    <TableCell className="py-4 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                        {new Date(session.attendance_date).toLocaleDateString("en-GB")}
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap font-normal">
                                        {session.course?.course_name || "-"}
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap font-normal">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                            {session.batch?.batch_name || "-"}
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">
                                            {session.present_count}
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-bold text-rose-700 bg-rose-50 rounded-lg border border-rose-100">
                                            {session.absent_count}
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-100">
                                            {session.leave_count}
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                                        {session.total_students}
                                    </TableCell>

                                    <TableCell className="py-4 px-4 whitespace-nowrap">
                                        <Badge
                                            variant={session.is_locked ? "destructive" : "default"}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${session.is_locked
                                                ? "bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100"
                                                : "bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-100"
                                                }`}
                                        >
                                            {session.is_locked ? "🔒 Locked" : "✏️ Editable"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onOpenAttendance(session)}
                                                className="h-8 rounded-lg px-3 border-gray-200 text-gray-700 hover:bg-slate-100 hover:text-slate-900 transition-all font-medium text-xs"
                                            >
                                                <Eye className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                                                Open
                                            </Button>

                                            {!session.is_locked && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 rounded-lg px-3 bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all font-medium text-xs"
                                                        >
                                                            <Lock className="mr-1.5 h-3.5 w-3.5" />
                                                            Lock
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-2xl max-w-md p-6">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-lg font-bold text-gray-900">
                                                                Lock Attendance Record?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription className="text-xs sm:text-sm text-gray-500 mt-2">
                                                                Once attendance is locked, it cannot be edited later.
                                                                Please make sure all attendance records are correct before locking.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="mt-6 gap-2">
                                                            <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50">
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => lockAttendance(session.id)}
                                                                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
                                                            >
                                                                Lock Attendance
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}