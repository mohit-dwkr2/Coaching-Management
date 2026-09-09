import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FeeStructureSection from "./FeeStructureSection";
import StudentFeeSection from "./StudentFeeSection";



export default function FeesManager() {
  const [activeTab, setActiveTab] = useState<string>("students");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);



  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };



  const exportFees = () => {
  };
  const printFees = () => {
  };

  const filteredBatches =
    selectedCourse === "all"
      ? batches
      : batches.filter(
        (batch) =>
          batch.course_id === selectedCourse
      );

return (
  <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">

    {/* Upper Top Header Card */}
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/70 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">

      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-500/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-indigo-500/[0.03] blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-7">

        {/* Title & Top Bar */}
        <div className="flex flex-col gap-6">

          {/* Heading + Icon */}
          <div className="flex items-start gap-4">

            <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
              <Wallet className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />

              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
            </div>

            <div className="min-w-0 space-y-1.5">

              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                  Fees Manager
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                 Manage student fees, payments, and outstanding balances with ease.
              </p>

            </div>
          </div>


          {/* Action Controls */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-2.5">

            <div className="w-full flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch gap-2.5">

              {/* Search */}
              <div className="relative w-full sm:flex-1 lg:min-w-0">

                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />

                <Input
                  placeholder={
                    activeTab === "structures"
                      ? "Search configurations..."
                      : "Search student or batch..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 rounded-xl text-sm transition-all font-medium shadow-sm"
                />

              </div>


              {/* Course Filter */}
              <Select
                value={selectedCourse}
                onValueChange={(value) => {
                  setSelectedCourse(value);
                  setSelectedBatch("all");
                }}
              >

                <SelectTrigger className="w-full sm:w-[220px] lg:w-[200px] h-11 rounded-xl shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm font-medium text-slate-700 dark:text-slate-300">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    All Courses
                  </SelectItem>

                  {courses.map((course) => (
                    <SelectItem
                      key={course.id}
                      value={course.id}
                    >
                      {course.course_name}
                    </SelectItem>
                  ))}

                </SelectContent>

              </Select>


              {/* Batch Filter */}
              <Select
                value={selectedBatch}
                onValueChange={setSelectedBatch}
              >

                <SelectTrigger className="w-full sm:w-[220px] lg:w-[200px] h-11 rounded-xl shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm font-medium text-slate-700 dark:text-slate-300">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    All Batches
                  </SelectItem>

                  {filteredBatches.map((batch) => (
                    <SelectItem
                      key={batch.id}
                      value={batch.id}
                    >
                      {batch.batch_name}
                    </SelectItem>
                  ))}

                </SelectContent>

              </Select>


              {/* Refresh */}
              {/* <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className="h-11 w-full sm:w-11 shrink-0 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200 active:scale-95 shadow-sm"
                title="Refresh Ledger Cache Data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button> */}

            </div>

          </div>

        </div>

      </div>

    </div>


    {/* Primary Context Workspace Tabs */}
    <Tabs
      defaultValue="structures"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full space-y-5"
    >

      <div className="flex items-center justify-between">

        <TabsList className="bg-slate-100/90 dark:bg-slate-900/90 p-1.5 border border-slate-200/70 dark:border-slate-800 inline-flex w-full sm:w-auto rounded-2xl backdrop-blur-sm gap-1 h-auto shadow-sm">

          <TabsTrigger
            value="students"
            className="rounded-xl font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md data-[state=active]:shadow-slate-200/70 dark:data-[state=active]:shadow-slate-950/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" strokeWidth={2.2} />
            Student Fees
          </TabsTrigger>

          <TabsTrigger
            value="structures"
            className="rounded-xl font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md data-[state=active]:shadow-slate-200/70 dark:data-[state=active]:shadow-slate-950/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Receipt className="h-4 w-4" strokeWidth={2.2} />
            Fee Structures
          </TabsTrigger>

        </TabsList>

      </div>


      <TabsContent
        value="structures"
        className="outline-none focus-visible:ring-0 mt-0"
      >
        <FeeStructureSection
          searchQuery={searchQuery}
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>


      <TabsContent
        value="students"
        className="outline-none focus-visible:ring-0 mt-0"
      >
        <StudentFeeSection
          searchQuery={searchQuery}
          selectedCourse={selectedCourse}
          selectedBatch={selectedBatch}
          refreshTrigger={refreshTrigger}

          onCoursesChange={setCourses}
          onBatchesChange={setBatches}
        />
      </TabsContent>

    </Tabs>

  </div>
);
}