import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeeStructure, CourseData } from "./types";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

interface FeeStructureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    formData: Omit<FeeStructure, "id" | "course"> & { id?: string }
  ) => Promise<void>;
  structure: FeeStructure | null;
  courses: CourseData[];
}

export default function FeeStructureDrawer({
  isOpen,
  onClose,
  onSave,
  structure,
  courses,
}: FeeStructureDrawerProps) {
  const [courseId, setCourseId] = useState<string>("");
  const [totalFee, setTotalFee] = useState<string>("");
  const [admissionFee, setAdmissionFee] = useState<string>("");
  const [registrationFee, setRegistrationFee] = useState<string>("");
  const [durationMonths, setDurationMonths] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (structure) {
      setCourseId(structure.course_id || "");
      setTotalFee(structure.total_fee?.toString() || "");
      setAdmissionFee(structure.admission_fee?.toString() || "");
      setRegistrationFee(structure.registration_fee?.toString() || "");
      setDurationMonths(structure.duration_months?.toString() || "");
      setIsActive(structure.status === "active");
    } else {
      setCourseId("");
      setTotalFee("");
      setAdmissionFee("");
      setRegistrationFee("");
      setDurationMonths("");
      setIsActive(true);
    }
  }, [structure, isOpen]);


  const grandTotal =
    Number(totalFee || 0) +
    Number(admissionFee || 0) +
    Number(registrationFee || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseId) {
      toast.error("Please select a course.");
      return;
    }

    if (!totalFee) {
      toast.error("Please enter the total fee.");
      return;
    }

    if (!durationMonths) {
      toast.error("Please enter the course duration.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        id: structure?.id,
        course_id: courseId,
        total_fee: Number(totalFee),
        admission_fee: Number(admissionFee || 0),
        registration_fee: Number(registrationFee || 0),
        duration_months: Number(durationMonths),
        status: isActive ? "active" : "inactive",
      });
    } finally {
      setSaving(false);
    };
  }


  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[500px] p-0 flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl">

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Modern Sheet Header */}
          <SheetHeader className="space-y-1.5 text-left border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  {structure ? "Edit Fee Structure" : "Create Fee Structure"}
                </SheetTitle>
                <SheetDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {structure
                    ? "Update the fee structure for your course."
                    : "Add a new fee structure for your course."}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Main Form Fields */}
          <form id="fee-structure-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Course Association Selector */}
            <div className="space-y-2">
              <Label htmlFor="course_select" className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase text-[10px]">
                Course <span className="text-rose-500">*</span>
              </Label>
              <Select value={courseId} onValueChange={setCourseId} required>
                <SelectTrigger id="course_select" className="w-full h-11 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-sm font-medium transition-all">
                  <SelectValue placeholder="Select Target Course" />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="text-sm py-2.5 rounded-lg cursor-pointer">
                      {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Total Fee Field */}
            <div className="space-y-2">
              <Label htmlFor="total_fee" className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase text-[10px]">
                Course Fee (₹) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm pointer-events-none">₹</span>
                <Input
                  id="total_fee"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={totalFee}
                  onChange={(e) => setTotalFee(e.target.value)}
                  className="pl-8 h-11 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl font-semibold text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Fee Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="admission_fee" className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase text-[10px]">
                  Admission Fee
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm pointer-events-none">₹</span>
                  <Input
                    id="admission_fee"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={admissionFee}
                    onChange={(e) => setAdmissionFee(e.target.value)}
                    className="pl-8 h-11 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl font-semibold text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_fee" className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase text-[10px]">
                  Registration Fee
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm pointer-events-none">₹</span>
                  <Input
                    id="registration_fee"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                    className="pl-8 h-11 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl font-semibold text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Course Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration_months" className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase text-[10px]">
                Course Duration (Months) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="duration_months"
                type="number"
                min="1"
                max="60"
                placeholder="e.g. 12"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="h-11 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl font-semibold text-sm transition-all"
                required
              />
            </div>

            {/* Premium Fee Summary Card */}
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/60 via-slate-50/80 to-slate-100/50 dark:from-blue-950/20 dark:via-slate-900/40 dark:to-slate-900/80 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-blue-100/60 dark:border-blue-900/30 pb-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Fee Structure Breakdown
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Summary
                </span>
              </div>

              <div className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Base Course Fee</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">₹ {Number(totalFee || 0).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Admission Fee</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">₹ {Number(admissionFee || 0).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Registration Fee</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">₹ {Number(registrationFee || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Total Payable Amount</span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                  ₹ {grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

          </form>
        </div>

        {/* Sticky Premium Sheet Footer */}
        <SheetFooter className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            form="fee-structure-form"
            className="h-11 px-6 font-bold text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            {saving
              ? "Saving Changes..."
              : structure
                ? "Update Structure"
                : "Create Structure"}
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}