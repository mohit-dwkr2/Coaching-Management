import { DashboardData } from "@/services/dashboardService";
import {
  CreditCard,
  Wallet,
  BadgeIndianRupee,
  CalendarDays,
} from "lucide-react";

interface FeeSectionProps {
  data: DashboardData["fees"];
}

export default function FeeSection({
  data,
}: FeeSectionProps) {

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 transition-all">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
            <CreditCard size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Fee Summary
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              Current fee breakdown & payment schedule
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
          <span className="text-[11px] font-bold">
            Academic Year {data.academicYear}
          </span>
        </div>
      </div>


      {data.feeAssigned ? (
        <>
          {/* Fee Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
            {/* Total Fee Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-5 hover:border-slate-400/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r-full bg-slate-600 opacity-80 group-hover:h-14 transition-all duration-300" />
              <div className="flex items-center justify-between pl-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  Total Fee
                </span>
                <div className="h-9 w-9 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-transform group-hover:scale-110">
                  <BadgeIndianRupee size={18} className="stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-3 pl-1">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{data.totalFee.toLocaleString()}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span>●</span> Net Payable Amount
                </p>
              </div>
            </div>

            {/* Paid Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r-full bg-emerald-500 opacity-80 group-hover:h-14 transition-all duration-300" />
              <div className="flex items-center justify-between pl-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  Paid
                </span>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Wallet size={18} className="stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-3 pl-1">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{data.paid.toLocaleString()}
                </h3>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <span>●</span> Cleared Payments
                </p>
              </div>
            </div>

            {/* Remaining Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-5 hover:border-rose-500/40 hover:bg-rose-500/[0.02] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r-full bg-rose-500 opacity-80 group-hover:h-14 transition-all duration-300" />
              <div className="flex items-center justify-between pl-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  Remaining
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Wallet size={18} className="stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-3 pl-1">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{data.remaining.toLocaleString()}
                </h3>
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <span>●</span> Outstanding Dues
                </p>
              </div>
            </div>

            {/* Next Due Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-5 hover:border-blue-500/40 hover:bg-blue-500/[0.02] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r-full bg-blue-500 opacity-80 group-hover:h-14 transition-all duration-300" />
              <div className="flex items-center justify-between pl-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  Next Due
                </span>
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <CalendarDays size={18} className="stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-3 pl-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {data.nextDueDate
                    ? new Date(data.nextDueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : "Not Available"}
                </h3>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {data.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Clearance Visual Progress Bar */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Fee Clearance Progress
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {data.totalFee > 0 ? Math.round((data.paid / data.totalFee) * 100) : 0}% Cleared
              </span>
            </div>

            <div className="relative w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 overflow-hidden border border-slate-200/50 dark:border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out shadow-sm"
                style={{
                  width: `${data.totalFee > 0 ? (data.paid / data.totalFee) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

        </>
      ) : (


        <div className="relative z-10 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CreditCard size={26} />
          </div>

          <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
            Fee Not Assigned Yet
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Your fee structure for {data.academicYear} has not been assigned yet.
          </p>
        </div>
      )}



      {data.previousDues.length > 0 && (
        <div className="relative z-10 mt-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 p-5">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-300">
                Previous Year Dues
              </h3>

              <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Outstanding amount from previous academic years
              </p>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[11px] font-black">
              ₹{data.previousDueTotal.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="space-y-2">
            {data.previousDues.map((due) => (
              <div
                key={due.academicYear}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-amber-200/50 dark:border-amber-900/30"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {due.academicYear}
                </span>

                <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                  ₹{due.remaining.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );

}