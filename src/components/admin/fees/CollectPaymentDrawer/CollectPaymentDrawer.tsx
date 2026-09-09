import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { collectPayment } from "../services/paymentService";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { StudentFeeData } from "../types";
import { PaymentFormData } from "../types";

import StudentInfoCard from "./StudentInfoCard";
import CurrentFeeSummary from "./CurrentFeeSummary";
import PaymentForm from "./PaymentForm";
import PaymentPreview from "./PaymentPreview";
import FooterActions from "./FooterActions";
import { CreditCard } from "lucide-react";

interface CollectPaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentFee: StudentFeeData | null;
  onPaymentSuccess?: (receiptNo: string) => void;
}

export default function CollectPaymentDrawer({
  isOpen,
  onClose,
  studentFee,
  onPaymentSuccess,
}: CollectPaymentDrawerProps) {



  const [formData, setFormData] = useState<PaymentFormData>({
    amount: "",
    paymentDate: new Date(),
    feePeriodFrom: null,
    paymentMode: "Cash",
    monthsCovered: 1,
    referenceNo: "",
    remarks: "",
  });

  const initializedRef = useRef<string | null>(null);

  const handleSubmit = async () => {
    if (!studentFee) return;

    try {
      setLoading(true);

      const paymentAmount = Number(formData.amount);

      if (!paymentAmount || paymentAmount <= 0) {
        toast.error("Please enter a valid payment amount.");
        return;
      }

      if (paymentAmount > studentFee.remaining_amount) {
        toast.error("Payment amount cannot exceed remaining fee.");
        return;
      }

      const response = await collectPayment({
        studentFee,
        formData,
        receivedBy: "Admin",
      });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(
        `${response.message} Receipt: ${response.receiptNo}`
      );

      onPaymentSuccess?.(response.receiptNo ?? "");

      onClose();

    } catch (error) {
      console.error(error);

      toast.error("Something went wrong while collecting payment.");

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!isOpen || !studentFee) {
      initializedRef.current = null;
      return;
    }

    const formKey = `${studentFee.id}`;

    // Already initialized for this drawer/student.
    // Do NOT reset form on normal re-renders.
    if (initializedRef.current === formKey) {
      return;
    }

    initializedRef.current = formKey;

    console.log("INITIALIZING PAYMENT FORM:", formKey);

    const defaultFeePeriod =
      studentFee.next_due_date
        ? new Date(studentFee.next_due_date)
        : studentFee.admission_date
          ? new Date(studentFee.admission_date)
          : null;

    setFormData({
      amount: "",
      paymentDate: new Date(),
      feePeriodFrom: defaultFeePeriod,
      paymentMode: "Cash",
      monthsCovered: 1,
      referenceNo: "",
      remarks: "",
    });
  }, [isOpen, studentFee?.id]);

  const [loading, setLoading] = useState(false);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-[620px] p-0 flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-950 border-l border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-all">

        {/* 1. CLEAN MODERN HEADER */}
        <div className="p-4 sm:p-6 pb-4 sm:pb-5 pr-10 sm:pr-12 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <SheetHeader className="space-y-1 text-left">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-600 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-md shrink-0">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    Collect Payment
                  </SheetTitle>
                  <SheetDescription className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                  Record payment details and generate receipt.
                  </SheetDescription>
                </div>
              </div>

              {/* Status Pill Indicator */}
              {/* <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span> */}
            </div>
          </SheetHeader>
        </div>

        {/* 2. SCROLLABLE BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-950">

          {/* Student Profile Card Component */}
          <div className="transition-all hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl">
            <StudentInfoCard studentFee={studentFee} />
          </div>

          {/* Current Fee Summary Card Component */}
          <CurrentFeeSummary studentFee={studentFee} />

          {/* Payment Input Form Component */}
          <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
            <PaymentForm
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          {/* Real-time Calculation & Preview Component */}
          <PaymentPreview
            studentFee={studentFee}
            formData={formData}
          />

        </div>

        {/* 3. PINNED MODERN FOOTER */}
        <div className="shrink-0 p-4 px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md">
          <FooterActions
            loading={loading}
            onClose={onClose}
            onSubmit={handleSubmit}
          />
        </div>

      </SheetContent>
    </Sheet>
  );
}