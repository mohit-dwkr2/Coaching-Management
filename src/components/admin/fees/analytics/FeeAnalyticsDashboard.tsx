import React, { useMemo, useState } from "react";
import {
  IndianRupee,
  Wallet,
  Clock3,
  Percent,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  CalendarDays as CalendarIcon,
  BookOpen,
  Layers3,
} from "lucide-react";

import {
  StudentFeeData,
  FeeTransaction,
} from "@/components/admin/fees/types";

import { getCurrentAcademicYear } from "@/utils/academicYear";
import { analyticsCalculations } from "./analyticsCalculations";
import RecentTransactions from "./RecentTransactions";

interface FeeAnalyticsDashboardProps {
  studentFees: StudentFeeData[];
  analyticsStudentFees: StudentFeeData[];
  feeTransactions: FeeTransaction[];
  onPrintReceipt?: (transaction: FeeTransaction) => void;
}

export default function FeeAnalyticsDashboard({
  studentFees,
  analyticsStudentFees,
  feeTransactions,
  onPrintReceipt,
}: FeeAnalyticsDashboardProps) {

  const currentAcademicYear = getCurrentAcademicYear();

  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<string>(currentAcademicYear);

  const [selectedCourse, setSelectedCourse] =
    useState<string>("all");

  const [selectedBatch, setSelectedBatch] =
    useState<string>("all");

  // --------------------------------------------------
  // ACADEMIC YEARS
  // --------------------------------------------------

  const academicYears = useMemo(() => {
    const years = analyticsStudentFees
      .map((fee) => fee.academic_year)
      .filter(
        (year): year is string =>
          Boolean(year)
      );

    return Array.from(new Set(years)).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [analyticsStudentFees]);


  // --------------------------------------------------
  // COURSES
  // --------------------------------------------------

  const courses = useMemo(() => {
    const map = new Map<string, string>();

    analyticsStudentFees.forEach((fee) => {
      if (
        fee.course?.id &&
        fee.course.course_name
      ) {
        map.set(
          fee.course.id,
          fee.course.course_name
        );
      }
    });

    return Array.from(map.entries()).map(
      ([id, course_name]) => ({
        id,
        course_name,
      })
    );
  }, [analyticsStudentFees]);


  // --------------------------------------------------
  // BATCHES
  // --------------------------------------------------

  const batches = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        batch_name: string;
        course_id?: string;
      }
    >();

    analyticsStudentFees.forEach((fee) => {
      if (
        fee.batch?.id &&
        fee.batch.batch_name
      ) {
        map.set(
          fee.batch.id,
          {
            id: fee.batch.id,
            batch_name: fee.batch.batch_name,
            course_id: fee.batch.course_id,
          }
        );
      }
    });

    return Array.from(map.values());
  }, [analyticsStudentFees]);


  // --------------------------------------------------
  // FILTERED BATCHES
  // --------------------------------------------------

  const filteredBatches = useMemo(() => {
    if (selectedCourse === "all") {
      return batches;
    }

    return batches.filter(
      (batch) =>
        batch.course_id === selectedCourse
    );
  }, [
    batches,
    selectedCourse,
  ]);


  // --------------------------------------------------
  // FILTERED ANALYTICS DATA
  // --------------------------------------------------

  const filteredAnalyticsStudentFees = useMemo(() => {
    return analyticsStudentFees.filter((fee) => {

      // Academic Year
      if (
        selectedAcademicYear !== "all" &&
        fee.academic_year !== selectedAcademicYear
      ) {
        return false;
      }


      // Course
      if (
        selectedCourse !== "all" &&
        fee.course_id !== selectedCourse
      ) {
        return false;
      }


      // Batch
      if (
        selectedBatch !== "all" &&
        fee.batch?.id !== selectedBatch
      ) {
        return false;
      }


      return true;
    });
  }, [
    analyticsStudentFees,
    selectedAcademicYear,
    selectedCourse,
    selectedBatch,
  ]);


  const filteredFeeTransactions = useMemo(() => {
    const feeIds = new Set(
      filteredAnalyticsStudentFees.map((fee) => fee.id)
    );

    return feeTransactions.filter((transaction) =>
      feeIds.has(transaction.student_fee_id)
    );
  }, [
    feeTransactions,
    filteredAnalyticsStudentFees,
  ]);


  // --------------------------------------------------
  // ANALYTICS CALCULATION
  // --------------------------------------------------

  const analytics = analyticsCalculations(
    filteredAnalyticsStudentFees,
    filteredFeeTransactions
  );

  // 2. Structured Cards Configuration Array with Rich Visual Gradients
  const cards = [
    {
      title: "TOTAL FEE ASSIGNED",
      value: `₹${analytics.totalAssigned.toLocaleString("en-IN")}`,
      // subtitle: "Total assigned fee amount",
      icon: IndianRupee,
      iconBg: "bg-blue-600 text-white shadow-blue-500/25",
    },
    {
      title: "TOTAL COLLECTED",
      value: `₹${analytics.totalCollected.toLocaleString("en-IN")}`,
      // subtitle: "Successfully collected",
      icon: Wallet,
      iconBg: "bg-emerald-500 text-white shadow-emerald-500/25",
    },
    {
      title: "OUTSTANDING AMOUNT",
      value: `₹${analytics.totalOutstanding.toLocaleString("en-IN")}`,
      // subtitle: "Remaining balance",
      icon: Clock3,
      iconBg: "bg-amber-500 text-white shadow-amber-500/25",
    },
    {
      title: "TODAY'S COLLECTION",
      value: `₹${analytics.todayCollection.toLocaleString("en-IN")}`,
      // subtitle: "Collected today",
      icon: CalendarDays,
      iconBg: "bg-teal-500 text-white shadow-teal-500/25",
    },
    {
      title: "THIS MONTH COLLECTION",
      value: `₹${analytics.monthCollection.toLocaleString("en-IN")}`,
      // subtitle: "Collected this month",
      icon: CalendarRange,
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/25",
    },
    {
      title: "COLLECTION %",
      value: `${analytics.collectionPercentage}%`,
      // subtitle: "Collection efficiency",
      icon: Percent,
      iconBg: "bg-violet-600 text-white shadow-violet-500/25",
    },
  ];

  return (

    <div className="space-y-6">

      {/* Analytics Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">

        {/* Filter Label */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <CalendarIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              Financial Overview
            </p>

            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Filter analytics by year, course & batch
            </p>
          </div>
        </div>


        {/* Selectors */}
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">

          {/* Academic Year */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedAcademicYear}
              onChange={(e) =>
                setSelectedAcademicYear(e.target.value)
              }
              className="h-10 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-bold text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 sm:min-w-[145px]"
            >
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>


          {/* Course */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedBatch("all");
              }}
              className="h-10 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-bold text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 sm:min-w-[155px]"
            >
              <option value="all">
                All Courses
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.course_name}
                </option>
              ))}
            </select>

            <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>


          {/* Batch */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedBatch}
              onChange={(e) =>
                setSelectedBatch(e.target.value)
              }
              className="h-10 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-bold text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 sm:min-w-[155px]"
            >
              <option value="all">
                All Batches
              </option>

              {filteredBatches.map((batch) => (
                <option
                  key={batch.id}
                  value={batch.id}
                >
                  {batch.batch_name}
                </option>
              ))}
            </select>

            <Layers3 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

        </div>
      </div>


      {/* Analytics Dynamic Grid - Clean SaaS Style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">



        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {/* Left Colorful Solid Icon Box (As seen in your screenshot) */}
              <div
                className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-md ${card.iconBg}`}
              >
                <Icon className="h-7 w-7 stroke-[2.2]" />
              </div>

              {/* Content Area */}
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  {card.title}
                </p>

                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {card.value}
                </h2>

                {/* <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.subtitle}
              </p> */}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions List */}
      <RecentTransactions
        transactions={filteredFeeTransactions}
        onPrintReceipt={onPrintReceipt}
      />
    </div>
  );
}