import ReceiptTemplate from "./ReceiptTemplate";
import { ReceiptData } from "../types";
import { useRef } from "react";
import { FileText, Printer, X } from "lucide-react";

interface ReceiptPreviewDialogProps {
    open: boolean;
    receipt: ReceiptData | null;

    onClose: () => void;
    onPrint: () => void;
}

export default function ReceiptPreviewDialog({
    open,
    receipt,
    onClose,
    onPrint,
}: ReceiptPreviewDialogProps) {

    const receiptRef = useRef<HTMLDivElement>(null);

    if (!open || !receipt) return null;

   return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-2 sm:p-3 md:p-4 lg:p-6 transition-all duration-300">

    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-5xl h-[96vh] sm:h-[94vh] md:h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-3.5 py-3 sm:px-5 sm:py-3.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">

        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Receipt Preview
            </h2>

            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Verify receipt details before printing or exporting.
            </p>
          </div>
        </div>

        {/* Close Icon Button (Top Right Quick Action) */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Receipt Workspace Preview Area */}
      <div className="flex-1 min-h-0 overflow-auto bg-slate-100/80 dark:bg-slate-950/80 p-2.5 sm:p-4 md:p-6 lg:p-8 flex justify-center items-start">

        <div className="w-full max-w-full flex justify-start sm:justify-center overflow-x-auto py-2 px-1 sm:px-0">
          <div className="shadow-2xl rounded-lg bg-white overflow-hidden transition-transform duration-200 hover:scale-[1.005] shrink-0">
            <div ref={receiptRef}>
              <ReceiptTemplate receipt={receipt} />
            </div>
          </div>
        </div>

      </div>

      {/* Modal Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-slate-200/80 dark:border-slate-800 px-3.5 py-3 sm:px-6 sm:py-3.5 bg-white dark:bg-slate-900 shrink-0">

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <Printer className="h-4 w-4" />
          <span>Ready for thermal or standard printing</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">

          <button
            onClick={onClose}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 sm:px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Close
          </button>

          <button
            onClick={onPrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-5 py-2.5 text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>

        </div>

      </div>

    </div>

  </div>
);
}