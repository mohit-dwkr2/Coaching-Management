import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
// Agar tumhara Supabase client kisi aur file mein hai,
// toh upar import path ko uske actual path se replace karna.

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTenant() {
      setLoading(true);
      setError("");

      const hostname = window.location.hostname.toLowerCase().trim();

      const { data, error: rpcError } = await supabase.rpc(
        "resolve_tenant_by_domain",
        { _domain: hostname }
      );

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
        setTenant(null);
      } else if (!data || data.length === 0) {
        setError(`Is domain ke liye coaching nahi mili: ${hostname}`);
        setTenant(null);
      } else {
        setTenant(data[0]);
      }

      setLoading(false);
    }

    loadTenant();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        tenantLoading: loading,
        tenantError: error,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used inside TenantProvider");
  }

  return context;
}