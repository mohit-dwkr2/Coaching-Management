import { serve } from "std/http/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice("Bearer ".length);

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid user" }, 401);
    }

    const body = await req.json();
    const adminId = body.adminId;
    const tenantId = body.tenantId;

    if (!adminId || !tenantId) {
      return jsonResponse(
        { error: "adminId and tenantId are required" },
        400
      );
    }

    // Only an owner of THIS tenant may delete its admins.
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("Coaching-3_TenantAdmins")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      membershipError ||
      !membership ||
      membership.role !== "owner"
    ) {
      return jsonResponse(
        { error: "Only this tenant's owner can delete admins" },
        403
      );
    }

    // Find the target profile only within the supplied tenant.
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("Coaching-3_Admins")
      .select("id, user_id, role")
      .eq("id", adminId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (adminError) {
      return jsonResponse({ error: "Could not look up admin" }, 500);
    }

    if (!adminData) {
      return jsonResponse({ error: "Admin not found in this tenant" }, 404);
    }

    if (adminData.role === "owner") {
      return jsonResponse({ error: "Owner cannot be deleted" }, 403);
    }

    // Remove only this tenant membership.
    const { error: membershipDeleteError } = await supabaseAdmin
      .from("Coaching-3_TenantAdmins")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", adminData.user_id);

    if (membershipDeleteError) {
      return jsonResponse(
        { error: membershipDeleteError.message },
        500
      );
    }

    // Remove only this tenant's admin profile.
    const { error: profileDeleteError } = await supabaseAdmin
      .from("Coaching-3_Admins")
      .delete()
      .eq("id", adminId)
      .eq("tenant_id", tenantId);

    if (profileDeleteError) {
      return jsonResponse(
        { error: profileDeleteError.message },
        500
      );
    }

    // Check whether this user belongs to any other coaching.
    const {
      data: remainingMemberships,
      error: remainingMembershipsError,
    } = await supabaseAdmin
      .from("Coaching-3_TenantAdmins")
      .select("tenant_id")
      .eq("user_id", adminData.user_id);

    if (remainingMembershipsError) {
      return jsonResponse(
        { error: remainingMembershipsError.message },
        500
      );
    }

    // If the user has no remaining coaching membership,
    // remove the Supabase Auth user as well.
    if (!remainingMemberships || remainingMemberships.length === 0) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(adminData.user_id);

      if (authDeleteError) {
        return jsonResponse(
          { error: authDeleteError.message },
          500
        );
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});