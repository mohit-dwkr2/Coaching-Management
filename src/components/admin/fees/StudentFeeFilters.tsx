import { Button } from "@/components/ui/button";

type FilterType =
  | "all"
  | "assigned"
  | "unassigned"
  | "pending"
  | "overdue"
  | "partial";

interface StudentFeeFiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;

  totalCount: number;
  assignedCount: number;
  unassignedCount: number;
  overdueCount: number;
  pendingCount: number;
  partialCount: number;
}

const StudentFeeFilters = ({
  filter,
  onFilterChange,
  totalCount,
  assignedCount,
  unassignedCount,
  overdueCount,
  pendingCount,
  partialCount,
}: StudentFeeFiltersProps) => {


  return (
    <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200/60 bg-slate-100/80 p-1.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 sm:flex sm:flex-wrap sm:items-center">

      {/* All Filter */}
      <Button
        variant="ghost"
        onClick={() => onFilterChange("all")}
        className={`relative h-9 w-full rounded-xl px-3 text-xs font-bold transition-all duration-200 gap-2 sm:w-auto sm:px-4 ${filter === "all"
            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
      >
        <span>All</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${filter === "all"
              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
        >
          {totalCount}
        </span>
      </Button>

      {/* Assigned Filter */}
      <Button
        variant="ghost"
        onClick={() => onFilterChange("assigned")}
        className={`relative h-9 w-full rounded-xl px-3 text-xs font-bold transition-all duration-200 gap-2 sm:w-auto sm:px-4 ${filter === "assigned"
            ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
      >
        <span>Assigned</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${filter === "assigned"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
        >
          {assignedCount}
        </span>
      </Button>

      {/* Not Assigned Filter */}
      <Button
        variant="ghost"
        onClick={() => onFilterChange("unassigned")}
        className={`relative h-9 w-full rounded-xl px-3 text-xs font-bold transition-all duration-200 gap-2 sm:w-auto sm:px-4 ${filter === "unassigned"
            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/80 dark:border-slate-700/80"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
      >
        <span>Not Assigned</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${filter === "unassigned"
              ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
        >
          {unassignedCount}
        </span>
      </Button>

      {/* Pending Filter */}
      <Button
        variant="ghost"
        onClick={() => onFilterChange("pending")}
        className={`relative h-9 w-full rounded-xl px-3 text-xs font-bold transition-all duration-200 gap-2 sm:w-auto sm:px-4 ${filter === "pending"
            ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
      >
        <span>Pending</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${filter === "pending"
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
        >
          {pendingCount}
        </span>
      </Button>

      {/* Overdue Filter */}
      <Button
        variant="ghost"
        onClick={() => onFilterChange("overdue")}
        className={`relative h-9 w-full rounded-xl px-3 text-xs font-bold transition-all duration-200 gap-2 sm:w-auto sm:px-4 ${filter === "overdue"
            ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
      >
        <span>Overdue</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${filter === "overdue"
              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
        >
          {overdueCount}
        </span>
      </Button>

      {/* Partial Filter */}
      <Button
        variant="ghost"
        onClick={() => onFilterChange("partial")}
        className={`relative h-9 w-full rounded-xl px-3 text-xs font-bold transition-all duration-200 gap-2 sm:w-auto sm:px-4 ${filter === "partial"
            ? "bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          }`}
      >
        <span>Partial</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${filter === "partial"
              ? "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400"
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
        >
          {partialCount}
        </span>
      </Button>

    </div>
  );
}

export default StudentFeeFilters;