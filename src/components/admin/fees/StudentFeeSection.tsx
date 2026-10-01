import ExportFeesModal from "./ExportFeesModal";
import { exportToExcel } from "@/utils/exportExcel";
import { printTable } from "@/utils/printTable";
import { FileSpreadsheet, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import StudentFeeTable from "./StudentFeeTable";
import StudentFeeDrawer from "./StudentFeeDrawer";
import UnassignedStudentTable from "./UnassignedStudentTable";
import AssignFeeDrawer from "./AssignFeeDrawer";
import FeeAnalyticsDashboard from "./analytics/FeeAnalyticsDashboard";
import StudentFeeFilters from "./StudentFeeFilters";

import ReceiptPreviewDialog from "./receipt/ReceiptPreviewDialog";
import { generateReceiptData } from "./receipt/generateReceiptData";

import {
  StudentFeeData,
  FeeStructure,
  FeeTransaction,
  PaymentHistory,
  ReceiptData,
} from "./types";

import CollectPaymentDrawer from "./CollectPaymentDrawer/CollectPaymentDrawer";
import { getCurrentAcademicYear } from "@/utils/academicYear";
import BulkAssignFeeDrawer from "./BulkAssignFeeDrawer";

interface StudentFeeSectionProps {
  searchQuery: string;
  selectedCourse: string;
  selectedBatch: string;
  refreshTrigger: number;

  onCoursesChange: (courses: any[]) => void;
  onBatchesChange: (batches: any[]) => void;
}

const StudentFeeSection = ({
  searchQuery,
  selectedCourse,
  selectedBatch,
  refreshTrigger,
  onCoursesChange,
  onBatchesChange,
}: StudentFeeSectionProps) => {
  const { tenant, tenantLoading } = useTenant();

  const [selectedUnassignedStudents, setSelectedUnassignedStudents] =
    useState<string[]>([]);

  const [bulkAssignFeeOpen, setBulkAssignFeeOpen] =
    useState(false);

  const [recentReceipt, setRecentReceipt] =
    useState<ReceiptData | null>(null);

  const [recentReceiptOpen, setRecentReceiptOpen] =
    useState(false);

  const [studentFees, setStudentFees] = useState<StudentFeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFeeData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [feeTransactions, setFeeTransactions] = useState<FeeTransaction[]>([]);

  const [previousDues, setPreviousDues] = useState<StudentFeeData[]>([]);
  const [previousDuesOpen, setPreviousDuesOpen] = useState(false);

  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  const [analyticsStudentFees, setAnalyticsStudentFees] =
    useState<StudentFeeData[]>([]);

  const [filter, setFilter] = useState<
    "all" | "assigned" | "unassigned" | "overdue" | "partial" | "pending"
  >("all");

  const [isExportModalOpen, setIsExportModalOpen] =
    useState(false);


  const fetchFeeTransactions = useCallback(async () => {
    try {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("Coaching-3_FeeTransactions")
        .select(`
    *,
    student_fee:Coaching-3_StudentFees!fee_transactions_student_fee_tenant_fk(
      id,
      student_id,
      course_id,
      batch_id,
      academic_year,

      student:Coaching-3_Students!student_fees_student_tenant_fk(
        id,
        student_id,
        name
      ),

      course:Coaching-3_Courses!student_fees_course_tenant_fk(
        id,
        course_name
      ),

      batch:Coaching-3_StudentBatches!student_fees_batch_tenant_fk(
        id,
        batch_name,
        course_id
      )
    )
  `)
        .eq("tenant_id", tenant.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      return data || [];

    } catch (err: any) {
      toast.error(err.message);
      return [];
    }
  }, [tenant?.id]);


  const fetchStudents = useCallback(async () => {
    try {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("Coaching-3_Students")
        .select(`
    *,
    course:Coaching-3_Courses!students_course_tenant_fk(
      id,
      course_name
    ),
    batch:Coaching-3_StudentBatches!students_batch_tenant_fk(
      id,
      batch_name,
      course_id
    )
  `)
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });


      if (error) {
        console.error("FETCH STUDENTS ERROR:", error);
        toast.error(error.message);
        return [];
      }

      return data || [];

    } catch (err: any) {
      console.error("FETCH STUDENTS ERROR:", err);

      toast.error(
        err?.message || "Failed to load students."
      );

      return [];
    }
  }, [tenant?.id]);


  const fetchFeeStructures = useCallback(async () => {
    try {
      if (!tenant?.id) {
        setFeeStructures([]);
        return;
      }
      const { data, error } = await supabase
        .from("Coaching-3_FeeStructures")
        .select("*")
        .eq("status", "active")
        .eq("tenant_id", tenant.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setFeeStructures(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [tenant?.id]);


  const fetchStudentFees = useCallback(async () => {
    try {
      if (!tenant?.id) return [];
      const academicYear = getCurrentAcademicYear();

      const { data, error } = await supabase
        .from("Coaching-3_StudentFees")
        .select(`
    *,
    student:Coaching-3_Students!student_fees_student_tenant_fk(
      id,
      student_id,
      name,
      email,
      mobile,
      class,
      batch_id,
      course_id,
      batch:Coaching-3_StudentBatches!students_batch_tenant_fk(
        id,
        batch_name,
        course_id
      )
    ),
    course:Coaching-3_Courses!student_fees_course_tenant_fk(
      id,
      course_name
    ),
    batch:Coaching-3_StudentBatches!student_fees_batch_tenant_fk(
      id,
      batch_name,
      course_id
    ),
    fee_structure:Coaching-3_FeeStructures!student_fees_structure_tenant_fk(
      *
    )
  `)
        .eq("academic_year", academicYear)
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });


      if (error) throw error;

      return data || [];

    } catch (err: any) {
      toast.error(
        err.message || "Failed to load student fees."
      );

      return [];
    }
  }, [tenant?.id]);


  const fetchAnalyticsStudentFees = useCallback(async () => {
    try {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("Coaching-3_StudentFees")
        .select(`
    *,
    student:Coaching-3_Students!student_fees_student_tenant_fk(
      id,
      student_id,
      name,
      email,
      mobile,
      class,
      batch_id,
      course_id,
      batch:Coaching-3_StudentBatches!students_batch_tenant_fk(
        id,
        batch_name,
        course_id
      )
    ),
    course:Coaching-3_Courses!student_fees_course_tenant_fk(
      id,
      course_name
    ),
    batch:Coaching-3_StudentBatches!student_fees_batch_tenant_fk(
      id,
      batch_name,
      course_id
    ),
    fee_structure:Coaching-3_FeeStructures!student_fees_structure_tenant_fk(
      *
    )
  `)
        .eq("tenant_id", tenant.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      return data || [];
    } catch (err: any) {
      toast.error(
        err.message || "Failed to load analytics fee data."
      );

      return [];
    }
  }, [tenant?.id]);


  const fetchPreviousDues = useCallback(async () => {
    try {
      if (!tenant?.id) return [];
      const currentAcademicYear = getCurrentAcademicYear();

      const { data, error } = await supabase
        .from("Coaching-3_StudentFees")
        .select(`
    *,
    student:Coaching-3_Students!student_fees_student_tenant_fk(
      id,
      student_id,
      name,
      email,
      mobile,
      class,
      batch_id,
      course_id,
      batch:Coaching-3_StudentBatches!students_batch_tenant_fk(
        id,
        batch_name,
        course_id
      )
    ),
    course:Coaching-3_Courses!student_fees_course_tenant_fk(
      id,
      course_name
    ),
    batch:Coaching-3_StudentBatches!student_fees_batch_tenant_fk(
      id,
      batch_name,
      course_id
    ),
    fee_structure:Coaching-3_FeeStructures!student_fees_structure_tenant_fk(
      *
    )
  `)
        .neq("academic_year", currentAcademicYear)
        .eq("tenant_id", tenant.id)
        .gt("remaining_amount", 0)
        .order("academic_year", {
          ascending: false,
        });
      if (error) throw error;

      return data || [];
    } catch (err: any) {
      toast.error(
        err.message || "Failed to load previous dues."
      );

      return [];
    }
  }, [tenant?.id]);


  const refreshData = useCallback(async () => {
    if (tenantLoading) return;

    if (!tenant?.id) {
      setStudentFees([]);
      setFeeTransactions([]);
      setFeeStructures([]);
      setStudents([]);
      setPreviousDues([]);
      setAnalyticsStudentFees([]);
      setSelectedFee(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [
        latestFees,
        latestAnalyticsFees,
        latestTransactions,
        latestStudents,
        latestPreviousDues,
      ] = await Promise.all([
        fetchStudentFees(),
        fetchAnalyticsStudentFees(),
        fetchFeeTransactions(),
        fetchStudents(),
        fetchPreviousDues(),
      ]);

      setStudentFees(latestFees || []);
      setFeeTransactions(latestTransactions || []);
      setStudents(latestStudents || []);
      setPreviousDues(latestPreviousDues || []);
      setAnalyticsStudentFees(latestAnalyticsFees || []);


      // Agar drawer open hai to selected fee bhi update karo
      setSelectedFee((currentSelectedFee) => {
        if (!currentSelectedFee) return null;

        const updatedFee = (latestFees || []).find(
          (fee) => fee.id === currentSelectedFee.id
        );

        return updatedFee ?? currentSelectedFee;
      });

    } catch (error: any) {
      console.error("Fees refresh error:", error);

      toast.error(
        error?.message || "Failed to refresh fee data."
      );
    } finally {
      setLoading(false);
    }
  }, [
    tenant?.id,
    tenantLoading,
    fetchStudentFees,
    fetchFeeTransactions,
    fetchFeeStructures,
    fetchStudents,
    fetchPreviousDues,
    fetchAnalyticsStudentFees,
  ]);


  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const replaceStudentFee = useCallback(
    (updatedFee: StudentFeeData) => {
      // Table update
      setStudentFees((prev) =>
        prev.map((fee) =>
          fee.id === updatedFee.id ? updatedFee : fee
        )
      );

      // Drawer update
      setSelectedFee((prev) => {
        if (!prev) return null;

        return prev.id === updatedFee.id
          ? updatedFee
          : prev;
      });
    },
    []
  );


  const handleSaveFee = async (
    updatedFee: StudentFeeData
  ) => {
    if (!tenant?.id) {
      toast.error("Unable to update fee: tenant is not available.");
      return;
    }
    try {
      const { error } = await supabase
        .from("Coaching-3_StudentFees")
        .update({
          fee_structure_id: updatedFee.fee_structure_id,
          total_fee: updatedFee.total_fee,
          discount: updatedFee.discount,
          final_fee: updatedFee.final_fee,
          paid_amount: updatedFee.paid_amount,
          remaining_amount: updatedFee.remaining_amount,
          next_due_date: updatedFee.next_due_date,
          status: updatedFee.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedFee.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;
      replaceStudentFee(updatedFee);
    } catch (err: any) {
      toast.error(err.message || "Failed to update fee.");
      throw err;
    }
  };


  const assignedIds = useMemo(() => {
    return new Set(
      studentFees
        .filter((fee) => fee.student_id)
        .map((fee) => String(fee.student_id))
    );
  }, [studentFees]);

  const unassignedStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.id &&
        student.status === "active" &&
        !assignedIds.has(String(student.id))
    );
  }, [students, assignedIds]);


  const filteredUnassignedStudents = useMemo(() => {
    return unassignedStudents.filter((student) => {
      // --------------------
      // Search Filter
      // --------------------
      const query = searchQuery.trim().toLowerCase();

      if (query) {
        const searchable = [
          student.name,
          student.student_id,
          student.mobile,
          student.course?.course_name,
          student.batch?.batch_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      // --------------------
      // Course Filter
      // --------------------
      if (
        selectedCourse !== "all" &&
        student.course_id !== selectedCourse
      ) {
        return false;
      }

      // --------------------
      // Batch Filter
      // --------------------
      if (
        selectedBatch !== "all" &&
        student.batch_id !== selectedBatch
      ) {
        return false;
      }

      return true;
    });
  }, [
    unassignedStudents,
    searchQuery,
    selectedCourse,
    selectedBatch,
  ]);


  const assignedCount = studentFees.length;

  const unassignedCount = unassignedStudents.length;

  const totalCount =
    assignedCount + unassignedCount;


  const overdueCount = studentFees.filter(
    (fee) => fee.status === "Overdue"
  ).length;

  const pendingCount = studentFees.filter(
    (fee) => fee.status === "Pending"
  ).length;

  const partialCount = studentFees.filter(
    (fee) => fee.status === "Partial"
  ).length;



  const filteredStudentFees = studentFees.filter((fee) => {
    // --------------------
    // Status Filter
    // --------------------

    if (filter === "overdue" && fee.status !== "Overdue")
      return false;

    if (filter === "partial" && fee.status !== "Partial")
      return false;

    if (filter === "pending" && fee.status !== "Pending")
      return false;

    // --------------------
    // Search Filter
    // --------------------

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      const searchable = [
        fee.student?.name,
        fee.student?.student_id,
        fee.student?.mobile,
        fee.course?.course_name,
        fee.student?.batch?.batch_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(query))
        return false;
    }

    // --------------------
    // Course Filter
    // --------------------

    if (
      selectedCourse !== "all" &&
      fee.course_id !== selectedCourse
    ) {
      return false;
    }

    // --------------------
    // Batch Filter
    // --------------------

    if (
      selectedBatch !== "all" &&
      fee.student?.batch_id !== selectedBatch
    ) {
      return false;
    }

    return true;
  });


  const courses = useMemo(() => {
    return [
      ...new Map(
        students
          .filter((student) => student.course)
          .map((student) => [
            student.course.id,
            student.course,
          ])
      ).values(),
    ];
  }, [students]);

  const batches = useMemo(() => {
    return [
      ...new Map(
        students
          .filter((student) => student.batch)
          .map((student) => [
            student.batch.id,
            student.batch,
          ])
      ).values(),
    ];
  }, [students]);


  useEffect(() => {
    onCoursesChange(courses);
    onBatchesChange(batches);
  }, [courses, batches, onCoursesChange, onBatchesChange]);


  const mapFee = (fee: StudentFeeData) => ({
    "Student Name": fee.student?.name || "",
    "Student ID": fee.student?.student_id || "",
    "Mobile": fee.student?.mobile || "",
    "Course": fee.course?.course_name || "",
    "Batch": fee.student?.batch?.batch_name || "",

    "Course Fee": fee.course_fee,
    "Admission Fee": fee.admission_fee,
    "Registration Fee": fee.registration_fee,
    "Duration (Months)": fee.duration_months,

    "Total Fee": fee.total_fee,
    "Discount": fee.discount,
    "Final Fee": fee.final_fee,
    "Paid Amount": fee.paid_amount,
    "Remaining Amount": fee.remaining_amount,

    "Status": fee.status,
    "Next Due Date": fee.next_due_date || "",
  });


  const mapTransaction = (transaction: FeeTransaction) => {

    const fee = studentFees.find(
      (f) => f.id === transaction.student_fee_id
    );

    return {

      "Student Name":
        fee?.student?.name || "",

      "Student ID":
        fee?.student?.student_id || "",

      "Course":
        fee?.course?.course_name || "",

      "Batch":
        fee?.student?.batch?.batch_name || "",

      "Amount":
        transaction.amount,

      "Payment Mode":
        transaction.payment_mode,

      "Receipt No":
        transaction.receipt_no || "",

      "Transaction Date":
        transaction.transaction_date,

      "Received By":
        transaction.received_by || "",

      "Reference No":
        transaction.transaction_id || "",

      "Remarks":
        transaction.remark || "",
    };

  };


  const exportFees = (
    reportType: string,
    courseId?: string,
    batchId?: string,
    studentId?: string,
    fromDate?: string,
    toDate?: string
  ) => {

    let exportData = [...filteredStudentFees];

    switch (reportType) {

      case "current":
        exportData = filteredStudentFees;
        break;

      case "complete":
        exportData = [...studentFees];
        break;


      case "course": {
        exportData = studentFees.filter((fee) => {
          const courseMatch =
            courseId === "all" ||
            fee.course_id === courseId;

          const date =
            fee.admission_date || "";

          const fromMatch =
            !fromDate ||
            date >= fromDate;

          const toMatch =
            !toDate ||
            date <= toDate;

          return (
            courseMatch &&
            fromMatch &&
            toMatch
          );
        });
        break;
      }


      case "batch":
        exportData = [...studentFees];
        // Course Filter
        if (courseId && courseId !== "all") {
          exportData = exportData.filter(
            fee => fee.course_id === courseId
          );
        }
        // Batch Filter
        if (batchId && batchId !== "all") {
          exportData = exportData.filter(
            fee => fee.student?.batch_id === batchId
          );
        }
        break;


      case "pending":
        exportData = studentFees.filter(
          fee => fee.status === "Pending"
        );
        break;



      case "paid":
        exportData = [...studentFees];
        // Sirf Paid
        exportData = exportData.filter(
          fee => fee.status === "Paid"
        );
        // Course Filter
        if (courseId && courseId !== "all") {
          exportData = exportData.filter(
            fee => fee.course_id === courseId
          );
        }
        // Batch Filter
        if (batchId && batchId !== "all") {
          exportData = exportData.filter(
            fee => fee.student?.batch_id === batchId
          );
        }
        break;



      case "collection":
        break;;

      default:
        exportData = studentFees;
    }

    //  batch report 
    if (
      reportType === "batch" &&
      (fromDate || toDate)
    ) {
      exportData = exportData.filter((fee) => {

        if (!fee.created_at) return false;

        const feeDate = fee.created_at.split("T")[0];

        if (fromDate && feeDate < fromDate) {
          return false;
        }

        if (toDate && feeDate > toDate) {
          return false;
        }

        return true;
      });
    }

    //  paid report

    if (
      reportType === "paid" &&
      (fromDate || toDate)
    ) {
      exportData = exportData.filter((fee) => {

        if (!fee.created_at) return false;

        const feeDate = fee.created_at.split("T")[0];

        if (fromDate && feeDate < fromDate)
          return false;

        if (toDate && feeDate > toDate)
          return false;

        return true;
      });
    }


    //  complete report

    if (
      reportType === "complete" &&
      (fromDate || toDate)
    ) {
      exportData = exportData.filter((fee) => {

        if (!fee.created_at) return false;

        const feeDate = fee.created_at.split("T")[0];

        if (fromDate && feeDate < fromDate) {
          return false;
        }

        if (toDate && feeDate > toDate) {
          return false;
        }
        return true;
      });
    }

    let collectionData = [...feeTransactions];

    // Course Filter
    if (courseId && courseId !== "all") {
      collectionData = collectionData.filter((transaction) => {
        const fee = studentFees.find(
          (f) => f.id === transaction.student_fee_id
        );
        return fee?.course_id === courseId;
      });
    }

    // Batch Filter
    if (batchId && batchId !== "all") {
      collectionData = collectionData.filter((transaction) => {
        const fee = studentFees.find(
          (f) => f.id === transaction.student_fee_id
        );
        return fee?.student?.batch_id === batchId;
      });
    }

    if (reportType === "collection") {

      // Date From
      if (fromDate) {

        collectionData = collectionData.filter(
          transaction =>
            transaction.transaction_date >= fromDate
        );

      }
      // Date To
      if (toDate) {

        collectionData = collectionData.filter(
          transaction =>
            transaction.transaction_date <= toDate
        );
      }

      if (!collectionData.length) {
        toast.error("No records found.");
        return;
      }
      exportToExcel({
        fileName: `Collection_Report_${new Date().toLocaleDateString()}`,
        sheets: [
          {
            sheetName: "Collection Report",
            data: collectionData.map(mapTransaction),
          },
        ],
      });
      toast.success(
        "Collection report exported successfully."
      );
      return;
    }


    // history report 
    if (reportType === "history") {

      let historyData = [...feeTransactions];

      // Course Filter
      if (courseId && courseId !== "all") {
        historyData = historyData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );
          return fee?.course_id === courseId;
        });
      }

      // Batch Filter
      if (batchId && batchId !== "all") {
        historyData = historyData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );
          return fee?.student?.batch_id === batchId;
        });
      }


      // Student Filter
      if (studentId && studentId !== "all") {
        historyData = historyData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );
          return (
            String(fee?.student?.id) ===
            String(studentId)
          );
        });
      }

      // From Date
      if (fromDate) {
        historyData = historyData.filter(
          (transaction) =>
            transaction.transaction_date >= fromDate
        );
      }

      // To Date
      if (toDate) {
        historyData = historyData.filter(
          (transaction) =>
            transaction.transaction_date <= toDate
        );
      }

      if (!historyData.length) {
        toast.error("No payment history found.");
        return;
      }
      exportToExcel({
        fileName: `Payment_History_${new Date().toLocaleDateString()}`,
        sheets: [
          {
            sheetName: "Payment History",
            data: historyData.map(mapTransaction),
          },
        ],
      });
      toast.success("Payment history exported successfully.");
      return;
    }
    if (!exportData.length) {
      toast.error("No records found.");
      return;
    }



    const sheets: any[] = [];
    // Main sheet
    sheets.push({
      sheetName: "Fees Report",
      data: exportData.map(mapFee),
    });

    // completee report 

    if (reportType === "complete") {

      // Course Wise
      courses.forEach((course) => {
        sheets.push({
          sheetName: `Course - ${course.course_name}`,
          data: exportData
            .filter(
              fee => fee.course_id === course.id
            )
            .map(mapFee),
        });
      });

      // Batch Wise
      batches.forEach((batch) => {
        sheets.push({
          sheetName: `Batch - ${batch.batch_name}`,
          data: exportData
            .filter(
              fee =>
                fee.student?.batch_id === batch.id
            )
            .map(mapFee),
        });
      });

      // Pending
      sheets.push({
        sheetName: "Pending Fees",
        data: exportData
          .filter(
            fee => fee.status === "Pending"
          )
          .map(mapFee),
      });

      // Paid
      sheets.push({
        sheetName: "Paid Students",
        data: exportData
          .filter(
            fee => fee.status === "Paid"
          )
          .map(mapFee),
      });

      // Partial
      sheets.push({
        sheetName: "Partial Fees",
        data: exportData
          .filter(
            fee => fee.status === "Partial"
          )
          .map(mapFee),
      });

      // Collection Report
      sheets.push({
        sheetName: "Collection Report",
        data: collectionData.map(mapTransaction),
      });
    }
    exportToExcel({
      fileName: `Fees_Report_${new Date().toLocaleDateString()}`,
      sheets,
    });
    toast.success("Fees report exported successfully.");
  };



  const printFees = (
    reportType: string,
    courseId?: string,
    batchId?: string,
    studentId?: string,
    fromDate?: string,
    toDate?: string
  ) => {

    let exportData = [...filteredStudentFees];
    let collectionData = [...feeTransactions];

    let historyData = [...feeTransactions];

    switch (reportType) {

      case "current":
        exportData = filteredStudentFees;
        break;

      case "complete":
        exportData = [...studentFees];
        break;

      default:
        exportData = [...studentFees];
    }


    if (reportType === "current") {

      const rows = filteredStudentFees.map(mapFee);

      if (!rows.length) {
        toast.error("No records found.");
        return;
      }

      printTable(
        "Current Fees Report",
        Object.keys(rows[0]),
        rows


      );
      return;
    }


    if (reportType === "complete") {

      let rows = studentFees
        .filter((fee) => {

          if (!fee.created_at) return false;

          const feeDate = fee.created_at.split("T")[0];

          if (fromDate && feeDate < fromDate) {
            return false;
          }

          if (toDate && feeDate > toDate) {
            return false;
          }

          return true;
        })
        .map(mapFee);

      if (!rows.length) {
        toast.error("No records found.");
        return;
      }

      printTable(
        "Complete Fees Report",
        Object.keys(rows[0]),
        rows
      );

      return;
    }


    if (reportType === "course") {

      let rows = studentFees
        .filter((fee) => {

          const courseMatch =
            courseId === "all" ||
            fee.course_id === courseId;

          const date =
            fee.admission_date || "";

          const fromMatch =
            !fromDate ||
            date >= fromDate;

          const toMatch =
            !toDate ||
            date <= toDate;

          return (
            courseMatch &&
            fromMatch &&
            toMatch
          );
        })
        .map(mapFee);

      if (!rows.length) {
        toast.error("No records found.");
        return;
      }

      printTable(
        "Course Report",
        Object.keys(rows[0]),
        rows
      );

      return;
    }


    if (reportType === "batch") {

      let rows = studentFees
        .filter((fee) => {

          if (
            courseId &&
            courseId !== "all" &&
            fee.course_id !== courseId
          ) {
            return false;
          }

          if (
            batchId &&
            batchId !== "all" &&
            fee.student?.batch_id !== batchId
          ) {
            return false;
          }

          if (!fee.created_at) return false;

          const feeDate =
            fee.created_at.split("T")[0];

          if (fromDate && feeDate < fromDate)
            return false;

          if (toDate && feeDate > toDate)
            return false;

          return true;

        })
        .map(mapFee);

      if (!rows.length) {
        toast.error("No records found.");
        return;
      }

      printTable(
        "Batch Report",
        Object.keys(rows[0]),
        rows
      );

      return;
    }


    if (reportType === "pending") {

      const rows = studentFees
        .filter(
          fee => fee.status === "Pending"
        )
        .map(mapFee);

      if (!rows.length) {
        toast.error("No records found.");
        return;
      }

      printTable(
        "Pending Fees Report",
        Object.keys(rows[0]),
        rows
      );

      return;
    }


    if (reportType === "paid") {

      let rows = studentFees
        .filter((fee) => {

          if (fee.status !== "Paid")
            return false;

          if (
            courseId &&
            courseId !== "all" &&
            fee.course_id !== courseId
          ) {
            return false;
          }

          if (
            batchId &&
            batchId !== "all" &&
            fee.student?.batch_id !== batchId
          ) {
            return false;
          }

          if (!fee.created_at) return false;

          const feeDate =
            fee.created_at.split("T")[0];

          if (fromDate && feeDate < fromDate)
            return false;

          if (toDate && feeDate > toDate)
            return false;

          return true;

        })
        .map(mapFee);

      if (!rows.length) {
        toast.error("No records found.");
        return;
      }

      printTable(
        "Paid Fees Report",
        Object.keys(rows[0]),
        rows
      );

      return;
    }


    if (reportType === "collection") {

      // Course Filter
      if (courseId && courseId !== "all") {
        collectionData = collectionData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );

          return fee?.course_id === courseId;
        });
      }

      // Batch Filter
      if (batchId && batchId !== "all") {
        collectionData = collectionData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );

          return fee?.student?.batch_id === batchId;
        });
      }

      // From Date
      if (fromDate) {
        collectionData = collectionData.filter(
          (transaction) =>
            transaction.transaction_date >= fromDate
        );
      }

      // To Date
      if (toDate) {
        collectionData = collectionData.filter(
          (transaction) =>
            transaction.transaction_date <= toDate
        );
      }

      const rows = collectionData.map(mapTransaction);

      if (!rows.length) {
        toast.error("No records found.");
        return;
      }

      printTable(
        "Collection Report",
        Object.keys(rows[0]),
        rows
      );

      return;
    }


    if (reportType === "history") {

      // Course Filter
      if (courseId && courseId !== "all") {
        historyData = historyData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );

          return fee?.course_id === courseId;
        });
      }

      // Batch Filter
      if (batchId && batchId !== "all") {
        historyData = historyData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );

          return fee?.student?.batch_id === batchId;
        });
      }

      // Student Filter
      if (studentId && studentId !== "all") {
        historyData = historyData.filter((transaction) => {
          const fee = studentFees.find(
            (f) => f.id === transaction.student_fee_id
          );

          return (
            String(fee?.student?.id) ===
            String(studentId)
          );
        });
      }

      // From Date
      if (fromDate) {
        historyData = historyData.filter(
          (transaction) =>
            transaction.transaction_date >= fromDate
        );
      }

      // To Date
      if (toDate) {
        historyData = historyData.filter(
          (transaction) =>
            transaction.transaction_date <= toDate
        );
      }

      const rows = historyData.map(mapTransaction);

      if (!rows.length) {
        toast.error("No payment history found.");
        return;
      }

      printTable(
        "Payment History",
        Object.keys(rows[0]),
        rows
      );

      return;
    }


  };



  const handleRecentTransactionPrint = async (
    transaction: FeeTransaction
  ) => {
    if (!tenant?.id) {
      toast.error("Unable to load receipt: tenant is not available.");
      return;
    }
    try {
      if (!transaction.student_fee_id) {
        toast.error("Fee record not found for this transaction.");
        return;
      }

      // Fetch the COMPLETE fee record
      const { data: fee, error } = await supabase
        .from("Coaching-3_StudentFees")
        .select(`
    *,

    student:Coaching-3_Students!student_fees_student_tenant_fk(
      id,
      student_id,
      name,
      email,
      mobile,
      class
    ),

    course:Coaching-3_Courses!student_fees_course_tenant_fk(
      id,
      course_name
    ),

    batch:Coaching-3_StudentBatches!student_fees_batch_tenant_fk(
      id,
      batch_name,
      course_id
    ),

    fee_structure:Coaching-3_FeeStructures!student_fees_structure_tenant_fk(
      *
    )
  `)
        .eq("id", transaction.student_fee_id)
        .eq("tenant_id", tenant.id)
        .single();

      if (error) {
        console.error("Receipt fee fetch error:", error);
        toast.error("Unable to load fee details for receipt.");
        return;
      }

      if (!fee) {
        toast.error("Fee record not found.");
        return;
      }

      const payment: PaymentHistory = {
        id: transaction.id,

        student_fee_id: transaction.student_fee_id,

        student_id: fee.student_id,

        amount: transaction.amount,

        payment_mode:
          transaction.payment_mode as PaymentHistory["payment_mode"],

        transaction_date: transaction.transaction_date,

        transaction_id: transaction.transaction_id,

        receipt_no: transaction.receipt_no,

        received_by: transaction.received_by,

        fee_period_from: transaction.fee_period_from,

        fee_period_to: transaction.fee_period_to,

        remark: transaction.remark,

        created_at: transaction.created_at,

        months_covered:
          transaction.months_covered ?? 1,

        is_manual_override:
          transaction.is_manual_override ?? false,
      };

      const receipt = generateReceiptData(
        payment,
        fee as StudentFeeData
      );

      setRecentReceipt(receipt);
      setRecentReceiptOpen(true);

    } catch (error) {
      console.error(
        "Recent transaction receipt error:",
        error
      );

      toast.error(
        "Failed to prepare receipt."
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Bar Action (Export Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 sm:pb-2 border-b border-slate-100 dark:border-slate-800">

        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Student Fee Management
          </h2>

          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
            Manage student fees, payments, and outstanding balances.
          </p>
        </div>


        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">

          {true && (
            <Button
              onClick={() => setPreviousDuesOpen(true)}
              variant="outline"
              className="h-9 sm:h-10 flex-1 sm:flex-none px-3 sm:px-3.5 rounded-xl border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] sm:text-xs gap-1.5 sm:gap-2"
            >
              Previous Year Dues

              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                {previousDues.length}
              </span>
            </Button>
          )}

          <Button
            onClick={() => setIsExportModalOpen(true)}
            className="h-9 sm:h-10 flex-1 sm:flex-none px-3 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs gap-1.5 sm:gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[2.2]" />
            <span>Export Report</span>
          </Button>
        </div>



        {previousDuesOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-3 sm:p-6">

            <div className="w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-2xl sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_80px_rgba(15,23,42,0.25)] flex flex-col">

              {/* Header */}
              <div className="relative flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/10 shrink-0">

                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex items-center gap-2.5 sm:gap-3.5 min-w-0">

                  <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-center shrink-0 shadow-sm">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                      Previous Year Dues
                    </h2>

                    <p className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium truncate">
                      Outstanding fees from previous academic years
                    </p>
                  </div>

                </div>

                <Button
                  variant="outline"
                  onClick={() => setPreviousDuesOpen(false)}
                  className="relative h-8 sm:h-10 px-3 sm:px-3.5 rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-[11px] sm:text-xs transition-all shrink-0"
                >
                  Close
                </Button>

              </div>


              {/* Body */}
              <div className="max-h-[75vh] sm:max-h-[65vh] overflow-y-auto p-3 sm:p-6 bg-slate-50/50 dark:bg-slate-950/30">

                {previousDues.length === 0 ? (

                  <div className="py-12 sm:py-16 text-center">

                    <div className="mx-auto h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                      <Receipt className="h-5 w-5 text-slate-400" />
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4">
                      No previous dues found.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-2.5 sm:space-y-3">

                    {previousDues.map((due) => (

                      <div
                        key={due.id}
                        className="group rounded-xl sm:rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all duration-200"
                      >

                        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">

                          {/* Student Information */}
                          <div className="min-w-0">

                            <div className="flex items-center gap-2.5 sm:gap-3">

                              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400 font-extrabold shrink-0">
                                {due.student?.name?.charAt(0)?.toUpperCase() || "S"}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                                  {due.student?.name}
                                </p>

                                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                  Previous Academic Year
                                </p>
                              </div>

                            </div>

                            <div className="mt-2.5 sm:mt-3 space-y-1">

                              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                Course:{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {due.course?.course_name || "-"}
                                </span>
                              </p>

                              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                Batch:{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {due.batch?.batch_name || "-"}
                                </span>
                              </p>

                              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                Academic Year:{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {due.academic_year}
                                </span>
                              </p>

                            </div>

                          </div>


                          {/* Remaining Due */}
                          <div className="md:min-w-[130px]">

                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Remaining Due
                            </p>

                            <p className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5 sm:mt-1">
                              ₹{Number(due.remaining_amount).toLocaleString("en-IN")}
                            </p>

                          </div>


                          {/* Payment Button */}
                          <Button
                            onClick={() => {
                              setSelectedFee(due);
                              setPaymentDrawerOpen(true);
                              setPreviousDuesOpen(false);
                            }}
                            className="h-9 sm:h-10 w-full md:w-auto px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all shrink-0"
                          >
                            Collect Payment
                          </Button>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </div>

          </div>
        )}


      </div>



      {/* Analytics Dashboard Component */}
      <FeeAnalyticsDashboard
        studentFees={studentFees}
        analyticsStudentFees={analyticsStudentFees}
        feeTransactions={feeTransactions}
        onPrintReceipt={handleRecentTransactionPrint}
      />

      {/* Student Fee Filters */}
      <StudentFeeFilters
        filter={filter}
        onFilterChange={setFilter}
        totalCount={totalCount}
        assignedCount={assignedCount}
        unassignedCount={unassignedCount}
        pendingCount={pendingCount}
        overdueCount={overdueCount}
        partialCount={partialCount}
      />


      {/* Main Assigned Student Fee Table */}
      {filter !== "unassigned" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-1">
          <StudentFeeTable
            items={filteredStudentFees}
            loading={loading}
            onEdit={(fee) => {
              setSelectedFee(fee);
              setDrawerOpen(true);
            }}
            onCollect={(fee) => {
              setSelectedFee(fee);
              setPaymentDrawerOpen(true);
            }}
            onDelete={() => { }}
          />
        </div>
      )}

      {/* Unassigned Students Section */}
      {(filter === "all" || filter === "unassigned") && (
        <div className="space-y-3 pt-2">
          {filter === "all" && (
            <div>

            </div>
          )}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-1">
            <UnassignedStudentTable
              items={filteredUnassignedStudents}
              loading={loading}

              selectedStudents={selectedUnassignedStudents}
              onSelectionChange={setSelectedUnassignedStudents}

              onAssignFee={(student) => {
                setSelectedStudent(student);
                setAssignDrawerOpen(true);
              }}

              onBulkAssignFee={() => {
                setBulkAssignFeeOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Student Fee Edit Drawer */}
      <StudentFeeDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedFee(null);
          setSelectedStudent(null);
        }}
        studentFee={selectedFee}
        feeStructures={feeStructures}
        onSave={handleSaveFee}
        onDataChanged={async () => {
          await refreshData();
        }}
      />

      {/* Assign Fee Drawer */}
      <AssignFeeDrawer
        isOpen={assignDrawerOpen}
        onClose={() => {
          setAssignDrawerOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onAssigned={async () => {
          await refreshData();
          setAssignDrawerOpen(false);
          setSelectedStudent(null);
        }}
      />

      <BulkAssignFeeDrawer
        isOpen={bulkAssignFeeOpen}
        onClose={() => {
          setBulkAssignFeeOpen(false);
        }}
        students={filteredUnassignedStudents.filter((student) =>
          selectedUnassignedStudents.includes(String(student.id))
        )}
        onAssigned={async () => {
          await refreshData();

          setSelectedUnassignedStudents([]);
          setBulkAssignFeeOpen(false);
        }}
      />

      {/* Payment Collection Drawer */}
      <CollectPaymentDrawer
        isOpen={paymentDrawerOpen}
        onClose={() => {
          setPaymentDrawerOpen(false);
          setSelectedFee(null);
        }}
        studentFee={selectedFee}
        onPaymentSuccess={async () => {
          await refreshData();
        }}
      />

      <ReceiptPreviewDialog
        open={recentReceiptOpen}
        receipt={recentReceipt}
        onClose={() => {
          setRecentReceiptOpen(false);
          setRecentReceipt(null);
        }}
        onPrint={() => {
          window.print();
        }}
      />

      {/* Export Modal */}
      <ExportFeesModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        courses={courses}
        batches={batches}
        students={
          [
            ...new Map(
              feeTransactions
                .map((transaction) => {
                  const fee = studentFees.find(
                    (f) => f.id === transaction.student_fee_id
                  );
                  return fee?.student;
                })
                .filter(Boolean)
                .map((student) => [student!.id, student])
            ).values(),
          ]
        }
        onExportExcel={exportFees}
        onPrint={printFees}
      />
    </div>
  );
}

export default StudentFeeSection