import { supabase } from "@/supabaseClient";

/**
 * Returns next available roll number for a batch.
 */
export async function getNextRollNumber(
    batchId: string,
    tenantId: string
) {
    const { data, error } = await supabase
        .from("Coaching-3_Students")
        .select("roll_number")
        .eq("tenant_id", tenantId)
        .eq("batch_id", batchId)
        .order("roll_number", { ascending: false })
        .limit(1);

    if (error) throw error;

    const highestRoll = data?.[0]?.roll_number ?? 0;

    return highestRoll + 1;
}

export async function getHighestRollNumber(
    batchId: string,
    tenantId: string
) {
    const { data, error } = await supabase
        .from("Coaching-3_Students")
        .select("roll_number")
        .eq("tenant_id", tenantId)
        .eq("batch_id", batchId)
        .order("roll_number", { ascending: false })
        .limit(1);

    if (error) throw error;

    return data?.[0]?.roll_number ?? 0;
}