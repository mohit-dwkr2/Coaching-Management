import React, { useEffect, useState } from "react";
import {
  X,
  Shield,
  User,
  Mail,
  Trash2,
  Plus,
  Crown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner"

type AdminRole = "owner" | "admin" | "teacher";

interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  status?: string;
}

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;

  currentAdmin: {
    email: string;
    role: AdminRole;
  };

  admins: AdminUser[];

  onInvite: (email: string, role: AdminRole) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  currentAdmin,
  admins,
  onInvite,
  onDelete,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] =
    useState<AdminRole>("admin");

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const isOwner = currentAdmin.role === "owner";

  // ✅ Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // ✅ Invite Admin
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter email");
      return;
    }

    // ✅ Email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter valid email");
      return;
    }

    try {
      setLoading(true);

      await onInvite(
        inviteEmail.trim().toLowerCase(),
        inviteRole
      );

      // ✅ Reset form
      setInviteEmail("");
      setInviteRole("admin");
    } catch (error) {
      console.error(error);
      toast.error("Failed to invite");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Admin
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this admin?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      await onDelete(id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
  <>
    {/* Overlay */}
    <div
      className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[3px] transition-all duration-300 ${
        isOpen
          ? "opacity-100 visible"
          : "opacity-0 invisible"
      }`}
      onClick={onClose}
    />

    {/* Drawer */}
    <div
      className={`fixed top-0 right-0 z-50 h-dvh w-full sm:w-[420px] bg-white dark:bg-slate-950 shadow-[-20px_0_60px_rgba(15,23,42,0.18)] border-l border-slate-200/80 dark:border-slate-800 transition-transform duration-300 flex flex-col ${
        isOpen
          ? "translate-x-0"
          : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="relative overflow-hidden px-5 py-4 border-b border-blue-100/80 dark:border-slate-800 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shrink-0">
        
        {/* Header Glow */}
        <div className="absolute -top-16 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-36 h-36 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Shield size={19} strokeWidth={2.2} />
            </div>

            <div>
              <h2 className="text-[15px] font-extrabold tracking-tight">
                Admin Management
              </h2>

              <p className="text-[11px] text-blue-100/90 font-medium mt-0.5">
                Manage website admins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/25 flex items-center justify-center transition-all duration-200 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scroll Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">

        {/* Current Admin */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          
          <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-3 tracking-[0.14em]">
            YOUR ACCOUNT
          </h3>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50/70 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/20 border border-blue-100/80 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm">
            
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-start gap-3">
              
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <User size={18} strokeWidth={2.2} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 break-all leading-5">
                  {currentAdmin.email}
                </p>

                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wide shadow-sm">
                  
                  {currentAdmin.role === "owner" && (
                    <Crown size={12} />
                  )}

                  {currentAdmin.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin List */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-[0.14em]">
              ADMINS
            </h3>

            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg font-extrabold border border-blue-100 dark:border-blue-900/40">
              {admins.length} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="group border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-900/60 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">

                  {/* Admin Info */}
                  <div className="flex gap-3 flex-1 min-w-0">
                    
                    <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/30 dark:group-hover:text-blue-400 transition-colors">
                      <Mail size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 break-all leading-5">
                        {admin.email}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">

                        {/* Role */}
                        <span
                          className={`text-[9px] px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wide ${
                            admin.role === "owner"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : admin.role === "admin"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {admin.role}
                        </span>

                        {/* Status */}
                        {admin.status && (
                          <span
                            className={`text-[9px] px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wide ${
                              admin.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}
                          >
                            {admin.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {isOwner &&
                    admin.role !== "owner" && (
                      <button
                        onClick={() =>
                          handleDelete(admin.id)
                        }
                        disabled={
                          deletingId === admin.id
                        }
                        className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-600 border border-red-100 dark:border-red-900/40 flex items-center justify-center transition-all duration-200 disabled:opacity-50 active:scale-95 shrink-0"
                      >
                        {deletingId === admin.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Section */}
        {isOwner && (
          <div className="p-5">
            
            <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-3.5 tracking-[0.14em]">
              INVITE NEW USER
            </h3>

            <div className="space-y-4">

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  User Email
                </label>

                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteEmail}
                  onChange={(e) =>
                    setInviteEmail(
                      e.target.value
                    )
                  }
                  className="w-full h-11 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-xl px-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Role
                </label>

                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target
                        .value as AdminRole
                    )
                  }
                  className="w-full h-11 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-xl px-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                >
                  <option value="admin">
                    Admin
                  </option>

                  <option value="owner">
                    Owner
                  </option>

                  <option value="teacher">
                    Teacher
                  </option>
                </select>
              </div>

              {/* Invite Button */}
              <button
                onClick={handleInvite}
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Invite User
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
);
};

export default AdminDrawer;