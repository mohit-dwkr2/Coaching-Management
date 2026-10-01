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

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const role = body.role;
    const tenantId = body.tenantId;

    if (!email || !tenantId || !role) {
      return jsonResponse(
        { error: "Email, role and tenantId are required" },
        400
      );
    }

    // This function may invite admins or teachers, never another owner.
    if (role !== "admin" && role !== "teacher") {
      return jsonResponse({ error: "Invalid invite role" }, 400);
    }

    // Confirm that the tenant exists, is active,
    // and has a domain configured.
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("Coaching-3_Tenants")
      .select("id, is_active, domain")
      .eq("id", tenantId)
      .maybeSingle();

    if (
      tenantError ||
      !tenant ||
      !tenant.is_active ||
      !tenant.domain
    ) {
      return jsonResponse(
        { error: "Tenant not found, inactive, or domain is missing" },
        404
      );
    }

    // Only an owner of THIS tenant may invite.
    const { data: membership, error: membershipError } =
      await supabaseAdmin
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
        { error: "Only this tenant's owner can invite admins" },
        403
      );
    }

    // Check existing admin profile only within this tenant.
    const { data: existingAdmin, error: existingError } =
      await supabaseAdmin
        .from("Coaching-3_Admins")
        .select("id")
        .eq("tenant_id", tenantId)
        .ilike("email", email)
        .maybeSingle();

    if (existingError) {
      return jsonResponse(
        { error: "Could not check existing admin" },
        500
      );
    }

    if (existingAdmin) {
      return jsonResponse(
        {
          error:
            "This email already has an admin profile in this coaching",
        },
        409
      );
    }

    // Build the password setup URL dynamically from this tenant's domain.
    const tenantDomain = tenant.domain
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

    const redirectTo = `https://${tenantDomain}/set-password`;

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });

    if (inviteError || !inviteData.user) {
      return jsonResponse(
        {
          error:
            inviteError?.message || "Failed to invite user",
        },
        400
      );
    }

    const invitedUserId = inviteData.user.id;

    // Create the tenant-scoped admin profile.
    const { error: profileError } = await supabaseAdmin
      .from("Coaching-3_Admins")
      .insert({
        email,
        role,
        user_id: invitedUserId,
        status: "pending",
        tenant_id: tenantId,
      });

    if (profileError) {
      return jsonResponse(
        {
          error: `Invite sent, but admin profile could not be created: ${profileError.message}`,
        },
        500
      );
    }

    // Add membership so the user is associated with this tenant.
    const { error: membershipInsertError } =
      await supabaseAdmin
        .from("Coaching-3_TenantAdmins")
        .insert({
          tenant_id: tenantId,
          user_id: invitedUserId,
          role,
        });

    if (membershipInsertError) {
      // Remove the profile created above to avoid a partial setup.
      await supabaseAdmin
        .from("Coaching-3_Admins")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("user_id", invitedUserId);

      return jsonResponse(
        {
          error: `Invite sent, but tenant membership could not be created: ${membershipInsertError.message}`,
        },
        500
      );
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      500
    );
  }
});