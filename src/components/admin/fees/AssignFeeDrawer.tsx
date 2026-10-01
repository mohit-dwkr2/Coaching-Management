import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AlertCircle, CheckCircle2, Receipt, X } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface AssignFeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
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

export default function AssignFeeDrawer({
  isOpen,
  onClose,
  student,
  onAssigned,
}: AssignFeeDrawerProps) {
  const { tenant, loading: tenantLoading } = useTenant();

  const [loading, setLoading] = useState(false);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [selectedStructure, setSelectedStructure] = useState("");
  const [discount, setDiscount] = useState(0);
  const [assignedFee, setAssignedFee] = useState<any | null>(null);

  // Helps ignore responses from an older student/tenant request.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    // Reset drawer form/data on close, reopen, student change, or tenant change.
    setSelectedStructure("");
    setDiscount(0);
    setFeeStructures([]);
    setAssignedFee(null);
    setLoading(false);

    if (!isOpen || tenantLoading || !tenant?.id || !student?.id) {
      return () => {
        requestIdRef.current++;
      };
    }

    void fetchFeeStructures(requestId);
    void loadAssignedFee(requestId);

    return () => {
      requestIdRef.current++;
    };
  }, [
    isOpen,
    student?.id,
    student?.course_id,
    tenant?.id,
    tenantLoading,
  ]);

  const fetchFeeStructures = async (requestId: number) => {
    if (tenantLoading || !tenant?.id || !student?.course_id) {
      setFeeStructures([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("Coaching-3_FeeStructures")
      .select("*")
      .eq("course_id", student.course_id)
      .eq("tenant_id", tenant.id)
      .eq("status", "active");

    // Ignore results if the drawer context changed while the request was running.
    if (requestIdRef.current !== requestId) return;

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setFeeStructures(data || []);
  };

  const selectedFee = useMemo(() => {
    return feeStructures.find((item) => item.id === selectedStructure);
  }, [feeStructures, selectedStructure]);

  const grandTotal = selectedFee
    ? Number(selectedFee.total_fee) +
    Number(selectedFee.admission_fee) +
    Number(selectedFee.registration_fee)
    : 0;

  const finalFee = Math.max(grandTotal - discount, 0);

  const loadAssignedFee = async (requestId?: number) => {
    if (tenantLoading || !tenant?.id || !student?.id) {
      setAssignedFee(null);
      return;
    }

    const { data, error } = await supabase
      .from("Coaching-3_StudentFees")
      .select(`
  *,
  fee_structure:Coaching-3_FeeStructures!student_fees_structure_tenant_fk(
    id,
    total_fee,
    admission_fee,
    registration_fee,
    duration_months
  ),
  course:Coaching-3_Courses!student_fees_course_tenant_fk(
    course_name
  ),
  batch:Coaching-3_StudentBatches!student_fees_batch_tenant_fk(
    id,
    batch_name,
    course_id
  )
`)
      .eq("student_id", student.id)
      .eq("academic_year", getCurrentAcademicYear())
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (
      requestId !== undefined &&
      requestIdRef.current !== requestId
    ) {
      return;
    }

    if (error) {
      toast.error(error.message);
      return;
    }

    setAssignedFee(data);
  };

  const handleAssignFee = async () => {
    if (tenantLoading || !tenant?.id || !student?.id) {
      toast.error("Tenant or student not found. Please try again.");
      return;
    }

    if (!selectedStructure || !selectedFee) {
      toast.error("Please select a valid fee structure.");
      return;
    }

    try {
      const academicYear = getCurrentAcademicYear();

      // Check whether a fee is already assigned for this student/year/tenant.
      const {
        data: existingFee,
        error: existingFeeError,
      } = await supabase
        .from("Coaching-3_StudentFees")
        .select("id")
        .eq("student_id", student.id)
        .eq("academic_year", academicYear)
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (existingFeeError) throw existingFeeError;

      if (existingFee) {
        toast.error(
          `Fee is already assigned for academic year ${academicYear}.`
        );
        return;
      }

      const { error } = await supabase
        .from("Coaching-3_StudentFees")
        .insert({
          tenant_id: tenant.id,
          student_id: student.id,
          course_id: student.course_id,
          batch_id: student.batch_id,
          academic_year: academicYear,
          fee_structure_id: selectedStructure,

          // Snapshot
          course_fee: Number(selectedFee.total_fee),
          admission_fee: Number(selectedFee.admission_fee),
          registration_fee: Number(selectedFee.registration_fee),
          duration_months: Number(selectedFee.duration_months),

          // Totals
          total_fee: grandTotal,
          discount: discount,
          final_fee: finalFee,
          paid_amount: 0,
          remaining_amount: finalFee,
          status: "Pending",
        });

      if (error) throw error;

      toast.success("Fee assigned successfully.");

      await loadAssignedFee();
      onAssigned();
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign fee.");
    }
  };

  if (!isOpen) return null;


  return (
    <>
      {/* Backdrop Blur Overlay with Fade Transition */}
      <div
        className={`fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-100" // transition control
          }`}
        onClick={onClose}
      />

      {/* Main Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-[90] w-full max-w-md bg-slate-50 text-slate-900 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200">

        {/* Modern Sticky Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${assignedFee ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {assignedFee ? "Fee Details" : "Assign Fee"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {assignedFee ? "Active Student Allocation" : "Set up student fee structure"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {!assignedFee ? (
            <div className="space-y-5">

              {/* Readonly Info Section */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Student
                    </Label>
                    <Input
                      value={student?.name || ""}
                      disabled
                      className="bg-slate-50 text-sm border-slate-200 font-semibold text-slate-800 disabled:opacity-100 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Course
                    </Label>
                    <Input
                      value={student?.course?.course_name || ""}
                      disabled
                      className="bg-slate-50 text-sm border-slate-200 font-semibold text-slate-800 disabled:opacity-100 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Batch
                  </Label>
                  <Input
                    value={
                      student?.batch?.batch_name || "Not Assigned"
                    }
                    disabled
                    className="bg-slate-50 text-sm border-slate-200 font-semibold text-slate-800 disabled:opacity-100 rounded-xl"
                  />
                </div>
              </div>

              {/* Fee Selection Inputs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Select Fee Structure
                  </Label>
                  <select
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                    value={selectedStructure}
                    onChange={(e) => setSelectedStructure(e.target.value)}
                  >
                    <option value="">Choose a structure...</option>
                    {feeStructures.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        ₹ {fee.total_fee} • {fee.duration_months} Months Duration
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Discount Amount (₹)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter discount if applicable"
                    value={discount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > grandTotal) {
                        toast.error(
                          "Discount cannot be greater than Grand Total."
                        );
                        return;
                      }
                      setDiscount(value);
                    }}
                    className="rounded-xl border-slate-200 font-semibold text-slate-900 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Fee Breakdown Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2.5">
                  Fee Calculations
                </h3>

                <div className="space-y-2.5 text-sm font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Course Fee</span>
                    <span className="font-semibold text-slate-900">
                      ₹ {Number(selectedFee?.total_fee || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admission Fee</span>
                    <span className="font-semibold text-slate-900">
                      ₹ {Number(selectedFee?.admission_fee || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registration Fee</span>
                    <span className="font-semibold text-slate-900">
                      ₹ {Number(selectedFee?.registration_fee || 0).toLocaleString()}
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
                    <span>₹ {grandTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-rose-600">
                    <span>Discount (-)</span>
                    <span className="font-semibold">₹ {discount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Final Highlighted Total */}
                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-lg font-black text-emerald-600">
                  <span>Final Payable</span>
                  <span className="text-xl bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">
                    ₹ {finalFee.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* Fee Already Assigned State View */
            <div className="space-y-5">

              {/* Success Badge Banner */}
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/30 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 text-emerald-700 font-extrabold text-base">
                  <CheckCircle2 size={20} />
                  <span>Fee Assigned & Active</span>
                </div>
                <p className="text-xs font-medium text-emerald-800/80 mt-1.5 leading-relaxed">
                  This student has an assigned fee record. You can check the current payment balance and details below.
                </p>
              </div>

              {/* Status & Allocation Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-black uppercase tracking-wider">
                    {assignedFee.status}
                  </span>
                </div>

                <div className="space-y-2.5 text-sm font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Course Fee</span>
                    <span className="font-semibold text-slate-900">
                      ₹ {Number(assignedFee.course_fee).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admission Fee</span>
                    <span className="font-semibold text-slate-900">
                      ₹ {Number(assignedFee.admission_fee).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registration Fee</span>
                    <span className="font-semibold text-slate-900">
                      ₹ {Number(assignedFee.registration_fee).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Discount</span>
                    <span className="font-semibold">
                      ₹ {Number(assignedFee.discount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-semibold text-slate-900">
                      {assignedFee.duration_months} Months
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between">
                    <span className="font-semibold text-slate-700">Remaining Due</span>
                    <span className="font-extrabold text-rose-600">
                      ₹ {Number(assignedFee.remaining_amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Paid Amount</span>
                    <span className="font-extrabold text-emerald-600">
                      ₹ {Number(assignedFee.paid_amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Assigned On</span>
                    <span className="font-medium">
                      {new Date(assignedFee.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-lg font-black text-slate-900">
                  <span>Final Fee</span>
                  <span className="text-xl">
                    ₹ {Number(assignedFee.final_fee).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Info Note Box */}
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 flex gap-3 items-start">
                <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800/80 leading-relaxed font-medium">
                  Future payments, receipts, and installment updates can be easily managed from the **Fees Manager** section.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Fixed Modern Action Footer */}
        <div className="p-5 bg-white border-t border-slate-200/80 shrink-0">
          {!assignedFee ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="w-1/2 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
                onClick={onClose}
              >
                Cancel
              </Button>

              <Button
                className="w-1/2 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                onClick={handleAssignFee}
              >
                Assign Fee
              </Button>
            </div>
          ) : (
            <Button
              onClick={onClose}
              className="w-full h-11 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.98] transition-all"
            >
              Close Window
            </Button>
          )}
        </div>

      </div>
    </>
  );
}