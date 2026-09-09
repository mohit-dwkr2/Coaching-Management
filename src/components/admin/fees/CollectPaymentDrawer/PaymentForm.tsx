import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import {
  PaymentFormData,
  PaymentFormProps,
  PaymentMode,
} from "../types";
import { AlertTriangle, CreditCard } from "lucide-react";


const paymentModes: PaymentMode[] = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cheque",
];

const monthOptions = [1, 2, 3, 4, 5, 6, 12];


export default function PaymentForm({
  formData,
  setFormData,
}: PaymentFormProps) {

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 space-y-4 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">

      {/* Section Title Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/60 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Payment Information
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
          Entry Form
        </span>
      </div>

      {/* Form Grid - Responsive Cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">

        {/* 1. Amount Input */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Amount <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
              ₹
            </span>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              className="pl-7 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* 2. Payment Mode */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Payment Mode
          </Label>
          <Select
            value={formData.paymentMode}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                paymentMode: value as PaymentMode,
              }))
            }
          >
            <SelectTrigger className="bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <SelectValue />
            </SelectTrigger>

            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              {paymentModes.map((mode) => (
                <SelectItem key={mode} value={mode} className="text-xs font-semibold">
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Months Covered */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Months Covered
          </Label>
          <Select
            value={String(formData.monthsCovered)}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                monthsCovered: Number(value),
              }))
            }
          >
            <SelectTrigger className="bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <SelectValue />
            </SelectTrigger>

            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              {monthOptions.map((month) => (
                <SelectItem
                  key={month}
                  value={String(month)}
                  className="text-xs font-semibold"
                >
                  {month} Month{month > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Fee Period From */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fee Period From
          </Label>

          <Input
            type="date"
            value={
              formData.feePeriodFrom
                ? formData.feePeriodFrom
                  .toISOString()
                  .split("T")[0]
                : ""
            }
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                feePeriodFrom: e.target.value
                  ? new Date(e.target.value)
                  : null,
              }))
            }
            className="bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all cursor-pointer"
          />

          <p className="text-[10px] text-amber-600 dark:text-amber-500/90 font-medium leading-tight flex items-center gap-1 mt-1">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Defaults automatically from current fee cycle. Adjust only if needed.</span>
          </p>
        </div>

        {/* 5. Payment Date */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Payment Date
          </Label>
          <Input
            type="date"
            value={
              formData.paymentDate
                .toISOString()
                .split("T")[0]
            }
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                paymentDate: new Date(e.target.value),
              }))
            }
            className="bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all cursor-pointer"
          />
        </div>

      </div>

      {/* 6. Reference Number */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Reference / Txn ID <span className="text-slate-400 font-normal lowercase">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. UPI-984321 / Chq #0012"
          value={formData.referenceNo}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              referenceNo: e.target.value,
            }))
          }
          className="bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all placeholder:font-normal"
        />
      </div>

      {/* 7. Remarks */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Remarks <span className="text-slate-400 font-normal lowercase">(optional)</span>
        </Label>
        <Textarea
          rows={2}
          placeholder="Add payment note or special remarks..."
          value={formData.remarks}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              remarks: e.target.value,
            }))
          }
          className="bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all placeholder:font-normal resize-none"
        />
      </div>

    </div>
  );
}