import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import AttendanceFilters from "./AttendanceFilters";
import AttendanceDrawer from "./AttendanceDrawer";
import AttendanceTable from "./AttendanceTable";
import { toast } from "sonner";
import { exportToExcel } from "@/utils/exportExcel";
import { printTable } from "@/utils/printTable";
import ExportAttendanceModal from "./ExportAttendanceModal";
import { CalendarCheck, Download, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AttendanceManager() {

    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedBatch, setSelectedBatch] = useState("");

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [
        attendanceSessions,
        setAttendanceSessions,
    ] = useState<any[]>([]);

    const [isExportModalOpen, setIsExportModalOpen] =
        useState(false);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [selectedSession, setSelectedSession] = useState<{
        courseId: string;
        batchId: string;
        attendanceDate: string;
    } | null>(null);

    const refreshAttendance = () => {
        setRefreshKey(prev => prev + 1);
    };


    const loadExportData = async () => {
        try {
            const [
                coursesRes,
                batchesRes,
                studentsRes,
            ] = await Promise.all([

                supabase
                    .from("Coaching-3_Courses")
                    .select("*")
                    .order("course_name"),

                supabase
                    .from("Coaching-3_StudentBatches")
                    .select("*")
                    .eq("status", "active")
                    .order("batch_name"),

                supabase
                    .from("Coaching-3_Students")
                    .select(`
          *,
          course:Coaching-3_Courses(course_name),
          batch:Coaching-3_StudentBatches(batch_name)
        `)
                    .eq("status", "active")
                    .order("name")

            ]);

            if (coursesRes.data)
                setCourses(coursesRes.data);

            if (batchesRes.data)
                setBatches(batchesRes.data);

            if (studentsRes.data)
                setStudents(studentsRes.data);

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadExportData();
    }, []);


    const mapAttendanceSession = (session: any) => ({
        "Attendance Date": session.attendance_date,

        "Course":
            session.course?.course_name || "",

        "Batch":
            session.batch?.batch_name || "",

        "Present":
            session.present_count,

        "Absent":
            session.absent_count,

        "Leave":
            session.leave_count,

        "Total Students":
            session.total_students,

        "Status":
            session.is_locked
                ? "Locked"
                : "Open",
    });

    const [courses, setCourses] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);


    const exportAttendance = async (
        reportType: string,
        courseId?: string,
        batchId?: string,
        studentId?: string,
        fromDate?: string,
        toDate?: string
    ) => {

        let exportData = [...attendanceSessions];

        if (reportType === "current") {

            exportData = attendanceSessions;

        }

        if (reportType === "complete") {

            exportData = [...attendanceSessions];

        }


        if (
            reportType === "complete" &&
            (fromDate || toDate)
        ) {

            exportData = exportData.filter(
                (session) => {

                    const date =
                        session.attendance_date;

                    if (fromDate && date < fromDate)
                        return false;

                    if (toDate && date > toDate)
                        return false;

                    return true;

                }
            );
        }



        if (reportType === "course") {
            exportData = attendanceSessions.filter((session) => {
                if (
                    courseId !== "all" &&
                    session.course_id !== courseId
                ) {
                    return false;
                }

                const date = session.attendance_date;

                if (fromDate && date < fromDate)
                    return false;

                if (toDate && date > toDate)
                    return false;
                return true;
            });
        }



        if (reportType === "batch") {
            exportData = attendanceSessions.filter((session) => {
                if (
                    courseId !== "all" &&
                    session.course_id !== courseId
                ) {
                    return false;
                }

                if (
                    batchId !== "all" &&
                    session.batch_id !== batchId
                ) {
                    return false;
                }

                const date = session.attendance_date;

                if (fromDate && date < fromDate)
                    return false;

                if (toDate && date > toDate)
                    return false;

                return true;
            });
        }



        if (reportType === "student") {
            const { data, error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
    status,
    remarks,

    student:Coaching-3_Students!attendance_records_student_fk(
      id,
      name,
      roll_number,
      course_id,
      batch_id,

      course:Coaching-3_Courses(
        course_name
      ),

      batch:Coaching-3_StudentBatches(
        batch_name
      )
    ),

    session:Coaching-3_AttendanceSessions!attendance_records_session_fk(
      attendance_date
    )
  `);



            if (error) {
                toast.error(error.message);
                return;
            }


            const filteredData = (data ?? [])

                .filter((record: any) => {

                    if (
                        courseId !== "all" &&
                        record.student?.course_id !== courseId
                    )
                        return false;

                    if (
                        batchId !== "all" &&
                        record.student?.batch_id !== batchId
                    )
                        return false;

                    if (
                        studentId !== "all" &&
                        record.student?.id != studentId
                    )
                        return false;

                    const date =
                        record.session?.attendance_date;

                    if (fromDate && date < fromDate)
                        return false;

                    if (toDate && date > toDate)
                        return false;

                    return true;

                });

            if (!filteredData.length) {
                toast.error("No attendance records found.");
                return;
            }

            exportToExcel({

                fileName: `Student_Attendance_Report_${new Date().toLocaleDateString()}`,

                sheets: [
                    {

                        sheetName: "Student Attendance",

                        data: filteredData.map((record: any) => ({

                            Date:
                                record.session?.attendance_date,

                            Student:
                                record.student?.name,

                            "Roll No":
                                record.student?.roll_number,

                            Course:
                                record.student?.course?.course_name || "",

                            Batch:
                                record.student?.batch?.batch_name || "",

                            Status:
                                record.status,

                            Remarks:
                                record.remarks || "",

                        }))


                    }
                ]
            });
            toast.success("Student report exported.");
            return;
        }



        if (reportType === "present") {
            const { data, error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
            status,
            remarks,

            student:Coaching-3_Students!attendance_records_student_fk(
                id,
                name,
                roll_number,
                course_id,
                batch_id,

                course:Coaching-3_Courses(
                    course_name
                ),

                batch:Coaching-3_StudentBatches(
                    batch_name
                )
            ),

            session:Coaching-3_AttendanceSessions!attendance_records_session_fk(
                attendance_date
            )
        `);

            if (error) {
                toast.error(error.message);
                return;
            }

            const filteredData = (data ?? []).filter((record: any) => {

                if (record.status !== "present")
                    return false;

                if (
                    courseId !== "all" &&
                    record.student?.course_id !== courseId
                )
                    return false;

                if (
                    batchId !== "all" &&
                    record.student?.batch_id !== batchId
                )
                    return false;

                const date =
                    record.session?.attendance_date;

                if (fromDate && date < fromDate)
                    return false;

                if (toDate && date > toDate)
                    return false;

                return true;

            });

            if (!filteredData.length) {
                toast.error("No present attendance records found.");
                return;
            }

            exportToExcel({

                fileName: `Present_Attendance_Report_${new Date().toLocaleDateString()}`,

                sheets: [
                    {
                        sheetName: "Present Attendance",

                        data: filteredData.map((record: any) => ({

                            Date: record.session?.attendance_date,

                            Student: record.student?.name,

                            "Roll No": record.student?.roll_number,

                            Course:
                                record.student?.course?.course_name || "",

                            Batch:
                                record.student?.batch?.batch_name || "",

                            Status: record.status,

                            Remarks: record.remarks || "",

                        }))
                    }
                ]
            });
            toast.success("Present report exported.");
            return;
        }



        if (reportType === "absent") {

            const { data, error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
            status,
            remarks,

            student:Coaching-3_Students!attendance_records_student_fk(
                id,
                name,
                roll_number,
                course_id,
                batch_id,

                course:Coaching-3_Courses(
                    course_name
                ),

                batch:Coaching-3_StudentBatches(
                    batch_name
                )
            ),

            session:Coaching-3_AttendanceSessions!attendance_records_session_fk(
                attendance_date
            )
        `);

            if (error) {
                toast.error(error.message);
                return;
            }

            const filteredData = (data ?? []).filter((record: any) => {

                if (record.status !== "absent")
                    return false;

                if (
                    courseId !== "all" &&
                    record.student?.course_id !== courseId
                )
                    return false;

                if (
                    batchId !== "all" &&
                    record.student?.batch_id !== batchId
                )
                    return false;

                const date =
                    record.session?.attendance_date;

                if (fromDate && date < fromDate)
                    return false;

                if (toDate && date > toDate)
                    return false;

                return true;

            });

            if (!filteredData.length) {
                toast.error("No absent attendance records found.");
                return;
            }

            exportToExcel({

                fileName: `Absent_Attendance_Report_${new Date().toLocaleDateString()}`,

                sheets: [
                    {
                        sheetName: "Absent Attendance",

                        data: filteredData.map((record: any) => ({

                            Date: record.session?.attendance_date,

                            Student: record.student?.name,

                            "Roll No": record.student?.roll_number,

                            Course:
                                record.student?.course?.course_name || "",

                            Batch:
                                record.student?.batch?.batch_name || "",

                            Status: record.status,

                            Remarks: record.remarks || "",

                        }))
                    }
                ]
            });
            toast.success("Absent report exported.");
            return;
        }




        if (!exportData.length) {
            toast.error("No attendance records found.");
            return;
        }
        exportToExcel({
            fileName: `Attendance_Report_${new Date().toLocaleDateString()}`,
            sheets: [
                {
                    sheetName: "Attendance",

                    data: exportData.map(
                        mapAttendanceSession
                    ),
                },
            ],
        });
        toast.success(
            "Attendance exported successfully."
        );
    };



    const printAttendance = async (
        reportType: string,
        courseId?: string,
        batchId?: string,
        studentId?: string,
        fromDate?: string,
        toDate?: string
    ) => {

        let printData = [...attendanceSessions];

        if (reportType === "current") {
            const rows = printData.map(mapAttendanceSession);
            if (!rows.length) {
                toast.error("No attendance records found.");
                return;
            }
            printTable(
                "Current Attendance Report",
                Object.keys(rows[0]),
                rows
            );
            return;
        }


        if (reportType === "complete") {

            const { data, error } = await supabase
                .from("Coaching-3_AttendanceSessions")
                .select(`
            attendance_date,
            course_id,
            batch_id,

            present_count,
            absent_count,
            leave_count,
            total_students,
            is_locked,

            course:Coaching-3_Courses(
                course_name
            ),

            batch:Coaching-3_StudentBatches(
                batch_name
            )
        `)
                .order("attendance_date", {
                    ascending: false,
                });

            if (error) {
                toast.error(error.message);
                return;
            }

            let printData = data ?? [];

            // Date filter
            if (fromDate || toDate) {

                printData = printData.filter((session: any) => {

                    const date = session.attendance_date;

                    if (fromDate && date < fromDate)
                        return false;

                    if (toDate && date > toDate)
                        return false;

                    return true;

                });

            }

            const rows = printData.map(mapAttendanceSession);
            if (!rows.length) {
                toast.error("No attendance records found.");
                return;
            }
            printTable(
                "Complete Attendance Report",
                Object.keys(rows[0]),
                rows
            );
            return;
        }


        if (reportType === "course") {
            const { data, error } = await supabase
                .from("Coaching-3_AttendanceSessions")
                .select(`
            attendance_date,
            course_id,
            batch_id,

            present_count,
            absent_count,
            leave_count,
            total_students,
            is_locked,

            course:Coaching-3_Courses(
                course_name
            ),

            batch:Coaching-3_StudentBatches(
                batch_name
            )
        `)
                .order("attendance_date", {
                    ascending: false,
                });

            if (error) {
                toast.error(error.message);
                return;
            }

            let printData = data ?? [];

            // Course Filter
            if (
                courseId &&
                courseId !== "all"
            ) {

                printData = printData.filter(
                    (session: any) =>
                        session.course_id === courseId
                );

            }

            // Date Filter
            if (fromDate || toDate) {

                printData = printData.filter(
                    (session: any) => {

                        const date =
                            session.attendance_date;

                        if (
                            fromDate &&
                            date < fromDate
                        )
                            return false;

                        if (
                            toDate &&
                            date > toDate
                        )
                            return false;

                        return true;

                    }
                );

            }

            const rows =
                printData.map(mapAttendanceSession);

            if (!rows.length) {

                toast.error(
                    "No attendance records found."
                );

                return;

            }
            printTable(
                "Course Attendance Report",
                Object.keys(rows[0]),
                rows
            );
            return;
        }



        if (reportType === "batch") {
            const { data, error } = await supabase
                .from("Coaching-3_AttendanceSessions")
                .select(`
            attendance_date,
            course_id,
            batch_id,

            present_count,
            absent_count,
            leave_count,
            total_students,
            is_locked,

            course:Coaching-3_Courses(
                course_name
            ),

            batch:Coaching-3_StudentBatches(
                batch_name
            )
        `)
                .order("attendance_date", {
                    ascending: false,
                });

            if (error) {
                toast.error(error.message);
                return;
            }

            let printData = data ?? [];

            // Course Filter
            if (
                courseId &&
                courseId !== "all"
            ) {
                printData = printData.filter(
                    (session: any) =>
                        session.course_id === courseId
                );
            }

            // Batch Filter
            if (
                batchId &&
                batchId !== "all"
            ) {
                printData = printData.filter(
                    (session: any) =>
                        session.batch_id === batchId
                );
            }

            // Date Filter
            if (fromDate || toDate) {

                printData = printData.filter(
                    (session: any) => {

                        const date =
                            session.attendance_date;

                        if (fromDate && date < fromDate)
                            return false;

                        if (toDate && date > toDate)
                            return false;

                        return true;

                    }
                );

            }

            const rows =
                printData.map(mapAttendanceSession);

            if (!rows.length) {
                toast.error("No attendance records found.");
                return;
            }
            printTable(
                "Batch Attendance Report",
                Object.keys(rows[0]),
                rows
            );
            return;
        }



        if (reportType === "student") {

            const { data, error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
            status,
            remarks,

            student:Coaching-3_Students!attendance_records_student_fk(
                id,
                name,
                roll_number,
                course_id,
                batch_id,

                course:Coaching-3_Courses(
                    course_name
                ),

                batch:Coaching-3_StudentBatches(
                    batch_name
                )
            ),

            session:Coaching-3_AttendanceSessions!attendance_records_session_fk(
                attendance_date
            )
        `);

            if (error) {
                toast.error(error.message);
                return;
            }

            const filteredData = (data ?? []).filter((record: any) => {

                if (
                    courseId !== "all" &&
                    record.student?.course_id !== courseId
                )
                    return false;

                if (
                    batchId !== "all" &&
                    record.student?.batch_id !== batchId
                )
                    return false;

                if (
                    studentId !== "all" &&
                    record.student?.id != studentId
                )
                    return false;

                const date = record.session?.attendance_date;

                if (fromDate && date < fromDate)
                    return false;

                if (toDate && date > toDate)
                    return false;

                return true;

            });

            if (!filteredData.length) {
                toast.error("No student attendance records found.");
                return;
            }

            const rows = filteredData.map((record: any) => ({

                Date: record.session?.attendance_date,

                Student: record.student?.name,

                "Roll No": record.student?.roll_number,

                Course:
                    record.student?.course?.course_name || "",

                Batch:
                    record.student?.batch?.batch_name || "",

                Status: record.status,

                Remarks: record.remarks || "",

            }));

            printTable(
                "Student Attendance Report",
                Object.keys(rows[0]),
                rows
            );

            return;
        }


        if (reportType === "present") {

            const { data, error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
            status,
            remarks,

            student:Coaching-3_Students!attendance_records_student_fk(
                id,
                name,
                roll_number,
                course_id,
                batch_id,

                course:Coaching-3_Courses(
                    course_name
                ),

                batch:Coaching-3_StudentBatches(
                    batch_name
                )
            ),

            session:Coaching-3_AttendanceSessions!attendance_records_session_fk(
                attendance_date
            )
        `);

            if (error) {
                toast.error(error.message);
                return;
            }

            const filteredData = (data ?? []).filter((record: any) => {

                if (record.status !== "present")
                    return false;

                if (
                    courseId !== "all" &&
                    record.student?.course_id !== courseId
                )
                    return false;

                if (
                    batchId !== "all" &&
                    record.student?.batch_id !== batchId
                )
                    return false;

                const date = record.session?.attendance_date;

                if (fromDate && date < fromDate)
                    return false;

                if (toDate && date > toDate)
                    return false;

                return true;

            });

            if (!filteredData.length) {
                toast.error("No present attendance records found.");
                return;
            }

            const rows = filteredData.map((record: any) => ({

                Date: record.session?.attendance_date,

                Student: record.student?.name,

                "Roll No": record.student?.roll_number,

                Course: record.student?.course?.course_name || "",

                Batch: record.student?.batch?.batch_name || "",

                Status: record.status,

                Remarks: record.remarks || "",

            }));

            printTable(
                "Present Attendance Report",
                Object.keys(rows[0]),
                rows
            );

            return;
        }



        if (reportType === "absent") {

            const { data, error } = await supabase
                .from("Coaching-3_AttendanceRecords")
                .select(`
            status,
            remarks,

            student:Coaching-3_Students!attendance_records_student_fk(
                id,
                name,
                roll_number,
                course_id,
                batch_id,

                course:Coaching-3_Courses(
                    course_name
                ),

                batch:Coaching-3_StudentBatches(
                    batch_name
                )
            ),

            session:Coaching-3_AttendanceSessions!attendance_records_session_fk(
                attendance_date
            )
        `);

            if (error) {
                toast.error(error.message);
                return;
            }

            const filteredData = (data ?? []).filter((record: any) => {

                if (record.status !== "absent")
                    return false;

                if (
                    courseId !== "all" &&
                    record.student?.course_id !== courseId
                )
                    return false;

                if (
                    batchId !== "all" &&
                    record.student?.batch_id !== batchId
                )
                    return false;

                const date = record.session?.attendance_date;

                if (fromDate && date < fromDate)
                    return false;

                if (toDate && date > toDate)
                    return false;

                return true;

            });

            if (!filteredData.length) {
                toast.error("No absent attendance records found.");
                return;
            }

            const rows = filteredData.map((record: any) => ({

                Date: record.session?.attendance_date,

                Student: record.student?.name,

                "Roll No": record.student?.roll_number,

                Course: record.student?.course?.course_name || "",

                Batch: record.student?.batch?.batch_name || "",

                Status: record.status,

                Remarks: record.remarks || "",

            }));

            printTable(
                "Absent Attendance Report",
                Object.keys(rows[0]),
                rows
            );

            return;
        }



    };

return (
  <div className="w-full space-y-6 animate-in fade-in duration-300">

    {/* ================= HEADER SECTION ================= */}
    <header className="relative overflow-hidden bg-white/90 dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

      {/* Subtle Ambient Glow */}
      <div className="absolute -top-24 right-10 w-80 h-80 bg-indigo-500/[0.045] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-blue-500/[0.035] rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-6">

        {/* ================= TOP ROW ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          {/* Heading */}
          <div className="flex items-center gap-4 min-w-0">

            {/* Icon */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur-md opacity-20" />

              <div className="relative h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                <CalendarCheck
                  size={26}
                  strokeWidth={2.2}
                />
              </div>
            </div>

            {/* Title */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Attendance Manager
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
               Track and manage student attendance with ease.
              </p>
            </div>

          </div>


          {/* ================= ACTION BUTTONS ================= */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Export */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExportModalOpen(true)}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <Download
                size={16}
                className="text-slate-500 dark:text-slate-400"
                strokeWidth={2.2}
              />

              <span>Export Report</span>
            </Button>


            {/* Take Attendance */}
            <Button
              type="button"
              onClick={() => {
                if (!selectedCourse || !selectedBatch) {
                  toast.error("Please select course and batch.");
                  return;
                }

                setIsDrawerOpen(true);
              }}
              disabled={
                !selectedCourse ||
                !selectedBatch ||
                !selectedDate
              }
              className="h-10 sm:h-11 px-4 sm:px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <UserCheck
                size={17}
                strokeWidth={2.2}
              />

              <span>Take Attendance</span>
            </Button>

          </div>

        </div>


        {/* ================= FILTER SECTION ================= */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">

          <AttendanceFilters
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            selectedBatch={selectedBatch}
            setSelectedBatch={setSelectedBatch}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            courses={courses}
            batches={batches.filter(
              (batch) =>
                !selectedCourse ||
                batch.course_id === selectedCourse
            )}

            /*
              Buttons parent mein move kar diye hain,
              isliye yahan callbacks ki zarurat nahi hai.
            */
            onTakeAttendance={() => {
              if (!selectedCourse || !selectedBatch) {
                toast.error("Please select course and batch.");
                return;
              }

              setIsDrawerOpen(true);
            }}

            onExport={() => setIsExportModalOpen(true)}
          />

        </div>

      </div>

    </header>


    {/* ================= BOTTOM SECTION: TABLE CARD ================= */}
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 sm:p-6">
      <AttendanceTable
        refreshKey={refreshKey}
        selectedCourse={selectedCourse}
        selectedBatch={selectedBatch}
        selectedDate={selectedDate}
        onDataLoaded={setAttendanceSessions}
        onOpenAttendance={(session) => {
          setSelectedCourse(session.course_id);
          setSelectedBatch(session.batch_id);
          setSelectedDate(session.attendance_date);

          setSelectedSession({
            courseId: session.course_id,
            batchId: session.batch_id,
            attendanceDate: session.attendance_date,
          });

          setIsDrawerOpen(true);
        }}
      />
    </div>


    {/* ================= DRAWERS & MODALS ================= */}
    <AttendanceDrawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      selectedCourse={selectedCourse}
      selectedBatch={selectedBatch}
      selectedDate={selectedDate}
      onAttendanceSaved={refreshAttendance}
    />

    <ExportAttendanceModal
      open={isExportModalOpen}
      onClose={() => setIsExportModalOpen(false)}
      courses={courses}
      batches={batches}
      students={students}
      onExportExcel={exportAttendance}
      onPrint={printAttendance}
    />

  </div>
);
}