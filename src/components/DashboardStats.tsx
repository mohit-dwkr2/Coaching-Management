import { DashboardData } from "@/services/dashboardService";
import {
    CalendarCheck,
    BookOpenCheck,
    CreditCard,
    Wallet,
} from "lucide-react";

interface DashboardStatsProps {
    data: DashboardData;
}

export default function DashboardStats({
    data,
}: DashboardStatsProps) {

  const cards = [
  {
    title: "Attendance",
    value: `${data.attendance.percentage}%`,
    subtitle: "Overall Attendance",
    icon: CalendarCheck,
    color: "emerald",
  },
  {
    title: "Classes Attended",
    value: `${data.attendance.present} / ${data.attendance.total}`,
    subtitle: "Present / Total",
    icon: BookOpenCheck,
    color: "blue",
  },
  {
      title: "Remaining Fee",
      value: `₹${data.fees.remaining.toLocaleString()}`,
      subtitle: "Pending Amount",
      icon: Wallet,
      color: "rose",
    },
    {
      title: "Fee Status",
      value: data.fees.status,
      subtitle: "Current Status",
      icon: CreditCard,
      color: "amber",
    },
];

// Color palette config mapped strictly for UI styling
const themeMap = {
  emerald: {
    borderTop: "border-t-emerald-400",
    bgGlow: "from-emerald-500/10 via-transparent to-transparent",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    pillBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40",
  },
  blue: {
    borderTop: "border-t-blue-400",
    bgGlow: "from-blue-500/10 via-transparent to-transparent",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    pillBg: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40",
  },
  amber: {
    borderTop: "border-t-amber-300",
    bgGlow: "from-amber-500/10 via-transparent to-transparent",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    pillBg: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
  },
  rose: {
    borderTop: "border-t-rose-300",
    bgGlow: "from-rose-500/10 via-transparent to-transparent",
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    pillBg: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40",
  },
};

 return (
    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const theme = themeMap[card.color] || themeMap.blue;

        return (
          <div
            key={card.title}
            className={`group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 border-t-4 ${theme.borderTop} p-3.5 sm:p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
          >
            {/* Subtle Ambient Hover Mesh Glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${theme.bgGlow} opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
            />

            <div className="relative z-10">
              {/* Top Row: Title Badge & Glass Icon */}
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest text-slate-400 dark:text-slate-500 truncate">
                  {card.title}
                </span>

                <div
                  className={`h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl ${theme.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-xs shrink-0`}
                >
                  <Icon
                    size={18}
                    className="sm:hidden stroke-[2.2]"
                  />
                  <Icon
                    size={22}
                    className="hidden sm:block stroke-[2.2]"
                  />
                </div>
              </div>

              {/* Main Value Highlight */}
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">
                  {card.value}
                </h3>
              </div>
            </div>

            {/* Bottom Row: Status Pill */}
            <div className="relative z-10 mt-4 sm:mt-6 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border ${theme.pillBg}`}
              >
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}