import React from "react";
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, CreditCard } from "lucide-react";
import { StudentFeeData } from "./types";

interface StudentFeeTableProps {
  items: StudentFeeData[];
  loading: boolean;
  onEdit: (ledger: StudentFeeData) => void;
  onDelete: (id: string) => void;
  onCollect?: (fee: StudentFeeData) => void;
}

export default function StudentFeeTable({
  items,
  loading,
  onEdit,
  onDelete,
  onCollect,
}: StudentFeeTableProps) {
  const getStatusBadge = (status: StudentFeeData["status"]) => {
    switch (status) {
      case "Paid":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Paid
          </Badge>
        );

      case "Partial":
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200/60">
            Partial
          </Badge>
        );

      case "Pending":
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200/60">
            Pending
          </Badge>
        );

      case "Overdue":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300">
            Overdue
          </Badge>
        );

      default:
        return null;
    }
  };


  // 1. Loading Skeleton State
  if (loading) {
   return (
      <div className="w-full rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
            <TableRow>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-3">Student Name</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2">Course</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2">Batch</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2">Total Fee</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2">Discount</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2">Payable Fee</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2">Collected</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2">Outstanding</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2">Due Date</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2">Status</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index} className="border-b border-slate-100 dark:border-slate-800">
                <TableCell className="py-3 px-3"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="py-3 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="py-3 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="py-3 px-2 text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                <TableCell className="py-3 px-2 text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                <TableCell className="py-3 px-2 text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                <TableCell className="py-3 px-2 text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                <TableCell className="py-3 px-2 text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                <TableCell className="py-3 px-2"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="py-3 px-2"><Skeleton className="h-5 w-14" /></TableCell>
                <TableCell className="py-3 px-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 2. Empty State
  if (items.length === 0) {
    return (
      <Card className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 text-slate-400 dark:text-slate-500">
          <CreditCard className="h-8 w-8 stroke-[1.8]" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">No Student Fees Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 font-medium">
          No student fee records found. Assign a fee structure to students to begin tracking.
        </p>
      </Card>
    );
  }

  // 3. Main Data View (Responsive: Mobile Cards + Desktop Table)
  return (
  <div className="space-y-4 w-full">
    {/* MOBILE VIEW (COMPACT ACCORDION LIST) */}
    <div className="md:hidden space-y-2 w-full">
      {items.map((ledger) => {
        const studentName = ledger.student?.name ?? "-";
        const initials =
          studentName !== "-"
            ? studentName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "?";

        return (
          <details
            key={ledger.id}
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-all overflow-hidden"
          >
            {/* Always Visible Summary Header */}
            <summary className="flex items-center justify-between p-2.5 cursor-pointer list-none select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar */}
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {initials}
                </div>

                {/* Name & ID/Course */}
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate leading-tight">
                    {studentName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {ledger.course?.course_name ?? "-"}
                  </p>
                </div>
              </div>

              {/* Status & Toggle Arrow */}
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(ledger.status)}
                <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform duration-200">
                  ▼
                </span>
              </div>
            </summary>

            {/* Collapsible Details */}
            <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
              {/* Batch Tag */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Batch: {ledger.student?.batch?.batch_name ?? "-"}
                </span>
              </div>

              {/* Grid Fee Details */}
              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    Final Fee
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    ₹{ledger.final_fee.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    Collected
                  </span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{ledger.paid_amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    Outstanding
                  </span>
                  <p
                    className={`font-bold text-sm ${
                      ledger.remaining_amount > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-500"
                    }`}
                  >
                    ₹{ledger.remaining_amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    Due Date
                  </span>
                  <p className="font-medium text-slate-600 dark:text-slate-300">
                    {ledger.next_due_date
                      ? new Date(ledger.next_due_date).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(ledger)}
                  className="flex-1 h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl gap-1.5 text-xs font-bold shadow-none"
                >
                  <Eye className="h-3.5 w-3.5" /> View Details
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onCollect?.(ledger)}
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 text-xs font-bold shadow-sm"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Collect
                </Button>
              </div>
            </div>
          </details>
        );
      })}
    </div>


    
      {/* DESKTOP VIEW (TABLE LAYOUT - Fully Fluid & No Horizontal Scroll) */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm w-full">
        <Table className="w-full table-auto">
          <TableHeader className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-3 whitespace-nowrap">Student Name</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2 whitespace-nowrap">Course</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2 whitespace-nowrap">Batch</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2 whitespace-nowrap">Total Fee</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2 whitespace-nowrap">Discount</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2 whitespace-nowrap">Payable Fee</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2 whitespace-nowrap">Collected</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-2 whitespace-nowrap">Outstanding</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2 whitespace-nowrap">Due Date</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase px-2 whitespace-nowrap">Status</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 h-11 text-[11px] tracking-wider uppercase text-right px-3 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((ledger) => (
              <TableRow
                key={ledger.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 transition-colors"
              >
                <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs py-3 px-3 whitespace-nowrap">
                  {ledger.student?.name ?? "-"}
                </TableCell>

                <TableCell className="text-slate-600 dark:text-slate-300 text-xs font-semibold py-3 px-2 whitespace-nowrap">
                  {ledger.course?.course_name ?? "-"}
                </TableCell>

                <TableCell className="text-slate-600 dark:text-slate-300 text-xs py-3 px-2 whitespace-nowrap">
                  <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-700 dark:text-slate-300 inline-block">
                    {ledger.student?.batch?.batch_name ?? "-"}
                  </span>
                </TableCell>

                <TableCell className="font-medium text-slate-700 dark:text-slate-300 text-xs text-right py-3 px-2 whitespace-nowrap">
                  ₹{ledger.total_fee.toLocaleString("en-IN")}
                </TableCell>

                <TableCell className="text-right font-medium text-slate-500 dark:text-slate-400 py-3 px-2 text-xs whitespace-nowrap">
                  ₹{ledger.discount.toLocaleString("en-IN")}
                </TableCell>

                <TableCell className="text-right font-black text-slate-900 dark:text-slate-50 py-3 px-2 text-xs whitespace-nowrap">
                  ₹{ledger.final_fee.toLocaleString("en-IN")}
                </TableCell>

                <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 py-3 px-2 text-xs whitespace-nowrap">
                  ₹{ledger.paid_amount.toLocaleString("en-IN")}
                </TableCell>

                <TableCell
                  className={`text-right font-bold py-3 px-2 text-xs whitespace-nowrap ${
                    ledger.remaining_amount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  ₹{ledger.remaining_amount.toLocaleString("en-IN")}
                </TableCell>

                <TableCell className="text-slate-500 dark:text-slate-400 text-xs font-semibold py-3 px-2 whitespace-nowrap">
                  {ledger.next_due_date
                    ? new Date(ledger.next_due_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </TableCell>

                <TableCell className="font-semibold text-slate-900 text-xs py-3 px-2 whitespace-nowrap">
                  {getStatusBadge(ledger.status)}
                </TableCell>

                <TableCell className="text-right py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(ledger)}
                      className="h-7 px-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg gap-1 text-[11px] font-bold shadow-none"
                    >
                      <Eye className="h-3 w-3" /> View
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCollect?.(ledger)}
                      className="h-7 px-2 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100/50 rounded-lg gap-1 text-[11px] font-bold shadow-none"
                    >
                      <CreditCard className="h-3 w-3" /> Collect
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}