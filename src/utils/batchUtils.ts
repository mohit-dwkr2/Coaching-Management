import { supabase } from "@/supabaseClient";

export const updateBatchStudentCount = async (
  batchId: string | null,
  tenantId: string
) => {
  if (!batchId || !tenantId) return;

  const { count, error: countError } = await supabase
    .from("Coaching-3_Students")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("batch_id", batchId)
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (countError) throw countError;

  const { error: updateError } = await supabase
    .from("Coaching-3_StudentBatches")
    .update({
      student_count: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", batchId)
    .eq("tenant_id", tenantId);

  if (updateError) throw updateError;
};