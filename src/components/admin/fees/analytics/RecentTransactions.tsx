import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeTransaction } from "../types";
import { ArrowUpRight, Printer, Receipt } from "lucide-react";

interface RecentTransactionsProps {
  transactions: FeeTransaction[];
  onPrintReceipt?: (transaction: FeeTransaction) => void;
}

export default function RecentTransactions({
  transactions,
  onPrintReceipt,
}: RecentTransactionsProps) {
  const recentTransactions = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

 return (
  <Card className="border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">

    {/* Card Header */}
    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 py-3.5 px-5">
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2.5">

          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
          </div>

          <div>
            <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Recent Transactions
            </CardTitle>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Latest payment activity logs
            </p>
          </div>

        </div>

        {recentTransactions.length > 0 && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
            {recentTransactions.length} Activity
          </span>
        )}

      </div>
    </CardHeader>


    {/* Card Content */}
    <CardContent className="p-4">

      {recentTransactions.length === 0 ? (

        <div className="text-center py-7 space-y-2">

          <div className="mx-auto w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Receipt className="h-4 w-4" />
          </div>

          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            No recent transactions recorded yet.
          </p>

        </div>

      ) : (

        <div className="space-y-2">

          {recentTransactions.map((transaction) => (

            <div
              key={transaction.id}
              className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100/80 dark:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 group"
            >

              {/* Left Side */}
              <div className="flex items-center gap-2.5 min-w-0">

                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Receipt className="h-4 w-4 stroke-[2]" />
                </div>


                <div className="space-y-0.5 min-w-0">

                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {transaction.student_fee?.student?.name}
                  </p>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {transaction.student_fee?.course?.course_name}
                  </p>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {transaction.student_fee?.batch?.batch_name}
                  </p>

                  {/* <p className="text-xs font-bold text-slate-900 tracking-wide font-mono">
                    #{transaction.id.slice(0, 8).toUpperCase()}
                  </p> */}

                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {transaction.payment_mode}
                  </span>

                </div>

              </div>


              {/* Right Side */}
              <div className="text-right space-y-1 shrink-0">

                <div>

                  <p className="text-xs font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    + ₹{Number(transaction.amount).toLocaleString("en-IN")}
                  </p>

                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {new Date(transaction.transaction_date).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => onPrintReceipt?.(transaction)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all text-[9px] font-bold"
                >
                  <Printer className="h-3 w-3" />
                  Print Receipt
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </CardContent>
  </Card>
);
}