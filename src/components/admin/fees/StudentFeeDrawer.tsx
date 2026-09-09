import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, History, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import CollectPaymentDrawer from "./CollectPaymentDrawer/CollectPaymentDrawer";
import PaymentHistoryList from "./history/PaymentHistoryList";

import {
  StudentFeeData,
  FeeStructure,
  FeeTransaction,
  PaymentHistory,
} from "./types";
import ReceiptPreviewDialog from "./receipt/ReceiptPreviewDialog";
import { generateReceiptData } from "./receipt/generateReceiptData";
import ChangeFeeStructureDialog from "./ChangeFeeStructureDialog";


interface StudentFeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentFee: StudentFeeData | null;
  feeStructures: FeeStructure[];
  onSave: (data: StudentFeeData) => Promise<void>;

  onDataChanged: () => Promise<void>;
}

export default function StudentFeeDrawer({
  isOpen,
  onClose,
  studentFee,
  feeStructures,
  onSave,
  onDataChanged,
}: StudentFeeDrawerProps) {



  const [selectedReceipt, setSelectedReceipt] =
    useState<PaymentHistory | null>(null);

  const [receiptPreviewOpen, setReceiptPreviewOpen] =
    useState(false);;

  const receiptData =
    selectedReceipt && studentFee
      ? generateReceiptData(
        selectedReceipt,
        studentFee
      )
      : null;

  const [saving, setSaving] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [changeFeeStructureOpen, setChangeFeeStructureOpen] =
    useState(false);

  const [formData, setFormData] = useState({
    fee_structure_id: "",
    total_fee: 0,
    discount: 0,
    final_fee: 0,
    paid_amount: 0,
    remaining_amount: 0,
    next_due_date: "",
    status: "Pending" as StudentFeeData["status"],
  });


  useEffect(() => {
    if (!studentFee) return;
    setFormData({
      fee_structure_id: studentFee.fee_structure_id ?? "",
      total_fee: studentFee.total_fee,
      discount: studentFee.discount,
      paid_amount: studentFee.paid_amount,
      next_due_date: studentFee.next_due_date ?? "",
      final_fee: 0,
      remaining_amount: 0,
      status: "Pending",
    });
  }, [studentFee]);


  const finalFee = Math.max(
    formData.total_fee - formData.discount,
    0
  );

  const remainingAmount = Math.max(
    finalFee - formData.paid_amount,
    0
  );

  const status: StudentFeeData["status"] =
    remainingAmount === 0
      ? "Paid"
      : formData.paid_amount > 0
        ? "Partial"
        : "Pending";


  const validateForm = () => {
    if (!formData.fee_structure_id) {
      toast.error("Please select a fee structure.");
      return false;
    }

    if (formData.discount < 0) {
      toast.error("Discount cannot be negative.");
      return false;
    }

    if (formData.discount > formData.total_fee) {
      toast.error("Discount cannot exceed total fee.");
      return false;
    }

    if (formData.paid_amount < 0) {
      toast.error("Paid amount cannot be negative.");
      return false;
    }

    if (formData.paid_amount > finalFee) {
      toast.error("Paid amount cannot exceed final fee.");
      return false;
    }

    return true;
  };


  const handleSave = async () => {
    if (!studentFee) return;

    if (!validateForm()) return;

    try {
      setSaving(true);

      await onSave({
        ...studentFee,

        fee_structure_id: formData.fee_structure_id,

        total_fee: formData.total_fee,

        discount: formData.discount,

        final_fee: finalFee,

        paid_amount: formData.paid_amount,

        remaining_amount: remainingAmount,

        next_due_date: formData.next_due_date || null,

        status,
      });

      toast.success("Student fee updated successfully.");

      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update student fee.");
    } finally {
      setSaving(false);
    }
  };



  const handleChangeFeeStructure = async (
    structure: FeeStructure,
    discount: number
  ) => {
    if (!studentFee) return;

    // Safety: payment hone ke baad structure change nahi hoga
    if (Number(studentFee.paid_amount || 0) > 0) {
      toast.error(
        "Fee structure cannot be changed after payment."
      );
      return;
    }

    const totalFee =
      Number(structure.total_fee || 0);

    const finalFee = Math.max(
      totalFee - Number(discount || 0),
      0
    );

    const remainingAmount = finalFee;

    const courseFee =
      totalFee -
      Number(structure.admission_fee || 0) -
      Number(structure.registration_fee || 0);

    try {
      setSaving(true);

      await onSave({
        ...studentFee,

        // New structure
        fee_structure_id: structure.id,

        // New structure values
        total_fee: totalFee,
        course_fee: courseFee,
        admission_fee: Number(
          structure.admission_fee || 0
        ),
        registration_fee: Number(
          structure.registration_fee || 0
        ),
        duration_months: Number(
          structure.duration_months || 0
        ),

        // Discount
        discount: Number(discount || 0),

        // Since paid amount is 0
        paid_amount: 0,
        final_fee: finalFee,
        remaining_amount: remainingAmount,

        status:
          finalFee === 0
            ? "Paid"
            : "Pending",
      });

      toast.success(
        "Fee structure changed successfully."
      );

      setChangeFeeStructureOpen(false);

      // Refresh parent data
      await onDataChanged();

    } catch (error: any) {
      toast.error(
        error?.message ||
        "Failed to change fee structure."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[520px] p-0 flex flex-col justify-between overflow-hidden bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">

        {/* 1. HEADER SECTION */}
        <div className="p-4 sm:p-6 pr-10 sm:pr-12 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
          <SheetHeader className="space-y-1.5 text-left">
            <div className="flex items-center justify-between gap-2">
              {/* Title with Icon */}
              <SheetTitle className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="truncate">Student Fee Ledger</span>
              </SheetTitle>

              {/* Status Badge */}
              {status && (
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                  {status}
                </span>
              )}
            </div>

            {/* Description */}
            <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
            Complete student fee details and payment history.
            </SheetDescription>
          </SheetHeader>
        </div>


        {/* 2. SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {studentFee && (
            <>
              {/* Student Information Card */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">

                <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />

                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Fee Structure Breakdown
                    </h3>
                  </div>

                  {Number(studentFee.paid_amount || 0) === 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setChangeFeeStructureOpen(true)
                      }
                      disabled={saving}
                      className="h-8 px-3 rounded-lg text-[11px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      Change Structure
                    </Button>
                  )}

                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Student Name</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 truncate">
                      {studentFee.student?.name ?? "-"}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Course</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {studentFee.course?.course_name ?? "-"}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Batch</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {studentFee.student?.batch?.batch_name ?? "-"}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {studentFee.student?.mobile ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown Card */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Fee Structure Breakdown
                  </h3>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Course Fee</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">₹{studentFee.course_fee.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Admission Fee</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">₹{studentFee.admission_fee.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Registration Fee</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">₹{studentFee.registration_fee.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Duration</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{studentFee.duration_months} Months</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Total Fee</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">₹{studentFee.total_fee.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Discount Given</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">- ₹{formData.discount || 0}</span>
                  </div>

                  {/* Final Highlighted Total */}
                  <div className="flex justify-between items-center pt-3 pb-1 text-sm font-extrabold border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-900 dark:text-slate-100">Final Payable Fee</span>
                    <span className="text-blue-600 dark:text-blue-400 text-base">₹{finalFee}</span>
                  </div>
                </div>
              </div>

              {/* Payment Summary Highlight Cards */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Payment Status
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Paid Amount</span>
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                      ₹{studentFee.paid_amount.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                    <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">Remaining Due</span>
                    <p className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">
                      ₹{remainingAmount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 px-1 text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Next Due Date:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {studentFee.next_due_date
                      ? new Date(studentFee.next_due_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Payment History Component */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <History className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Transaction History
                  </h3>
                </div>

                <PaymentHistoryList
                  studentFeeId={studentFee.id}
                  onPrintReceipt={(payment) => {
                    setSelectedReceipt(payment);
                    setReceiptPreviewOpen(true);
                  }}
                />
              </div>
            </>
          )}
        </div>

        <ChangeFeeStructureDialog
          open={changeFeeStructureOpen}
          onClose={() =>
            setChangeFeeStructureOpen(false)
          }
          studentFee={studentFee}
          feeStructures={feeStructures}
          onChanged={handleChangeFeeStructure}
        />

        {/* 3. MODALS & DRAWERS (Logic Intact) */}
        <CollectPaymentDrawer
          isOpen={paymentDrawerOpen}
          onClose={() => setPaymentDrawerOpen(false)}
          studentFee={studentFee}
          onPaymentSuccess={(receiptNo) => {
            console.log("Receipt:", receiptNo);
            onDataChanged?.();
          }}
        />

        <ReceiptPreviewDialog
          open={receiptPreviewOpen}
          receipt={receiptData}
          onClose={() => {
            setReceiptPreviewOpen(false);
            setSelectedReceipt(null);
          }}
          onPrint={() => {
            window.print();
          }}
        />

        {/* 4. FOOTER ACTIONS */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 px-5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Close
          </Button>

          <Button
            onClick={() => setPaymentDrawerOpen(true)}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 gap-2 transition-all"
          >
            <CreditCard className="h-4 w-4" /> Collect Payment
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}