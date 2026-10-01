import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import StudyMaterialSection from "@/components/StudyMaterialSection";
import NotificationSection from "@/components/NotificationSection";
import Payment from "@/components/Payment";
import StudentProfileDrawer from "@/components/StudentProfileDrawer";
import DashboardTab from "@/components/DashboardTab";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import {
  CreditCard,
  Loader2,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Bell,
  Clock,
  Edit3,
  Save,
  X,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();

  const [courses, setCourses] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("dashboard");

  // Edit
  const [isEditing, setIsEditing] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    mobile: "",
  });

  // Notes Count
  const [totalNotes, setTotalNotes] =
    useState(0);

  const [currentSubNotes, setCurrentSubNotes] =
    useState(0);

  // ✅ Sync edit data
  useEffect(() => {
    if (!profile) return;

    setEditData({
      name: profile.name || "",
      mobile: profile.mobile || "",
    });
  }, [profile]);

  // ✅ INITIALIZE USER
  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      if (tenantLoading || !tenant?.id) return;

      try {
        // SESSION
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          window.location.replace("/userlogin");
          return;
        }

        const userId = session.user.id;
        await fetchCourses();

        // FETCH PROFILE

        const {
          data: studentData,
          error: studentError,
        } = await supabase
          .from("Coaching-3_Students")
          .select(`
    *,
    course:Coaching-3_Courses!students_course_tenant_fk (
      course_name
    ),
    batch:Coaching-3_StudentBatches!students_batch_tenant_fk (
      batch_name
    )
  `)
          .eq("tenant_id", tenant.id)
          .eq("user_id", userId)
          .maybeSingle();
        if (studentError) {
          throw studentError;
        }

   
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("Coaching-3_StudentApprovals")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("user_id", userId)
          .maybeSingle();
        if (profileError) {
          throw profileError;
        }

        // NO PROFILE
        if (!profileData) {
          await supabase.auth.signOut();

          toast.error(
            "Profile not found. Please login again."
          );

          window.location.replace("/userlogin");

          return;
        }

        // DENIED USER
        if (profileData.status === "denied") {
          await supabase.auth.signOut();

          toast.error(
            "Your access has been denied. Please re-apply."
          );

          window.location.replace("/userlogin");

          return;
        }

        // VALID USER
        if (mounted) {

          const mergedProfile = {

            ...profileData,

            ...studentData,

          };

          setProfile(mergedProfile);

          setStatus(profileData.status);

        }

      } catch (err: any) {
        console.error(
          "Dashboard Init Error:",
          err?.message
        );

        await supabase.auth.signOut();

        window.location.replace("/userlogin");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeUser();

    return () => {
      mounted = false;
    };
  }, [tenant?.id, tenantLoading]);


  useEffect(() => {
    if (!profile?.user_id || !tenant?.id) return;

    const channel = supabase
      .channel("student-approval-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Coaching-3_StudentApprovals",
          filter: `user_id=eq.${profile.user_id}`,
        },
        async (payload) => {
          console.log("Realtime Approval Update:", payload);

          const updatedProfile = payload.new;
          if (updatedProfile.tenant_id !== tenant.id) return;

          const previousStatus = status;
          const newStatus = updatedProfile.status;

          // Update only approval related data
          setProfile((prev: any) => ({
            ...prev,
            name: updatedProfile.name,
            email: updatedProfile.email,
            mobile: updatedProfile.mobile,
            class: updatedProfile.class,
            status: updatedProfile.status,
          }));

          setStatus(newStatus);

          // Student Approved
          if (
            previousStatus !== "approved" &&
            newStatus === "approved"
          ) {
            toast.success("Your account has been approved!");
          }

          // Student Rejected
          if (
            previousStatus !== "denied" &&
            newStatus === "denied"
          ) {
            toast.error("Your access has been denied.");

            await supabase.auth.signOut();

            window.location.replace("/userlogin");
          }
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log(
          "Approval Realtime:",
          subscriptionStatus
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, status, tenant?.id]);


  useEffect(() => {
    if (!profile?.user_id || !tenant?.id) return;

    const studentChannel = supabase
      .channel("student-profile-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Coaching-3_Students",
          filter: `user_id=eq.${profile.user_id}`,
        },
        (payload) => {
          console.log(
            "Student Profile Updated:",
            payload
          );

          const student = payload.new;
          if (student.tenant_id !== tenant.id) return;

          setProfile((prev: any) => ({
            ...prev,

            student_id: student.student_id,
            notes_access: student.notes_access,
            student_status: student.status,

            name: student.name,
            email: student.email,
            mobile: student.mobile,

            roll_number: student.roll_number,
            joined_at: student.joined_at,
          }));
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log(
          "Student Realtime:",
          subscriptionStatus
        );
      });

    return () => {
      supabase.removeChannel(studentChannel);
    };
  }, [profile?.user_id, status, tenant?.id]);


  const fetchCourses = async () => {
    if (!tenant?.id) return;
    const { data, error } = await supabase
      .from("Coaching-3_Courses")
      .select("id, course_name")
      .eq("tenant_id", tenant.id)
      .eq("status", "active")
      .order("course_name");

    if (error) {
      console.error(error);
      return;
    }
    setCourses(data || []);
  };


  // ✅ PROFILE UPDATE
  const handleUpdateProfile = async () => {
    if (saving) return;

    // Validation
    if (editData.name.trim().length < 3) {
      return toast.error("Name too short");
    }

    if (!/^[0-9]{10}$/.test(editData.mobile.trim())) {
      return toast.error("Enter valid mobile number");
    }

    setSaving(true);

    try {
      const updatedPayload = {

        name: editData.name.trim(),

        mobile: editData.mobile.trim(),

        updated_at: new Date().toISOString(),

      };

      // ✅ Update StudentApprovals
      const { error: approvalError } = await supabase
        .from("Coaching-3_StudentApprovals")
        .update(updatedPayload)
        .eq("tenant_id", tenant.id)
        .eq("user_id", profile.user_id);

      if (approvalError) throw approvalError;

      // ✅ Update Students Table
      const { error: studentError } = await supabase
        .from("Coaching-3_Students")
        .update({
          name: updatedPayload.name,
          mobile: updatedPayload.mobile,
          // class: updatedPayload.class,
          updated_at: updatedPayload.updated_at,
        })
        .eq("tenant_id", tenant.id)
        .eq("user_id", profile.user_id);

      // Agar student table me row na ho (pending student), to ignore karo
      if (studentError) {
        console.log(studentError);
      }

      // ✅ Update Local State
      setProfile((prev: any) => ({
        ...prev,
        ...updatedPayload,
      }));
      setEditData({
        name: updatedPayload.name,
        mobile: updatedPayload.mobile,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");


    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ✅ LOGOUT
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      window.location.replace("/userlogin");
    } catch (error) {
      console.error(error);

      toast.error("Logout failed");
    }
  };

  // ✅ LOADING
  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
          Verifying...
        </p>
      </div>
    );
  }

  if (tenantError || !tenant?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <p className="text-red-600 font-semibold">
          {tenantError || "Coaching not found"}
        </p>
      </div>
    );
  }

  const studentId =
    profile?.student_id || "Not Assigned";

  const batch =
    profile?.batch || "Not Assigned";

  // Google Image Logic
  const userAvatar = profile?.user_id ? `https://lh3.googleusercontent.com/d/${profile.user_id}` : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">

      {/* ================= SIDEBAR DESKTOP ================= */}
      <aside className="hidden md:flex w-72 bg-slate-900 flex-col gap-8 shadow-sm fixed left-0 top-0 h-screen p-6 overflow-y-auto">

        <div>
          <h2 className="text-xl font-black text-white ">
            Your <span className="text-blue-600 text-2xl">Institute</span>
          </h2>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Student Dashboard
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3">

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-600 uppercase">
                Total Notes
              </p>

              <p className="text-2xl font-black text-slate-900">
                {totalNotes}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase">
                Subject Notes
              </p>

              <p className="text-2xl font-black text-slate-900">
                {currentSubNotes}
              </p>
            </div>
          </div>

          <nav className="space-y-2 py-8">
            {[
              {
                id: "dashboard",
                icon: LayoutDashboard,
                label: "Dashboard",
              },
              {
                id: "study",
                icon: BookOpen,
                label: "Study Material",
              },
              {
                id: "notifications",
                icon: Bell,
                label: "Notifications",
              },
              {
                id: "payment",
                icon: CreditCard,
                label: "Fee Payment",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                  ? "bg-blue-700 text-white shadow-md shadow-slate-200"
                  : "text-white"
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* ================= MOBILE SIDEBAR ================= */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-[80] md:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 h-full w-[82%] max-w-[300px] bg-slate-900 z-[90] p-6 shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black text-white">
                    TOPPERS{" "}
                    <span className="text-blue-600">
                      ACADEMY
                    </span>
                  </h2>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Student Dashboard
                  </p>
                </div>

                <button
                  onClick={() =>
                    setIsSidebarOpen(false)
                  }
                >
                  <X className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">
                      Total Notes
                    </p>

                    <p className="text-2xl font-black text-slate-900">
                      {totalNotes}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">
                      Subject Notes
                    </p>

                    <p className="text-2xl font-black text-slate-900">
                      {currentSubNotes}
                    </p>
                  </div>
                </div>

                <nav className="space-y-2 py-8">
                  {[

                    {
                      id: "dashboard",
                      icon: LayoutDashboard,
                      label: "Dashboard",
                    },

                    {
                      id: "study",
                      icon: BookOpen,
                      label: "Study Material",
                    },
                    {
                      id: "notifications",
                      icon: Bell,
                      label: "Notifications",
                    },
                    {
                      id: "payment",
                      icon: CreditCard,
                      label: "Fee Payment",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                        ? "bg-blue-700 text-white shadow-md shadow-slate-200"
                        : "text-white "
                        }`}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex-1 md:ml-72">

        {/* TOPBAR */}
        <div className="sticky top-0 z-40 h-16 w-full bg-slate-900 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-4 md:px-8 transition-all">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all duration-200 active:scale-95"
              aria-label="Open Sidebar"
            >
              <Menu size={20} />
            </button>

            {/* DASHBOARD BRAND / TITLE */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300">
                <LayoutDashboard className="h-5 w-5" />
              </div>

              <div className="flex flex-col">
                <h1 className="font-black text-white tracking-wider text-base md:text-lg uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent italic">
                  Dashboard
                </h1>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            {/* USER DETAILS (DESKTOP) */}
            <div className="hidden md:flex flex-col items-end">
              <p className="text-base font-bold text-slate-100 leading-none tracking-tight">
                {profile?.name || "Student"}
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                  {profile?.course?.course_name || "Enrolled Student"}
                </p>
              </div>
            </div>

            {/* AVATAR PROFILE BUTTON */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="relative group focus:outline-none"
            >
              {/* Outer Glow Ring on Hover */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 opacity-50 group-hover:opacity-100 blur-xs transition duration-300 group-hover:scale-105" />

              {/* Avatar Box */}
              <div className="relative h-10 w-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-indigo-300 text-sm font-black tracking-wider uppercase overflow-hidden shadow-lg transition-transform duration-200 group-active:scale-95">
                {profile?.name?.charAt(0) || "S"}
              </div>
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="p-6 md:p-10">
          <AnimatePresence mode="wait">
            {status === "pending" ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto mt-12 text-center bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Clock size={32} className="animate-spin-slow" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Pending Approval</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                  Welcome, <span className="text-blue-600 font-bold">{profile?.name}</span>! Our team is verifying your profile for Class <span className="text-blue-600 font-bold">{profile?.class}</span>.Once the verification is complete, all your study materials will be show right here.
                </p>
              </motion.div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                {activeTab === "dashboard" && (
                  <DashboardTab
                    profile={profile}
                    status={status}
                  />
                )}

                {activeTab === "study" && <StudyMaterialSection
                  courseId={profile?.course_id || ""}
                  notesAccess={profile?.notes_access}
                  onTotalCount={setTotalNotes}
                  onSubjectCount={setCurrentSubNotes}
                />}
                {activeTab === "notifications" && <NotificationSection profile={profile} />}
                {activeTab === "payment" && <Payment />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>


      <StudentProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}

        profile={profile}
        status={status}

        studentId={studentId}
        batch={batch}

        isEditing={isEditing}
        setIsEditing={setIsEditing}

        editData={editData}
        setEditData={setEditData}

        saving={saving}

        handleUpdateProfile={handleUpdateProfile}
      />


    </div>
  );
}