import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  CheckCircle2,
  Receipt,
  Users,
  X,
} from "lucide-react";

interface BulkAssignFeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  onAssigned: () => void;
}

function getCurrentAcademicYear(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}

export default function BulkAssignFeeDrawer({
  isOpen,
  onClose,
  students,
  onAssigned,
}: BulkAssignFeeDrawerProps) {
  const [loading, setLoading] = useState(false);

  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [selectedStructure, setSelectedStructure] = useState("");

  const [discount, setDiscount] = useState(0);

  /*
   * Students should normally belong to the same course
   * because selection is being done through Course/Batch filters.
   */
  const courseId = students[0]?.course_id || "";

  const selectedFee = useMemo(() => {
    return feeStructures.find(
      (item) => item.id === selectedStructure
    );
  }, [feeStructures, selectedStructure]);

  /*
   * Same calculation as AssignFeeDrawer
   */
  const grandTotal = selectedFee
    ? Number(selectedFee.total_fee) +
      Number(selectedFee.admission_fee) +
      Number(selectedFee.registration_fee)
    : 0;

  const finalFee = Math.max(
    grandTotal - Number(discount || 0),
    0
  );

  /*
   * Load fee structures whenever drawer opens
   * or selected course changes.
   */
  useEffect(() => {
    if (!isOpen) return;

    setSelectedStructure("");
    setDiscount(0);

    fetchFeeStructures();
  }, [isOpen, courseId]);

  const fetchFeeStructures = async () => {
    if (!courseId) {
      setFeeStructures([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("Coaching-3_FeeStructures")
        .select("*")
        .eq("course_id", courseId)
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setFeeStructures(data || []);
    } catch (error: any) {
      console.error(
        "Bulk fee structure fetch error:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to load fee structures."
      );

      setFeeStructures([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * BULK ASSIGN
   */
  const handleBulkAssign = async () => {
    if (!students.length) {
      toast.error("No students selected.");
      return;
    }

    if (!selectedStructure) {
      toast.error("Please select a fee structure.");
      return;
    }

    if (!selectedFee) {
      toast.error("Invalid fee structure.");
      return;
    }

    if (discount < 0) {
      toast.error("Discount cannot be negative.");
      return;
    }

    if (discount > grandTotal) {
      toast.error(
        "Discount cannot be greater than Grand Total."
      );
      return;
    }

    /*
     * Safety:
     * Bulk selected students should belong to same course.
     */
    const differentCourse = students.some(
      (student) =>
        student.course_id !== courseId
    );

    if (differentCourse) {
      toast.error(
        "Selected students must belong to the same course."
      );
      return;
    }

    try {
      setLoading(true);

      const academicYear =
        getCurrentAcademicYear();

      /*
       * Check which students already have a
       * fee record for current academic year.
       */
      const studentIds = students.map(
        (student) => student.id
      );

      const { data: existingFees, error: existingError } =
        await supabase
          .from("Coaching-3_StudentFees")
          .select("student_id")
          .in("student_id", studentIds)
          .eq("academic_year", academicYear);

      if (existingError) {
        throw existingError;
      }

      const alreadyAssignedIds = new Set(
        (existingFees || []).map(
          (fee) => String(fee.student_id)
        )
      );

      const studentsToAssign =
        students.filter(
          (student) =>
            !alreadyAssignedIds.has(
              String(student.id)
            )
        );

      /*
       * Nothing to assign.
       */
      if (!studentsToAssign.length) {
        toast.info(
          `All ${students.length} selected students already have fee structures assigned for ${academicYear}.`
        );

        setLoading(false);
        return;
      }

      /*
       * Create one fee record for each student.
       */
      const insertRows = studentsToAssign.map(
        (student) => ({
          student_id: student.id,

          /*
           * IMPORTANT:
           * Take course + batch from student's
           * CURRENT assignment.
           */
          course_id: student.course_id,
          batch_id: student.batch_id,

          academic_year: academicYear,

          fee_structure_id: selectedStructure,

          /*
           * Snapshot from selected fee structure
           */
          course_fee: Number(
            selectedFee.total_fee
          ),

          admission_fee: Number(
            selectedFee.admission_fee
          ),

          registration_fee: Number(
            selectedFee.registration_fee
          ),

          duration_months: Number(
            selectedFee.duration_months
          ),

          /*
           * Totals
           */
          total_fee: grandTotal,

          discount: Number(discount || 0),

          final_fee: finalFee,

          /*
           * New fee assignment always starts at 0
           */
          paid_amount: 0,

          remaining_amount: finalFee,

          status: "Pending",
        })
      );

      const { error: insertError } =
        await supabase
          .from("Coaching-3_StudentFees")
          .insert(insertRows);

      if (insertError) {
        throw insertError;
      }

      /*
       * Success message
       */
      const assignedCount =
        studentsToAssign.length;

      const skippedCount =
        students.length - assignedCount;

      if (skippedCount > 0) {
        toast.success(
          `${assignedCount} students assigned successfully. ${skippedCount} already had fees assigned.`
        );
      } else {
        toast.success(
          `Fee structure assigned to ${assignedCount} students successfully.`
        );
      }

      /*
       * Refresh parent + close drawer
       */
      onAssigned();
    } catch (error: any) {
      console.error(
        "Bulk fee assignment error:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to assign fee structures."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm"
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />

      {/* DRAWER */}
      <div className="fixed inset-y-0 right-0 z-[90] w-full max-w-md bg-slate-50 text-slate-900 shadow-2xl flex flex-col border-l border-slate-200">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-200/80 shrink-0">

          <div className="flex items-center gap-3">

            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <Users size={20} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Bulk Assign Fee
              </h2>

              <p className="text-xs text-slate-400 font-medium">
                Assign one fee structure to multiple students
              </p>
            </div>

          </div>

          <button
            disabled={loading}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-40"
          >
            <X size={18} />
          </button>

        </div>


        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* SELECTED STUDENTS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">

            <div className="flex items-center justify-between mb-4">

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Selected Students
                </p>

                <p className="text-2xl font-black text-slate-900 mt-1">
                  {students.length}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>

            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">

              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="min-w-0">

                    <p className="text-xs font-bold text-slate-800 truncate">
                      {student.name}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      {student.student_id || "-"}
                    </p>

                  </div>

                  <span className="text-[10px] font-bold text-slate-500">
                    {student.batch?.batch_name || "-"}
                  </span>
                </div>
              ))}

            </div>

          </div>


          {/* COURSE + BATCH */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">

            <div>
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Course
              </Label>

              <Input
                value={
                  students[0]?.course?.course_name ||
                  ""
                }
                disabled
                className="mt-1.5 bg-slate-50 border-slate-200 font-semibold rounded-xl disabled:opacity-100"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Batch
              </Label>

              <Input
                value={
                  students.length === 1
                    ? students[0]?.batch?.batch_name ||
                      "Not Assigned"
                    : "Multiple / Selected Batches"
                }
                disabled
                className="mt-1.5 bg-slate-50 border-slate-200 font-semibold rounded-xl disabled:opacity-100"
              />
            </div>

          </div>


          {/* FEE STRUCTURE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">

            <div>

              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Select Fee Structure
              </Label>

              <select
                disabled={
                  loading ||
                  feeStructures.length === 0
                }
                value={selectedStructure}
                onChange={(e) =>
                  setSelectedStructure(
                    e.target.value
                  )
                }
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer disabled:opacity-50"
              >

                <option value="">
                  {feeStructures.length === 0
                    ? "No fee structures available"
                    : "Choose a structure..."}
                </option>

                {feeStructures.map((fee) => (
                  <option
                    key={fee.id}
                    value={fee.id}
                  >
                    ₹{" "}
                    {Number(
                      fee.total_fee || 0
                    ).toLocaleString("en-IN")}{" "}
                    •{" "}
                    {fee.duration_months || 0} Months
                  </option>
                ))}

              </select>

            </div>


            {/* DISCOUNT */}
            <div>

              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Discount Amount (₹)
              </Label>

              <Input
                type="number"
                min={0}
                value={discount}
                disabled={loading}
                placeholder="Enter discount"
                onChange={(e) => {

                  const value = Number(
                    e.target.value
                  );

                  if (value < 0) {
                    return;
                  }

                  if (value > grandTotal) {
                    toast.error(
                      "Discount cannot be greater than Grand Total."
                    );
                    return;
                  }

                  setDiscount(value);
                }}
                className="rounded-xl border-slate-200 font-semibold"
              />

            </div>

          </div>


          {/* FEE CALCULATION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">

            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2.5">
              Fee Calculations
            </h3>

            <div className="space-y-2.5 text-sm font-medium text-slate-600">

              <div className="flex justify-between">
                <span>Course Fee</span>

                <span className="font-semibold text-slate-900">
                  ₹{" "}
                  {Number(
                    selectedFee?.total_fee || 0
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Admission Fee</span>

                <span className="font-semibold text-slate-900">
                  ₹{" "}
                  {Number(
                    selectedFee?.admission_fee || 0
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Registration Fee</span>

                <span className="font-semibold text-slate-900">
                  ₹{" "}
                  {Number(
                    selectedFee?.registration_fee || 0
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Duration</span>

                <span className="font-semibold text-slate-900">
                  {selectedFee?.duration_months || 0} Months
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800">

                <span>Total Fee</span>

                <span>
                  ₹{" "}
                  {grandTotal.toLocaleString("en-IN")}
                </span>

              </div>

              <div className="flex justify-between text-rose-600">

                <span>Discount (-)</span>

                <span className="font-semibold">
                  ₹{" "}
                  {Number(
                    discount || 0
                  ).toLocaleString("en-IN")}
                </span>

              </div>

            </div>


            <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-lg font-black text-emerald-600">

              <span>Final Payable</span>

              <span className="text-xl bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">
                ₹{" "}
                {finalFee.toLocaleString("en-IN")}
              </span>

            </div>

          </div>


          {/* INFO */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4">

            <div className="flex gap-3">

              <Receipt
                size={18}
                className="text-blue-600 shrink-0 mt-0.5"
              />

              <p className="text-xs text-blue-800/80 leading-relaxed font-medium">
                This fee will be assigned for the current
                academic year. Every selected student will
                retain their current course and batch.
              </p>

            </div>

          </div>

        </div>


        {/* FOOTER */}
        <div className="p-5 bg-white border-t border-slate-200/80 shrink-0">

          <div className="flex gap-3">

            <Button
              variant="outline"
              disabled={loading}
              className="w-1/2 h-11 rounded-xl font-bold"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              disabled={
                loading ||
                !students.length ||
                !selectedStructure ||
                !selectedFee
              }
              className="w-1/2 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleBulkAssign}
            >
              {loading
                ? "Assigning..."
                : `Assign to ${students.length}`}
            </Button>

          </div>

        </div>

      </div>
    </>
  );
}