import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import {
  Send, Trash2, Edit3, Plus,
  Users, User, Calendar, MessageSquare, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner"
import { useTenant } from '@/contexts/TenantContext';

const NotificationSectionManager = () => {
  const { tenant, loading: tenantLoading } = useTenant();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [targetType, setTargetType] = useState<
    "global" | "course" | "batch"
  >("global");

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    if (tenantLoading || !tenant?.id) return;
    fetchNotifications();
    fetchCourses();
  }, [tenant?.id, tenantLoading]);


  useEffect(() => {
    if (!selectedCourse) {
      setBatches([]);
      return;
    }

    const fetchBatches = async () => {
      if (!tenant?.id) return; // <--- Tenant check
      const { data } = await supabase
        .from("Coaching-3_StudentBatches")
        .select("id,batch_name")
        .eq("tenant_id", tenant.id) // <--- Add this line
        .eq("course_id", selectedCourse)
        .eq("status", "active")
        .order("batch_name");

      if (data) {
        setBatches(data);
      }
    };

    fetchBatches();
  }, [selectedCourse]);


  const fetchCourses = async () => {
    if (!tenant?.id) return; // <--- Tenant check
    const { data } = await supabase
      .from("Coaching-3_Courses")
      .select("id, course_name")
      .eq("tenant_id", tenant.id) // <--- Add this line
      .eq("status", "active")
      .order("course_name");

    if (data) {
      setCourses(data);
    }
  };

  const fetchNotifications = async () => {
    if (!tenant?.id) return; // <--- Tenant check
    setLoading(true);
    const { data, error } = await supabase
      .from("Coaching-3_Notifications")
      .select(`
  *,
  course:Coaching-3_Courses!notifications_course_tenant_fk(
    id,
    course_name
  ),
  batch:Coaching-3_StudentBatches!notifications_batch_tenant_fk(
    id,
    batch_name
  )
`)
      .eq("tenant_id", tenant.id) // <--- Add this line
      .order("created_at", { ascending: false });

    if (!error) setNotifications(data || []);
    setLoading(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }

    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    if (
      (targetType === "course" || targetType === "batch") &&
      !selectedCourse
    ) {
      toast.error("Please select a course.");
      return;
    }

    if (
      targetType === "batch" &&
      !selectedBatch
    ) {
      toast.error("Please select a batch.");
      return;
    }

    const payload = {
      title,
      message,

      target_type: targetType,

      course_id:
        targetType === "course" ||
          targetType === "batch"
          ? selectedCourse
          : null,

      batch_id:
        targetType === "batch"
          ? selectedBatch
          : null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("Coaching-3_Notifications")
        .update(payload)
        .eq("id", editingId)
        .eq("tenant_id", tenant.id); // <--- Add tenant check

      if (!error)
        toast.success("Notification Updated!");
    } else {
      const { error } = await supabase
        .from("Coaching-3_Notifications")
        .insert([{ ...payload, tenant_id: tenant.id }]); // <--- tenant_id payload me attach kiya

      if (!error)
        toast.success("Notification Sent!");
    }

    resetForm();
    fetchNotifications();
  };


  const deleteNotification = async (id: string) => {
    if (!tenant?.id) return;
    if (window.confirm('Kya aap ise sach mein delete karna chahte hain?')) {
      const { error } = await supabase
        .from('Coaching-3_Notifications')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id); // <--- Add tenant check

      if (!error) fetchNotifications();
    }
  };

  const startEdit = (notif: any) => {

    setEditingId(notif.id);

    setTitle(notif.title);

    setMessage(notif.message);

    setTargetType(notif.target_type);

    setSelectedCourse(notif.course_id || "");

    setSelectedBatch(notif.batch_id || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };

  const resetForm = () => {
    setTitle("");
    setMessage("");

    setTargetType("global");

    setSelectedCourse("");

    setSelectedBatch("");

    setEditingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notification Manager</h1>
          <p className="text-xs font-bold text-slate-400">Send Updates And Notification To Students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Create/Edit Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-100/50 border border-blue-50 sticky top-6">
            <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
              {editingId ? <Edit3 size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
              {editingId ? 'Edit Notification' : 'Create New Notification'}
            </h2>

            <div className="space-y-5">

              {/* Target Selection */}

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-5">

                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Notification Target
                </label>

                <div className="flex gap-4 sm:gap-6 flex-wrap">

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={targetType === "global"}
                      onChange={() => {
                        setTargetType("global");
                        setSelectedCourse("");
                        setSelectedBatch("");
                      }}
                    />
                    <span className="font-semibold">All</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={targetType === "course"}
                      onChange={() => {
                        setTargetType("course");
                        setSelectedBatch("");
                      }}
                    />
                    <span className="font-semibold">Course</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={targetType === "batch"}
                      onChange={() => setTargetType("batch")}
                    />
                    <span className="font-semibold">Batch</span>
                  </label>

                </div>

                {(targetType === "course" ||
                  targetType === "batch") && (

                    <div>

                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        Select Course
                      </label>

                      <select
                        value={selectedCourse}
                        onChange={(e) => {
                          setSelectedCourse(e.target.value);
                          setSelectedBatch("");
                        }}
                        className="w-full mt-1 p-3 border rounded-xl"
                      >

                        <option value="">Choose Course</option>

                        {courses.map((course) => (

                          <option
                            key={course.id}
                            value={course.id}
                          >
                            {course.course_name}
                          </option>

                        ))}

                      </select>

                    </div>

                  )}

                {targetType === "batch" && (

                  <div>

                    <label className="text-[10px] font-black text-slate-500 uppercase">
                      Select Batch
                    </label>

                    <select
                      value={selectedBatch}
                      onChange={(e) =>
                        setSelectedBatch(e.target.value)
                      }
                      className="w-full mt-1 p-3 border rounded-xl"
                    >

                      <option value="">Choose Batch</option>

                      {batches.map((batch) => (

                        <option
                          key={batch.id}
                          value={batch.id}
                        >
                          {batch.batch_name}
                        </option>

                      ))}

                    </select>

                  </div>

                )}

              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Notification Title</label>
                <input
                  type="text"
                  placeholder="Enter catchy title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Detailed Message</label>
                <textarea
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-32 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send size={18} /> {editingId ? 'Update Now' : 'Send Notification'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right: History List */}
        <div className="lg:col-span-7">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Sent History</h2>

            <AnimatePresence>
              {notifications.map((notif) => (
                <motion.div
                  layout
                  key={notif.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-slate-100 rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-2">


                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${notif.target_type === "global"
                          ? "bg-blue-100 text-blue-600"
                          : notif.target_type === "course"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-600"
                          }`}
                      >

                        {notif.target_type === "global" && (
                          <>
                            <Users size={12} className="inline mr-1" />
                            All Students
                          </>
                        )}

                        {notif.target_type === "course" && (
                          <>
                            <User size={12} className="inline mr-1" />
                            {notif.course?.course_name}
                          </>
                        )}

                        {notif.target_type === "batch" && (
                          <>
                            <User size={12} className="inline mr-1" />
                            {notif.course?.course_name}
                            {" • "}
                            {notif.batch?.batch_name}
                          </>
                        )}

                      </span>

                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                        <Calendar size={12} />
                        {new Date(notif.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <button onClick={() => startEdit(notif)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-full transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => deleteNotification(notif.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-black text-slate-800 text-base sm:text-lg group-hover:text-blue-600 transition-colors truncate">
                    {notif.title}
                  </h3>

                  <div className="mt-2 text-slate-500 text-sm flex items-start gap-2">
                    <MessageSquare size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                    <p className="line-clamp-2 md:line-clamp-none leading-relaxed italic">
                      "{notif.message}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {notifications.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">No notifications sent yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSectionManager;