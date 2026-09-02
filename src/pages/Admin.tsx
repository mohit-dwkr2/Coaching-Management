import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Image,
  FileText,
  Trophy,
  Inbox,
  GraduationCap,
  User,
  Menu,
  X,
  AppWindow,
  LogOut,
  Bell
} from "lucide-react";
import { toast } from "sonner"

import { supabase } from "@/supabaseClient";
// import BatchManager from "@/components/admin/BatchManager";
import GalleryManager from "@/components/admin/GalleryManager";
import StudyMaterialManager from "@/components/admin/StudyMaterialManager";
import TopperManager from "@/components/admin/TopperManager";
import InquiryInbox from "@/components/admin/InquiryInbox";
import FacultyManager from "@/components/admin/facultyManager";
import HeroManager from "@/components/admin/HeroManager";
import VideosManager from "@/components/admin/VideosManager";
import StudentManager from "@/components/admin/StudentManager";
import NotificationSectionManager from "@/components/admin/NotificationSectionManager";
import AdminDrawer from "@/components/admin/AdminDrawer";
import { motion, AnimatePresence } from "framer-motion";
import FeesManager from "@/components/admin/fees/FeesManager"
import AttendanceSection from "@/components/admin/attendance/AttendanceManager";

const managementTabs = [
  { id: "students", label: "Students Manager", icon: AppWindow },
  { id: "fees", label: "Fees Manager", icon: AppWindow },
  { id: "attendance", label: "Attendance Manager", icon: FileText },
  { id: "notification", label: "Notification Manager", icon: Bell },
  { id: "material", label: "Study Material", icon: FileText },
  { id: "videos", label: "Videos Manager", icon: AppWindow },
  { id: "inbox", label: "Student Inquiries", icon: Inbox },
] as const;

const websiteTabs = [
  { id: "Hero", label: "Hero Manager", icon: AppWindow },
  // { id: "batches", label: "Batch Manager", icon: BookOpen },
  { id: "faculty", label: "Faculty Manager", icon: User },
  { id: "toppers", label: "Toppers Manager", icon: Trophy },
  { id: "gallery", label: "Gallery Manager", icon: Image },
] as const;

const tabs = [...managementTabs, ...websiteTabs];


type Tab = (typeof tabs)[number]["id"];

type AdminRole = "owner" | "admin" | "teacher";

interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  status: string;
  user_id: string;
}



const panels: Record<Tab, React.FC> = {
  // batches: BatchManager,
  gallery: GalleryManager,
  material: StudyMaterialManager,
  toppers: TopperManager,
  inbox: InquiryInbox,
  faculty: FacultyManager,
  Hero: HeroManager,
  videos: VideosManager,
  students: StudentManager,
  notification: NotificationSectionManager,
  fees: FeesManager,
  attendance: AttendanceSection,
};



export default function Admin() {

  const [active, setActive] = useState<Tab>("students");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] =
    useState<AdminUser | null>(null);

  const navigate = useNavigate();

  const visibleManagementTabs =
    currentAdmin?.role === "teacher"
      ? managementTabs.filter((tab) =>
        [
          "attendance",
          "material",
          "videos",
          "notification",
        ].includes(tab.id)
      )
      : managementTabs;

  const visibleWebsiteTabs =
    currentAdmin?.role === "teacher"
      ? []
      : websiteTabs;

  const teacherAllowedTabs = [
    "attendance",
    "material",
    "videos",
    "notification",
  ];

  const safeActive: Tab =
    currentAdmin?.role === "teacher" &&
      !teacherAllowedTabs.includes(active)
      ? "attendance"
      : active;

  const Panel = panels[safeActive];


  // ✅ Fetch All Admins
  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("Coaching-3_Admins")
      .select("*")
      .order("created_at");

    if (error) {
      console.error(error);
      toast.error("Failed to load admins");
      return;
    }



    setAdmins(data ?? []);

  };

  // 🔐 Protect Admin Route
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/admin-login");
        return;
      }

      // ✅ Verify admin
      const { data: adminData, error } = await supabase
        .from("Coaching-3_Admins")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !adminData) {
        await supabase.auth.signOut();
        navigate("/admin-login");
        return;
      }

      // ❌ Inactive admin
      if (adminData.status !== "active") {
        await supabase.auth.signOut();
        navigate("/admin-login");
        return;
      }

      setCurrentAdmin(adminData);

      if (adminData.role === "teacher") {
        setActive("attendance");
      } else {
        setActive("students");
      }

      await fetchAdmins();

      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  // 🔓 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };


  // ✅ Invite Admin
  const handleInvite = async (
    email: string,
    role: AdminRole
  ) => {
    try {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        "https://pqsauuhrabzjsfpqcsqf.supabase.co/functions/v1/invite-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email,
            role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to invite admin");
        return;
      }

      await fetchAdmins();

      toast.success("Invite sent successfully");

    } catch (err) {
      console.error(err);
      toast.error("Failed to invite admin");
    }
  };

  // ✅ Delete Admin
  const handleDelete = async (id: string) => {
    try {

      const adminToDelete = admins.find(
        (admin) => admin.id === id
      );

      if (!adminToDelete) return;

      // ❌ Prevent deleting owner
      if (adminToDelete.role === "owner") {
        toast.error("Owner cannot be deleted");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        "https://pqsauuhrabzjsfpqcsqf.supabase.co/functions/v1/delete-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            adminId: id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          result.error ||
          "Failed to delete admin"
        );
        return;
      }

      await fetchAdmins();

      toast.success("Admin deleted successfully");

    } catch (err) {
      console.error(err);
      toast.error("Failed to delete admin");
    }
  };




  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500 font-semibold">
        Checking Authentication...
      </div>
    );
  }

  const handleTabChange = (id: Tab) => {
    setActive(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden">

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r flex flex-col
        transition-transform duration-300 lg:translate-x-0 lg:static lg:w-64
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>


        <nav className="flex-1 p-4 overflow-y-auto">

          {/* MANAGEMENT */}
          <div className="space-y-2">
            <p className="px-4 mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
              Management
            </p>

            {visibleManagementTabs.map((t) => {
              const IsActive = safeActive === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${IsActive
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <t.icon className="h-5 w-5" />
                  {t.label}
                </button>
              );
            })}
          </div>


          {/* WEBSITE MANAGEMENT */}
          {visibleWebsiteTabs.length > 0 && (
            <div className="mt-7 pt-6 border-t border-slate-200">

              <p className="px-4 mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                Website Management
              </p>

              <div className="space-y-2">
                {visibleWebsiteTabs.map((t) => {
                  const IsActive = safeActive === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTabChange(t.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${IsActive
                        ? "bg-primary text-white"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      <t.icon className="h-5 w-5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

            </div>
          )}

        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-sm font-semibold text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Dashboard / {safeActive}
          </h1>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
          >
            <User size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-6 max-w-[1400px] mx-auto">
            <Panel />
          </div>
        </main>
      </div>

      {/* ✅ Admin Drawer */}
      {currentAdmin && (
        <AdminDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          currentAdmin={currentAdmin}
          admins={admins}
          onInvite={handleInvite}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}