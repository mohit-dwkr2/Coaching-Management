import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    CheckCircle2,
    Lock,
    RefreshCw,
} from "lucide-react";

import {
    FeeStructure,
    StudentFeeData,
} from "./types";

interface ChangeFeeStructureDialogProps {
    open: boolean;
    onClose: () => void;

    studentFee: StudentFeeData | null;
    feeStructures: FeeStructure[];

    onChanged: (
        structure: FeeStructure,
        discount: number
    ) => Promise<void>;
}

export default function ChangeFeeStructureDialog({
    open,
    onClose,
    studentFee,
    feeStructures,
    onChanged,
}: ChangeFeeStructureDialogProps) {

    const [selectedStructureId, setSelectedStructureId] =
        useState("");

    const [discount, setDiscount] = useState("");
    const [saving, setSaving] = useState(false);

    const [availableStructures, setAvailableStructures] =
        useState<FeeStructure[]>([]);

    const [loadingStructures, setLoadingStructures] =
        useState(false);
    /*
     * Only show active fee structures belonging
     * to the student's current course.
     */

    useEffect(() => {
        if (!open || !studentFee) return;

        const loadFeeStructures = async () => {
            try {
                setLoadingStructures(true);

                const courseId =
                    studentFee.course_id ||
                    studentFee.fee_structure?.course_id;

                console.log("========== CHANGE FEE STRUCTURE ==========");
                console.log("Student:", studentFee);
                console.log("Student Course ID:", courseId);

                if (!courseId) {
                    console.error("Course ID missing");
                    setAvailableStructures([]);
                    return;
                }

                const { data, error } = await supabase
                    .from("Coaching-3_FeeStructures")
                    .select("*")
                    .eq("course_id", courseId)
                    .eq("status", "active")
                    .order("created_at", {
                        ascending: false,
                    });

                console.log("Fee Structures:", data);
                console.log("Fee Structures Error:", error);

                if (error) throw error;

                setAvailableStructures(data || []);
            } catch (error: any) {
                console.error(
                    "Failed to load fee structures:",
                    error
                );

                toast.error(
                    error?.message ||
                    "Failed to load fee structures."
                );

                setAvailableStructures([]);
            } finally {
                setLoadingStructures(false);
            }
        };

        loadFeeStructures();
    }, [open, studentFee]);



    /*
     * Currently selected structure
     */
    const selectedStructure = useMemo(() => {
        return (
            availableStructures.find(
                (structure) =>
                    structure.id === selectedStructureId
            ) ?? null
        );
    }, [
        availableStructures,
        selectedStructureId,
    ]);

    /*
     * Reset modal state whenever it opens
     */
    useEffect(() => {
        if (!open || !studentFee) return;

        setSelectedStructureId(
            studentFee.fee_structure_id || ""
        );

        setDiscount(
            studentFee.discount
                ? String(studentFee.discount)
                : ""
        );

        setSaving(false);
    }, [open, studentFee]);

    if (!open || !studentFee) return null;

    /*
     * Fee calculations
     */
    const totalFee = selectedStructure
        ? Number(selectedStructure.total_fee || 0)
        : 0;

    const admissionFee = selectedStructure
        ? Number(selectedStructure.admission_fee || 0)
        : 0;

    const registrationFee = selectedStructure
        ? Number(selectedStructure.registration_fee || 0)
        : 0;

    /*
     * Course fee = total structure fee
     * minus admission + registration
     */
    const courseFee =
        totalFee -
        admissionFee -
        registrationFee;

    /*
     * Discount
     */
    const discountAmount = Math.max(
        Number(discount) || 0,
        0
    );

    /*
     * Final fee after discount
     */
    const finalFee = Math.max(
        totalFee - discountAmount,
        0
    );

    /*
     * Same structure check
     */
    const isSameStructure =
        selectedStructureId ===
        studentFee.fee_structure_id;

    /*
     * Discount validation
     */
    const discountExceedsFee =
        discountAmount > totalFee;

    /*
     * Structure can only be changed
     * when NO PAYMENT has been made.
     */
    const canChange =
        Number(studentFee.paid_amount || 0) === 0 &&
        !!selectedStructure &&
        !isSameStructure &&
        !discountExceedsFee &&
        !saving;

    /*
     * Save / Change Structure
     */
    const handleChange = async () => {
        if (!selectedStructure) return;

        /*
         * Safety check:
         * Never allow structure change
         * after payment.
         */
        if (
            Number(studentFee.paid_amount || 0) > 0
        ) {
            return;
        }

        /*
         * Same structure = nothing to change
         */
        if (isSameStructure) {
            return;
        }

        /*
         * Discount cannot exceed total fee
         */
        if (discountAmount > totalFee) {
            return;
        }

        try {
            setSaving(true);

            await onChanged(
                selectedStructure,
                discountAmount
            );

            /*
             * Parent controls closing.
             * We don't close manually here.
             */
        } catch (error) {
            console.error(
                "Change fee structure error:",
                error
            );
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

            <div className="w-full max-w-lg h-[680px] max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                {/* ========================= */}
                {/* HEADER */}
                {/* ========================= */}

                <div className="p-6 border-b border-slate-200 dark:border-slate-800">

                    <div className="flex items-start justify-between gap-4">

                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                                Change Fee Structure
                            </h2>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Change the assigned fee structure before any payment is recorded.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg disabled:opacity-50"
                        >
                            ×
                        </button>

                    </div>

                </div>


                {/* ========================= */}
                {/* BODY */}
                {/* ========================= */}

                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">

                    {/* ========================= */}
                    {/* PAYMENT STATUS */}
                    {/* ========================= */}

                    {Number(studentFee.paid_amount || 0) > 0 ? (

                        <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">

                            <Lock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />

                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                    Fee Structure Locked
                                </p>

                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                    A payment of ₹
                                    {Number(
                                        studentFee.paid_amount
                                    ).toLocaleString("en-IN")}{" "}
                                    has already been recorded. The fee structure cannot be changed.
                                </p>
                            </div>

                        </div>

                    ) : (

                        <div className="flex gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">

                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />

                            <div>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                    Structure Change Allowed
                                </p>

                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                                    No payment has been recorded for this fee.
                                </p>
                            </div>

                        </div>

                    )}


                    {/* ========================= */}
                    {/* CURRENT STRUCTURE */}
                    {/* ========================= */}

                    <div className="space-y-2">

                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Current Structure
                        </Label>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">

                            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                                {studentFee.fee_structure?.course?.course_name ||
                                    "Current Fee Structure"}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                                Total Fee: ₹
                                {Number(
                                    studentFee.total_fee || 0
                                ).toLocaleString("en-IN")}
                            </p>

                            <p className="text-[11px] text-slate-400 mt-1">
                                Current Discount: ₹
                                {Number(
                                    studentFee.discount || 0
                                ).toLocaleString("en-IN")}
                            </p>

                        </div>

                    </div>


                    {/* ========================= */}
                    {/* NEW STRUCTURE */}
                    {/* ========================= */}

                    <div className="space-y-2">

                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            New Fee Structure
                        </Label>

                        <select
                            value={selectedStructureId}
                            onChange={(e) =>
                                setSelectedStructureId(
                                    e.target.value
                                )
                            }
                            disabled={
                                Number(studentFee.paid_amount || 0) > 0 ||
                                saving
                            }
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        >

                            <option value="">
                                Select fee structure
                            </option>

                            {availableStructures.map(
                                (structure) => {

                                    const total = Number(
                                        structure.total_fee || 0
                                    );

                                    return (
                                        <option
                                            key={structure.id}
                                            value={structure.id}
                                        >
                                            ₹
                                            {total.toLocaleString(
                                                "en-IN"
                                            )}
                                            {" • "}
                                            {structure.duration_months}{" "}
                                            Months
                                        </option>
                                    );
                                }
                            )}

                        </select>

                        {availableStructures.length === 0 && (
                            <p className="text-xs text-slate-500">
                                No active fee structures are available for this course.
                            </p>
                        )}

                    </div>


                    {/* ========================= */}
                    {/* STRUCTURE BREAKDOWN */}
                    {/* ========================= */}

                    {selectedStructure && (

                        <div className="grid grid-cols-3 gap-2">

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">

                                <p className="text-[9px] uppercase font-black text-slate-400">
                                    Course
                                </p>

                                <p className="text-xs font-bold mt-1 text-slate-800 dark:text-slate-200">
                                    ₹
                                    {courseFee.toLocaleString(
                                        "en-IN"
                                    )}
                                </p>

                            </div>


                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">

                                <p className="text-[9px] uppercase font-black text-slate-400">
                                    Admission
                                </p>

                                <p className="text-xs font-bold mt-1 text-slate-800 dark:text-slate-200">
                                    ₹
                                    {admissionFee.toLocaleString(
                                        "en-IN"
                                    )}
                                </p>

                            </div>


                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">

                                <p className="text-[9px] uppercase font-black text-slate-400">
                                    Registration
                                </p>

                                <p className="text-xs font-bold mt-1 text-slate-800 dark:text-slate-200">
                                    ₹
                                    {registrationFee.toLocaleString(
                                        "en-IN"
                                    )}
                                </p>

                            </div>

                        </div>

                    )}


                    {/* ========================= */}
                    {/* DISCOUNT */}
                    {/* ========================= */}

                    <div className="space-y-2">

                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Discount
                        </Label>

                        <Input
                            type="number"
                            min="0"
                            value={discount}
                            disabled={
                                Number(studentFee.paid_amount || 0) > 0 ||
                                saving
                            }
                            onChange={(e) =>
                                setDiscount(e.target.value)
                            }
                            placeholder="Enter discount amount"
                            className="h-11 rounded-xl"
                        />

                        {discountExceedsFee && (

                            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">

                                <AlertCircle className="h-3.5 w-3.5" />

                                Discount cannot exceed total fee.

                            </div>

                        )}

                    </div>


                    {/* ========================= */}
                    {/* FINAL FEE */}
                    {/* ========================= */}

                    {selectedStructure && (

                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">

                            <div className="flex items-center justify-between">

                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                    New Final Fee
                                </span>

                                <span className="text-xl font-black text-blue-700 dark:text-blue-300">
                                    ₹
                                    {finalFee.toLocaleString(
                                        "en-IN"
                                    )}
                                </span>

                            </div>

                            <p className="text-[11px] text-blue-600/80 dark:text-blue-400 mt-1">
                                Paid: ₹0 · Remaining: ₹
                                {finalFee.toLocaleString(
                                    "en-IN"
                                )}
                            </p>

                        </div>

                    )}

                </div>


                {/* ========================= */}
                {/* FOOTER */}
                {/* ========================= */}

                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800">

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        onClick={handleChange}
                        disabled={!canChange}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                    >

                        {saving ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}

                    </Button>

                </div>

            </div>

        </div>
    );
}