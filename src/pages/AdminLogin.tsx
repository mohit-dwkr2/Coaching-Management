import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { GraduationCap, Loader2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

export default function AdminLogin() {
  const navigate = useNavigate();

  const {
    tenant,
    loading: tenantLoading,
    error: tenantError,
  } = useTenant();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");

  // ✅ Check Existing Session
  useEffect(() => {
    if (tenantLoading) return;

    let cancelled = false;

    const checkAdminSession = async () => {
      if (!tenant || tenantError) {
        setError(tenantError || "Coaching tenant could not be resolved.");
        setCheckingSession(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setCheckingSession(false);
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("Coaching-3_Admins")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (cancelled) return;

      if (adminError || !adminData || adminData.status !== "active") {
        await supabase.auth.signOut();
      } else {
        navigate("/admin");
      }

      setCheckingSession(false);
    };

    checkAdminSession();

    return () => {
      cancelled = true;
    };
  }, [navigate, tenant, tenantLoading, tenantError]);

  // ✅ Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (tenantLoading || !tenant || tenantError) {
      setError(tenantError || "Coaching tenant is still loading.");
      return;
    }

    setLoading(true);
    setError("");

    // ✅ Login
    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError || !data.user) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // ✅ Verify admin exists
    const { data: adminData, error: adminError } = await supabase
      .from("Coaching-3_Admins")
      .select("id, status")
      .eq("user_id", data.user.id)
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    // ❌ Not an admin
    if (adminError || !adminData) {
      await supabase.auth.signOut();

      setError("You are not authorized to access admin panel");
      setLoading(false);
      return;
    }

    // ❌ Inactive admin
    if (adminData.status !== "active") {
      await supabase.auth.signOut();

      setError("Your admin access is inactive");
      setLoading(false);
      return;
    }

    // ✅ Success
    navigate("/admin");
  };

  // ✅ Loading Screen
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">
            Admin Login
          </h2>

          <p className="text-sm text-slate-500">
            Enter your credentials to access dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-600">
              Email
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-slate-600">
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Secure Admin Access
        </div>
      </div>
    </div>
  );
}