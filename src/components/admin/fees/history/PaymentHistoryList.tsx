import { useEffect, useState } from "react";
import { PaymentHistory } from "../types";
import { getStudentPaymentHistory } from "./paymentHistoryService";
import PaymentHistoryCard from "./PaymentHistoryCard";
import { Receipt } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface PaymentHistoryListProps {
  studentFeeId: string;

  onPrintReceipt?: (
    payment: PaymentHistory
  ) => void;
}

export default function PaymentHistoryList({
  studentFeeId,
  onPrintReceipt,
}: PaymentHistoryListProps) {
  const { tenant } = useTenant();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      if (!tenant?.id || !studentFeeId) {
        setPayments([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await getStudentPaymentHistory(
          studentFeeId,
          tenant.id
        );

        if (isActive) {
          setPayments(data);
        }
      } catch (error) {
        console.error("Failed to load payment history:", error);

        if (isActive) {
          setPayments([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [studentFeeId, tenant?.id]);

  // PaymentHistoryList Component

  if (loading) {

    return (
      <div className="space-y-3 py-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 animate-pulse space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
          <Receipt className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Payments Recorded Yet</p>
        <p className="text-[11px] text-slate-400 max-w-[220px]">
          When payments are collected, transaction details & receipts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {payments.map((payment) => (
        <PaymentHistoryCard
          key={payment.id}
          payment={payment}
          onPrint={onPrintReceipt}
        />
      ))}
    </div>
  );
}