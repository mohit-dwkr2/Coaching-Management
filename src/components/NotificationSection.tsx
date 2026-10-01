import { supabase } from "@/supabaseClient";
import { Bell, Clock, Megaphone, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";

interface Notification {
  id: string
  created_at: string
  title: string
  message: string
  target_type: "global" | "course" | "batch"
  course_id: string | null
  batch_id: string | null
  course?: {
    course_name: string
  }
  batch?: {
    batch_name: string
  }
}

const NotificationSection = ({ profile }: { profile?: any }) => {
  const { tenant } = useTenant();


  // ✅ REACT QUERY: Data fetch aur Cache logic
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [
      "notifications",
      tenant?.id,
      profile?.course_id,
      profile?.batch_id,
    ],

    queryFn: async () => {
      if (!tenant?.id || !profile?.course_id) return [];

      const filters = [
        "target_type.eq.global",
        `and(target_type.eq.course,course_id.eq.${profile.course_id})`,
      ];

      // Batch assigned hai tabhi batch notification filter add karo
      if (profile.batch_id) {
        filters.push(
          `and(target_type.eq.batch,batch_id.eq.${profile.batch_id})`
        );
      }

      const { data, error } = await supabase
        .from("Coaching-3_Notifications")
        .select(`
  *,
  course:Coaching-3_Courses!notifications_course_tenant_fk(
    course_name
  ),
  batch:Coaching-3_StudentBatches!notifications_batch_tenant_fk(
    batch_name
  )
`)
        .eq("tenant_id", tenant.id)
        .or(filters.join(","))
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as Notification[]) ?? [];
    },

    enabled: !!tenant?.id && !!profile?.course_id,

    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
  });

  const visibleNotifications = notifications

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <p className="font-bold text-slate-400 animate-pulse text-sm">Checking for updates...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 w-full overflow-hidden">
        <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100 shrink-0">
          <Bell className="text-white" size={20} />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <h2 className="text-xl font-black text-slate-800 truncate">
            Notice Board
          </h2>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
            Updates for {profile?.course?.course_name || "Your Course"}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4 w-full overflow-x-hidden">
        <AnimatePresence mode="popLayout">
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="
                relative
                bg-white
                border
                border-slate-100
                p-4 sm:p-5
                rounded-[1.5rem]
                shadow-sm
                hover:shadow-md
                transition-all
                group
                w-full
                max-w-full
                overflow-hidden
                break-words
              "
              >

                {/* Content */}
                <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden pr-8">
                  {/* Top badges */}
                  <div className="flex flex-wrap items-center gap-2 w-full overflow-hidden">

                    <span
                      className={`
    text-[10px]
    font-black
    px-2
    py-0.5
    rounded-md
    uppercase
    shrink-0
    whitespace-nowrap
    ${notif.target_type === "global"
                          ? "bg-blue-100 text-blue-600"
                          : notif.target_type === "course"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-600"
                        }
  `}
                    >

                      {notif.target_type === "global" && "All"}

                      {notif.target_type === "course" &&
                        notif.course?.course_name}

                      {notif.target_type === "batch" &&
                        `${notif.course?.course_name} • ${notif.batch?.batch_name}`}

                    </span>

                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 shrink-0 whitespace-nowrap">
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="
                    font-bold
                    text-slate-800
                    text-base
                    sm:text-lg
                    leading-tight
                    break-words
                    whitespace-pre-wrap
                    overflow-wrap-anywhere
                    w-full
                  "
                  >
                    {notif.title}
                  </h3>

                  {/* Message */}
                  <p
                    className="
                    text-slate-600
                    text-sm
                    leading-relaxed
                    break-words
                    whitespace-pre-wrap
                    overflow-wrap-anywhere
                    w-full
                    max-w-full
                  "
                  >
                    {notif.message}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="
              text-center
              py-16
              bg-slate-50
              rounded-[2rem]
              border-2
              border-dashed
              border-slate-200
              w-full
              overflow-hidden
            "
            >
              <Megaphone
                className="mx-auto text-slate-300 mb-2"
                size={32}
              />

              <p className="text-slate-400 font-bold text-sm">
                No new notices today
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
export default NotificationSection