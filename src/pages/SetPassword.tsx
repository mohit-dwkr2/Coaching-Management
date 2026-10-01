import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useTenant } from "@/contexts/TenantContext";
import {
  GraduationCap,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const SetPassword = () => {

  const {
    tenant,
    loading: tenantLoading,
    error: tenantError,
  } = useTenant();

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Check invite session
  useEffect(() => {
    if (tenantLoading) return;

    const checkSession = async () => {
      if (!tenant?.id || tenantError) {
        navigate("/admin-login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/admin-login");
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [navigate, tenant, tenantLoading, tenantError]);


  // ✅ Set Password
  const handleSetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ❌ Empty
    if (!password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }

    // ❌ Short password
    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters"
      );
      return;
    }

    // ❌ Password mismatch
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {

      if (tenantLoading || !tenant?.id || tenantError) {
        setError(tenantError || "Coaching tenant could not be resolved.");
        return;
      }
      setLoading(true);

      // ✅ Update password
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const { data: activated, error: activateError } = await supabase.rpc(
        "activate_invited_admin",
        {
          p_tenant_id: tenant.id,
        }
      );

      if (activateError) {
        console.error("Admin activation error:", activateError);
        setError(activateError.message);
        setLoading(false);
        return;
      }

      if (!activated) {
        setError("Unable to activate your admin account.");
        setLoading(false);
        return;
      }

      setSuccess(
        "Password created successfully. Redirecting to login..."
      );

      // ✅ Redirect to Login
      setTimeout(async () => {
        await supabase.auth.signOut(); // Invite session close
        navigate("/admin-login");
      }, 1500);

    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verifying invite...
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
            Set Password
          </h2>

          <p className="text-sm text-slate-500">
            Create your account password
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSetPassword}
          className="space-y-4"
        >

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-slate-600">
              New Password
            </label>

            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-slate-600">
              Confirm Password
            </label>

            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
                Saving...
              </>
            ) : (
              "Set Password"
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Secure Admin Access
        </div>
      </div>
    </div>
  );
};

export default SetPassword;